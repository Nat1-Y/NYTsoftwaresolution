/** Testimonials carousel — auto-advancing, but never against the user. */
import { $, $$, prefersReducedMotion } from './dom';

export function initCarousel(): void {
  const viewport = $('#testimonials-carousel');
  const track = $('#testimonials-track');
  if (!viewport || !track) return;

  const slides = $$<HTMLElement>('.testimonial-slide', track);
  const dots = $$<HTMLButtonElement>('.testi-dot');
  const prev = $<HTMLButtonElement>('#testi-prev');
  const next = $<HTMLButtonElement>('#testi-next');
  if (slides.length < 2) return;

  let current = 0;
  let timer: number | null = null;
  let paused = false;

  const render = () => {
    const offset = -current * 100;
    slides.forEach((slide, i) => {
      slide.style.transform = `translateX(${offset}%)`;
      // Offscreen slides are hidden so they aren't read out or tabbed into.
      const isCurrent = i === current;
      slide.setAttribute('aria-hidden', String(!isCurrent));
      slide.toggleAttribute('inert', !isCurrent);
    });

    dots.forEach((dot, i) => {
      const active = i === current;
      dot.classList.toggle('active', active);
      dot.setAttribute('aria-selected', String(active));
      dot.tabIndex = active ? 0 : -1;
    });
  };

  const goTo = (index: number) => {
    current = (index + slides.length) % slides.length;
    render();
  };

  const stop = () => {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
  };

  const start = () => {
    stop();
    // Auto-rotation is motion the user did not ask for — skip it entirely
    // when they have asked for reduced motion.
    if (paused || prefersReducedMotion()) return;
    timer = window.setInterval(() => goTo(current + 1), 6000);
  };

  const restart = () => {
    stop();
    start();
  };

  prev?.addEventListener('click', () => {
    goTo(current - 1);
    restart();
  });

  next?.addEventListener('click', () => {
    goTo(current + 1);
    restart();
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goTo(i);
      restart();
    });

    dot.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const nextIndex =
        e.key === 'ArrowRight'
          ? (i + 1) % dots.length
          : (i - 1 + dots.length) % dots.length;
      goTo(nextIndex);
      dots[nextIndex]?.focus();
      restart();
    });
  });

  // Pause while the visitor is reading — on hover and on keyboard focus.
  const pause = () => {
    paused = true;
    stop();
  };
  const resume = () => {
    paused = false;
    start();
  };

  viewport.addEventListener('mouseenter', pause);
  viewport.addEventListener('mouseleave', resume);
  viewport.addEventListener('focusin', pause);
  viewport.addEventListener('focusout', resume);

  // And stop entirely while the tab is in the background.
  document.addEventListener('visibilitychange', () =>
    document.hidden ? stop() : start()
  );

  render();
  start();
}
