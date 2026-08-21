/**
 * Blueprint Studio — estimate, diagram, brief.
 *
 * Three jobs, in order:
 *   1. Turn four answers into a plan (weeks, phases, components).
 *   2. Draw that plan as an architecture diagram, laid out from the node list
 *      rather than hand-positioned, so any combination renders legibly.
 *   3. Write it up as a brief and hand it to the contact form.
 *
 * The estimator never prints a price. See src/data/blueprint.ts.
 */
import { $, $$, prefersReducedMotion } from './dom';
import { toast } from './toast';
import {
  alwaysIncluded,
  layerLabels,
  layerOrder,
  modules,
  paces,
  phases,
  scales,
  systemTypes,
  type BlueprintNode,
} from '../data/blueprint';

/* ------------------------------------------------------------ selection -- */

interface Selection {
  system: (typeof systemTypes)[number];
  scale: (typeof scales)[number];
  pace: (typeof paces)[number];
  modules: (typeof modules)[number][];
}

interface Plan {
  low: number;
  high: number;
  total: number;
  firstShip: number;
  phases: { label: string; weeks: number }[];
  nodes: BlueprintNode[];
}

function readSelection(form: HTMLFormElement): Selection {
  const value = (name: string): string =>
    form.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value ?? '';

  const chosenModules = $$<HTMLInputElement>('input[name="module"]:checked', form).map(
    (input) => input.value
  );

  return {
    system: systemTypes.find((s) => s.id === value('system')) ?? systemTypes[0]!,
    scale: scales.find((s) => s.id === value('scale')) ?? scales[0]!,
    pace: paces.find((p) => p.id === value('pace')) ?? paces[0]!,
    modules: modules.filter((m) => chosenModules.includes(m.id)),
  };
}

/* ------------------------------------------------------------- estimate -- */

function buildPlan(selection: Selection): Plan {
  const moduleWeeks = selection.modules.reduce((sum, m) => sum + m.weeks, 0);
  const raw = (selection.system.baseWeeks + moduleWeeks) * selection.scale.multiplier * selection.pace.factor;

  const total = Math.max(4, Math.round(raw));

  /*
   * A range, not a number. The spread widens with the size of the job because
   * a twenty-week estimate is not as knowable as a six-week one.
   */
  const spread = total < 10 ? 0.1 : total < 20 ? 0.15 : 0.2;
  const low = Math.max(3, Math.floor(total * (1 - spread)));
  const high = Math.ceil(total * (1 + spread));

  /*
   * Split the calendar across the phases, then push any rounding remainder
   * into the core build — it is the phase with the most give.
   */
  const split = phases.map((phase) => ({
    label: phase.label,
    weeks: Math.max(1, Math.round(total * phase.share)),
  }));

  const drift = total - split.reduce((sum, p) => sum + p.weeks, 0);
  const build = split.find((p) => p.label === 'Core build');
  if (build) build.weeks = Math.max(1, build.weeks + drift);

  // A phased rollout puts something usable in front of people much earlier.
  const firstShipShare = selection.pace.id === 'phased' ? 0.35 : 0.55;
  const firstShip = Math.max(2, Math.round(total * firstShipShare));

  // Dedupe: two modules can legitimately ask for the same component.
  const seen = new Set<string>();
  const nodes: BlueprintNode[] = [];
  for (const node of [
    ...selection.system.nodes,
    ...selection.scale.nodes,
    ...selection.modules.flatMap((m) => m.nodes),
  ]) {
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    nodes.push(node);
  }

  return { low, high, total, firstShip, phases: split, nodes };
}

/* -------------------------------------------------------------- diagram -- */

/*
 * Sized so the widest case the studio can produce — five layers — still fits
 * the full-width panel at desktop without scrolling. A region that scrolls
 * gets a tab stop, and a tab stop that buys you fourteen pixels is noise.
 */
