// Generating a hard puzzle can take a second or two, so it runs in a worker.
import { getPuzzle, parseId, cachePuzzle, cachedPuzzle } from './puzzles.js';

let worker = null;
const waiting = new Map();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./generatorWorker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const { id, puzzle, error } = e.data;
      const cbs = waiting.get(id) || [];
      waiting.delete(id);
      if (puzzle) cachePuzzle(puzzle);
      cbs.forEach(({ resolve, reject }) => (puzzle ? resolve(puzzle) : reject(new Error(error))));
    };
  }
  return worker;
}

export function loadPuzzle(id) {
  const hit = cachedPuzzle(id);
  if (hit) return Promise.resolve(hit);
  const parsed = parseId(id);
  if (!parsed) return Promise.resolve(null);
  if (typeof Worker === 'undefined') return Promise.resolve(getPuzzle(id));
  return new Promise((resolve, reject) => {
    if (!waiting.has(id)) {
      waiting.set(id, []);
      getWorker().postMessage({ id, ...parsed });
    }
    waiting.get(id).push({ resolve, reject });
  });
}
