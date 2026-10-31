// Human-readable explanations for engine steps.
import { YES } from './engine.js';
import { lab, clueText, clueMath, cap } from './puzzle.js';

export const RULES = {
  clue: { name: 'Clue translation', short: 'Translate' },
  elim: { name: 'Uniqueness elimination', short: 'Eliminate' },
  pigeon: { name: 'Last remaining option', short: 'Last option' },
  trans: { name: 'Transitivity', short: 'Transitivity' },
  order: { name: 'Ordering bounds', short: 'Ordering' },
  inter: { name: 'Set intersection', short: 'Intersection' },
  contra: { name: 'Proof by contradiction', short: 'Contradiction' },
};

const rel = (v) => (v === YES ? '=' : '≠');
const setOf = (p, c, idxs) => `{${idxs.map((i) => lab(p, { c, i })).join(', ')}}`;

export function changeText(p, ch) {
  return `${lab(p, ch.a)} ${rel(ch.v)} ${lab(p, ch.b)}`;
}

function changeList(p, changes, max = 6) {
  const shown = changes.slice(0, max).map((ch) => changeText(p, ch));
  if (changes.length > max) shown.push(`… (+${changes.length - max})`);
  return shown.join(',  ');
}

/** One-line summary, used inside contradiction chains and step lists. */
export function brief(p, step) {
  const head = step.rule === 'clue' || step.rule === 'order' ? `${RULES[step.rule].short} (clue ${step.clue + 1})` : RULES[step.rule].short;
  if (!step.changes.length) return `${head}: no value left`;
  return `${head}: ${changeList(p, step.changes, 3)}`;
}

function conflictText(p, conflict) {
  if (!conflict) return 'a contradiction';
  const cat = (c) => p.categories[c].name.toLowerCase();
  switch (conflict.kind) {
    case 'dead':
      return `${lab(p, conflict.a)} would have no possible ${cat(conflict.other)} left`;
    case 'double':
      return `${lab(p, conflict.a)} would match two different ${cat(conflict.other)} values`;
    case 'order':
      return `clue ${conflict.clue + 1} could no longer be satisfied`;
    default:
      return conflict.a
        ? `${lab(p, conflict.a)} would have to be both = and ≠ ${lab(p, conflict.b)}`
        : 'the same cell would need to be both ✓ and ✗';
  }
}

