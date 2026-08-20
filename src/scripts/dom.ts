/** Small typed DOM helpers shared across the interaction modules. */

export const $ = <T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document
): T | null => root.querySelector<T>(selector);

export const $$ = <T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document
): T[] => Array.from(root.querySelectorAll<T>(selector));

/** True when the visitor has asked the OS to reduce motion. */
export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** localStorage that never throws in private mode or a sandboxed frame. */
export const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* quota or privacy mode — preference simply won't persist */
    }
  },
};

/** Coalesce bursts of scroll/resize events into one frame. */
export function rafThrottle<A extends unknown[]>(fn: (...args: A) => void) {
  let queued = false;
  let lastArgs: A;
  return (...args: A) => {
    lastArgs = args;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      fn(...lastArgs);
    });
  };
}

/**
 * Trap Tab focus inside a container while it is open — required for any
 * element that behaves as a modal dialog.
 */
export function trapFocus(container: HTMLElement): () => void {
  const selector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const onKeydown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const focusable = $$<HTMLElement>(selector, container).filter(
      (el) => el.offsetParent !== null || el === document.activeElement
    );
    if (!focusable.length) return;

    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  container.addEventListener('keydown', onKeydown);
  return () => container.removeEventListener('keydown', onKeydown);
}

/**
 * Roving-tabindex keyboard support for an ARIA tablist.
 * Arrow keys move, Home/End jump, and activation is automatic (the tab that
 * receives focus is selected) which matches the visual behaviour here.
 */
export function wireTablist(
  tabs: HTMLElement[],
  activate: (tab: HTMLElement, index: number) => void
): void {
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab, index));

    tab.addEventListener('keydown', (e: KeyboardEvent) => {
      const horizontal = ['ArrowRight', 'ArrowLeft'];
      const keys = [...horizontal, 'Home', 'End'];
      if (!keys.includes(e.key)) return;

      e.preventDefault();
      let next = index;
      if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;

      const target = tabs[next];
      if (!target) return;
      target.focus();
      activate(target, next);
    });
  });
}

/** Set the roving tabindex + aria-selected state across a tablist. */
export function syncTabState(tabs: HTMLElement[], activeIndex: number): void {
  tabs.forEach((tab, i) => {
    const selected = i === activeIndex;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    tab.classList.toggle('active', selected);
  });
}
