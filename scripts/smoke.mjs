/**
 * Interaction smoke test.
 *
 * Drives the built site in a real browser and asserts the things that are easy
 * to break and impossible to catch with a type-checker: the mobile menu opens,
 * the tabs swap panels, the filters filter, the form refuses to lie about
 * sending, and the palette responds to Ctrl+K.
 *
 * Usage:  npm run build && npm run preview   (in one shell)
 *         npm run smoke                      (in another)
 */
import puppeteer from 'puppeteer-core';
import { mkdir, readFile } from 'node:fs/promises';

/**
 * Read the loader timings straight from the site config, so the test can never
 * drift from what actually ships. Anchored to the `loader` object specifically —
 * a loose match picks up the example value in the surrounding comment instead.
 */
const siteSrc = await readFile(new URL('../src/data/site.ts', import.meta.url), 'utf8');
const loaderBlock = /export const loader = \{([\s\S]*?)\}/.exec(siteSrc)?.[1] ?? '';
const LOADER = {
  minMs: Number(/minMs:\s*(\d+)/.exec(loaderBlock)?.[1] ?? 0),
  maxMs: Number(/maxMs:\s*(\d+)/.exec(loaderBlock)?.[1] ?? 0),
};

if (!LOADER.maxMs) {
  console.error('Could not read loader timings from src/data/site.ts');
  process.exit(1);
}

const BASE = process.env.SMOKE_URL ?? 'http://localhost:4321';
const OUT = process.env.SMOKE_OUT ?? './.smoke';
const CHROME =
  process.env.CHROME_PATH ??
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? '  PASS' : '  FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

await mkdir(OUT, { recursive: true });

/**
 * Screenshots are diagnostics, not assertions. A full disk or a slow paint
 * must not take the whole suite down with it.
 */
async function snap(page, path) {
  try {
    await page.screenshot({ path });
  } catch (err) {
    console.log(`  note   screenshot skipped (${String(err.message).split('\n')[0]})`);
  }
}

/**
 * Click via the element itself rather than by screen coordinate. Reveal
 * animations move elements while they run, and a coordinate click can land on
 * whatever slid into that spot instead.
 */
async function tap(page, selector) {
  await page.waitForSelector(selector);
  await page.$eval(selector, (el) => el.click());
}

/**
 * Navigate and wait until the page's scripts have attached their handlers.
 *
 * The intro splash is deliberately held for several seconds, so rather than
 * waiting it out on every page load we take the documented escape hatch — a
 * keypress — which also exercises the skip path on every single test.
 */
async function open(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('html[data-ready="true"]', { timeout: 20000 });
  await page.keyboard.press('Escape');
  await page.waitForFunction(
    () => {
      const l = document.getElementById('page-loader');
      return !l || l.classList.contains('hidden');
    },
    { timeout: 20000 }
  );
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});

