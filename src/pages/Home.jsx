import HeroBg from '../HeroBg';
import Icon, { Marks } from '../Icon';
import Tex from '../Tex';
import { RULES } from '../lib/explain';

// One example per clue type the generator uses.
const CLUES = [
  ['equality', 'Ben chose archery.', String.raw`\mathrm{Ben} = \mathrm{Archery}`],
  ['inequality', 'Ava is not in the Red cabin.', String.raw`\mathrm{Ava} \neq \mathrm{Red}`],
  ['membership', 'Diego is in the Red or Blue cabin.', String.raw`\mathrm{Diego} \in \{\mathrm{Red}, \mathrm{Blue}\}`],
  ['order', 'Ava is younger than Chloe.', String.raw`\mathrm{Age}(\mathrm{Ava}) < \mathrm{Age}(\mathrm{Chloe})`],
  ['difference', 'Emma is two years older than Ben.', String.raw`\mathrm{Age}(\mathrm{Emma}) - \mathrm{Age}(\mathrm{Ben}) = 2`],
  ['all-different', 'Ava, the archer, and the Red-cabin camper are all different.', String.raw`\mathrm{Ava},\, \mathrm{Archery},\, \mathrm{Red}\ \text{distinct}`],
];

const RULE_ROWS = [
  ['clue', 'Write each sentence as a constraint.', String.raw`\text{words} \to =,\, \neq,\, <,\, \in`],
  ['elim', 'A ✓ rules out the rest of its row and column.', String.raw`a = b \Rightarrow a \neq b'`],
  ['pigeon', 'One option left means it is the answer.', String.raw`P(a) = \{b\} \Rightarrow a = b`],
  ['trans', 'Matched items share every fact.', String.raw`a = b,\ b \neq c \Rightarrow a \neq c`],
  ['order', 'A comparison cuts values from both ends.', String.raw`f(a) < f(b) \Rightarrow f(a) \neq \max`],
  ['inter', 'No common option means no match.', String.raw`P(a) \cap P(b) = \varnothing \Rightarrow a \neq b`],
  ['contra', 'If assuming p breaks the grid, p is false.', String.raw`(p \Rightarrow \bot) \vdash \neg p`],
];

// Tiers of the ten-problem set: [name, problems, k, n, (n!)^(k-1)].
const LEVELS = [
  ['Tutorial', '1', 3, 3, 36],
  ['Easy', '2–4', 3, 4, 576],
  ['Medium', '5–7', 4, 4, 13824],
  ['Hard', '8–10', 4, 5, 1728000],
];

/** Tiny staircase diagram of a k-category, n-item grid. */
function MiniGrid({ k, n }) {
  const u = 5;
  const gap = 3;
  const block = n * u;
  const size = (k - 1) * block + (k - 2) * gap;
  const cells = [];
  for (let r = 0; r < k - 1; r++)
    for (let c = 0; c < k - 1 - r; c++)
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++)
          cells.push(<rect key={`${r}${c}${y}${x}`} x={c * (block + gap) + x * u + 0.5} y={r * (block + gap) + y * u + 0.5} width={u - 1} height={u - 1} />);
  return (
    <svg className="mini" width={size + 1} height={size + 1} viewBox={`0 0 ${size + 1} ${size + 1}`} aria-hidden="true">
      {cells}
    </svg>
  );
}

function SectionHead({ n, title, children }) {
  return (
    <div className="split-head">
      <span className="sec-n">§ {n}</span>
      <h2 className="display">{title}</h2>
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <>
      <section className="full hero">
        <HeroBg />
        <div className="wrap hero-center">
          <h1 className="hero-title">Logic puzzles, solved with math.</h1>
          <p className="hero-sub">Turn clues into equations and watch the possible answers shrink to one.</p>
          <div className="hero-actions">
            <a className="btn primary lg" href="#/solve">Start solving</a>
            <a className="btn ghost lg" href="#/learn">How it works</a>
          </div>
          <div className="hero-math">
            <Tex>{String.raw`|S| :\; 36 \to 12 \to 6 \to 4 \to 3 \to 1`}</Tex>
          </div>
        </div>
      </section>

      <section className="full ink">
        <div className="wrap split">
          <SectionHead n={1} title="Clues become equations.">
            <p>Every sentence in a puzzle is one of six constraint types.</p>
          </SectionHead>
          <ul className="translate">
            {CLUES.map(([type, text, tex]) => (
              <li key={type}>
                <span className="type">{type}</span>
                <q>{text}</q>
                <Tex>{tex}</Tex>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="full">
        <div className="wrap split">
          <SectionHead n={2} title="Seven rules. Simplest first.">
            <p>Hints and the solver always use the easiest rule that makes progress.</p>
            <a className="text-link" href="#/learn">All rules with examples <Icon name="arrow-right" /></a>
          </SectionHead>
          <ol className="rule-list">
            {RULE_ROWS.map(([key, text, tex], i) => (
              <li key={key}>
                <span className="n">{i + 1}</span>
                <div>
                  <strong>{RULES[key].name}</strong>
                  <span><Marks>{text}</Marks></span>
                </div>
                <Tex>{tex}</Tex>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="full">
        <div className="wrap split">
          <SectionHead n={3} title="Ten problems, in order.">
            <p>Each one unlocks the next. Every puzzle is proven to have exactly one solution.</p>
          </SectionHead>
          <div>
            <div className="level-rows">
              {LEVELS.map(([name, nums, k, n, total]) => (
                <a key={name} href="#/solve">
                  <MiniGrid k={k} n={n} />
                  <span className="name">
                    {name}
                    <span className="size">Problem{nums.length > 1 ? 's' : ''} {nums} · {k} categories × {n} items</span>
                  </span>
                  <span className="total">
                    <Tex>{String.raw`(${n}!)^{${k - 1}}`}</Tex>
                    <span>{total.toLocaleString('en-US')}</span>
                  </span>
                  <span className="go"><Icon name="arrow-right" /></span>
                </a>
              ))}
            </div>
            <p className="muted small rows-note">Possible answers before the first clue.</p>
          </div>
        </div>
      </section>
    </>
  );
}
