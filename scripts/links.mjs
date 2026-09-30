/**
 * Link check over the built site.
 *
 * Every internal href and src in dist/ must resolve to a file that exists, and
 * every #fragment must match an id on the target page. With --external, every
 * outbound link is fetched too — the check that would have caught a case
 * study pointing at a domain that no longer exists.
 *
 * Usage:  npm run build && npm run links            (internal only)
 *         npm run links -- --external               (also fetch outbound links)
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const EXTERNAL = process.argv.includes('--external');

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

/** The URL path a built HTML file is served at. */
const urlOf = (file) => {
  const rel = relative(DIST, file).split(sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel.replace(/\.html$/, '')}`;
};

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/** Resolve a site path to the file that would serve it. */
async function fileFor(pathname) {
  const clean = decodeURIComponent(pathname).replace(/^\//, '');
  const candidates = [join(DIST, clean), join(DIST, clean, 'index.html'), join(DIST, `${clean}.html`)];
  for (const c of candidates) {
    if (await exists(c) && (await stat(c)).isFile()) return c;
  }
  return null;
}

const files = await walk(DIST);
const pages = new Map();
for (const f of files) pages.set(urlOf(f), await readFile(f, 'utf8'));

const idsOf = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const problems = [];
const external = new Map();
let checked = 0;

for (const [pageUrl, html] of pages) {
  const refs = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const raw of refs) {
    if (/^(mailto:|tel:|data:|javascript:)/.test(raw)) continue;
    if (/^https?:\/\//.test(raw)) {
      if (!raw.includes('nytsoftwaresolution.pro.et')) {
        if (!external.has(raw)) external.set(raw, new Set());
        external.get(raw).add(pageUrl);
      }
      continue;
    }
    checked++;
    const url = new URL(raw, `http://site${pageUrl}`);
    const target = url.pathname === pageUrl ? pageUrl : url.pathname;

    let targetHtml = pages.get(target) ?? pages.get(target.replace(/\/?$/, '/'));
    if (!targetHtml) {
      const file = await fileFor(target);
      if (!file) {
        problems.push(`${pageUrl}: broken link ${raw}`);
        continue;
      }
      targetHtml = file.endsWith('.html') ? await readFile(file, 'utf8') : null;
    }

    const hash = url.hash.slice(1);
    if (hash && hash !== 'top' && targetHtml && !idsOf(targetHtml).has(decodeURIComponent(hash))) {
      problems.push(`${pageUrl}: ${raw} — no element with id "${hash}"`);
    }
  }
}

console.log(`Internal: ${checked} links across ${pages.size} pages`);

if (EXTERNAL) {
  console.log(`External: checking ${external.size} links…`);
  for (const [url, from] of external) {
    let status = 'unreachable';
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(20000) });
      status = res.status;
      if (res.ok) continue;
    } catch (error) {
      status = error?.cause?.code ?? error?.name ?? 'error';
    }
    problems.push(`external ${url} → ${status} (linked from ${[...from].join(', ')})`);
  }
}

if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  problems.forEach((p) => console.log(`  - ${p}`));
  process.exitCode = 1;
} else {
  console.log('PASS — no broken links');
}
