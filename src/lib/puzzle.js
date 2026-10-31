// Puzzle text: turning formal clue objects into English and math notation.
//
// A "ref" points at one item: { c: categoryIndex, i: itemIndex }.
// A solution is sol[c][e] = item index of category c for entity e,
// where entity e is item e of the anchor category (sol[0][e] === e).

const fill = (tpl, x) => tpl.replace('{x}', x);
export const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

const word = (p, r) => {
  const cat = p.categories[r.c];
  const label = cat.items[r.i];
  return cat.lower ? label.toLowerCase() : label;
};

/** Compact label used in the grid, explanations, and math. */
export const lab = (p, r) => fill(p.categories[r.c].short || '{x}', p.categories[r.c].items[r.i]);
const ref = (p, r) => fill(p.categories[r.c].ref, word(p, r));
const pred = (p, r) => fill(p.categories[r.c].pred, word(p, r));

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five'];

function joinList(parts) {
  if (parts.length <= 2) return parts.join(' and ');
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}

function orderedAmount(p, cl) {
  const O = p.categories[cl.cat].ordered;
  const amount = cl.d * O.step;
  return { O, amount, unit: amount === 1 ? O.unit[0] : O.unit[1] };
}

const plural = (w) => (/[^aeiou]y$/.test(w) ? `${w.slice(0, -1)}ies` : `${w}s`);

/** The word-problem framing around the clues: who is involved, the options, and the question. */
export function problemText(p) {
  const [anchor, ...rest] = p.categories;
  const names = rest.map((c) => c.name.toLowerCase());
  const options = rest.map((c) => `The ${plural(c.name.toLowerCase())} are ${joinList(c.items.map((x) => (c.lower ? x.toLowerCase() : x)))}.`);
  return {
    setup: `${cap(NUMBER_WORDS[p.n])} ${p.entities}, ${joinList(anchor.items)}, each have a different ${joinList(names)}. ${options.join(' ')}`,
    question: `Determine the ${joinList(names)} of each ${anchor.name.toLowerCase()}.`,
  };
}

export function clueText(cl, p) {
  switch (cl.type) {
    case 'same':
      return cap(`${ref(p, cl.a)} is ${pred(p, cl.b)}.`);
    case 'diff':
      return cap(`${ref(p, cl.a)} is not ${pred(p, cl.b)}.`);
    case 'oneOf':
      return cap(`${ref(p, cl.a)} is either ${pred(p, cl.opts[0])} or ${pred(p, cl.opts[1])}.`);
    case 'less':
      return cap(`${ref(p, cl.a)} ${p.categories[cl.cat].ordered.less} ${ref(p, cl.b)}.`);
    case 'offset': {
      const { O, amount, unit } = orderedAmount(p, cl);
      return (
        cap(
          O.offset
            .replace('{A}', ref(p, cl.a))
            .replace('{B}', ref(p, cl.b))
            .replace('{d}', amount)
            .replace('{unit}', unit),
        ) + '.'
      );
    }
    case 'nextTo': {
      const O = p.categories[cl.cat].ordered;
      return cap(O.nextTo.replace('{A}', ref(p, cl.a)).replace('{B}', ref(p, cl.b))) + '.';
    }
    case 'allDiff':
      return cap(
        `${joinList(cl.items.map((r) => ref(p, r)))} are ${NUMBER_WORDS[cl.items.length]} different ${p.entities}.`,
      );
    default:
      return '';
  }
}

export function clueMath(cl, p) {
  const L = (r) => lab(p, r);
  switch (cl.type) {
    case 'same':
      return `${L(cl.a)} = ${L(cl.b)}`;
    case 'diff':
      return `${L(cl.a)} ≠ ${L(cl.b)}`;
    case 'oneOf':
      return `${L(cl.a)} ∈ {${cl.opts.map(L).join(', ')}}`;
    case 'less': {
      const f = p.categories[cl.cat].ordered.fn;
      return `${f}(${L(cl.a)}) < ${f}(${L(cl.b)})`;
    }
    case 'offset': {
      const { O, amount } = orderedAmount(p, cl);
      return `${O.fn}(${L(cl.b)}) − ${O.fn}(${L(cl.a)}) = ${amount}`;
    }
    case 'nextTo': {
      const O = p.categories[cl.cat].ordered;
      return `|${O.fn}(${L(cl.a)}) − ${O.fn}(${L(cl.b)})| = ${O.step}`;
    }
    case 'allDiff':
      return `${cl.items.map(L).join(', ')} pairwise distinct`;
    default:
      return '';
  }
}

/** Does the clue hold in a full solution? Used by tests and the generator. */
export function checkClue(cl, sol) {
  const ent = (r) => sol[r.c].indexOf(r.i);
  const val = (r, c) => sol[c][ent(r)];
  switch (cl.type) {
    case 'same':
      return ent(cl.a) === ent(cl.b);
    case 'diff':
      return ent(cl.a) !== ent(cl.b);
    case 'oneOf':
      return cl.opts.some((o) => ent(o) === ent(cl.a));
    case 'less':
      return val(cl.a, cl.cat) < val(cl.b, cl.cat);
    case 'offset':
      return val(cl.b, cl.cat) - val(cl.a, cl.cat) === cl.d;
    case 'nextTo':
      return Math.abs(val(cl.a, cl.cat) - val(cl.b, cl.cat)) === 1;
    case 'allDiff':
      return new Set(cl.items.map(ent)).size === cl.items.length;
    default:
      return false;
  }
}
