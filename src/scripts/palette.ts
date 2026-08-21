/**
 * Command palette (Ctrl/Cmd + K).
 * Navigation, the live project links, and the page's own actions — reachable
 * from the keyboard without touching the mouse.
 */
import { $, $$, trapFocus, prefersReducedMotion } from './dom';

interface Command {
  id: string;
  label: string;
  desc?: string;
  group: string;
  icon: string;
  keywords?: string;
  run: () => void;
}

const ICONS: Record<string, string> = {
  section: 'M4,6H20V8H4V6M4,11H20V13H4V11M4,16H20V18H4V16Z',
  link: 'M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z',
  action:
    'M12,1L9.5,8.5L2,11L9.5,13.5L12,21L14.5,13.5L22,11L14.5,8.5L12,1Z',
  mail: 'M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4M20,8L12,13L4,8V6L12,11L20,6V8Z',
};

function goTo(hash: string): void {
  const target = document.querySelector(hash);
  if (!target) return;
  target.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'start',
  });
  // Move focus too, so keyboard users land where the page just scrolled.
  const focusTarget = target as HTMLElement;
  focusTarget.setAttribute('tabindex', '-1');
  focusTarget.focus({ preventScroll: true });
}

function buildCommands(): Command[] {
  const commands: Command[] = [];

  // Sections, read from the rendered nav so the two can never drift apart.
  $$<HTMLAnchorElement>('.nav-menu .nav-link').forEach((link) => {
    const hash = link.getAttribute('href') ?? '';
    if (!hash.startsWith('#')) return;
    commands.push({
      id: `nav${hash}`,
      label: link.textContent?.trim() ?? hash,
      desc: 'Jump to section',
      group: 'Navigate',
      icon: 'section',
      run: () => goTo(hash),
    });
  });

  commands.push(
    {
      id: 'nav-faq',
      label: 'FAQ',
      desc: 'Cost, timelines, ownership, support',
      group: 'Navigate',
      icon: 'section',
      keywords: 'questions help price how long',
      run: () => goTo('#faq'),
    },
    {
      id: 'nav-contact',
      label: 'Contact',
      desc: 'Start a conversation',
      group: 'Navigate',
      icon: 'section',
      run: () => goTo('#contact'),
    }
  );

  // Every live project link becomes a command.
  $$<HTMLElement>('.project-card').forEach((card) => {
    const name = card.querySelector('.project-name')?.textContent?.trim();
    const anchor = card.querySelector<HTMLAnchorElement>('.btn-live');
    if (!name || !anchor) return;
    commands.push({
      id: `open-${card.dataset.caseStudy}`,
      label: `Open ${name}`,
      desc: 'Live production system — opens in a new tab',
      group: 'Live systems',
      icon: 'link',
      keywords: 'demo project case study live',
      run: () => window.open(anchor.href, '_blank', 'noopener'),
    });
  });

  commands.push(
    {
      id: 'persona-business',
      label: 'Switch to Business view',
      desc: 'Outcomes, impact and operations',
      group: 'Actions',
      icon: 'action',
      keywords: 'persona mode toggle emerald',
      run: () => $<HTMLButtonElement>('#btn-business')?.click(),
    },
    {
      id: 'persona-tech',
      label: 'Switch to Engineering view',
      desc: 'Architecture, stack and technical depth',
      group: 'Actions',
      icon: 'action',
      keywords: 'persona mode toggle cyan developer',
      run: () => $<HTMLButtonElement>('#btn-tech')?.click(),
    },
    {
      id: 'blueprint',
      label: 'Scope a project',
      desc: 'Blueprint Studio — architecture, phases and a brief',
      group: 'Actions',
      icon: 'action',
      keywords: 'estimate cost timeline how long quote scope planner calculator blueprint',
      run: () => goTo('#blueprint'),
    },
    {
      id: 'open-chat',
      label: 'Ask the assistant',
      desc: 'Automated answers to common questions',
      group: 'Actions',
      icon: 'action',
      keywords: 'chat bot help support question',
      run: () => $<HTMLButtonElement>('#chatbot-toggle')?.click(),
    },
    {
      id: 'email',
      label: 'Email NYT Software Solutions',
      desc: 'nytsoftwaresolutionplc@gmail.com',
      group: 'Actions',
      icon: 'mail',
      keywords: 'contact reach mail',
      run: () => {
        window.location.href = 'mailto:nytsoftwaresolutionplc@gmail.com';
      },
    }
  );

  return commands;
}

