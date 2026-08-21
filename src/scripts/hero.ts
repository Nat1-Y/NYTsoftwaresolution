/**
 * Hero console.
 *
 * Cycles the four production systems, typing each command out before its
 * readout lands. Two rules shape the implementation:
 *
 *   1. It must never be the reason the hero looks broken. Every animation
 *      starts from the fully-rendered server markup and only ever adds to it,
 *      so if this module never runs, the first system is simply on screen.
 *   2. Reduced motion means reduced motion — no typing, no cycling, no
 *      pointer glow. Not a faster version of the same thing.
 */
import { $, $$, prefersReducedMotion } from './dom';

const CYCLE_MS = 5200;
const TYPE_MS = 26;

/* ------------------------------------------------------------- spotlight -- */
/**
 * A soft light that follows the pointer across the hero. Written to a custom
 * property on the block itself so the paint stays in CSS.
 */
function initSpotlight(): void {
  const block = $('.hero-block');
  if (!block || prefersReducedMotion()) return;

  // Coarse pointers have no hover position to track — the glow would either
  // sit where the last tap landed or never appear at all.
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  let frame = 0;

  block.addEventListener('pointermove', (e) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const rect = block.getBoundingClientRect();
      block.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
      block.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
      block.classList.add('spotlit');
    });
  });

  block.addEventListener('pointerleave', () => block.classList.remove('spotlit'));
}

/* --------------------------------------------------------------- console -- */
function initConsole(): void {
  const console_ = $('#hero-console');
  if (!console_) return;

  const tabs = $$<HTMLElement>('.console-tab', console_);
  const panels = $$<HTMLElement>('.console-panel', console_);
  if (panels.length < 2) return;

  const reduced = prefersReducedMotion();

  // Static mode: show the first system, fully revealed, and stop.
  if (reduced) {
    panels.forEach((panel, i) => panel.classList.toggle('active', i === 0));
    panels[0]?.classList.add('revealed');
    return;
  }

  let index = 0;
  let timer = 0;
  let typing = 0;
  let paused = false;

  /** Type the command out one character at a time, then reveal the readout. */
  const type = (panel: HTMLElement) => {
    const target = panel.querySelector<HTMLElement>('.console-typed');
    if (!target) {
      panel.classList.add('revealed');
      return;
    }

    const full = target.dataset.full ?? target.textContent ?? '';
    let at = 0;
    target.textContent = '';
    panel.classList.remove('revealed');
    panel.classList.add('typing');

    window.clearInterval(typing);
    typing = window.setInterval(() => {
      at += 1;
      target.textContent = full.slice(0, at);
      if (at < full.length) return;

      window.clearInterval(typing);
      panel.classList.remove('typing');
      panel.classList.add('revealed');
    }, TYPE_MS);
  };

  const show = (next: number) => {
    index = (next + panels.length) % panels.length;

    panels.forEach((panel, i) => {
      const on = i === index;
      panel.classList.toggle('active', on);
      if (!on) panel.classList.remove('revealed', 'typing');
    });

    tabs.forEach((tab, i) => tab.classList.toggle('active', i === index));

    const panel = panels[index];
    if (panel) type(panel);
  };

  const schedule = () => {
    window.clearTimeout(timer);
    if (paused) return;
    timer = window.setTimeout(() => {
      show(index + 1);
      schedule();
    }, CYCLE_MS);
  };

  /*
   * Reading the panel while it rewrites itself is the one thing this must not
   * do to someone, so hovering the console holds the current system.
   */
  console_.addEventListener('pointerenter', () => {
    paused = true;
    window.clearTimeout(timer);
  });

  console_.addEventListener('pointerleave', () => {
    paused = false;
    schedule();
  });

  // A tab stops the carousel and pins what was clicked.
  tabs.forEach((tab, i) =>
    tab.addEventListener('click', () => {
      show(i);
      schedule();
    })
  );

  // Nothing animates until the hero is actually on screen.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            paused = false;
            schedule();
          } else {
            paused = true;
            window.clearTimeout(timer);
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(console_);
  }

  show(0);
  schedule();
}

export function initHero(): void {
  initConsole();
  initSpotlight();
}
