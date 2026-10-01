/**
 * Generates the favicon, app icons and social card from the logo geometry.
 *
 * The monogram paths here are the same ones in src/components/Logo.astro —
 * keep them in sync if the mark ever changes. Colours follow the v5 "Signal"
 * tokens in src/styles/tokens.css.
 *
 * Outputs (all in public/):
 *   favicon.svg          the tab icon for current browsers
 *   favicon.ico          16/32/48px, for older browsers and crawlers that
 *                        still ask for /favicon.ico
 *   favicon-48.png       Google Search shows a site's favicon beside its
 *                        results and wants a multiple of 48px
 *   icon-192/512.png     installable-app icons (maskable safe area)
 *   apple-touch-icon.png iOS home screen
 *   og-image.png         the link-preview card
 *
 * Run with `npm run og`.
 */
import sharp from 'sharp';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');

const INK = '#05070d';
const INK_2 = '#111a2e';
const WHITE = '#eef2fa';
const BLUE = '#6f98ff';
const VIOLET = '#a18bff';
const TEAL = '#54e3c6';
const MUTED = '#aab5cb';

/** The NYT monogram. viewBox 0 0 230 100. */
const monogram = (letterFill, triangleFill) => `
  <path fill="${letterFill}" d="M0,100 L0,14 L14,0 L22,0 L62,60 L62,0 L84,0 L84,100 L62,100 L22,40 L22,100 Z"/>
  <path fill="${letterFill}" transform="translate(78,0)" d="M0,0 L24,0 L38,26 L52,0 L76,0 L49,50 L49,100 L27,100 L27,50 Z"/>
  <path fill="${triangleFill}" transform="translate(78,0)" d="M24,0 L52,0 L38,24 Z"/>
  <path fill="${letterFill}" transform="translate(158,0)" d="M0,0 L58,0 L72,14 L72,20 L47,20 L47,100 L25,100 L25,20 L0,20 Z"/>
`;

/** Places the 230×100 monogram centred in a 100×100 square at `width`. */
const centred = (width, letterFill, triangleFill) => {
  const s = width / 230;
  const x = (100 - width) / 2;
  const y = (100 - 100 * s) / 2;
  return `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s.toFixed(4)})">${monogram(letterFill, triangleFill)}</g>`;
};

const defs = `
  <defs>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${INK_2}"/>
      <stop offset="1" stop-color="${INK}"/>
    </linearGradient>
    <linearGradient id="signal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BLUE}"/>
      <stop offset="1" stop-color="${VIOLET}"/>
    </linearGradient>
    <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BLUE}" stop-opacity="0.9"/>
      <stop offset="0.5" stop-color="${VIOLET}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${BLUE}" stop-opacity="0.15"/>
    </linearGradient>
  </defs>`;

/*
 * The tab icon: the full NYT monogram, as wide as the square allows. At 16px
 * a tab shows it about 6px tall — the letters are heavy, straight-edged and
 * high-contrast, which is what survives that size. The triangle carries the
 * signal gradient, as it does in the header.
 */
const faviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${defs}
  <rect width="100" height="100" rx="22" fill="url(#ground)"/>
  <rect x="1.5" y="1.5" width="97" height="97" rx="20.5" fill="none" stroke="url(#edge)" stroke-width="3"/>
  ${centred(88, WHITE, 'url(#signal)')}
</svg>`;

/** A square PNG of the favicon at `size` px, without the hairline edge (it
 *  blurs into the letters below 32px). */
const faviconPng = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">${defs}
  <rect width="100" height="100" rx="${size <= 16 ? 18 : 22}" fill="url(#ground)"/>
  ${size >= 32 ? '<rect x="1.5" y="1.5" width="97" height="97" rx="20.5" fill="none" stroke="url(#edge)" stroke-width="3"/>' : ''}
  ${centred(size <= 16 ? 92 : 88, WHITE, 'url(#signal)')}
</svg>`;

/** Maskable app icon: full-bleed ground, mark inside the 80% safe circle. */
const appIconSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">${defs}
  <rect width="100" height="100" fill="url(#ground)"/>
  <circle cx="50" cy="50" r="34" fill="${BLUE}" opacity="0.08"/>
  ${centred(60, WHITE, 'url(#signal)')}
