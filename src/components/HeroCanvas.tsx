import { useEffect, useRef } from 'react';

interface Dot {
  ox: number;
  oy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const REPULSE_RADIUS = 140;
const REPULSE_FORCE = 1400;
const SPRING = 0.045;
const FRICTION = 0.86;
const SETTLED = 0.35; // px displacement below which a dot counts as at rest
const IDLE_FRAMES = 30;
const MAX_COLS = 38; // cap simulation size on large screens

/**
 * Full-bleed interactive dot field: a calm grid that scatters away from the
 * cursor and springs back. Pure 2D canvas, no dependencies.
 *
 * Perf contract: the simulation only runs while something is actually moving.
 * At rest it draws one static frame and cancels its rAF loop entirely, so it
 * costs nothing during page load (while the headline reveal animates) and
 * nothing while idle. Pointer movement wakes it; leaving the viewport pauses it.
 */
export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let dots: Dot[] = [];
    let raf = 0;
    let width = 0;
    let height = 0;
    let idleFrames = 0;
    let visible = true;
    const mouse = { x: -9999, y: -9999 };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const gap = Math.max(34, width / MAX_COLS);
      dots = [];
      for (let y = gap / 2; y < height; y += gap) {
        for (let x = gap / 2; x < width; x += gap) {
          dots.push({ ox: x, oy: y, x, y, vx: 0, vy: 0 });
        }
      }
      drawFrame();
    };

    /** One frame: physics + paint. Returns true if anything is still moving. */
    const drawFrame = (): boolean => {
      ctx.clearRect(0, 0, width, height);
      let anyMotion = false;
      const hot: { d: Dot; displaced: number }[] = [];

      // Calm dots batch into a single path + fill; only displaced dots pay
      // for their own fillStyle.
      ctx.beginPath();
      for (const d of dots) {
        const dx = d.x - mouse.x;
        const dy = d.y - mouse.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < REPULSE_RADIUS * REPULSE_RADIUS && dist2 > 0.01) {
          const dist = Math.sqrt(dist2);
          const force = REPULSE_FORCE / dist2;
          d.vx += (dx / dist) * force;
          d.vy += (dy / dist) * force;
        }
        d.vx += (d.ox - d.x) * SPRING;
        d.vy += (d.oy - d.y) * SPRING;
        d.vx *= FRICTION;
        d.vy *= FRICTION;
        d.x += d.vx;
        d.y += d.vy;

        const displaced = Math.hypot(d.x - d.ox, d.y - d.oy);
        if (displaced > SETTLED || Math.abs(d.vx) + Math.abs(d.vy) > 0.05) anyMotion = true;

        if (displaced > 3) {
          hot.push({ d, displaced: Math.min(displaced / 40, 1) });
        } else {
          ctx.moveTo(d.x + 1, d.y);
          ctx.arc(d.x, d.y, 1, 0, Math.PI * 2);
        }
      }
      ctx.fillStyle = 'rgba(236, 236, 241, 0.13)';
      ctx.fill();

      for (const { d, displaced } of hot) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, 1 + displaced * 1.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 240, 74, ${0.25 + displaced * 0.6})`;
        ctx.fill();
      }
      return anyMotion;
    };

    const tick = () => {
      const anyMotion = drawFrame();
      if (anyMotion) {
        idleFrames = 0;
      } else if (++idleFrames > IDLE_FRAMES) {
        raf = 0; // fully asleep: no rAF until the pointer wakes us
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (!raf && visible) {
        idleFrames = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      wake();
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    // Starts asleep: build() paints the static grid once, and the sim only
    // spends frames after the first pointer movement.
    build();
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);
    const ro = new ResizeObserver(build);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (visible) {
        wake();
      }
    });
    io.observe(canvas);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
