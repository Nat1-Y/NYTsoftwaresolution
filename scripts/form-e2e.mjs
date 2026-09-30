/**
 * Contact form, end to end.
 *
 * `npm run smoke` runs against `astro preview`, which serves no functions, so
 * it can only prove the form's honest-failure path. This proves the rest: it
 * serves the built site together with the real api/contact.js handler, points
 * the handler at a fake email provider, and fills the form in a real browser.
 *
 *   1. provider accepts  → the page says "delivered", the provider received
 *                          the enquiry and the confirmation, with every field
 *   2. provider refuses  → the page reports failure and offers the email draft
 *   3. not configured    → same honest failure, no provider call at all
 *
 * Usage: npm run build && npm run e2e:form
 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { handleContact } from '../api/contact.js';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const CHROME = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.avif': 'image/avif', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain',
};

/* The fake provider: records messages, answers per the current mode. */
const provider = { mode: 'accept', sent: [] };
let env = {};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/fake-provider') {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    provider.sent.push(JSON.parse(raw));
    const accept = provider.mode === 'accept';
    res.writeHead(accept ? 200 : 500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(accept ? { id: `fake_${provider.sent.length}` } : { message: 'refused' }));
    return;
  }

  if (url.pathname === '/api/contact') {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const request = new Request(`http://localhost:${port}${url.pathname}`, {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : raw,
    });
    const response = await handleContact(request, { env });
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(await response.text());
    return;
  }

  let path = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
  if (path.includes('..')) { res.writeHead(400); res.end(); return; }
  if (!extname(path)) path = join(path, 'index.html');
  try {
    const body = await readFile(join(DIST, path));
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});

await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const configured = {
  RESEND_API_KEY: 'test-key',
  CONTACT_FROM: 'NYT Software Solutions <hello@example.test>',
  CONTACT_TO: 'team@example.test',
  RESEND_API_URL: `http://localhost:${port}/fake-provider`,
  CONTACT_ALLOWED_ORIGINS: `http://localhost:${port}`,
};

const results = [];
const check = (name, pass, detail = '') => {
  results.push(pass);
  console.log(`${pass ? '  PASS' : '  FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });

async function submit({ label, mode, envFor }) {
  env = envFor;
  provider.mode = mode;
  provider.sent = [];

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('html[data-ready="true"]');
  await page.keyboard.press('Escape');
  await page.evaluate(() => document.getElementById('contact').scrollIntoView());

  await page.type('#form-name', 'Test Café Group');
  await page.type('#form-email', 'owner@example.com');
  await page.select('#form-subject', 'Restaurant / POS system');
  await page.select('#form-budget', '$5,000–$15,000');
  await page.select('#form-timeline', 'Within 1–3 months');
  await page.type('#form-message', 'Three branches, need an offline-capable POS and stock control.');
  await page.$eval('#form-consent', (el) => el.click());
  // A person takes longer than the server's three-second floor.
  await new Promise((r) => setTimeout(r, 3200));
  await page.$eval('.form-submit', (el) => el.click());
  await page.waitForFunction(() => !document.getElementById('contact-form').hasAttribute('aria-busy') &&
    !/Sending/.test(document.getElementById('form-status').textContent), { timeout: 15000 });

  const state = await page.evaluate(() => ({
    status: document.getElementById('form-status').textContent,
    success: document.getElementById('form-status').classList.contains('success'),
    fallback: !document.getElementById('form-fallback').hasAttribute('hidden'),
    cleared: document.getElementById('form-name').value === '',
  }));
  await page.close();
  console.log(`\n${label}`);
  return state;
}

try {
  let s = await submit({ label: 'Provider accepts', mode: 'accept', envFor: configured });
  check('page reports delivery', s.success && /delivered/.test(s.status), s.status);
  check('provider received enquiry and confirmation', provider.sent.length === 2, `${provider.sent.length} messages`);
  const [note, copy] = provider.sent;
  check('enquiry carries every field',
    note && /Test Café Group/.test(note.text) && /\$5,000–\$15,000/.test(note.text) &&
    /Within 1–3 months/.test(note.text) && /offline-capable POS/.test(note.text) && note.reply_to === 'owner@example.com');
  check('confirmation goes to the visitor', copy?.to?.[0] === 'owner@example.com');
  check('form clears after delivery', s.cleared);
  check('no fallback after delivery', !s.fallback);

  s = await submit({ label: 'Provider refuses', mode: 'refuse', envFor: configured });
  check('refusal is reported as a failure', !s.success && !/delivered|thank you/i.test(s.status), s.status);
  check('refusal offers the email draft', s.fallback);
  check('no confirmation after a refusal', provider.sent.length === 1);
  check('details are kept after a failure', !s.cleared);

  s = await submit({ label: 'Not configured', mode: 'accept', envFor: {} });
  check('missing keys are reported honestly', !s.success && !/delivered|thank you/i.test(s.status), s.status);
  check('missing keys offer the email draft', s.fallback);
  check('nothing is sent without keys', provider.sent.length === 0);
} finally {
  await browser.close();
  server.close();
}

const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} checks passed`);
process.exitCode = passed === results.length ? 0 : 1;
