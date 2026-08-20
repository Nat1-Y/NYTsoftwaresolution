/**
 * Persona switching — the site's signature interaction.
 * Swaps the accent palette, the hero/services copy, and aligns every case
 * study card to the matching level of detail.
 */
import { $, $$, storage, syncTabState, wireTablist, prefersReducedMotion } from './dom';
import { personaCopy } from '../data/site';
import { setCaseStudyTabs } from './tabs';

export type Persona = 'business' | 'tech';

const STORAGE_KEY = 'nyt-persona';

/** Cross-fade a text swap without leaving the string half-updated. */
function swapText(el: HTMLElement | null, text: string): void {
  if (!el || el.textContent === text) return;

  if (prefersReducedMotion()) {
    el.textContent = text;
    return;
  }

  el.style.transition = 'opacity 0.2s ease';
  el.style.opacity = '0';
  window.setTimeout(() => {
    el.textContent = text;
    el.style.opacity = '1';
  }, 200);
}

export function initPersona(): void {
  const tabs = $$<HTMLButtonElement>('.switcher-btn');
  if (tabs.length !== 2) return;

  const badge = $('#dynamic-badge');
  const heroSubtitle = $('#hero-subtitle');
  const servicesSubtitle = $('#services-subtitle');

  const apply = (mode: Persona, persist = true) => {
    const root = document.documentElement;
    root.classList.toggle('mode-tech', mode === 'tech');
    root.classList.toggle('mode-business', mode === 'business');

    const copy = personaCopy[mode];
    swapText(badge, copy.badge);
    swapText(heroSubtitle, copy.heroSubtitle);
    swapText(servicesSubtitle, copy.servicesSubtitle);

    syncTabState(tabs, mode === 'tech' ? 1 : 0);
    setCaseStudyTabs(mode);

    if (persist) storage.set(STORAGE_KEY, mode);
  };

  wireTablist(tabs, (tab) => {
    apply((tab.dataset.mode as Persona) ?? 'business');
  });

  // The inline head script already set the class to avoid a flash; this
  // aligns the rest of the UI to whatever it chose.
  const saved = storage.get(STORAGE_KEY);
  apply(saved === 'tech' ? 'tech' : 'business', false);
}
