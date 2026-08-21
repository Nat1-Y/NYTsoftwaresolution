/**
 * Accessibility audit — runs axe-core against the built site.
 *
 * Checks the page in both personas (the accent colour changes, so contrast
 * has to hold twice) and with the chat and command palette open, since those
 * overlays are where keyboard and ARIA problems usually hide.
 *
 * Usage:  npm run preview   (in one shell)
 *         npm run a11y      (in another)
 */
import puppeteer from 'puppeteer-core';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');
const axeSource = await readFile(axePath, 'utf8');

const BASE = process.env.SMOKE_URL ?? 'http://localhost:4321';
const CHROME =
  process.env.CHROME_PATH ??
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});

let totalViolations = 0;

async function audit(label, setup, viewport = { width: 1440, height: 900 }) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('html[data-ready="true"]', { timeout: 20000 });
  // Skip the intro splash rather than waiting it out on every audit.
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => {
    const l = document.getElementById('page-loader');
    return !l || l.classList.contains('hidden');
  }, { timeout: 20000 });

  // Walk the page so every IntersectionObserver fires, then wait for the
  // reveal transitions to finish. Sampling mid-fade reports the transient
  // opacity as a contrast failure.
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('.reveal')].every(
        (el) => parseFloat(getComputedStyle(el).opacity) > 0.99
      ),
    { timeout: 20000 }
  ).catch(() => {});

  if (setup) {
    await setup(page);
    await new Promise((r) => setTimeout(r, 900));
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll('.reveal')].every(
          (el) => parseFloat(getComputedStyle(el).opacity) > 0.99
        ),
      { timeout: 20000 }
    ).catch(() => {});
  }

  await page.evaluate(axeSource);
  const results = await page.evaluate(async () => {
    return await window.axe.run(document, {
      resultTypes: ['violations'],
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
    });
  });

  const violations = results.violations.filter((v) => v.impact !== 'minor' || v.id.includes('contrast'));

  console.log(`\n${label}`);
  if (!violations.length) {
    console.log('  no violations');
  } else {
    for (const v of violations) {
      totalViolations += v.nodes.length;
      console.log(`  [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length})`);
      v.nodes.slice(0, 3).forEach((n) => {
        console.log(`      ${n.target.join(' ')}`);
        const msg = (n.any[0]?.message || n.all[0]?.message || '').split('\n')[0];
        if (msg) console.log(`        ${msg}`);
      });
    }
  }

  await page.close();
}

try {
  await audit('Home — business persona (desktop)');

  await audit('Home — engineering persona (desktop)', async (page) => {
    await page.click('#btn-tech');
  });

  await audit('Home — all case studies on Technical tab', async (page) => {
    await page.click('#btn-tech');
    await new Promise((r) => setTimeout(r, 300));
  });

  await audit('Chat assistant open', async (page) => {
    await page.click('#chatbot-toggle');
    await new Promise((r) => setTimeout(r, 700));
    await page.click('.suggest-btn');
  });

  await audit('Command palette open', async (page) => {
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyK');
    await page.keyboard.up('Control');
  });

  await audit(
    'Mobile with menu open',
    async (page) => {
      await page.click('#mobile-nav-toggle');
    },
    { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
  );
} finally {
  await browser.close();
}

console.log(
  `\n${totalViolations === 0 ? 'PASS' : 'FAIL'} — ${totalViolations} serious/critical violation node(s)`
);
process.exit(totalViolations === 0 ? 0 : 1);
