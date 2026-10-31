// The problem set: a fixed sequence that unlocks one problem at a time.
// Every generated seed is checked by scripts/verify-puzzles.mjs.
export const PROBLEMS = [
  { id: 'tutorial', level: 'Tutorial' },
  { id: 'g-easy-1000', level: 'Easy' },
  { id: 'g-easy-101', level: 'Easy' },
  { id: 'g-easy-1002', level: 'Easy' },
  { id: 'g-medium-1001', level: 'Medium' },
  { id: 'g-medium-1002', level: 'Medium' },
  { id: 'g-medium-104', level: 'Medium' },
  { id: 'g-hard-1000', level: 'Hard' },
  { id: 'g-hard-1001', level: 'Hard' },
  { id: 'g-hard-1002', level: 'Hard' },
];

export const problemIndex = (id) => PROBLEMS.findIndex((p) => p.id === id);

/** Problem i is open once the one before it is solved. */
export const isUnlocked = (i, solved) => i === 0 || solved.has(PROBLEMS[i].id) || solved.has(PROBLEMS[i - 1].id);

/** Index of the first problem not yet solved (the last one if all are). */
export function currentIndex(solved) {
  const i = PROBLEMS.findIndex((p) => !solved.has(p.id));
  return i === -1 ? PROBLEMS.length - 1 : i;
}
