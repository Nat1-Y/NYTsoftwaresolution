/**
 * Page-level behaviour: loader, reveals, counters, nav state, scroll affordances.
 */
import { $, $$, prefersReducedMotion, rafThrottle } from './dom';

/* ---------------------------------------------------------------- loader -- */
/**
 * The old loader held the page for 1.6s *after* `load` and hurt every
 * perceived-performance metric. Now it dismisses as soon as the document is
 * interactive, with a short safety timeout for a stalled asset.
 */
function initLoader(): void {
  const loader = $('#page-loader');
  if (!loader) return;

  const hide = () => {
    if (loader.classList.contains('hidden')) return;
    loader.classList.add('hidden');
    window.setTimeout(() => loader.remove(), 600);
  };

  if (document.readyState === 'complete') hide();
  else window.addEventListener('load', hide, { once: true });

  // Never let a slow third-party asset hold the page hostage.
  window.setTimeout(hide, 1500);
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
