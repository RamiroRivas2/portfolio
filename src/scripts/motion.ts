import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

function initLenis() {
  lenis?.destroy();
  lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1.05 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/** Wrap every char of an element in a span so lines can slide up out of a mask. */
function splitChars(el: HTMLElement) {
  const text = el.textContent ?? '';
  el.textContent = '';
  el.setAttribute('aria-label', text);
  for (const word of text.split(' ')) {
    const wordSpan = document.createElement('span');
    wordSpan.className = 'inline-block overflow-hidden align-bottom';
    wordSpan.setAttribute('aria-hidden', 'true');
    for (const ch of word) {
      const c = document.createElement('span');
      c.className = 'char';
      c.textContent = ch;
      wordSpan.appendChild(c);
    }
    el.appendChild(wordSpan);
    el.appendChild(document.createTextNode(' '));
  }
}

function initReveals() {
  // Headline character reveals
  document.querySelectorAll<HTMLElement>('.char-reveal:not([data-split])').forEach((el) => {
    el.dataset.split = 'true';
    splitChars(el);
    gsap.to(el.querySelectorAll('.char'), {
      y: 0,
      duration: 0.9,
      ease: 'power4.out',
      stagger: 0.018,
      delay: Number(el.dataset.delay ?? 0),
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  // Generic fade-up reveals
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.fromTo(
      el,
      { y: 48, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'power3.out',
        delay: Number(el.dataset.delay ?? 0),
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      }
    );
  });

  // Parallax elements: data-speed is relative drift while scrolling
  document.querySelectorAll<HTMLElement>('[data-speed]').forEach((el) => {
    gsap.to(el, {
      yPercent: Number(el.dataset.speed) * -100,
      ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  // Horizontal ruler lines that draw in
  document.querySelectorAll<HTMLElement>('[data-line]').forEach((el) => {
    gsap.fromTo(
      el,
      { scaleX: 0 },
      {
        scaleX: 1,
        transformOrigin: 'left center',
        duration: 1.2,
        ease: 'power3.inOut',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      }
    );
  });
}

function initAll() {
  ScrollTrigger.getAll().forEach((st) => st.kill());
  initLenis();
  // Wait for webfonts so the character reveal never animates through a font
  // swap (reflow mid-stagger reads as jank). Resolves instantly once cached.
  document.fonts.ready.then(() => {
    initReveals();
    ScrollTrigger.refresh();
  });
}

document.addEventListener('astro:page-load', initAll);
