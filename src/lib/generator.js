// Puzzle generator.
//
// 1. Pick a random hidden solution (one permutation per category).
// 2. Keep adding random TRUE clues until the deduction engine can solve the
//    grid. Because every engine rule is logically sound, "the engine solves
//    it" proves the solution is unique.
// 3. Remove clues one at a time while the puzzle stays solvable, so every
//    remaining clue is necessary.
import { mulberry32, randInt, pick, shuffle, range, weightedPick } from './rng.js';
import { THEMES } from './themes.js';
import { createState, run, isComplete, RULESETS } from './engine.js';

const DIFFICULTIES = {
  easy: {
    k: 3,
    n: 4,
    rules: 'easy',
    needOrdered: false,
    weights: { same: 2, diff: 5, oneOf: 3 },
  },
  medium: {
    k: 4,
    n: 4,
    rules: 'medium',
    needOrdered: true,
    weights: { same: 1, diff: 4, oneOf: 3, less: 4, nextTo: 1, allDiff: 1 },
  },
  hard: {
    k: 4,
    n: 5,
    rules: 'hard',
    needOrdered: true,
    weights: { same: 0.5, diff: 4, oneOf: 3, less: 4, offset: 2, nextTo: 2, allDiff: 1.5 },
  },
};

function previewGenerated(difficulty, seed) {
  const rng = mulberry32(seed);
  const theme = THEMES[randInt(rng, THEMES.length)];
  const cfg = DIFFICULTIES[difficulty];
  return { theme, cfg, title: `${theme.name} #${seed % 1000}` };
}

function pickCategories(rng, theme, cfg) {
  const others = range(theme.categories.length).slice(1);
  let chosen;
  if (cfg.needOrdered) {
    const ordered = pick(rng, others.filter((i) => theme.categories[i].ordered));
    chosen = [ordered, ...shuffle(rng, others.filter((i) => i !== ordered))].slice(0, cfg.k - 1);
  } else {
    chosen = shuffle(rng, others).slice(0, cfg.k - 1);
  }
  chosen.sort((a, b) => a - b);
  return [0, ...chosen].map((ci) => {
    const tc = theme.categories[ci];
    // Ordered categories keep consecutive values so differences stay meaningful.
    const keep = tc.ordered ? range(cfg.n) : shuffle(rng, range(tc.items.length)).slice(0, cfg.n).sort((a, b) => a - b);
    return { ...tc, items: keep.map((i) => tc.items[i]) };
  });
}

function randomClue(rng, p, sol, weights) {
  const { k, n } = p;
  const refOf = (c, e) => ({ c, i: sol[c][e] });
  const twoEntities = () => {
    const [e1, e2] = shuffle(rng, range(n));
    return [e1, e2];
  };
  const orderedCats = range(k).filter((c) => p.categories[c].ordered);
  const type = weightedPick(rng, weights);

  if (type === 'same' || type === 'diff' || type === 'oneOf') {
    const [c1, c2] = shuffle(rng, range(k));
    const [e1, e2] = twoEntities();
    if (type === 'same') return { type, a: refOf(c1, e1), b: refOf(c2, e1) };
    if (type === 'diff') return { type, a: refOf(c1, e1), b: refOf(c2, e2) };
    return { type, a: refOf(c1, e1), opts: shuffle(rng, [refOf(c2, e1), refOf(c2, e2)]) };
  }

  if (type === 'allDiff') {
    const m = n >= 5 && rng() < 0.4 ? 4 : 3;
    if (n < 4) return null;
    const ents = shuffle(rng, range(n)).slice(0, m);
    const items = ents.map((e) => refOf(randInt(rng, k), e));
    if (new Set(items.map((r) => r.c)).size < 2) return null;
    return { type, items };
  }

  // Comparison clues
  if (!orderedCats.length) return null;
  const O = pick(rng, orderedCats);
  const plain = range(k).filter((c) => c !== O);
  let [e1, e2] = twoEntities();
  if (sol[O][e1] > sol[O][e2]) [e1, e2] = [e2, e1];
  const d = sol[O][e2] - sol[O][e1];
  const a = refOf(pick(rng, plain), e1);
  const b = refOf(pick(rng, plain), e2);
  if (type === 'less') return { type, a, b, cat: O };
  if (type === 'offset') return d <= 2 ? { type, a, b, cat: O, d } : null;
  if (type === 'nextTo') return d === 1 ? (rng() < 0.5 ? { type, a, b, cat: O } : { type, a: b, b: a, cat: O }) : null;
  return null;
}

function solvable(p, rules) {
  const s = createState(p.k, p.n);
  const res = run(p, s, rules, 3000);
  return !res.conflict && isComplete(s);
}

export function generatePuzzle(difficulty, seed) {
  const { theme, cfg, title } = previewGenerated(difficulty, seed);
  const rng = mulberry32(seed * 7919 + 17);
  // Clues are collected with the cheaper rule set, then minimized with the full one.
  const buildRules = RULESETS[cfg.rules === 'hard' ? 'medium' : cfg.rules];
  const rules = RULESETS[cfg.rules === 'hard' ? 'hardFast' : cfg.rules];
  const { k, n } = cfg;

  for (let attempt = 0; attempt < 20; attempt++) {
    const categories = pickCategories(rng, theme, cfg);
    const solution = [range(n), ...range(k - 1).map(() => shuffle(rng, range(n)))];
    const p = { k, n, categories, entities: theme.entities, clues: [] };

    const state = createState(k, n);
    const seen = new Set();
    let guard = 0;
    while (!isComplete(state) && p.clues.length < 60 && guard++ < 500) {
      const cl = randomClue(rng, p, solution, cfg.weights);
      if (!cl) continue;
      const key = JSON.stringify(cl);
      if (seen.has(key)) continue;
      seen.add(key);
      p.clues = [...p.clues, cl];
      if (run(p, state, buildRules, 3000).conflict) break; // should never happen
    }
    if (!isComplete(state)) continue;

    // Minimize: drop every clue that is not needed.
    for (const cl of shuffle(rng, p.clues)) {
      const without = { ...p, clues: p.clues.filter((x) => x !== cl) };
      if (solvable(without, rules)) p.clues = without.clues;
    }

    return {
      ...p,
      id: `g-${difficulty}-${seed}`,
      title,
      theme: theme.id,
      themeName: theme.name,
      difficulty,
      solution,
      intro: `${cap(numberWord(n))} ${theme.entities} each have a different ${joinNames(categories.slice(1))}. Use the clues to match everything up.`,
    };
  }
  throw new Error(`Could not generate puzzle ${difficulty}-${seed}`);
}

const numberWord = (n) => ['zero', 'one', 'two', 'three', 'four', 'five'][n];
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const joinNames = (cats) => {
  const names = cats.map((c) => c.name.toLowerCase());
  return names.length <= 2 ? names.join(' and ') : `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
};
