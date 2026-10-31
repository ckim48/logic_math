import { THEMES } from './themes.js';
import { generatePuzzle } from './generator.js';

const camp = THEMES[0];

// Hand-written 3×3 warm-up that walks through translation, elimination,
// and ordering in a few steps.
const TUTORIAL = {
  id: 'tutorial',
  title: 'First Steps',
  themeName: 'Tutorial',
  difficulty: 'tutorial',
  k: 3,
  n: 3,
  entities: camp.entities,
  intro: 'Three campers each chose a different activity and are different ages. Use the clues to match everything up.',
  categories: [
    { ...camp.categories[0], items: ['Ava', 'Ben', 'Chloe'] },
    { ...camp.categories[1], items: ['Archery', 'Canoeing', 'Pottery'] },
    { ...camp.categories[3], items: ['10', '11', '12'] },
  ],
  clues: [
    { type: 'same', a: { c: 0, i: 1 }, b: { c: 1, i: 0 } },
    { type: 'less', a: { c: 1, i: 1 }, b: { c: 0, i: 0 }, cat: 2 },
    { type: 'less', a: { c: 0, i: 0 }, b: { c: 1, i: 0 }, cat: 2 },
  ],
  // Ava: pottery, 11 · Ben: archery, 12 · Chloe: canoeing, 10
  solution: [
    [0, 1, 2],
    [2, 0, 1],
    [1, 2, 0],
  ],
};

export const puzzleId = (difficulty, seed) => `g-${difficulty}-${seed}`;

const cache = new Map([[TUTORIAL.id, TUTORIAL]]);

export function parseId(id) {
  const m = /^g-(easy|medium|hard)-(\d{1,9})$/.exec(id || '');
  return m ? { difficulty: m[1], seed: Number(m[2]) } : null;
}

export const cachedPuzzle = (id) => cache.get(id) || null;
export const cachePuzzle = (p) => cache.set(p.id, p);

export function getPuzzle(id) {
  if (cache.has(id)) return cache.get(id);
  const parsed = parseId(id);
  if (!parsed) return null;
  const p = generatePuzzle(parsed.difficulty, parsed.seed);
  cache.set(id, p);
  return p;
}

export const randomSeed = () => 1000 + Math.floor(Math.random() * 900000);
