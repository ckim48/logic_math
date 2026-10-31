import 'bootstrap-icons/font/bootstrap-icons.min.css';

/** A Bootstrap Icons glyph, e.g. <Icon name="lightbulb" />. */
export default function Icon({ name, className = '' }) {
  return <i className={`bi bi-${name} ${className}`} aria-hidden="true" />;
}

/** Text in which ✓ and ✗ are drawn as icons. */
export function Marks({ children }) {
  return String(children)
    .split(/([✓✗])/)
    .map((part, i) => {
      if (part === '✓') return <Icon key={i} name="check-lg" className="mk yes" />;
      if (part === '✗') return <Icon key={i} name="x-lg" className="mk no" />;
      return part;
    });
}
