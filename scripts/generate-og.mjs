/**
 * Generates the favicon, app icons and social card from the logo geometry.
 *
 * The monogram paths here are the same ones in src/components/Logo.astro —
 * keep them in sync if the mark ever changes.
 *
 * Run with `npm run og`.
 */
import sharp from 'sharp';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');

const NAVY = '#0f2350';
const NAVY_DEEP = '#081735';
const BLUE = '#2176ff';
const WHITE = '#ffffff';

/** The NYT monogram. viewBox 0 0 230 100. */
const monogram = (letterFill, triangleFill) => `
  <path fill="${letterFill}" d="M0,100 L0,14 L14,0 L22,0 L62,60 L62,0 L84,0 L84,100 L62,100 L22,40 L22,100 Z"/>
  <path fill="${letterFill}" transform="translate(78,0)" d="M0,0 L24,0 L38,26 L52,0 L76,0 L49,50 L49,100 L27,100 L27,50 Z"/>
  <path fill="${triangleFill}" transform="translate(78,0)" d="M24,0 L52,0 L38,24 Z"/>
  <path fill="${letterFill}" transform="translate(158,0)" d="M0,0 L58,0 L72,14 L72,20 L47,20 L47,100 L25,100 L25,20 L0,20 Z"/>
`;

/*
 * The favicon renders at 16px, where three letterforms turn to mush. Use the
 * triangle from the Y on its own — it is the most distinctive element of the
 * mark and it survives being tiny.
 */
const faviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="14" fill="${NAVY}"/>
  <path fill="${WHITE}" d="M20,26 L44,26 L44,74 L56,74 L56,26 L80,26 L80,40 L68,40 L68,74 L56,74"/>
  <path fill="${BLUE}" d="M26,26 L74,26 L50,66 Z"/>
</svg>`;

/** Maskable icon: same mark with the safe-area padding PWA icons require. */
const appIconSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <rect width="100" height="100" fill="${NAVY}"/>
  <path fill="${BLUE}" d="M30,32 L70,32 L50,66 Z"/>
  <path fill="${WHITE}" d="M46,60 L54,60 L54,74 L46,74 Z"/>
</svg>`;

const ogSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${BLUE}"/>
      <stop offset="100%" stop-color="${BLUE}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="${NAVY_DEEP}"/>

  <!-- Blueprint grid, matching the hero -->
  <g opacity="0.06" stroke="#8caFeb" stroke-width="1">
    ${Array.from({ length: 19 }, (_, i) => `<line x1="${i * 64}" y1="0" x2="${i * 64}" y2="630"/>`).join('')}
    ${Array.from({ length: 10 }, (_, i) => `<line x1="0" y1="${i * 64}" x2="1200" y2="${i * 64}"/>`).join('')}
  </g>

  <!-- Oversized triangle bleeding off the right edge -->
  <path fill="${BLUE}" opacity="0.1" d="M820,0 L1280,0 L1050,400 Z"/>

  <!-- The mark -->
  <g transform="translate(80,72) scale(1.05)">
    ${monogram(WHITE, BLUE)}
  </g>

  <text x="80" y="248" font-family="Arial, sans-serif" font-size="26" font-weight="700"
        letter-spacing="7" fill="#c9d9f5">NYT SOFTWARE</text>
  <text x="80" y="286" font-family="Arial, sans-serif" font-size="18" font-weight="600"
        letter-spacing="10" fill="${BLUE}">SOLUTIONS</text>

  <rect x="80" y="330" width="420" height="3" fill="url(#rule)"/>

  <text x="80" y="416" font-family="Arial Black, Arial, sans-serif" font-size="60" font-weight="900" fill="${WHITE}">Enterprise-Grade</text>
  <text x="80" y="486" font-family="Arial Black, Arial, sans-serif" font-size="60" font-weight="900" fill="${BLUE}">Engineering.</text>

  <text x="80" y="546" font-family="Arial, sans-serif" font-size="24" fill="#9fb6dd">Custom ERPs · Multi-tenant SaaS · POS · Mobile apps</text>
  <text x="80" y="586" font-family="Arial, sans-serif" font-size="20" font-weight="600" fill="#7d97c4">Addis Ababa, Ethiopia · Worldwide remote</text>
</svg>`;

await mkdir(publicDir, { recursive: true });

await writeFile(join(publicDir, 'favicon.svg'), faviconSvg.trim() + '\n');
console.log('  ✓ public/favicon.svg');

const jobs = [
  { svg: ogSvg, out: 'og-image.png' },
  { svg: appIconSvg(192), out: 'icon-192.png' },
  { svg: appIconSvg(512), out: 'icon-512.png' },
  { svg: appIconSvg(180), out: 'apple-touch-icon.png' },
];

for (const job of jobs) {
  await sharp(Buffer.from(job.svg)).png({ compressionLevel: 9 }).toFile(join(publicDir, job.out));
  console.log(`  ✓ public/${job.out}`);
}

console.log('\nBrand assets regenerated from the logo geometry.');