/** Full explanation for a step: { title, text, math, chain? }. */
export function describe(p, step) {
  const L = (r) => lab(p, r);
  const catName = (c) => p.categories[c].name;
  const entity = p.entities.replace(/s$/, '');
  const R = RULES[step.rule];

  switch (step.rule) {
    case 'clue': {
      const cl = p.clues[step.clue];
      let follow;
      if (cl.type === 'same') follow = `So ${L(cl.a)} and ${L(cl.b)} belong to the same ${entity}: mark ✓.`;
      else if (cl.type === 'diff') follow = `So ${L(cl.a)} and ${L(cl.b)} belong to different ${p.entities}: mark ✗.`;
      else if (cl.type === 'oneOf')
        follow = `Only those two options remain for ${L(cl.a)}, so every other ${catName(cl.opts[0].c).toLowerCase()} gets ✗.`;
      else if (cl.type === 'allDiff') follow = 'They are all different, so every pair among them gets ✗.';
      else follow = `A comparison needs two different ${p.entities}, so ${L(cl.a)} ≠ ${L(cl.b)}. (We'll use the numbers later.)`;
      return {
        title: `${R.name} · clue ${step.clue + 1}`,
        text: `Clue ${step.clue + 1} says “${clueText(cl, p)}” As a constraint: ${clueMath(cl, p)}. ${follow}`,
        math: `${clueMath(cl, p)}  ⟹  ${changeList(p, step.changes)}`,
      };
    }
    case 'elim': {
      const { a, b } = step.info;
      return {
        title: R.name,
        text: `${L(a)} = ${L(b)}. Each ${catName(a.c).toLowerCase()} matches exactly one ${catName(b.c).toLowerCase()} and vice versa, so ${L(a)} cannot match any other ${catName(b.c).toLowerCase()}, and ${L(b)} cannot match any other ${catName(a.c).toLowerCase()}.`,
        math: `${L(a)} = ${L(b)}  ⟹  ${changeList(p, step.changes)}`,
      };
    }
    case 'pigeon': {
      const { a, b } = step.info;
      const other = catName(b.c);
      return {
        title: R.name,
        text: `${L(a)} must match exactly one ${other.toLowerCase()}. Every other option has already been ruled out, so the only one left must be correct: ${L(a)} = ${L(b)}.`,
        math: `Poss_${other}(${L(a)}) = {${L(b)}}  ⟹  ${L(a)} = ${L(b)}`,
      };
    }
    case 'trans': {
      const { a, b, C } = step.info;
      const lines = step.changes.slice(0, 4).map((ch) => {
        const via = ch.via;
        return `${L(via)} = ${L(ch.a)} ∧ ${L(via)} ${rel(ch.v)} ${L(ch.b)}  ⟹  ${L(ch.a)} ${rel(ch.v)} ${L(ch.b)}`;
      });
      if (step.changes.length > 4) lines.push(`… (+${step.changes.length - 4} more)`);
      return {
        title: R.name,
        text: `${L(a)} = ${L(b)}, so they describe the same ${entity}. Whatever we already know about one of them and the ${catName(C).toLowerCase()} category must also hold for the other.`,
        math: lines.join('\n'),
      };
    }
    case 'order': {
      const cl = p.clues[step.clue];
      const { O, dA, dB, remA, remB } = step.info;
      const f = p.categories[O].ordered.fn;
      const vals = (idxs) => setOf(p, O, idxs);
      let why;
      if (cl.type === 'less')
        why = `${L(cl.a)} must be below ${L(cl.b)}. The highest ${f.toLowerCase()} ${L(cl.b)} could have is ${L({ c: O, i: Math.max(...dB) })}, and the lowest ${L(cl.a)} could have is ${L({ c: O, i: Math.min(...dA) })}.`;
      else if (cl.type === 'offset')
        why = `${L(cl.b)} must be exactly ${cl.d * p.categories[O].ordered.step} above ${L(cl.a)}. Any value without a partner at that distance in the other set is impossible.`;
      else why = `${L(cl.a)} and ${L(cl.b)} must be neighbors. Any value with no neighbor in the other set is impossible.`;
      const removed = [
        ...remA.map((v) => `${L(cl.a)} ≠ ${L({ c: O, i: v })}`),
        ...remB.map((v) => `${L(cl.b)} ≠ ${L({ c: O, i: v })}`),
      ];
      return {
        title: `${R.name} · clue ${step.clue + 1}`,
        text: `Clue ${step.clue + 1}: ${clueMath(cl, p)}. Right now ${f}(${L(cl.a)}) ∈ ${vals(dA)} and ${f}(${L(cl.b)}) ∈ ${vals(dB)}. ${why}`,
        math: `${f}(${L(cl.a)}) ∈ ${vals(dA)},  ${f}(${L(cl.b)}) ∈ ${vals(dB)}  ⟹  ${removed.join(',  ')}`,
      };
    }
    case 'inter': {
      const { a, b, B, pa, pb } = step.info;
      const X = catName(B);
      return {
        title: R.name,
        text: `In the ${X.toLowerCase()} category, ${L(a)} can only be ${setOf(p, B, pa)} and ${L(b)} can only be ${setOf(p, B, pb)}. These sets do not overlap, so ${L(a)} and ${L(b)} cannot belong to the same ${entity}.`,
        math: `Poss_${X}(${L(a)}) ∩ Poss_${X}(${L(b)}) = ${setOf(p, B, pa)} ∩ ${setOf(p, B, pb)} = ∅  ⟹  ${L(a)} ≠ ${L(b)}`,
      };
    }
    case 'contra': {
      const { a, b, assumed, chain, conflict } = step.info;
      const reason = conflictText(p, conflict);
      return {
        title: R.name,
        text: `Suppose ${L(a)} ${rel(assumed)} ${L(b)}. Following the basic rules leads to a dead end: ${reason}. That is impossible, so the assumption is false: ${L(a)} ${rel(-assumed)} ${L(b)}.`,
        math: `(${L(a)} ${rel(assumed)} ${L(b)}  ⟹  ⊥)  ⟹  ${L(a)} ${rel(-assumed)} ${L(b)}`,
        chain: [...chain.map((s) => brief(p, s)), `⊥  ${cap(reason)}`],
      };
    }
    default:
      return { title: 'Step', text: '', math: '' };
  }
}
