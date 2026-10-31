// Deduction engine.
//
// The grid state stores, for every pair of categories (c1 < c2), an n×n block
// of cells: UNK (unknown), YES (same entity), NO (different entities).
// Each rule looks at the state and returns ONE step — a set of cell changes
// plus the data needed to explain it — or null. Rules are tried from the
// simplest to the most advanced, so the step sequence reads like a human
// solution.

export const UNK = 0;
export const YES = 1;
export const NO = -1;

export const blockKey = (c1, c2) => `${c1},${c2}`;

export function createState(k, n) {
  const g = {};
  for (let a = 0; a < k; a++) for (let b = a + 1; b < k; b++) g[blockKey(a, b)] = new Array(n * n).fill(UNK);
  return { k, n, g };
}

export function cloneState(s) {
  const g = {};
  for (const key in s.g) g[key] = s.g[key].slice();
  return { k: s.k, n: s.n, g };
}

export function getCell(s, a, b) {
  if (a.c === b.c) return a.i === b.i ? YES : NO;
  if (a.c < b.c) return s.g[blockKey(a.c, b.c)][a.i * s.n + b.i];
  return s.g[blockKey(b.c, a.c)][b.i * s.n + a.i];
}

export function setCell(s, a, b, v) {
  if (a.c === b.c) return;
  if (a.c < b.c) s.g[blockKey(a.c, b.c)][a.i * s.n + b.i] = v;
  else s.g[blockKey(b.c, a.c)][b.i * s.n + a.i] = v;
}

/** Normalized string id for a cell, independent of argument order. */
export function cellId(a, b) {
  return a.c < b.c ? `${a.c}:${a.i}|${b.c}:${b.i}` : `${b.c}:${b.i}|${a.c}:${a.i}`;
}

export function forEachBlock(s, fn) {
  for (let c1 = 0; c1 < s.k; c1++) for (let c2 = c1 + 1; c2 < s.k; c2++) fn(c1, c2, s.g[blockKey(c1, c2)]);
}

/** The fully solved grid for a puzzle's known solution. */
export function truthState(p) {
  const s = createState(p.k, p.n);
  forEachBlock(s, (c1, c2, arr) => {
    for (let e = 0; e < p.n; e++)
      for (let f = 0; f < p.n; f++) arr[p.solution[c1][e] * p.n + p.solution[c2][f]] = e === f ? YES : NO;
  });
  return s;
}

export function isComplete(s) {
  for (const key in s.g) if (s.g[key].includes(UNK)) return false;
  return true;
}

/** Local contradictions: a line with two ✓, or a line with no option left. */
export function findConflict(s) {
  const n = s.n;
  let found = null;
  forEachBlock(s, (c1, c2, arr) => {
    if (found) return;
    for (let i = 0; i < n && !found; i++) {
      let yr = 0, nr = 0, yc = 0, nc = 0;
      for (let j = 0; j < n; j++) {
        const r = arr[i * n + j], c = arr[j * n + i];
        if (r === YES) yr++;
        if (r === NO) nr++;
        if (c === YES) yc++;
        if (c === NO) nc++;
      }
      if (yr > 1) found = { kind: 'double', a: { c: c1, i }, other: c2 };
      else if (nr === n) found = { kind: 'dead', a: { c: c1, i }, other: c2 };
      else if (yc > 1) found = { kind: 'double', a: { c: c2, i }, other: c1 };
      else if (nc === n) found = { kind: 'dead', a: { c: c2, i }, other: c1 };
    }
  });
  return found;
}

/** Item indices of category c that ref r could still match. */
export function domain(s, r, c) {
  if (r.c === c) return [r.i];
  const out = [];
  for (let i = 0; i < s.n; i++) if (getCell(s, r, { c, i }) !== NO) out.push(i);
  return out;
}

/** Returns false if a change contradicts what is already in the grid. */
export function applyStep(s, step) {
  for (const ch of step.changes) {
    const cur = getCell(s, ch.a, ch.b);
    if (cur === UNK) setCell(s, ch.a, ch.b, ch.v);
    else if (cur !== ch.v) return false;
  }
  return true;
}

const pending = (s, list) => list.filter((ch) => ch.a.c !== ch.b.c && getCell(s, ch.a, ch.b) !== ch.v);

