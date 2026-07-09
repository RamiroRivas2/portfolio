import { useRef, useCallback } from 'react';
import gsap from 'gsap';

interface Props {
  href: string;
  label: string;
}

/** Link that magnetically follows the cursor while hovered, then springs back. */
export default function MagneticLink({ href, label }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(el, { x: x * 0.4, y: y * 0.4, duration: 0.4, ease: 'power3.out' });
  }, []);

  const onLeave = useCallback(() => {
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.35)' });
  }, []);

  const external = href.startsWith('http');

  return (
    <a
      ref={ref}
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="inline-block rounded-full border border-paper/20 px-5 py-2 text-paper transition-colors hover:border-accent hover:text-accent"
    >
      {label}
    </a>
  );
}
