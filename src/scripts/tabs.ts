/** Business / Technical tabs inside each case-study card. */
import { $$, syncTabState, wireTablist } from './dom';

type TabName = 'business' | 'tech';

function activateCard(card: HTMLElement, target: TabName): void {
  const tabs = $$<HTMLButtonElement>('.card-tab-btn', card);
  const panels = $$<HTMLElement>('.card-tab-content', card);

  const index = tabs.findIndex((t) => t.dataset.tab === target);
  if (index === -1) return;

  syncTabState(tabs, index);

  panels.forEach((panel) => {
    const active = panel.dataset.tabContent === target;
    panel.classList.toggle('active', active);
    // Hidden panels must leave the accessibility tree and the tab order.
    panel.toggleAttribute('hidden', !active);
  });
}

/** Called by the persona switcher to align every card at once. */
export function setCaseStudyTabs(target: TabName): void {
  $$<HTMLElement>('.project-card').forEach((card) => activateCard(card, target));
}

export function initCaseStudyTabs(): void {
  $$<HTMLElement>('.project-card').forEach((card) => {
    const tabs = $$<HTMLButtonElement>('.card-tab-btn', card);
    if (!tabs.length) return;

    wireTablist(tabs, (tab) => {
      activateCard(card, (tab.dataset.tab as TabName) ?? 'business');
    });

    // Establish the initial hidden state that the markup implies.
    activateCard(card, 'business');
  });
}
