import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/** Renders a LaTeX string with KaTeX. `block` centers it on its own line. */
export default function Tex({ children, block }) {
  const html = useMemo(
    () => katex.renderToString(String(children), { displayMode: !!block, throwOnError: false }),
    [children, block],
  );
  return <span className={block ? 'tex tex-block' : 'tex'} dangerouslySetInnerHTML={{ __html: html }} />;
}
