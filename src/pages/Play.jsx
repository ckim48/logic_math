import { useCallback, useEffect, useMemo, useState } from 'react';
import Grid from '../Grid';
import Icon, { Marks } from '../Icon';
import Tex from '../Tex';
import {
  UNK, YES, NO, applyStep, cellId, cloneState, createState, forEachBlock, getCell, nextStep, setCell, solve, stateAfter, truthState,
} from '../lib/engine';
import { describe } from '../lib/explain';
import { clueMath, clueText, problemText } from '../lib/puzzle';
import { cachedPuzzle } from '../lib/puzzles';
import { loadPuzzle } from '../lib/loadPuzzle';
import { PROBLEMS, currentIndex, isUnlocked, problemIndex } from '../lib/problems';
import { solutionSpace } from '../lib/space';
import { loadProgress, loadSolved, saveProgress } from '../store';

const IDS = PROBLEMS.map((p) => p.id);

/** "#/solve/3" → 2. Also accepts a puzzle id from older links. */
function indexFromArg(arg) {
  const n = Number(arg);
  if (Number.isInteger(n) && n >= 1 && n <= PROBLEMS.length) return n - 1;
  return problemIndex(arg);
}

export default function Play({ id, user }) {
  const uid = user?.uid || null;
  const authKnown = user !== undefined;
  const [solved, setSolved] = useState(null);
  useEffect(() => {
    if (!authKnown) return undefined;
    let alive = true;
    loadSolved(uid, IDS).then((s) => alive && setSolved(s));
    return () => {
      alive = false;
    };
  }, [authKnown, uid]);

  // "#/solve" (or an unknown argument) goes to the first unsolved problem.
  const index = indexFromArg(id);
  const canonical = index >= 0 && String(index + 1) === id;
  useEffect(() => {
    if (!solved || canonical) return;
    window.location.replace(`#/solve/${(index >= 0 ? index : currentIndex(solved)) + 1}`);
  }, [solved, canonical, index]);

  const pid = PROBLEMS[index]?.id;
  const open = solved && canonical && isUnlocked(index, solved);
  const [puzzle, setPuzzle] = useState(() => cachedPuzzle(pid));
  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    loadPuzzle(pid)
      .then((p) => {
        if (alive) setPuzzle(p);
        // Warm up the next problem while this one is being solved.
        if (PROBLEMS[index + 1]) loadPuzzle(PROBLEMS[index + 1].id);
      });
    return () => {
      alive = false;
    };
  }, [open, pid, index]);

  const markSolved = useCallback((done) => setSolved((s) => (s.has(done) ? s : new Set([...s, done]))), []);

  if (!solved || !canonical) return <div className="loading"><Tex>{String.raw`\text{Loading the problem set} \ldots`}</Tex></div>;

  return (
    <>
      <div className="sheet-bar">
        <p className="set-count">
          <strong>Problem set</strong>
          <span>{IDS.filter((x) => solved.has(x)).length} / {PROBLEMS.length} solved</span>
        </p>
        <nav className="steps" aria-label="Problems">
          {PROBLEMS.map((p, i) => {
            const state = solved.has(p.id) ? 'done' : isUnlocked(i, solved) ? 'open' : 'locked';
            const cls = `${state} ${i === index ? 'on' : ''}`;
            const tip = `Problem ${i + 1} · ${p.level}${state === 'locked' ? ' (locked)' : ''}`;
            return state === 'locked' ? (
              <span key={p.id} className={cls} title={tip}><Icon name="lock" /></span>
            ) : (
              <a key={p.id} className={cls} href={`#/solve/${i + 1}`} title={tip}>{i + 1}</a>
            );
          })}
        </nav>
      </div>

      {!open ? (
        <section className="pane locked-pane">
          <Icon name="lock" className="locked-icon" />
          <h2>Problem {index + 1} is locked</h2>
          <p className="muted">Solve Problem {index} first. Problems unlock one at a time.</p>
          <a className="btn primary" href={`#/solve/${currentIndex(solved) + 1}`}>
            Go to Problem {currentIndex(solved) + 1} <Icon name="arrow-right" />
          </a>
        </section>
      ) : puzzle?.id === pid ? (
        <Game key={`${pid}:${uid || ''}`} puzzle={puzzle} uid={uid} index={index} onSolved={markSolved} />
      ) : (
        <div className="loading">
          <Tex>{String.raw`\text{Generating Problem ${index + 1} with } |S| = 1 \ldots`}</Tex>
        </div>
      )}
    </>
  );
}

