/** Lightweight toast notifications, injected on first use. */

const ICONS = {
  success: 'M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z',
  error: 'M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z',
} as const;

let region: HTMLElement | null = null;

function getRegion(): HTMLElement {
  if (region) return region;
  region = document.createElement('div');
  region.className = 'toast-region';
  // Toasts are supplementary; the underlying control also reports its state.
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  document.body.appendChild(region);
  return region;
}

export function toast(
  message: string,
  type: keyof typeof ICONS = 'success',
  ms = 4500
): void {
  const el = document.createElement('div');
  el.className = `toast ${type}`;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill', 'currentColor');
  path.setAttribute('d', ICONS[type]);
  svg.appendChild(path);

  const span = document.createElement('span');
  span.textContent = message;

  el.append(svg, span);
  getRegion().appendChild(el);

  window.setTimeout(() => {
    el.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    window.setTimeout(() => el.remove(), 260);
  }, ms);
}