</svg>`;

const ogSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="aura1" cx="0.9" cy="0" r="0.7">
      <stop offset="0" stop-color="#4664ff" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#4664ff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="aura2" cx="0" cy="0.9" r="0.6">
      <stop offset="0" stop-color="${TEAL}" stop-opacity="0.14"/>
      <stop offset="1" stop-color="${TEAL}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="signal" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8fb0ff"/>
      <stop offset="0.6" stop-color="#b69cff"/>
      <stop offset="1" stop-color="#6ee7d4"/>
    </linearGradient>
    <linearGradient id="tri" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BLUE}"/>
      <stop offset="1" stop-color="${VIOLET}"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="${INK}"/>
  <rect width="1200" height="630" fill="url(#aura1)"/>
  <rect width="1200" height="630" fill="url(#aura2)"/>

  <!-- The measuring grid from the page background -->
  <g opacity="0.07" stroke="#94aadc" stroke-width="1">
    ${Array.from({ length: 28 }, (_, i) => `<line x1="${i * 44}" y1="0" x2="${i * 44}" y2="630"/>`).join('')}
    ${Array.from({ length: 15 }, (_, i) => `<line x1="0" y1="${i * 44}" x2="1200" y2="${i * 44}"/>`).join('')}
  </g>

  <!-- The mark -->
  <g transform="translate(80,76) scale(0.72)">
    ${monogram(WHITE, 'url(#tri)')}
  </g>
  <text x="264" y="106" font-family="Arial, sans-serif" font-size="22" font-weight="700"
        letter-spacing="6" fill="${WHITE}">NYT SOFTWARE</text>
  <text x="264" y="136" font-family="Consolas, monospace" font-size="15" font-weight="600"
        letter-spacing="9" fill="${BLUE}">SOLUTIONS</text>

  <!-- Status pill -->
  <rect x="80" y="214" width="472" height="38" rx="19" fill="#ffffff" fill-opacity="0.04" stroke="#94aadc" stroke-opacity="0.2"/>
  <circle cx="102" cy="233" r="5" fill="${TEAL}"/>
  <text x="118" y="239" font-family="Consolas, monospace" font-size="15" letter-spacing="2.5" fill="${MUTED}">SERVING CLIENTS WORLDWIDE | ETHIOPIA</text>

  <text x="80" y="340" font-family="Arial Black, Arial, sans-serif" font-size="66" font-weight="900" letter-spacing="-1.5" fill="${WHITE}">Enterprise-Grade Engineering.</text>
  <text x="80" y="420" font-family="Arial Black, Arial, sans-serif" font-size="66" font-weight="900" letter-spacing="-1.5" fill="url(#signal)">Local Operational Excellence.</text>

  <text x="80" y="498" font-family="Arial, sans-serif" font-size="25" fill="${MUTED}">Custom ERPs · Multi-tenant SaaS · POS · Healthcare · Marketplaces</text>
  <text x="80" y="566" font-family="Consolas, monospace" font-size="18" letter-spacing="2" fill="#8591aa">nytsoftwaresolution.pro.et · Addis Ababa · Worldwide remote</text>
</svg>`;

/**
 * A minimal .ico: a directory of PNG images. Every browser since IE Vista
 * reads PNG-in-ICO, and it keeps each size exactly as rendered above.
 */
function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

const png = (svg) => sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();

await mkdir(publicDir, { recursive: true });

await writeFile(join(publicDir, 'favicon.svg'), faviconSvg.trim() + '\n');
console.log('  ✓ public/favicon.svg');

const icoSizes = await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(faviconPng(size)) })));
await writeFile(join(publicDir, 'favicon.ico'), ico(icoSizes));
console.log('  ✓ public/favicon.ico (16, 32, 48)');

const jobs = [
  { svg: faviconPng(48), out: 'favicon-48.png' },
  { svg: ogSvg, out: 'og-image.png' },
  { svg: appIconSvg(192), out: 'icon-192.png' },
  { svg: appIconSvg(512), out: 'icon-512.png' },
  { svg: appIconSvg(180), out: 'apple-touch-icon.png' },
];

for (const job of jobs) {
  await writeFile(join(publicDir, job.out), await png(job.svg));
  console.log(`  ✓ public/${job.out}`);
}

console.log('\nBrand assets regenerated from the logo geometry.');