/** Marks that disagree with the solution. */
function wrongCells(s, truth) {
  const out = [];
  forEachBlock(s, (c1, c2, arr) => {
    const t = truth.g[`${c1},${c2}`];
    arr.forEach((v, idx) => {
      if (v !== UNK && v !== t[idx]) out.push(cellId({ c: c1, i: Math.floor(idx / s.n) }, { c: c2, i: idx % s.n }));
    });
  });
  return out;
}

/** Every ✓ is placed and nothing is wrong. */
function isSolved(s, truth) {
  let ok = true;
  forEachBlock(s, (c1, c2, arr) => {
    const t = truth.g[`${c1},${c2}`];
    arr.forEach((v, idx) => {
      if ((t[idx] === YES && v !== YES) || (v !== UNK && v !== t[idx])) ok = false;
    });
  });
  return ok;
}

/** 1728000 → 1{,}728{,}000 for KaTeX. */
const num = (x) => x.toLocaleString('en-US').replace(/,/g, '{,}');

function SpacePanel({ state }) {
  const { bound, perms, progress, k } = useMemo(() => solutionSpace(state), [state]);
  const product = perms.length > 1 ? `${perms.map(num).join(' \\cdot ')} = ${num(bound)}` : num(bound);
  return (
    <section className="pane">
      <p className="pane-label">
        Solution space
        <span className={bound === 0 ? 'bad' : ''}>{bound === 0 ? 'contradiction' : bound === 1 ? 'unique' : `${Math.round(progress * 100)}%`}</span>
      </p>
      <Tex block>{String.raw`|S| \le \prod_{c=1}^{${k - 1}} \operatorname{perm}(M_c) = ${product}`}</Tex>
      <div className={`meter ${bound === 0 ? 'bad' : ''}`}>
        <div style={{ width: `${bound === 0 ? 100 : progress * 100}%` }} />
      </div>
      <p className="muted small">
        {bound === 0 ? <Marks>No answer fits these marks: some ✗ or ✓ contradicts another.</Marks> : 'Log scale, from no clues used to exactly one answer.'}
      </p>
    </section>
  );
}

