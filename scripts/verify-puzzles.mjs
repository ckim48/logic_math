// Checks that generated puzzles are correct: every clue is true for the
// hidden solution, the engine reaches that solution, and (for grids small
// enough to brute-force) exactly one arrangement satisfies all clues.
import { getPuzzle } from '../src/lib/puzzles.js';
import { PROBLEMS } from '../src/lib/problems.js';
import { solve, truthState } from '../src/lib/engine.js';
import { checkClue } from '../src/lib/puzzle.js';

function permutations(n) {
  if (n === 0) return [[]];
  const out = [];
  for (const p of permutations(n - 1))
    for (let i = 0; i <= p.length; i++) out.push([...p.slice(0, i), n - 1, ...p.slice(i)]);
  return out;
}

function countSolutions(p) {
  const perms = permutations(p.n);
  let count = 0;
  (function rec(sol) {
    if (sol.length === p.k) return void (p.clues.every((c) => checkClue(c, sol)) && count++);
    for (const q of perms) rec([...sol, q]);
  })([perms[0].map((_, i) => i)]);
  return count;
}

const ids = PROBLEMS.map((p) => p.id);
let failed = 0;
for (const id of ids) {
  const p = getPuzzle(id);
  const cluesTrue = p.clues.every((c) => checkClue(c, p.solution));
  const r = solve(p);
  const matches = r.solved && JSON.stringify(r.state.g) === JSON.stringify(truthState(p).g);
  const unique = p.n <= 4 ? countSolutions(p) === 1 : 'skipped';
  const ok = cluesTrue && matches && unique !== false;
  if (!ok) failed++;
  console.log(`${ok ? '✓' : '✗'} ${id.padEnd(14)} ${p.k}×${p.n}  ${p.clues.length} clues  ${r.steps.length} steps  unique: ${unique}`);
}
if (failed) {
  console.error(`${failed} puzzle(s) failed`);
  process.exit(1);
}
