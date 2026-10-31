import { useEffect, useRef } from 'react';

// Hero background: faint ✓ / ✗ marks appearing on the page grid while a few
// sine-sum curves drift across it. Static frame when reduced motion is on.
const CELL = 32;
const MARKS = 16;
const CURVES = [
  { amp: 70, terms: [[1, 0.0045, 0.00022], [0.35, 0.011, -0.0004]], y: 0.38 },
  { amp: 90, terms: [[1, 0.0032, -0.00016], [0.25, 0.009, 0.0003]], y: 0.62 },
  { amp: 50, terms: [[1, 0.006, 0.0003], [0.4, 0.0021, 0.00012]], y: 0.5 },
];

function palette() {
  const css = getComputedStyle(document.documentElement);
  return { accent: css.getPropertyValue('--accent').trim(), muted: css.getPropertyValue('--muted').trim() };
}

export default function HeroBg() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    let colors = palette();
    const onScheme = () => (colors = palette());
    scheme.addEventListener('change', onScheme);

    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const newMark = (t, spread = 0) => ({
      col: Math.floor(Math.random() * Math.ceil(w / CELL)),
      row: Math.floor(Math.random() * Math.ceil(h / CELL)),
      yes: Math.random() < 0.35,
      born: t - Math.random() * spread,
      life: 3500 + Math.random() * 3000,
    });
    let marks = Array.from({ length: MARKS }, () => newMark(0, 6000));

    const drawMark = (m, t) => {
      const p = (t - m.born) / m.life;
      if (p < 0 || p > 1) return;
      const a = Math.sin(p * Math.PI);
      const x = m.col * CELL;
      const y = m.row * CELL;
      ctx.globalAlpha = a * (m.yes ? 0.5 : 0.3);
      ctx.strokeStyle = m.yes ? colors.accent : colors.muted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (m.yes) {
        ctx.moveTo(x + 10, y + 17);
        ctx.lineTo(x + 14, y + 21);
        ctx.lineTo(x + 22, y + 11);
      } else {
        ctx.moveTo(x + 11, y + 11);
        ctx.lineTo(x + 21, y + 21);
        ctx.moveTo(x + 21, y + 11);
        ctx.lineTo(x + 11, y + 21);
      }
      ctx.stroke();
      if (m.yes) {
        ctx.globalAlpha = a * 0.06;
        ctx.fillStyle = colors.accent;
        ctx.fillRect(x + 1, y + 1, CELL - 1, CELL - 1);
      }
    };

    const curveY = (c, x, t) => c.y * h + c.amp * c.terms.reduce((s, [k, f, v]) => s + k * Math.sin(f * x + v * t), 0);

    const drawCurves = (t) => {
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = colors.accent;
      CURVES.forEach((c, i) => {
        ctx.globalAlpha = i === 2 ? 0.12 : 0.2;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 6) {
          const y = curveY(c, x, t);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        // a point travelling along the curve
        const px = ((t * 0.04 + i * w * 0.37) % (w + 80)) - 40;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = colors.accent;
        ctx.beginPath();
        ctx.arc(px, curveY(c, px, t), 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    let raf = 0;
    let visible = true;
    const frame = (t) => {
      ctx.clearRect(0, 0, w, h);
      marks = marks.map((m) => (t - m.born > m.life ? newMark(t) : m));
      marks.forEach((m) => drawMark(m, t));
      drawCurves(t);
      ctx.globalAlpha = 1;
      if (!reduced && visible) raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !reduced) raf = requestAnimationFrame(frame);
    });
    if (reduced) frame(3000);
    else io.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      scheme.removeEventListener('change', onScheme);
    };
  }, []);

  return <canvas ref={ref} className="hero-bg" aria-hidden="true" />;
}