function Game({ puzzle, uid, index, onSolved }) {
  const { k, n } = puzzle;
  const truth = useMemo(() => truthState(puzzle), [puzzle]);
  const steps = useMemo(() => solve(puzzle).steps, [puzzle]);

  const [grid, setGrid] = useState(() => createState(k, n));
  const [history, setHistory] = useState([]);
  const [hints, setHints] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState('');
  const [message, setMessage] = useState(null); // { title, text, math?, cells, step? }
  const [solverIdx, setSolverIdx] = useState(null); // null while the student is playing

  const solved = isSolved(grid, truth);

  useEffect(() => {
    loadProgress(uid, puzzle.id).then((d) => {
      if (d?.grid) setGrid({ k, n, g: d.grid });
      setHints(d?.hints || 0);
      setLoaded(true);
    });
  }, [uid, puzzle.id, k, n]);

  useEffect(() => {
    if (!loaded) return undefined;
    const t = setTimeout(() => saveProgress(uid, puzzle.id, { grid: grid.g, hints, solved }).then(setSaved), 500);
    return () => clearTimeout(t);
  }, [loaded, uid, puzzle.id, grid, hints, solved]);

  useEffect(() => {
    if (loaded && solved) onSolved(puzzle.id);
  }, [loaded, solved, puzzle.id, onSolved]);

  const update = (g) => {
    setHistory((h) => [...h, grid]);
    setGrid(g);
    setMessage(null);
  };

  // Click: blank → ✗ → ✓ → blank. Right-click: toggle ✗. A ✓ crosses out its row and column.
  const onCell = (a, b, mode) => {
    if (solved) return;
    const cur = getCell(grid, a, b);
    const next = mode === 'no' ? (cur === NO ? UNK : NO) : cur === UNK ? NO : cur === NO ? YES : UNK;
    const g = cloneState(grid);
    setCell(g, a, b, next);
    if (next === YES)
      for (let x = 0; x < n; x++) {
        if (x !== b.i && getCell(g, a, { c: b.c, i: x }) === UNK) setCell(g, a, { c: b.c, i: x }, NO);
        if (x !== a.i && getCell(g, { c: a.c, i: x }, b) === UNK) setCell(g, { c: a.c, i: x }, b, NO);
      }
    update(g);
  };

  const undo = () => {
    if (!history.length) return;
    setGrid(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
    setMessage(null);
  };

  const check = () => {
    const wrong = wrongCells(grid, truth);
    setMessage(
      wrong.length
        ? { title: 'Check', text: `${wrong.length} mark${wrong.length > 1 ? 's are' : ' is'} wrong (shown in red).`, cells: wrong, bad: true }
        : { title: 'Check', text: 'Everything you have marked so far is correct.', cells: [] },
    );
  };

  // A hint is the simplest deduction that follows from the student's own grid.
  const hint = () => {
    const wrong = wrongCells(grid, truth);
    if (wrong.length) {
      setMessage({ title: 'Fix your marks first', text: `${wrong.length} mark${wrong.length > 1 ? 's don’t' : ' doesn’t'} fit the clues (shown in red).`, cells: wrong, bad: true });
      return;
    }
    const step = nextStep(puzzle, grid);
    if (!step) return;
    setHints((h) => h + 1);
    setMessage({ ...describe(puzzle, step), cells: step.changes.map((ch) => cellId(ch.a, ch.b)), step });
  };

  const applyHint = () => {
    const g = cloneState(grid);
    applyStep(g, message.step);
    update(g);
  };

  const reset = () => {
    if (window.confirm('Clear the grid?')) update(createState(k, n));
  };

  // Solver view: replays the engine's solution one step at a time.
  const solverStep = solverIdx > 0 ? steps[solverIdx - 1] : null;
  const shown = useMemo(() => (solverIdx === null ? grid : stateAfter(puzzle, steps, solverIdx)), [solverIdx, grid, puzzle, steps]);
  const box = solverIdx === null ? message : solverStep && { ...describe(puzzle, solverStep), cells: solverStep.changes.map((ch) => cellId(ch.a, ch.b)), step: solverStep };

  const highlights = {};
  box?.cells.forEach((c) => (highlights[c] = box.bad ? 'bad' : 'new'));
  const activeClue = box?.step?.clue;
  const { setup, question } = problemText(puzzle);
  const next = PROBLEMS[index + 1];

  let total = 1;
  for (let x = 2; x <= n; x++) total *= x;
  total **= k - 1;

  return (
    <>
      <header className="problem-head">
        <p className="eyebrow">Problem {index + 1} of {PROBLEMS.length} · {PROBLEMS[index].level} · {k} × {n}</p>
        <h1>{puzzle.difficulty === 'tutorial' ? puzzle.title : puzzle.themeName}</h1>
        <p className="statement">
          <strong>Problem {index + 1}.</strong> {setup}{' '}
          {puzzle.clues.map((cl, i) => (
            <span key={i} className={activeClue === i ? 'active' : ''}>{clueText(cl, puzzle)} </span>
          ))}
          <em>{question}</em>
        </p>
        <p className="problem-def">
          <Tex>{String.raw`k = ${k},\; n = ${n},\; |C| = ${puzzle.clues.length},\; |S_0| = (${n}!)^{${k - 1}} = ${num(total)}`}</Tex>
        </p>
      </header>

      <div className="workbench">
        <section className="pane workspace">
          <p className="pane-label">
            {solverIdx === null ? 'Workspace' : 'Proof'}
            {solverIdx !== null && <span>step {solverIdx} / {steps.length}</span>}
          </p>
          <Grid puzzle={puzzle} state={shown} onCell={onCell} highlights={highlights} readOnly={solverIdx !== null || solved} />
          {solverIdx === null ? (
            <div className="toolbar">
              <button onClick={undo} disabled={!history.length || solved}><Icon name="arrow-counterclockwise" />Undo</button>
              <button onClick={reset} disabled={solved}><Icon name="eraser" />Reset</button>
              <button onClick={check} disabled={solved}><Icon name="check2-circle" />Verify</button>
              <button className="primary" onClick={hint} disabled={solved}><Icon name="lightbulb" />Hint</button>
              <span className="grow" />
              <button onClick={() => setSolverIdx(0)}><Icon name="list-ol" />Show proof</button>
            </div>
          ) : (
            <div className="toolbar">
              <button onClick={() => setSolverIdx(Math.max(0, solverIdx - 1))} disabled={solverIdx === 0}><Icon name="arrow-left" />Prev</button>
              <button className="primary" onClick={() => setSolverIdx(solverIdx + 1)} disabled={solverIdx >= steps.length}>Next<Icon name="arrow-right" /></button>
              <span className="grow" />
              <button onClick={() => setSolverIdx(null)}><Icon name="arrow-return-left" />Back to my grid</button>
            </div>
          )}
          <p className="help">
            <span>Click: blank <Icon name="arrow-right-short" /> <Marks>✗</Marks> <Icon name="arrow-right-short" /> <Marks>✓</Marks> · Right-click: <Marks>✗</Marks> · Hints used: {hints}</span>
            {saved && (
              <span className={`saved ${saved}`}>{saved === 'cloud' ? 'Saved to Firebase' : uid ? 'Saved in this browser (cloud save failed)' : 'Saved in this browser · sign in to sync'}</span>
            )}
          </p>
        </section>

        <aside className="side">
          <SpacePanel state={shown} />

          {solved && solverIdx === null && (
            <section className="pane solved">
              <p className="pane-label">Result</p>
              <Tex block>{String.raw`|S| = 1 \qquad \blacksquare`}</Tex>
              <p className="muted small">Every constraint is satisfied by exactly one assignment.</p>
              {next ? (
                <a className="btn primary" href={`#/solve/${index + 2}`}>Next: Problem {index + 2}<Icon name="arrow-right" /></a>
              ) : (
                <p className="small"><Icon name="trophy" /> You finished the problem set.</p>
              )}
            </section>
          )}

          {solverIdx === 0 && (
            <section className="pane">
              <p className="pane-label">Proof</p>
              <p className="muted small">Each clue becomes a constraint, then the simplest valid rule is applied at every step. Press Next to begin.</p>
            </section>
          )}

          {box && (
            <section className={`pane explain ${box.bad ? 'bad' : ''}`}>
              <p className="pane-label">
                {solverIdx !== null ? `Step ${solverIdx}` : box.step ? 'Hint' : box.title}
              </p>
              {(box.step || solverIdx !== null) && <h3>{box.title}</h3>}
              <p><Marks>{box.text}</Marks></p>
              {box.math && <pre className="formula mathfont">{box.math}</pre>}
              {box.chain && (
                <ol className="chain">
                  {(box.chain.length > 8 ? [...box.chain.slice(0, 3), '…', ...box.chain.slice(-4)] : box.chain).map((line, i) => (
                    <li key={i}><Marks>{line}</Marks></li>
                  ))}
                </ol>
              )}
              {solverIdx === null && box.step && <button className="primary" onClick={applyHint}>Apply this step</button>}
            </section>
          )}

          <section className="pane">
            <p className="pane-label">Given</p>
            <ol className="clues">
              {puzzle.clues.map((cl, i) => (
                <li key={i} className={activeClue === i ? 'active' : ''}>
                  <span className="c-n"><Tex>{`C_{${i + 1}}`}</Tex></span>
                  <code className="mathfont">{clueMath(cl, puzzle)}</code>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </>
  );
}