/** What a clue says directly, before any reasoning. */
export function clueImplications(cl, p) {
  switch (cl.type) {
    case 'same':
      return [{ a: cl.a, b: cl.b, v: YES }];
    case 'diff':
      return [{ a: cl.a, b: cl.b, v: NO }];
    case 'oneOf': {
      const oc = cl.opts[0].c;
      const out = [];
      for (let i = 0; i < p.n; i++)
        if (!cl.opts.some((o) => o.i === i)) out.push({ a: cl.a, b: { c: oc, i }, v: NO });
      return out;
    }
    case 'less':
    case 'offset':
    case 'nextTo':
      return [{ a: cl.a, b: cl.b, v: NO }];
    case 'allDiff': {
      const out = [];
      for (let x = 0; x < cl.items.length; x++)
        for (let y = x + 1; y < cl.items.length; y++) out.push({ a: cl.items[x], b: cl.items[y], v: NO });
      return out;
    }
    default:
      return [];
  }
}

// ---------------------------------------------------------------- rules

function ruleClue(p, s) {
  for (let ci = 0; ci < p.clues.length; ci++) {
    const changes = pending(s, clueImplications(p.clues[ci], p));
    if (changes.length) return { rule: 'clue', clue: ci, changes };
  }
  return null;
}

function ruleElim(p, s) {
  const n = s.n;
  let step = null;
  forEachBlock(s, (c1, c2, arr) => {
    if (step) return;
    for (let i = 0; i < n && !step; i++)
      for (let j = 0; j < n && !step; j++) {
        if (arr[i * n + j] !== YES) continue;
        const changes = [];
        for (let x = 0; x < n; x++) {
          if (x !== j && arr[i * n + x] !== NO) changes.push({ a: { c: c1, i }, b: { c: c2, i: x }, v: NO });
          if (x !== i && arr[x * n + j] !== NO) changes.push({ a: { c: c1, i: x }, b: { c: c2, i: j }, v: NO });
        }
        if (changes.length) step = { rule: 'elim', changes, info: { a: { c: c1, i }, b: { c: c2, i: j } } };
      }
  });
  return step;
}

function rulePigeon(p, s) {
  const n = s.n;
  let step = null;
  forEachBlock(s, (c1, c2, arr) => {
    if (step) return;
    for (let i = 0; i < n && !step; i++) {
      // row i of c1 against c2, then column i (item i of c2) against c1
      for (const asRow of [true, false]) {
        let open = 0, last = -1, hasYes = false;
        for (let j = 0; j < n; j++) {
          const v = asRow ? arr[i * n + j] : arr[j * n + i];
          if (v === YES) hasYes = true;
          if (v !== NO) { open++; last = j; }
        }
        if (!hasYes && open === 1) {
          const a = asRow ? { c: c1, i } : { c: c2, i };
          const b = asRow ? { c: c2, i: last } : { c: c1, i: last };
          step = { rule: 'pigeon', changes: [{ a, b, v: YES }], info: { a, b, other: b.c } };
          break;
        }
      }
    }
  });
  return step;
}

function ruleTrans(p, s) {
  const n = s.n;
  let step = null;
  forEachBlock(s, (c1, c2, arr) => {
    if (step) return;
    for (let i = 0; i < n && !step; i++)
      for (let j = 0; j < n && !step; j++) {
        if (arr[i * n + j] !== YES) continue;
        const a = { c: c1, i }, b = { c: c2, i: j };
        for (let C = 0; C < s.k && !step; C++) {
          if (C === c1 || C === c2) continue;
          const changes = [];
          for (let x = 0; x < n; x++) {
            const z = { c: C, i: x };
            const va = getCell(s, a, z), vb = getCell(s, b, z);
            if (va !== UNK && vb !== va) changes.push({ a: b, b: z, v: va, via: a });
            else if (vb !== UNK && va === UNK) changes.push({ a, b: z, v: vb, via: b });
          }
          if (changes.length) step = { rule: 'trans', changes, info: { a, b, C } };
        }
      }
  });
  return step;
}

function ruleOrder(p, s) {
  for (let ci = 0; ci < p.clues.length; ci++) {
    const cl = p.clues[ci];
    if (cl.type !== 'less' && cl.type !== 'offset' && cl.type !== 'nextTo') continue;
    const O = cl.cat;
    const dA = domain(s, cl.a, O), dB = domain(s, cl.b, O);
    let keepA, keepB;
    if (cl.type === 'less') {
      const maxB = Math.max(...dB), minA = Math.min(...dA);
      keepA = dA.filter((v) => v < maxB);
      keepB = dB.filter((w) => w > minA);
    } else if (cl.type === 'offset') {
      keepA = dA.filter((v) => dB.includes(v + cl.d));
      keepB = dB.filter((w) => dA.includes(w - cl.d));
    } else {
      keepA = dA.filter((v) => dB.includes(v - 1) || dB.includes(v + 1));
      keepB = dB.filter((w) => dA.includes(w - 1) || dA.includes(w + 1));
    }
    const remA = dA.filter((v) => !keepA.includes(v));
    const remB = dB.filter((v) => !keepB.includes(v));
    if (!remA.length && !remB.length) continue;
    const info = { O, dA, dB, remA, remB };
    // A ref inside the ordered category itself has a fixed value; losing it is impossible.
    if ((cl.a.c === O && remA.length) || (cl.b.c === O && remB.length))
      return { rule: 'order', clue: ci, changes: [], info, conflict: 'order' };
    const changes = [
      ...remA.map((v) => ({ a: cl.a, b: { c: O, i: v }, v: NO })),
      ...remB.map((v) => ({ a: cl.b, b: { c: O, i: v }, v: NO })),
    ];
    return { rule: 'order', clue: ci, changes, info };
  }
  return null;
}