const NODE_W = 138;
const NODE_H = 54;
const V_GAP = 16;
const COL_GAP = 72;
const PAD = 18;
const HEAD_H = 30;

const SVG_NS = 'http://www.w3.org/2000/svg';

function el<K extends keyof SVGElementTagNameMap>(
  name: K,
  attrs: Record<string, string | number> = {}
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

/**
 * Lay the nodes out in columns by layer and draw them.
 *
 * Connections run through a vertical bus between each pair of columns rather
 * than node-to-node: with four components either side, direct edges become a
 * cross-hatch that communicates nothing.
 */
function renderDiagram(container: HTMLElement, plan: Plan, systemLabel: string): void {
  const columns = layerOrder
    .map((layer) => ({ layer, nodes: plan.nodes.filter((n) => n.layer === layer) }))
    .filter((column) => column.nodes.length > 0);

  container.textContent = '';
  if (!columns.length) return;

  const rows = Math.max(...columns.map((c) => c.nodes.length));
  const bodyH = rows * NODE_H + (rows - 1) * V_GAP;
  const width = PAD * 2 + columns.length * NODE_W + (columns.length - 1) * COL_GAP;
  const height = PAD * 2 + HEAD_H + bodyH;

  const svg = el('svg', {
    class: 'arch-svg bp-svg',
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
    role: 'img',
    'aria-labelledby': 'bp-svg-title',
    'aria-describedby': 'bp-svg-desc',
  });

  const title = el('title', { id: 'bp-svg-title' });
  title.textContent = `Proposed architecture for a ${systemLabel.toLowerCase()}`;

  // The text alternative has to carry the same information as the picture.
  const desc = el('desc', { id: 'bp-svg-desc' });
  desc.textContent = columns
    .map((c) => `${layerLabels[c.layer]}: ${c.nodes.map((n) => n.label).join(', ')}`)
    .join('. ');

  svg.append(title, desc);

  const defs = el('defs');
  const marker = el('marker', {
    id: 'bp-arrow',
    viewBox: '0 0 10 10',
    refX: 9,
    refY: 5,
    markerWidth: 5,
    markerHeight: 5,
    orient: 'auto-start-reverse',
  });
  marker.appendChild(el('path', { d: 'M 0 0 L 10 5 L 0 10 z', class: 'arch-arrow-accent' }));
  defs.appendChild(marker);
  svg.appendChild(defs);

  const colX = (i: number) => PAD + i * (NODE_W + COL_GAP);
  const nodeY = (column: { nodes: BlueprintNode[] }, i: number) => {
    const colH = column.nodes.length * NODE_H + (column.nodes.length - 1) * V_GAP;
    const start = PAD + HEAD_H + (bodyH - colH) / 2;
    return start + i * (NODE_H + V_GAP);
  };

  /* ---- connectors first, so nodes paint over them --------------------- */
  const edges = el('g', { class: 'bp-edges' });

  for (let i = 0; i < columns.length - 1; i++) {
    const left = columns[i]!;
    const right = columns[i + 1]!;
    const busX = colX(i) + NODE_W + COL_GAP / 2;

    const leftYs = left.nodes.map((_, n) => nodeY(left, n) + NODE_H / 2);
    const rightYs = right.nodes.map((_, n) => nodeY(right, n) + NODE_H / 2);
    const allYs = [...leftYs, ...rightYs];

    edges.appendChild(
      el('line', {
        x1: busX,
        y1: Math.min(...allYs),
        x2: busX,
        y2: Math.max(...allYs),
        class: 'arch-edge bp-edge',
      })
    );

    leftYs.forEach((y) =>
      edges.appendChild(
        el('line', { x1: colX(i) + NODE_W, y1: y, x2: busX, y2: y, class: 'arch-edge bp-edge' })
      )
    );

    rightYs.forEach((y) =>
      edges.appendChild(
        el('line', {
          x1: busX,
          y1: y,
          x2: colX(i + 1) - 4,
          y2: y,
          class: 'arch-edge-accent bp-edge',
          'marker-end': 'url(#bp-arrow)',
        })
      )
    );
  }

  svg.appendChild(edges);

  /* ---- columns --------------------------------------------------------- */
  let order = 0;

  columns.forEach((column, i) => {
    const x = colX(i);

    const heading = el('text', {
      x: x + NODE_W / 2,
      y: PAD + 12,
      'text-anchor': 'middle',
      class: 'bp-col-label',
    });
    heading.textContent = layerLabels[column.layer].toUpperCase();
    svg.appendChild(heading);

    column.nodes.forEach((node, n) => {
      const y = nodeY(column, n);
      const group = el('g', { class: 'bp-node' });
      group.style.setProperty('--bp-order', String(order++));

      group.appendChild(
        el('rect', {
          x,
          y,
          width: NODE_W,
          height: NODE_H,
          rx: 8,
          class: column.layer === 'external' ? 'arch-node' : 'arch-node-accent',
        })
      );

      const label = el('text', {
        x: x + NODE_W / 2,
        y: node.note ? y + 24 : y + 31,
        'text-anchor': 'middle',
        class: 'arch-label',
      });
      label.textContent = node.label;
      group.appendChild(label);

      if (node.note) {
        const note = el('text', {
          x: x + NODE_W / 2,
          y: y + 39,
          'text-anchor': 'middle',
          class: 'arch-sub',
        });
        note.textContent = node.note;
        group.appendChild(note);
      }

      svg.appendChild(group);
    });
  });

  if (prefersReducedMotion()) svg.classList.add('bp-svg-static');
  container.appendChild(svg);

  /*
   * A region that scrolls has to be reachable from the keyboard. main.ts owns
   * that for the static diagrams, but its ResizeObserver watches the container
   * box — which does not change when a wider drawing is placed inside it. So
   * this diagram sets its own tab stop, by the same rule: only when it
   * actually overflows.
   */
  if (container.scrollWidth > container.clientWidth + 1) container.tabIndex = 0;
  else container.removeAttribute('tabindex');
}

/* ---------------------------------------------------------------- brief -- */

function composeBrief(selection: Selection, plan: Plan): string {
  const lines = [
    `PROJECT BRIEF — generated with the Blueprint Studio`,
    ``,
    `System type:  ${selection.system.label}`,
    `Reach:        ${selection.scale.label}`,
    `Delivery:     ${selection.pace.label} (${selection.pace.team})`,
    ``,
    `Capabilities needed:`,
    ...(selection.modules.length
      ? selection.modules.map((m) => `  - ${m.label}`)
      : ['  - Core system only']),
    ``,
    `Indicative calendar: ${plan.low}–${plan.high} weeks`,
    `First usable build:  around week ${plan.firstShip}`,
    ``,
    `Phases:`,
    ...plan.phases.map((p) => `  ${p.label} — ${p.weeks} week${p.weeks === 1 ? '' : 's'}`),
    ``,
    `Proposed components (${plan.nodes.length}):`,
    ...layerOrder
      .filter((layer) => plan.nodes.some((n) => n.layer === layer))
      .map((layer) => {
        const names = plan.nodes.filter((n) => n.layer === layer).map((n) => n.label);
        return `  ${layerLabels[layer]}: ${names.join(', ')}`;
      }),
    ``,
    `Generated on the website from four answers — treated as a starting point,`,
    `not a specification.`,
  ];

  return lines.join('\n');
}

/** Closest existing option on the contact form. */
function subjectFor(systemId: string): string {
  if (systemId === 'pos') return 'Restaurant / POS system';
  if (systemId === 'erp' || systemId === 'saas' || systemId === 'marketplace')
    return 'Custom ERP / SaaS platform';
  return 'Other inquiry';
}

/* ----------------------------------------------------------------- init -- */

export function initBlueprint(): void {
  const form = $<HTMLFormElement>('#bp-controls');
  const result = $('#bp-result');
  if (!form || !result) return;

  const weeksEl = $('#bp-weeks');
  const teamEl = $('#bp-team');
  const componentsEl = $('#bp-components');
  const firstShipEl = $('#bp-firstship');
  const titleEl = $('#bp-title');
  const phasesEl = $('#bp-phases');
  const includedEl = $('#bp-included');
  const diagramEl = $('#bp-diagram');

  let current: { selection: Selection; plan: Plan } | null = null;

  const paint = () => {
    const selection = readSelection(form);
    const plan = buildPlan(selection);
    current = { selection, plan };

    if (titleEl) titleEl.textContent = selection.system.label;
    if (weeksEl) weeksEl.textContent = `${plan.low}–${plan.high}`;
    if (teamEl) teamEl.textContent = selection.pace.team;
    if (componentsEl) componentsEl.textContent = String(plan.nodes.length);
    if (firstShipEl) firstShipEl.textContent = `Week ${plan.firstShip}`;

    if (phasesEl) {
      phasesEl.textContent = '';
      const longest = Math.max(...plan.phases.map((p) => p.weeks));
      plan.phases.forEach((phase) => {
        const item = document.createElement('li');
        item.className = 'bp-phase';

        const label = document.createElement('span');
        label.className = 'bp-phase-label';
        label.textContent = phase.label;

        const bar = document.createElement('span');
        bar.className = 'bp-phase-bar';
        const fill = document.createElement('span');
        fill.className = 'bp-phase-fill';
        fill.style.width = `${(phase.weeks / longest) * 100}%`;
        bar.appendChild(fill);

        const weeks = document.createElement('span');
        weeks.className = 'bp-phase-weeks';
        weeks.textContent = `${phase.weeks}w`;

        item.append(label, bar, weeks);
        phasesEl.appendChild(item);
      });
    }

    if (includedEl && !includedEl.childElementCount) {
      alwaysIncluded.forEach((text) => {
        const item = document.createElement('li');
        item.textContent = text;
        includedEl.appendChild(item);
      });
    }

    if (diagramEl) renderDiagram(diagramEl, plan, selection.system.label);
  };

  /*
   * Changing the system re-ticks that system's capabilities. Someone who has
   * just told us they are building a POS should not have to re-derive that it
   * needs offline support — and if they disagree, the boxes are right there.
   */
  $$<HTMLInputElement>('input[name="system"]', form).forEach((radio) => {
    radio.addEventListener('change', () => {
      const system = systemTypes.find((s) => s.id === radio.value);
      if (!system) return;
      $$<HTMLInputElement>('input[name="module"]', form).forEach((box) => {
        box.checked = system.defaults.includes(box.value);
      });
    });
  });

  form.addEventListener('change', paint);

  $('#bp-reset')?.addEventListener('click', () => {
    form.reset();
    paint();
    toast('Blueprint reset.', 'success');
  });

  $('#bp-copy')?.addEventListener('click', async () => {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(composeBrief(current.selection, current.plan));
      toast('Brief copied to your clipboard.', 'success');
    } catch {
      toast('Could not copy — the brief is on screen to select manually.', 'error');
    }
  });

  $('#bp-send')?.addEventListener('click', () => {
    if (!current) return;

    const message = $<HTMLTextAreaElement>('#form-message');
    const subject = $<HTMLSelectElement>('#form-subject');
    const name = $<HTMLInputElement>('#form-name');
    const contact = $('#contact');

    if (!message || !contact) {
      window.location.hash = '#contact';
      return;
    }

    message.value = composeBrief(current.selection, current.plan);
    if (subject) subject.value = subjectFor(current.selection.system.id);

    contact.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });

    // Land on the first thing still to fill in, not on the top of the section.
    window.setTimeout(() => name?.focus({ preventScroll: true }), 500);
    toast('Brief added to the form — we just need your name and email.', 'success');
  });

  paint();
}
