/**
 * Page-level behaviour: loader, reveals, counters, nav state, scroll affordances.
 */
import { $, $$, prefersReducedMotion, rafThrottle } from './dom';
import { loader as loaderConfig } from '../data/site';

/* ---------------------------------------------------------------- loader -- */
/**
 * Intro splash.
 *
 * Held for a configured minimum (see `loader` in src/data/site.ts) so the
 * brand animation gets its moment, then dismissed as soon as the page is
 * ready. A hard ceiling guarantees nobody is ever stuck behind it.
 *
 * Any click or keypress skips the remainder — a visitor who wants the content
 * should never be made to wait for an animation, and it doubles as the escape
 * hatch for anyone tabbing straight into the page.
 */
function initLoader(): void {
  const loader = $('#page-loader');
  if (!loader) return;

  const minMs = Math.max(0, loaderConfig.minMs);
  const maxMs = Math.max(minMs, loaderConfig.maxMs);
  const startedAt = performance.now();

  let dismissed = false;

  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    loader.classList.add('hidden');
    document.removeEventListener('keydown', onSkip);
    loader.removeEventListener('click', onSkip);
    window.setTimeout(() => loader.remove(), 600);
  };

  function onSkip() {
    dismiss();
  }

  /** Dismiss once the page is ready AND the minimum hold has elapsed. */
  const dismissWhenReady = () => {
    const elapsed = performance.now() - startedAt;
    window.setTimeout(dismiss, Math.max(0, minMs - elapsed));
  };

  if (document.readyState === 'complete') dismissWhenReady();
  else window.addEventListener('load', dismissWhenReady, { once: true });

  // Ceiling: a stalled asset must not extend the splash indefinitely.
  window.setTimeout(dismiss, maxMs);

  // Let people opt out of the wait.
  document.addEventListener('keydown', onSkip);
  loader.addEventListener('click', onSkip);

  // Someone who has asked for reduced motion should not sit through a
  // decorative animation at all.
  if (prefersReducedMotion()) dismiss();

  // Drive the progress bar over the real hold, so it does not fill early and
  // then sit at 100% looking stuck.
  loader.style.setProperty('--loader-duration', `${minMs}ms`);

  // Reveal the skip hint once the splash has clearly outstayed a normal load.
  window.setTimeout(() => {
    if (!dismissed) loader.classList.add('show-skip');
  }, Math.min(1800, minMs));
}

/* --------------------------------------------------------------- reveals -- */
function initReveals(): void {
  const targets = $$(
    '.section-header, .service-card, .project-card, .about-info-card, .timeline-step, .tech-card, .engagement-card, .faq-item'
  );

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

  targets.forEach((el) => el.classList.add('reveal'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        window.setTimeout(() => entry.target.classList.add('visible'), i * 60);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach((el) => observer.observe(el));

  /*
   * Safety net. A reveal starts at opacity 0, so anything the observer never
   * reports would stay invisible forever. Kept deliberately short: a visitor
   * should never be looking at a blank section wondering if the page broke.
   */
  window.setTimeout(() => {
    targets.forEach((el) => el.classList.add('visible'));
    observer.disconnect();
  }, 3000);
}

/* -------------------------------------------------------------- counters -- */
function initCounters(): void {
  const nums = $$<HTMLElement>('.stat-num[data-count-to]');
  if (!nums.length) return;

  // The final value is already in the DOM; skip the animation entirely.
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

  const animate = (el: HTMLElement) => {
    const target = Number(el.dataset.countTo ?? 0);
    const suffix = el.dataset.countSuffix ?? '';
    const duration = 1600;
    let start: number | null = null;

    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    };

    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animate(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );

  /*
   * Note we do NOT zero the values up front. The real number is already in the
   * markup; `animate` resets to zero at the moment it starts. Blanking them
   * eagerly meant any stat the visitor never scrolled far enough to trigger
   * would just sit there reading "0+".
   */
  nums.forEach((el) => observer.observe(el));
}

/* ------------------------------------------------------------- nav state -- */
function initNavHighlight(): void {
  const links = $$<HTMLAnchorElement>('.nav-link');
  const sections = $$('main section[id]');
  if (!links.length || !sections.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          const isCurrent = link.getAttribute('href') === `#${entry.target.id}`;
          link.classList.toggle('active-nav', isCurrent);
          if (isCurrent) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    },
    { threshold: 0.35 }
  );

  sections.forEach((s) => observer.observe(s));
}

/* ------------------------------------------------------------ mobile nav -- */
function initMobileNav(): void {
  const toggle = $<HTMLButtonElement>('#mobile-nav-toggle');
  const menu = $('#mobile-nav-menu');
  if (!toggle || !menu) return;

  const bars = $$<HTMLElement>('.bar', toggle);

  const setOpen = (open: boolean) => {
    menu.classList.toggle('active', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');

    if (bars.length === 3) {
      bars[0]!.style.transform = open ? 'rotate(45deg) translate(5px, 5px)' : '';
      bars[1]!.style.opacity = open ? '0' : '1';
      bars[2]!.style.transform = open ? 'rotate(-45deg) translate(6px, -6px)' : '';
    }
  };

  toggle.addEventListener('click', () =>
    setOpen(toggle.getAttribute('aria-expanded') !== 'true')
  );

  $$('.mobile-nav-link', menu).forEach((link) =>
    link.addEventListener('click', () => setOpen(false))
  );

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('active')) {
      setOpen(false);
      toggle.focus();
    }
  });
}

