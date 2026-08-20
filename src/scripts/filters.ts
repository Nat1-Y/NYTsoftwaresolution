/** Tech ecosystem category filters. */
import { $, $$ } from './dom';

export function initTechFilters(): void {
  const buttons = $$<HTMLButtonElement>('.filter-btn');
  const cards = $$<HTMLElement>('.tech-card');
  const status = $('#tech-filter-status');
  if (!buttons.length || !cards.length) return;

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter ?? 'all';

      buttons.forEach((b) => {
        const active = b === button;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', String(active));
      });

      let shown = 0;
      cards.forEach((card) => {
        const categories = (card.dataset.category ?? '').split(' ');
        const match = filter === 'all' || categories.includes(filter);
        card.classList.toggle('hidden', !match);
        // Filtered-out cards should not be announced or focusable.
        card.toggleAttribute('inert', !match);
        card.setAttribute('aria-hidden', String(!match));
        if (match) shown++;
      });

      // Announce the result so the change is not silent for screen readers.
      if (status) {
        status.textContent = `${shown} ${
          shown === 1 ? 'technology' : 'technologies'
        } shown for ${button.textContent?.trim()}.`;
      }
    });
  });
}
