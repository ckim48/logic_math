import { Marks } from '../Icon';
import Tex from '../Tex';

// The seven rules, in the order the solver and hints try them.
const RULES = [
  {
    name: 'Clue translation',
    area: 'Modeling',
    tex: String.raw`\text{“A is younger than B”} \;\Longrightarrow\; \operatorname{Age}(A) < \operatorname{Age}(B)`,
    text: 'Rewrite each sentence as an equation, an inequality, or a membership statement. Equal means ✓, not equal means ✗.',
    example: String.raw`\text{“Ava is not in the Red cabin”} \;\Longrightarrow\; \mathrm{Ava} \neq \mathrm{Red}`,
  },
  {
    name: 'Uniqueness elimination',
    area: 'Bijections',
    tex: String.raw`a = b \;\Longrightarrow\; \forall\, b' \in B \setminus \{b\}:\; a \neq b'`,
    text: 'Each category is matched one-to-one, so a ✓ crosses out the rest of its row and column.',
    example: String.raw`\mathrm{Ben} = \mathrm{Archery} \Rightarrow \mathrm{Ben} \neq \mathrm{Pottery},\ \mathrm{Ava} \neq \mathrm{Archery}`,
  },
  {
    name: 'Last remaining option',
    area: 'Pigeonhole principle',
    tex: String.raw`P_B(a) = \{\, b \,\} \;\Longrightarrow\; a = b`,
    text: 'If every option but one has been ruled out, the one left must be the answer.',
    example: String.raw`P_{\text{Age}}(\mathrm{Chloe}) = \{10\} \Rightarrow \mathrm{Chloe} = 10`,
  },
  {
    name: 'Transitivity',
    area: 'Equivalence relations',
    tex: String.raw`a = b \,\wedge\, b \mathrel{R} c \;\Longrightarrow\; a \mathrel{R} c, \quad R \in \{=, \neq\}`,
    text: 'Matched items describe the same person, so whatever is known about one is known about the other.',
    example: String.raw`\mathrm{Ben} = \mathrm{Archery} \,\wedge\, \mathrm{Archery} \neq 10 \Rightarrow \mathrm{Ben} \neq 10`,
  },
  {
    name: 'Ordering bounds',
    area: 'Inequalities',
    tex: String.raw`f(a) < f(b) \;\Longrightarrow\; f(a) < \max D_b \;\wedge\; f(b) > \min D_a`,
    text: 'A comparison removes values from both ends: the smaller one cannot be the largest, and vice versa.',
    example: String.raw`\operatorname{Age}(A) < \operatorname{Age}(B) \Rightarrow \operatorname{Age}(A) \neq 12`,
  },
  {
    name: 'Set intersection',
    area: 'Set theory',
    tex: String.raw`P_X(a) \cap P_X(b) = \varnothing \;\Longrightarrow\; a \neq b`,
    text: 'If two items have no possible value in common, they cannot belong to the same person.',
    example: String.raw`\{10, 11\} \cap \{12, 13\} = \varnothing \Rightarrow a \neq b`,
  },
  {
    name: 'Proof by contradiction',
    area: 'Formal logic',
    tex: String.raw`(\, p \Rightarrow \bot \,) \;\vdash\; \neg p`,
    text: 'Assume a mark, follow the simpler rules, and if you reach an impossibility, the opposite mark must be true.',
    example: String.raw`(\mathrm{Ava} = \mathrm{Red} \Rightarrow \bot) \Rightarrow \mathrm{Ava} \neq \mathrm{Red}`,
  },
];

const USES = [
  ['Scheduling', 'Exam timetables and sports fixtures are constraint problems with the same structure.'],
  ['Chip verification', 'SAT solvers check billions of Boolean constraints to prove a processor is correct.'],
  ['Logistics', 'Assigning drivers to routes is a matching problem, solved with the same elimination ideas.'],
  ['Compilers', 'Register allocation is graph coloring: give each variable a register no conflict shares.'],
];

export default function Learn() {
  return (
    <>
      <section className="section first">
        <div className="section-head">
          <p className="eyebrow">Learn</p>
          <h1>The mathematics of a logic grid</h1>
          <p className="lead">
            A logic grid puzzle is a small constraint satisfaction problem. Here is the model, and the seven rules
            the solver uses, always trying the simplest one first.
          </p>
        </div>
      </section>

      <section className="model card">
        <div>
          <h2>The model</h2>
          <p>
            There are <Tex>{'n'}</Tex> people <Tex>{'E'}</Tex> and <Tex>{'k'}</Tex> categories. For every category{' '}
            <Tex>{'c'}</Tex>, the answer is a bijection <Tex>{String.raw`x_{\cdot,c} : E \to D_c`}</Tex>. Each grid cell
            is a Boolean variable that asks “do these two items belong to the same person?”
          </p>
          <p>
            Without clues there are <Tex>{'n!'}</Tex> bijections per category, so the solution space starts at{' '}
            <Tex>{String.raw`|S_0| = (n!)^{k-1}`}</Tex>. A well-made puzzle has clues that leave exactly{' '}
            <Tex>{'|S| = 1'}</Tex>.
          </p>
        </div>
        <div className="model-math">
          <Tex block>{String.raw`\mathcal{P} = \langle X, D, C \rangle`}</Tex>
          <Tex block>{String.raw`\text{cell}(a,b) \in \{\, \checkmark,\ \times,\ ?\, \}`}</Tex>
          <Tex block>{String.raw`|S| \le \prod_{c=1}^{k-1} \operatorname{perm}(M_c)`}</Tex>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <p className="eyebrow">Seven deduction rules</p>
          <h2>From simplest to strongest</h2>
        </div>
        <ol className="rules">
          {RULES.map((r, i) => (
            <li key={r.name} className="card rule">
              <div className="rule-head">
                <span className="step-n">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{r.name}</h3>
                  <span className="chip">{r.area}</span>
                </div>
              </div>
              <div className="formula big"><Tex block>{r.tex}</Tex></div>
              <p><Marks>{r.text}</Marks></p>
              <div className="example">
                <span className="muted small">Example</span>
                <Tex>{r.example}</Tex>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="section">
        <div className="section-head">
          <p className="eyebrow">Beyond puzzles</p>
          <h2>Where this reasoning is used</h2>
        </div>
        <div className="cards four">
          {USES.map(([title, text]) => (
            <article key={title} className="card use">
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="card callout">
          <div>
            <h2>Ready to try?</h2>
            <p className="muted">The tutorial needs rules 1–5. Every hint names the rule it uses.</p>
          </div>
          <a className="btn primary" href="#/solve/1">Start the tutorial</a>
        </div>
      </section>
    </>
  );
}
