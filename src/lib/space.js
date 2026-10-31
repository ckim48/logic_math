// Size of the solution space that is still open.
//
// A complete answer is one bijection (permutation) per non-anchor category,
// so before any marks |S₀| = (n!)^(k-1). Given the current marks, M_c is the
// 0/1 matrix of anchor–category-c pairs that are still possible, and the
// number of bijections that fit it is the permanent of M_c. Their product is
// an upper bound on the remaining answers: |S| ≤ ∏ perm(M_c).
import { YES, NO, getCell } from './engine.js';

const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));

/** Number of perfect matchings of an n×n 0/1 matrix (n ≤ 5, so brute force is fine). */
function permanent(M, row = 0, used = 0) {
  if (row === M.length) return 1;
  let total = 0;
  for (let j = 0; j < M.length; j++) if (!(used & (1 << j)) && M[row][j]) total += permanent(M, row + 1, used | (1 << j));
  return total;
}

/** A cell is open unless it is ✗, or another cell in its row/column already has the ✓. */
function openMatrix(s, c) {
  const { n } = s;
  const v = (e, j) => getCell(s, { c: 0, i: e }, { c, i: j });
  return Array.from({ length: n }, (_, e) =>
    Array.from({ length: n }, (_, j) => {
      if (v(e, j) === NO) return 0;
      for (let x = 0; x < n; x++) if ((x !== j && v(e, x) === YES) || (x !== e && v(x, j) === YES)) return 0;
      return 1;
    }),
  );
}

export function solutionSpace(s) {
  const { k, n } = s;
  const total = factorial(n) ** (k - 1);
  const perms = [];
  for (let c = 1; c < k; c++) perms.push(permanent(openMatrix(s, c)));
  const bound = perms.reduce((a, b) => a * b, 1);
  // Progress on a log scale: log|S| falls from log|S₀| to 0 as the puzzle is solved.
  const progress = bound <= 1 ? 1 : 1 - Math.log(bound) / Math.log(total);
  return { total, bound, perms, progress, n, k };
}
