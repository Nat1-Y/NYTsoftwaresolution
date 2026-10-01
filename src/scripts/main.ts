/**
 * Page-level behaviour: reveals, counters, nav state, scroll affordances.
 *
 * There is deliberately no intro splash. Measured on a throttled phone (slow
 * 4G, 4x CPU), the old one covered an already-rendered page until ~6.6-7.5s,
 * because it could only lift once this script had run.
 */
import { $, $$, prefersReducedMotion, rafThrottle, renderAllSections } from './dom';

/* ------------------------------------------------------- in-page jumps --- */
/**
 * Any link to a target on this page renders the lazily-sized sections first
 * (see renderAllSections), in the capture phase so it runs before the
 * browser's own scroll. Covers the nav, the phone menu, hero buttons, footer
 * links and "See the system" — every `#hash` and `/#hash` link on the home
 * page — without each one having to know.
 */
function initInPageJumps(): void {
  document.addEventListener(
    'click',
    (e) => {
      const link = (e.target as Element | null)?.closest?.('a[href*="#"]');
      if (!(link instanceof HTMLAnchorElement)) return;
      const url = new URL(link.href);
      if (url.pathname === location.pathname && url.hash.length > 1) renderAllSections();
    },
    true
  );
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
  // Desktop links and the phone menu's section links share one scroll-spy.
  const links = $$<HTMLAnchorElement>('.nav-link, .mobile-nav-list .mobile-nav-link');
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
/**
 * The phone menu is a full-screen sheet, so while it is open it behaves like a
 * modal: the page behind stops scrolling and leaves the tab order (`inert`),
 * focus moves into the sheet, and closing it hands focus back to the toggle.
 * The header stays live so the toggle itself can close the sheet.
 */
function initMobileNav(): void {
  const toggle = $<HTMLButtonElement>('#mobile-nav-toggle');
  const menu = $('#mobile-nav-menu');
  if (!toggle || !menu) return;

  // Everything that is not the header or the menu is "behind" the sheet.
  const behind = () =>
    [...document.body.children].filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement &&
        el !== menu &&
        !el.classList.contains('main-header') &&
        el.tagName !== 'SCRIPT'
    );

  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  const setOpen = (open: boolean, { restoreFocus = false } = {}) => {
    if (open === isOpen()) return;
    menu.classList.toggle('active', open);
    menu.inert = !open;
    document.documentElement.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    behind().forEach((el) => (el.inert = open));

    if (open) {
      // Land on the current section if the scroll-spy knows it, else the first.
      const target =
        $<HTMLElement>('.mobile-nav-link[aria-current="true"]', menu) ??
        $<HTMLElement>('.mobile-nav-link', menu);
      window.setTimeout(() => target?.focus({ preventScroll: true }), 60);
    } else if (restoreFocus) {
      toggle.focus();
    }
  };

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  $$('a', menu).forEach((link) => link.addEventListener('click', () => setOpen(false)));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) setOpen(false, { restoreFocus: true });
  });

  // Rotating to a width where the desktop nav shows closes the sheet.
  const desktop = window.matchMedia('(min-width: 1200px)');
  desktop.addEventListener('change', (e) => {
    if (e.matches) setOpen(false);
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

/**
 * What every page needs: the mobile menu, the scroll affordances, the offline
 * banner and the service worker. Inner pages call this on its own — the 404
 * page used to render the header without it, so its menu never opened.
 */
export function initSiteChrome(): void {
  initInPageJumps();
  initMobileNav();
  initScrollAffordances();
  initConnectivityBanner();
  initServiceWorker();
  initScrollableDiagrams();
}

/** The home page: the site chrome plus the page's own behaviour. */
export function initMain(): void {
  initReveals();
  initCounters();
  initNavHighlight();
  initSiteChrome();
}
