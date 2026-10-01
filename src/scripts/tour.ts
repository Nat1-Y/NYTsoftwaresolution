/**
 * NYT Cafe Manager product tour.
 *
 * A tablist over four drawn screens that share one stage. While the tour is
 * on screen it steps through them slowly on its own, because the point of it
 * is to show a product rather than wait to be asked — but it pauses while
 * the pointer or focus is inside it, stops for good the moment anyone picks
 * a screen themselves, and never moves at all under reduced motion.
 */
import { $, $$, prefersReducedMotion, syncTabState, wireTablist } from './dom';

const STEP_MS = 5500;

export function initTour(): void {
  const root = $<HTMLElement>('.tour');
  if (!root) return;

  const tabs = $$<HTMLButtonElement>('[data-tour-tab]', root);
  const panels = $$<HTMLElement>('[data-tour-panel]', root);
  if (!tabs.length || tabs.length !== panels.length) return;

  let current = 0;

  const show = (index: number) => {
    current = index;
    syncTabState(tabs, index);
    panels.forEach((panel, i) => {
      const active = i === index;
      panel.classList.toggle('active', active);
      // Inactive screens leave the accessibility tree, as the case-study
      // panels do, so a screen reader hears only the one on show.
      panel.toggleAttribute('hidden', !active);
    });
  };

  show(0);

  /* ---------------------------------------------------------- autoplay -- */
  let timer: number | undefined;
  let stopped = prefersReducedMotion();
  let inView = false;
  let paused = false;

  const stop = () => {
    window.clearInterval(timer);
    timer = undefined;
  };

  const sync = () => {
    if (stopped || paused || !inView || document.hidden) return stop();
    if (timer === undefined) {
      timer = window.setInterval(() => show((current + 1) % tabs.length), STEP_MS);
    }
  };

  wireTablist(tabs, (_tab, index) => {
    stopped = true;
    stop();
    show(index);
  });

  /*
   * On a touchscreen the screens can be swiped as well as tapped. Only a
   * clearly horizontal gesture counts, so a vertical scroll that starts on the
   * stage still scrolls the page (the stage is `touch-action: pan-y`).
   */
  const stage = $<HTMLElement>('.tour-stage', root);
  let start: { x: number; y: number } | null = null;
  stage?.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') start = { x: e.clientX, y: e.clientY };
  });
  stage?.addEventListener('pointercancel', () => (start = null));
  stage?.addEventListener('pointerup', (e) => {
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    start = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    stopped = true;
    stop();
    show((current + (dx < 0 ? 1 : -1) + tabs.length) % tabs.length);
  });

  if (stopped || !('IntersectionObserver' in window)) return;

  new IntersectionObserver(
    ([entry]) => {
      inView = Boolean(entry?.isIntersecting);
      sync();
    },
    { threshold: 0.5 }
  ).observe(root);

  const pause = (value: boolean) => () => {
    paused = value;
    sync();
  };
  root.addEventListener('pointerenter', pause(true));
  root.addEventListener('pointerleave', pause(false));
  root.addEventListener('focusin', pause(true));
  root.addEventListener('focusout', pause(false));
  document.addEventListener('visibilitychange', sync);
}
