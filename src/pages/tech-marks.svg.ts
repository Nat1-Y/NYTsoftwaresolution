/**
 * The technology marks as one SVG sprite, built from src/data/tech-logos.ts.
 *
 * Served as a separate, cacheable file rather than inlined: the twenty paths
 * are ~31 kB, more than the rest of the ecosystem section's markup combined,
 * and every visitor would otherwise download them inside the HTML whether or
 * not they ever scroll that far. Each mark is referenced with <use>, so it
 * still inherits currentColor from the page.
 */
import type { APIRoute } from 'astro';
import { techLogos } from '../data/tech-logos';
import { slug } from '../lib/slug';

export const GET: APIRoute = () => {
  const symbols = Object.entries(techLogos)
    .map(([name, d]) => `<symbol id="${slug(name)}" viewBox="0 0 24 24"><path d="${d}"/></symbol>`)
    .join('');

  return new Response(`<svg xmlns="http://www.w3.org/2000/svg">${symbols}</svg>`, {
    headers: { 'Content-Type': 'image/svg+xml' },
  });
};