/* ----------------------------------------------------- scroll affordances -- */
function initScrollAffordances(): void {
  const topBtn = $('#scroll-top-btn');
  const progress = $<HTMLElement>('.scroll-progress');

  // Only drive the bar from JS where CSS scroll-timeline isn't supported.
  const needsJsProgress =
    progress !== null && !CSS.supports('animation-timeline: scroll()');

  const onScroll = rafThrottle(() => {
    const y = window.scrollY;

    topBtn?.classList.toggle('visible', y > 500);

    if (needsJsProgress && progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    }
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  topBtn?.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
    // Return focus to the top of the document, not just the scroll position.
    $('.skip-link')?.focus({ preventScroll: true });
  });
}

/* ---------------------------------------------------------------- online -- */
function initConnectivityBanner(): void {
  const banner = document.createElement('div');
  banner.className = 'offline-banner';
  banner.setAttribute('role', 'status');
  banner.textContent =
    'You are offline — you are viewing a cached copy of this page.';
  document.body.appendChild(banner);

  const sync = () => banner.classList.toggle('visible', !navigator.onLine);
  window.addEventListener('online', sync);
  window.addEventListener('offline', sync);
  sync();
}

/* ------------------------------------------------------- service worker --- */
function initServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline support is an enhancement — never block the page on it */
    });
  });
}

/* ------------------------------------------------- scrollable diagrams --- */
/**
 * A region that scrolls must be keyboard-reachable, but a tab stop that
 * scrolls nowhere is just noise. Give the architecture diagrams a tabindex
 * only while they actually overflow, and re-evaluate on resize.
 */
function initScrollableDiagrams(): void {
  const regions = $$<HTMLElement>('.arch-scroll');
  if (!regions.length) return;

  const sync = rafThrottle(() => {
    regions.forEach((region) => {
      const scrolls = region.scrollWidth > region.clientWidth + 1;
      if (scrolls) region.tabIndex = 0;
      else region.removeAttribute('tabindex');
    });
  });

  window.addEventListener('resize', sync, { passive: true });

  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(sync);
    regions.forEach((r) => ro.observe(r));
  }

  // The diagrams live in hidden tab panels, so measure again once one opens.
  $$('.card-tab-btn').forEach((btn) =>
    btn.addEventListener('click', () => window.setTimeout(sync, 50))
  );
  $$('.switcher-btn').forEach((btn) =>
    btn.addEventListener('click', () => window.setTimeout(sync, 50))
  );

  sync();
}

export function initMain(): void {
  initLoader();
  initScrollableDiagrams();
  initReveals();
  initCounters();
  initNavHighlight();
  initMobileNav();
  initScrollAffordances();
  initConnectivityBanner();
  initServiceWorker();
}