try {
  /* =============================== DESKTOP =============================== */
  console.log('\nDesktop (1440x900)');
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await open(page, BASE);

  // No horizontal overflow anywhere on the page.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  check('no horizontal overflow', overflow <= 0, `${overflow}px`);

  const loaderGone = await page.evaluate(() => {
    const l = document.getElementById('page-loader');
    return !l || l.classList.contains('hidden');
  });
  check('splash can be skipped by keypress', loaderGone);

  // The closed chat panel used to keep its place in the flex column, pushing
  // the toggle ~380px up the page and over the hero.
  const chatAnchor = await page.evaluate(() => {
    const t = document.querySelector('.chatbot-toggle').getBoundingClientRect();
    return {
      bottomGap: Math.round(window.innerHeight - t.bottom),
      rightGap: Math.round(window.innerWidth - t.right),
    };
  });
  check(
    'chat button sits in the bottom-right corner',
    chatAnchor.bottomGap < 60 && chatAnchor.rightGap < 60,
    `${chatAnchor.bottomGap}px from bottom, ${chatAnchor.rightGap}px from right`
  );

  // Counters must never be left showing 0 for a stat that was scrolled past.
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 2600));
  const stats = await page.evaluate(() =>
    [...document.querySelectorAll('.stat-num')].map((el) => el.textContent.trim())
  );
  check(
    'stat counters settle on their real values',
    stats.length === 4 && stats.every((s) => s !== '0+' && s !== '0%' && /[1-9]/.test(s)),
    stats.join(' | ')
  );

  // Case-study tabs swap the visible panel and update ARIA.
  await tap(page, '[data-case-study="fikrekun-spagna"] [data-tab="tech"]');
  const tabState = await page.evaluate(() => {
    const card = document.querySelector('[data-case-study="fikrekun-spagna"]');
    const techPanel = card.querySelector('[data-tab-content="tech"]');
    const bizPanel = card.querySelector('[data-tab-content="business"]');
    const techTab = card.querySelector('[data-tab="tech"]');
    return {
      techVisible: techPanel.classList.contains('active') && !techPanel.hasAttribute('hidden'),
      bizHidden: bizPanel.hasAttribute('hidden'),
      selected: techTab.getAttribute('aria-selected') === 'true',
      hasDiagram: !!techPanel.querySelector('.arch-svg'),
    };
  });
  check('tab switches panel', tabState.techVisible && tabState.bizHidden);
  check('tab updates aria-selected', tabState.selected);
  check('architecture diagram renders', tabState.hasDiagram);

  // A scrollable region needs a tab stop; a non-scrollable one must not have
  // a dead tab stop. At desktop width the diagram fits, so neither should.
  const diagramDesktop = await page.evaluate(() => {
    const r = document.querySelector(
      '#panel-fikrekun-spagna-tech .arch-scroll'
    );
    return {
      overflows: r.scrollWidth > r.clientWidth + 1,
      tabindex: r.getAttribute('tabindex'),
    };
  });
  check(
    'diagram fits its card on desktop (no dead tab stop)',
    !diagramDesktop.overflows && diagramDesktop.tabindex === null,
    `overflows=${diagramDesktop.overflows} tabindex=${diagramDesktop.tabindex}`
  );

  // Persona switch repaints the accent and realigns every card.
  await tap(page, '#btn-tech');
  await new Promise((r) => setTimeout(r, 500));
  const persona = await page.evaluate(() => ({
    rootClass: document.documentElement.className,
    accent: getComputedStyle(document.body).getPropertyValue('--accent').trim(),
    allTech: [...document.querySelectorAll('.project-card')].every((c) =>
      c.querySelector('[data-tab-content="tech"]').classList.contains('active')
    ),
    stored: localStorage.getItem('nyt-persona'),
  }));
  check('persona sets tech mode', persona.rootClass.includes('mode-tech'), persona.accent);
  check('persona realigns all cards', persona.allTech);
  check('persona persists', persona.stored === 'tech');

  await tap(page, '#btn-business');
  await new Promise((r) => setTimeout(r, 400));

  // Tech filters hide non-matching cards and announce the count.
  await tap(page, '.filter-btn[data-filter="databases"]');
  const filtered = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.tech-card')];
    return {
      shown: cards.filter((c) => !c.classList.contains('hidden')).length,
      hiddenInert: cards
        .filter((c) => c.classList.contains('hidden'))
        .every((c) => c.hasAttribute('inert')),
      status: document.getElementById('tech-filter-status')?.textContent ?? '',
    };
  });
  check('filter narrows the grid', filtered.shown === 5, `${filtered.shown} shown`);
  check('filtered-out cards are inert', filtered.hiddenInert);
  check('filter change is announced', filtered.status.includes('5'));

  // Command palette opens on Ctrl+K and filters.
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyK');
  await page.keyboard.up('Control');
  await new Promise((r) => setTimeout(r, 300));
  let paletteOpen = await page.evaluate(() =>
    document.getElementById('command-palette').classList.contains('open')
  );
  check('Ctrl+K opens palette', paletteOpen);

  await page.type('#cmdk-input', 'merkato');
  await new Promise((r) => setTimeout(r, 200));
  const paletteResults = await page.evaluate(() => ({
    count: document.querySelectorAll('.cmdk-item').length,
    first: document.querySelector('.cmdk-item .cmdk-label')?.textContent ?? '',
  }));
  check('palette search filters', paletteResults.count > 0 && /Merkato/i.test(paletteResults.first),
    paletteResults.first);

  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 250));
  paletteOpen = await page.evaluate(() =>
    document.getElementById('command-palette').classList.contains('open')
  );
  check('Escape closes palette', !paletteOpen);

  /* --- The important one: the form must not claim a false success --------- */
  await page.evaluate(() => document.getElementById('contact').scrollIntoView());
  await page.type('#form-name', 'Test Restaurant');
  await page.type('#form-email', 'not-an-email');
  await page.type('#form-message', 'We need a POS system for three branches.');
  await tap(page, '#form-consent');
  await tap(page, '.form-submit');
  await new Promise((r) => setTimeout(r, 400));

  let formState = await page.evaluate(() => ({
    status: document.getElementById('form-status').textContent,
    emailInvalid: document.getElementById('form-email').getAttribute('aria-invalid'),
    emailError: document.getElementById('err-email').textContent,
  }));
  check('invalid email is rejected', formState.emailInvalid === 'true', formState.emailError);
  check('no false success on invalid input', !/thank you|delivered|received/i.test(formState.status));

  await page.evaluate(() => {
    document.getElementById('form-email').value = '';
  });
  await page.type('#form-email', 'owner@example.com');
  await tap(page, '.form-submit');
  await new Promise((r) => setTimeout(r, 500));

  formState = await page.evaluate(() => ({
    status: document.getElementById('form-status').textContent,
    fallbackShown: !document.getElementById('form-fallback')?.hasAttribute('hidden'),
    mailHref: document.getElementById('fallback-mail')?.getAttribute('href') ?? '',
  }));
  check(
    'no backend => never claims it sent',
    !/thank you|has been (delivered|received)/i.test(formState.status),
    JSON.stringify(formState.status)
  );
  check('no backend => offers a real fallback', formState.fallbackShown);
  check(
    'fallback prefills a mailto draft',
    formState.mailHref.startsWith('mailto:') && formState.mailHref.includes('Test%20Restaurant')
  );

  // Chatbot must not answer everything with the services blurb.
  await tap(page, '#chatbot-toggle');
  await new Promise((r) => setTimeout(r, 600));
  await page.type('#chatbot-input', 'how long will it take?');
  await page.keyboard.press('Enter');
  await new Promise((r) => setTimeout(r, 1600));
  const reply = await page.evaluate(() => {
    const bubbles = [...document.querySelectorAll('.chat-message.bot .msg-bubble')];
    return bubbles[bubbles.length - 1]?.textContent ?? '';
  });
  check('chatbot routes to the timeline intent', /2 to 4 weeks|dated timeline/i.test(reply),
    reply.slice(0, 60).replace(/\s+/g, ' '));

  await page.evaluate(() => document.getElementById('chatbot-minimize')?.click());
  await snap(page, `${OUT}/desktop.png`);

  /* --- Splash timing: honours the configured hold, and always ends ------- */
  {
    const timed = await browser.newPage();
    await timed.setViewport({ width: 1280, height: 800 });
    const t0 = Date.now();
    await timed.goto(BASE, { waitUntil: 'domcontentloaded' });
    await timed.waitForFunction(
      () => {
        const l = document.getElementById('page-loader');
        return !l || l.classList.contains('hidden');
      },
      { timeout: 20000, polling: 50 }
    );
    const heldMs = Date.now() - t0;

    check(
      'splash holds for at least the configured minimum',
      heldMs >= LOADER.minMs - 250,
      `${heldMs}ms (min ${LOADER.minMs}ms)`
    );
    check(
      'splash always ends by the configured ceiling',
      heldMs <= LOADER.maxMs + 1500,
      `${heldMs}ms (max ${LOADER.maxMs}ms)`
    );
    await timed.close();
  }

  /* --- Reduced motion must not sit through a decorative splash ---------- */
  {
    const rmLoader = await browser.newPage();
    await rmLoader.emulateMediaFeatures([
      { name: 'prefers-reduced-motion', value: 'reduce' },
    ]);
    const t0 = Date.now();
    await rmLoader.goto(BASE, { waitUntil: 'domcontentloaded' });
    await rmLoader.waitForFunction(
      () => {
        const l = document.getElementById('page-loader');
        return !l || l.classList.contains('hidden');
      },
      { timeout: 20000, polling: 50 }
    );
    const rmHeld = Date.now() - t0;
    check(
      'reduced motion skips the splash entirely',
      rmHeld < LOADER.minMs,
      `${rmHeld}ms`
    );
    await rmLoader.close();
  }

  /* ================================ MOBILE =============================== */
  console.log('\nMobile (iPhone 12 — 390x844)');
  const m = await browser.newPage();
  await m.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await open(m, BASE);

  const mOverflow = await m.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  check('no horizontal overflow on mobile', mOverflow <= 1, `${mOverflow}px`);

  const toggleVisible = await m.evaluate(() => {
    const t = document.getElementById('mobile-nav-toggle');
    const r = t.getBoundingClientRect();
    return r.width > 0 && r.right <= window.innerWidth && r.left >= 0;
  });
  check('hamburger is on screen', toggleVisible);

  await tap(m, '#mobile-nav-toggle');
  await new Promise((r) => setTimeout(r, 450));
  const menu = await m.evaluate(() => {
    const el = document.getElementById('mobile-nav-menu');
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      expanded: document.getElementById('mobile-nav-toggle').getAttribute('aria-expanded'),
      display: style.display,
      visibility: style.visibility,
      onScreen: rect.top >= 0 && rect.width <= window.innerWidth + 1,
      opacity: style.opacity,
    };
  });
  check('mobile menu actually opens', menu.display !== 'none' && menu.visibility === 'visible',
    `display:${menu.display} visibility:${menu.visibility} opacity:${menu.opacity}`);
  check('mobile menu sets aria-expanded', menu.expanded === 'true');
  check('mobile menu fits the viewport', menu.onScreen);

  await tap(m, '#mobile-nav-toggle');
  await new Promise((r) => setTimeout(r, 350));
  await m.$eval('#btn-tech', (el) => el.click());
  await new Promise((r) => setTimeout(r, 700));
  const diagramMobile = await m.evaluate(() => {
    const r = document.querySelector('#panel-fikrekun-spagna-tech .arch-scroll');
    return {
      overflows: r.scrollWidth > r.clientWidth + 1,
      tabindex: r.getAttribute('tabindex'),
    };
  });
  check(
    'scrollable diagram is keyboard-reachable on mobile',
    diagramMobile.overflows && diagramMobile.tabindex === '0',
    `overflows=${diagramMobile.overflows} tabindex=${diagramMobile.tabindex}`
  );
  await m.$eval('#btn-business', (el) => el.click());
  await new Promise((r) => setTimeout(r, 300));
  await tap(m, '#mobile-nav-toggle');
  await new Promise((r) => setTimeout(r, 350));

  const personaFit = await m.evaluate(() => {
    const btns = [...document.querySelectorAll('.switcher-btn')];
    return btns.every((b) => {
      const br = b.getBoundingClientRect();
      const label = b.querySelector('.switcher-short');
      const lr = label.getBoundingClientRect();
      return lr.left >= br.left - 0.5 && lr.right <= br.right + 0.5;
    });
  });
  check('persona labels fit their buttons', personaFit);

  const banner = await m.evaluate(() => ({
    online: navigator.onLine,
    visible: document.querySelector('.offline-banner')?.classList.contains('visible'),
  }));
  check('offline banner hidden while online', banner.online ? !banner.visible : true,
    'navigator.onLine=' + banner.online);

  await snap(m, `${OUT}/mobile-menu.png`);

  await tap(m, '#mobile-nav-toggle');
  await new Promise((r) => setTimeout(r, 400));
  await snap(m, `${OUT}/mobile.png`);

  /* ============================ REDUCED MOTION =========================== */
  console.log('\nReduced motion');
  const rm = await browser.newPage();
  await rm.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await rm.setViewport({ width: 1280, height: 900 });
  await open(rm, BASE);
  await new Promise((r) => setTimeout(r, 800));

  const rmState = await rm.evaluate(() => {
    const hidden = [...document.querySelectorAll('.reveal')].filter(
      (el) => getComputedStyle(el).opacity === '0'
    ).length;
    const statText = document.querySelector('.stat-num')?.textContent ?? '';
    return { hidden, statText };
  });
  check('reduced motion: nothing left invisible', rmState.hidden === 0, `${rmState.hidden} hidden`);
  check('reduced motion: counters show final value', /\d/.test(rmState.statText), rmState.statText);
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log('\nFailures:');
  failed.forEach((f) => console.log(`  - ${f.name}${f.detail ? ` (${f.detail})` : ''}`));
  process.exit(1);
}
