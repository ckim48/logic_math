import { YES, NO, getCell, cellId } from './lib/engine';
import { lab } from './lib/puzzle';
import Icon from './Icon';

// Staircase layout: columns are categories 1..k-1, rows are category 0
// followed by k-1, k-2, …, 2, so every pair of categories appears once.
export default function Grid({ puzzle, state, onCell, highlights = {}, readOnly }) {
  const { k, n, categories } = puzzle;
  const colCats = Array.from({ length: k - 1 }, (_, i) => i + 1);
  const rowCats = [0, ...Array.from({ length: k - 2 }, (_, i) => k - 1 - i)];

  return (
    <div className="grid-scroll">
      <table className="grid">
        <thead>
          <tr>
            <th colSpan={2} rowSpan={2} />
            {colCats.map((c) => (
              <th key={c} className="cat-h" colSpan={n}>{categories[c].name}</th>
            ))}
          </tr>
          <tr>
            {colCats.flatMap((c) =>
              categories[c].items.map((_, j) => (
                <th key={`${c}-${j}`} className="col-label">
                  <span>{lab(puzzle, { c, i: j })}</span>
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {rowCats.map((rc, ri) =>
            categories[rc].items.map((_, i) => (
              <tr key={`${rc}-${i}`} className={i === n - 1 ? 'b-bottom' : ''}>
                {i === 0 && (
                  <th className="cat-v" rowSpan={n}><span>{categories[rc].name}</span></th>
                )}
                <th className="row-label">{lab(puzzle, { c: rc, i })}</th>
                {colCats.map((cc, ci) =>
                  ci < k - 1 - ri
                    ? categories[cc].items.map((__, j) => {
                        const a = { c: rc, i }, b = { c: cc, i: j };
                        const v = getCell(state, a, b);
                        const id = cellId(a, b);
                        return (
                          <td key={id} className={`${j === n - 1 ? 'b-right' : ''} ${ci === 0 && j === 0 ? 'b-left' : ''}`}>
                            <button
                              type="button"
                              className={`cell ${highlights[id] || ''}`}
                              aria-label={`${lab(puzzle, a)} and ${lab(puzzle, b)}: ${v === YES ? 'match' : v === NO ? 'no match' : 'unknown'}`}
                              onClick={() => !readOnly && onCell(a, b, 'cycle')}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                if (!readOnly) onCell(a, b, 'no');
                              }}
                            >
                              {v === YES ? <Icon name="check-lg" /> : v === NO ? <Icon name="x-lg" /> : null}
                            </button>
                          </td>
                        );
                      })
                    : null,
                )}
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}