function ruleInter(p, s) {
  const n = s.n;
  let step = null;
  forEachBlock(s, (c1, c2, arr) => {
    if (step) return;
    for (let i = 0; i < n && !step; i++)
      for (let j = 0; j < n && !step; j++) {
        if (arr[i * n + j] !== UNK) continue;
        const a = { c: c1, i }, b = { c: c2, i: j };
        for (let B = 0; B < s.k && !step; B++) {
          if (B === c1 || B === c2) continue;
          const pa = domain(s, a, B), pb = domain(s, b, B);
          if (!pa.some((x) => pb.includes(x)))
            step = { rule: 'inter', changes: [{ a, b, v: NO }], info: { a, b, B, pa, pb } };
        }
      }
  });
  return step;
}

const BASIC_RULES = [ruleClue, ruleElim, rulePigeon, ruleTrans, ruleOrder, ruleInter];

/** Runs rules to a fixed point (or a contradiction) on s, mutating it. */
export function run(p, s, rules = BASIC_RULES, maxSteps = 2000) {
  const steps = [];
  for (let iter = 0; iter < maxSteps; iter++) {
    const c = findConflict(s);
    if (c) return { conflict: c, steps };
    let step = null;
    for (const r of rules) {
      step = r(p, s);
      if (step) break;
    }
    if (!step) return { conflict: null, steps };
    steps.push(step);
    if (step.conflict) return { conflict: { kind: 'order', clue: step.clue }, steps };
    if (!applyStep(s, step)) {
      const bad = step.changes.find((ch) => getCell(s, ch.a, ch.b) !== ch.v);
      return { conflict: { kind: 'clash', a: bad.a, b: bad.b }, steps };
    }
  }
  return { conflict: null, steps, truncated: true };
}

// Short chains are tried first because they make far better explanations;
// the generator skips that pass for speed.
const makeContra = (limits) => function ruleContra(p, s) {
  const n = s.n;
  for (const limit of limits) {
    for (const assumed of [YES, NO]) {
      let step = null;
      forEachBlock(s, (c1, c2, arr) => {
        if (step) return;
        for (let i = 0; i < n && !step; i++)
          for (let j = 0; j < n && !step; j++) {
            if (arr[i * n + j] !== UNK) continue;
            const a = { c: c1, i }, b = { c: c2, i: j };
            const t = cloneState(s);
            setCell(t, a, b, assumed);
            const res = run(p, t, BASIC_RULES, limit);
            if (res.conflict)
              step = {
                rule: 'contra',
                changes: [{ a, b, v: -assumed }],
                info: { a, b, assumed, chain: res.steps, conflict: res.conflict },
              };
          }
      });
      if (step) return step;
    }
  }
  return null;
};

export const RULESETS = {
  easy: [ruleClue, ruleElim, rulePigeon, ruleTrans],
  medium: BASIC_RULES,
  hard: [...BASIC_RULES, makeContra([12, 400])],
  hardFast: [...BASIC_RULES, makeContra([400])],
};
RULESETS.all = RULESETS.hard;

/** The next single deduction from state s (not mutated), or null. */
export function nextStep(p, s, rules = RULESETS.all) {
  for (const r of rules) {
    const step = r(p, s);
    if (step) return step;
  }
  return null;
}

/** Full step-by-step solution from an empty (or given) grid. */
export function solve(p, start, rules = RULESETS.all) {
  const s = start ? cloneState(start) : createState(p.k, p.n);
  const res = run(p, s, rules, 5000);
  return { ...res, state: s, solved: !res.conflict && isComplete(s) };
}

/** Replays the first `count` steps onto an empty grid. */
export function stateAfter(p, steps, count) {
  const s = createState(p.k, p.n);
  for (let i = 0; i < count; i++) applyStep(s, steps[i]);
  return s;
}
