/**
 * Serves the built site with the production Content-Security-Policy applied
 * and reports any violation the browser raises.
 *
 * `astro preview` does not apply netlify.toml / vercel.json headers, so a
 * broken CSP would otherwise only show up after deploying.
 *
 * Usage:  npm run preview   (in one shell)
 *         npm run csp       (in another)
 */
import puppeteer from 'puppeteer-core';
import { readFile } from 'node:fs/promises';

const BASE = process.env.SMOKE_URL ?? 'http://localhost:4321';
const CHROME =
  process.env.CHROME_PATH ??
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// Read the policy straight from the deploy config so the two cannot drift.
const toml = await readFile('netlify.toml', 'utf8');
const match = toml.match(/Content-Security-Policy = "([^"]+)"/);
if (!match) throw new Error('Could not find the CSP in netlify.toml');
const CSP = match[1];
console.log('Policy under test:\n  ' + CSP.replace(/; /g, ';\n  ') + '\n');

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});

const violations = [];
const failedRequests = [];

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Inject the production header on every same-origin document response.
  await page.setRequestInterception(true);
  page.on('request', (req) => req.continue());
  page.on('console', (msg) => {
    const text = msg.text();
    if (/content security policy|refused to/i.test(text)) violations.push(text);
  });
  page.on('requestfailed', (req) => {
    failedRequests.push(`${req.failure()?.errorText} ${req.url()}`);
  });

  const client = await page.createCDPSession();
  await client.send('Fetch.enable', {
    patterns: [{ urlPattern: '*', requestStage: 'Response' }],
  });
  client.on('Fetch.requestPaused', async (event) => {
    const isDoc = event.resourceType === 'Document';
    const headers = (event.responseHeaders ?? []).filter(
      (h) => h.name.toLowerCase() !== 'content-security-policy'
    );
    if (isDoc) headers.push({ name: 'Content-Security-Policy', value: CSP });
    try {
      const body = await client.send('Fetch.getResponseBody', {
        requestId: event.requestId,
      });
      await client.send('Fetch.fulfillRequest', {
        requestId: event.requestId,
        responseCode: event.responseStatusCode ?? 200,
        responseHeaders: headers,
        body: body.base64Encoded
          ? body.body
          : Buffer.from(body.body).toString('base64'),
      });
    } catch {
      await client.send('Fetch.continueRequest', { requestId: event.requestId });
    }
  });

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('html[data-ready="true"]', { timeout: 20000 });
  await new Promise((r) => setTimeout(r, 2500));

  // Did the brand font actually apply, or did we fall back to a system face?
  const fonts = await page.evaluate(() => {
    const heading = document.querySelector('.hero-title');
    const mono = document.querySelector('.stat-num');
    return {
      headingFamily: getComputedStyle(heading).fontFamily,
      monoFamily: getComputedStyle(mono).fontFamily,
      displayLoaded: document.fonts.check('600 3rem Fraunces'),
      sansLoaded: document.fonts.check('400 1rem Archivo'),
      firaLoaded: document.fonts.check('400 1rem "Fira Code"'),
      stylesheetPromoted: document.getElementById('font-css')?.rel,
    };
  });

  console.log('Fonts:');
  console.log('  link rel after promotion :', fonts.stylesheetPromoted);
  console.log('  Fraunces loaded          :', fonts.displayLoaded);
  console.log('  Archivo loaded           :', fonts.sansLoaded);
  console.log('  Fira Code loaded         :', fonts.firaLoaded);

  // The page must still be interactive under the policy.
  await page.$eval('#btn-tech', (el) => el.click());
  await new Promise((r) => setTimeout(r, 400));
  const interactive = await page.evaluate(() =>
    document.documentElement.classList.contains('mode-tech')
  );

  console.log('\nInteractivity under CSP:', interactive ? 'OK' : 'BROKEN');

  const fontOk = fonts.displayLoaded && fonts.sansLoaded && fonts.firaLoaded;
  console.log('\nCSP violations:', violations.length);
  violations.forEach((v) => console.log('  - ' + v.slice(0, 160)));

  const relevantFailures = failedRequests.filter((f) => !/favicon/i.test(f));
  if (relevantFailures.length) {
    console.log('\nFailed requests:');
    relevantFailures.forEach((f) => console.log('  - ' + f.slice(0, 160)));
  }

  const pass = violations.length === 0 && fontOk && interactive;
  console.log(`\n${pass ? 'PASS' : 'FAIL'} — site works under the production CSP`);
  process.exitCode = pass ? 0 : 1;
} finally {
  await browser.close();
}