export function initCommandPalette(): void {
  const palette = $('#command-palette');
  const input = $<HTMLInputElement>('#cmdk-input');
  const results = $('#cmdk-results');
  if (!palette || !input || !results) return;

  const commands = buildCommands();
  let filtered = commands;
  let active = 0;
  let open = false;
  let lastFocused: HTMLElement | null = null;
  let releaseTrap: (() => void) | null = null;

  const render = () => {
    results.textContent = '';

    if (!filtered.length) {
      const empty = document.createElement('p');
      empty.className = 'cmdk-empty';
      empty.textContent = 'No matches. Try “pricing”, “offline” or a project name.';
      results.appendChild(empty);
      return;
    }

    let currentGroup = '';
    filtered.forEach((command, index) => {
      if (command.group !== currentGroup) {
        currentGroup = command.group;
        const heading = document.createElement('div');
        heading.className = 'cmdk-group-label';
        heading.textContent = currentGroup;
        heading.setAttribute('role', 'presentation');
        results.appendChild(heading);
      }

      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'cmdk-item';
      item.setAttribute('role', 'option');
      item.id = `cmdk-opt-${index}`;
      item.setAttribute('aria-selected', String(index === active));

      const icon = document.createElement('span');
      icon.className = 'cmdk-icon';
      icon.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="${
        ICONS[command.icon] ?? ICONS.action
      }"/></svg>`;

      const text = document.createElement('span');
      const label = document.createElement('span');
      label.className = 'cmdk-label';
      label.textContent = command.label;
      text.appendChild(label);

      if (command.desc) {
        const desc = document.createElement('span');
        desc.className = 'cmdk-desc';
        desc.textContent = command.desc;
        text.appendChild(desc);
      }

      item.append(icon, text);
      item.addEventListener('click', () => execute(index));
      item.addEventListener('mousemove', () => {
        if (active === index) return;
        active = index;
        syncSelection();
      });

      results.appendChild(item);
    });

    syncSelection();
  };

  const syncSelection = () => {
    const items = $$<HTMLElement>('.cmdk-item', results);
    items.forEach((item, i) => item.setAttribute('aria-selected', String(i === active)));
    const current = items[active];
    if (current) {
      input.setAttribute('aria-activedescendant', current.id);
      current.scrollIntoView({ block: 'nearest' });
    }
  };

  const filter = (query: string) => {
    const q = query.trim().toLowerCase();
    filtered = !q
      ? commands
      : commands.filter((c) =>
          `${c.label} ${c.desc ?? ''} ${c.group} ${c.keywords ?? ''}`
            .toLowerCase()
            .includes(q)
        );
    active = 0;
    render();
  };

  const execute = (index: number) => {
    const command = filtered[index];
    if (!command) return;
    close();
    // Let the palette finish closing before the action moves the page.
    window.setTimeout(() => command.run(), 60);
  };

  const openPalette = () => {
    if (open) return;
    open = true;
    lastFocused = document.activeElement as HTMLElement;
    palette.classList.add('open');
    input.value = '';
    filter('');
    releaseTrap = trapFocus(palette);
    window.setTimeout(() => input.focus(), 40);
  };

  const close = () => {
    if (!open) return;
    open = false;
    palette.classList.remove('open');
    releaseTrap?.();
    releaseTrap = null;
    lastFocused?.focus();
  };

  input.addEventListener('input', () => filter(input.value));

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      active = (active + 1) % Math.max(filtered.length, 1);
      syncSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      active = (active - 1 + filtered.length) % Math.max(filtered.length, 1);
      syncSelection();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      execute(active);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  });

  // Click the backdrop to dismiss.
  palette.addEventListener('mousedown', (e) => {
    if (e.target === palette) close();
  });

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      open ? close() : openPalette();
    }
  });

  $$('[data-cmdk-open]').forEach((trigger) =>
    trigger.addEventListener('click', openPalette)
  );
}
