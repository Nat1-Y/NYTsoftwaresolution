/**
 * Refresh the live captures of the client systems.
 *
 * The case-study plates show genuine screenshots of the public screens of two
 * systems (Bora, Merkato88). This re-takes them from the live sites into
 * src/assets/captures/, where the build's image pipeline turns them into
 * AVIF/WebP at several widths. Re-run it when a client ships a redesign, and
 * update the capture date in CasePlate.astro.
 *
 * Only public, logged-out screens are captured — nothing behind a login, and
 * nothing showing another person's data.
 *
 * Usage:  npm run captures
 */
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';

const OUT = 'src/assets/captures';
const CHROME =
  process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const DESKTOP = { width: 1280, height: 800, deviceScaleFactor: 1.5 };
const PHONE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

const targets = [
  ['bora-desktop', 'https://boraticketing.vercel.app/', DESKTOP],
  ['bora-mobile', 'https://boraticketing.vercel.app/', PHONE],
  ['merkato-desktop', 'https://merkato88.com/', DESKTOP],
  ['merkato-mobile', 'https://merkato88.com/browse', PHONE],
];

/** Close the cookie banner and the install-the-app prompt, if present. */
const dismiss = (page) =>
  page.evaluate(() => {
    for (const b of document.querySelectorAll('button, a')) {
      if (/^(no thanks|continue on web)$/i.test(b.textContent.trim())) b.click();
    }
  });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
try {
  for (const [name, url, viewport] of targets) {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    // Both sites animate in and lazy-load their imagery; let them settle.
    await wait(14000);
    await dismiss(page);
    await wait(4000);
    await dismiss(page);
    await wait(1500);
    const png = await page.screenshot();
    await sharp(png).jpeg({ quality: 90, mozjpeg: true }).toFile(`${OUT}/${name}.jpg`);
    console.log(`  saved  ${OUT}/${name}.jpg`);
    await page.close();
  }
} finally {
  await browser.close();
}
