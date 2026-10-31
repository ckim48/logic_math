import { generatePuzzle } from './generator.js';

self.onmessage = (e) => {
  const { id, difficulty, seed } = e.data;
  try {
    self.postMessage({ id, puzzle: generatePuzzle(difficulty, seed) });
  } catch (err) {
    self.postMessage({ id, error: String(err) });
  }
};
