/**
 * Light / dark theme — the sun/moon button in the header.
 *
 * Light ("paper") is the default for every visitor; dark is opt-in and
 * remembered. The inline script in layouts/Base.astro sets <html data-theme>
 * before first paint, so this only wires the button and keeps the browser
 * chrome (theme-color, color-scheme) in step with the choice.
 */
import { $$, storage } from './dom';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'nyt-theme';

/** The colour the browser paints its own UI with — the page's ground. */
const THEME_COLOR: Record<Theme, string> = { light: '#fbfaf6', dark: '#05070d' };

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function apply(theme: Theme): void {
  const root = document.documentElement;
  root.dataset.theme = theme;

  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', theme);

  const next = theme === 'dark' ? 'light' : 'dark';
  for (const btn of $$<HTMLButtonElement>('[data-theme-toggle]')) {
    btn.setAttribute('aria-pressed', String(theme === 'dark'));
    btn.title = `Switch to ${next} mode`;
  }
}

export function initThemeToggle(): void {
  const buttons = $$<HTMLButtonElement>('[data-theme-toggle]');
  apply(currentTheme());

  for (const btn of buttons) {
    btn.addEventListener('click', () => {
      const theme: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
      // Swap every colour at once rather than letting each element's own
      // transition animate it on its own clock.
      const root = document.documentElement;
      root.classList.add('theme-switching');
      apply(theme);
      storage.set(THEME_STORAGE_KEY, theme);
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')));
    });
  }
}
