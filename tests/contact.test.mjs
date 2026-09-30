/**
 * Contact endpoint tests. Run with `npm test`.
 *
 * The email provider is replaced by a recording fake, so these exercise every
 * path — including the ones that must NOT report success — without sending
 * real mail. Delivery through the real provider is checked separately once
 * the production keys are set (README → "Contact form").
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { handleContact } from '../api/contact.js';
import { validate, buildEmails, escapeHtml, createRateLimiter } from '../api/_lib/enquiry.js';

const ENV = { RESEND_API_KEY: 'test-key', CONTACT_FROM: 'NYT <hello@example.test>', CONTACT_TO: 'team@example.test' };
const NOW = 1_800_000_000_000;

const good = (over = {}) => ({
  name: 'Abebe Bekele',
  email: 'abebe@example.com',
  subject: 'Restaurant / POS system',
  budget: 'Not sure yet',
  timeline: 'Within 1–3 months',
  message: 'We run three cafés and need a POS that keeps working offline.',
  consent: true,
  company_url: '',
  started_at: NOW - 60_000,
  ...over,
});

let ipCounter = 0;
function request(body, { method = 'POST', origin = 'https://nytsoftwaresolution.pro.et', type = 'application/json', ip } = {}) {
  const headers = { 'content-type': type, 'x-forwarded-for': ip ?? `10.0.0.${++ipCounter}` };
  if (origin) headers.origin = origin;
  return new Request('https://nytsoftwaresolution.pro.et/api/contact', {
    method,
    headers,
    body: method === 'GET' ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
}

/** A fake provider: records each message, answers with the given outcomes in turn. */
function provider(...outcomes) {
  const sent = [];
  const fetchImpl = async (_url, init) => {
    sent.push(JSON.parse(init.body));
    const outcome = outcomes[sent.length - 1] ?? 'ok';
    if (outcome === 'throw') throw new TypeError('network down');
    if (outcome === 'ok') return Response.json({ id: `msg_${sent.length}` });
    return Response.json({ message: 'rejected' }, { status: outcome });
  };
  return { sent, fetchImpl };
}

const call = (req, p = provider(), env = ENV) => handleContact(req, { env, fetchImpl: p.fetchImpl, now: NOW });

test('delivers the enquiry and a confirmation copy', async () => {
  const p = provider('ok', 'ok');
  const res = await call(request(good()), p);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, confirmation: true });
  assert.equal(p.sent.length, 2);

  const [notification, confirmation] = p.sent;
  assert.deepEqual(notification.to, ['team@example.test']);
  assert.equal(notification.reply_to, 'abebe@example.com');
  assert.match(notification.subject, /Restaurant \/ POS system — Abebe Bekele/);
  assert.match(notification.text, /Budget range: Not sure yet/);
  assert.match(notification.text, /Timeline: Within 1–3 months/);
  assert.deepEqual(confirmation.to, ['abebe@example.com']);
  assert.equal(confirmation.reply_to, 'team@example.test');
});

test('never reports success when the provider refuses the enquiry', async () => {
  for (const outcome of [500, 401, 'throw']) {
    const p = provider(outcome);
    const res = await call(request(good()), p);
    assert.equal(res.status, 502, `outcome ${outcome}`);
    assert.deepEqual(await res.json(), { ok: false, error: 'delivery_failed' });
    assert.equal(p.sent.length, 1, 'no confirmation is sent for an undelivered enquiry');
  }
});

test('a provider 200 without a message id is not treated as delivery', async () => {
  const fetchImpl = async () => Response.json({});
  const res = await handleContact(request(good()), { env: ENV, fetchImpl, now: NOW });
  assert.equal(res.status, 502);
});

test('a failed confirmation copy still reports the enquiry as delivered', async () => {
  const res = await call(request(good()), provider('ok', 500));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, confirmation: false });
});

test('without keys it says so instead of pretending', async () => {
  const p = provider();
  const res = await call(request(good()), p, {});
  assert.equal(res.status, 503);
  assert.equal((await res.json()).error, 'not_configured');
  assert.equal(p.sent.length, 0);
});

test('field errors come back per field, before any sending', async () => {
  const p = provider();
  const res = await call(
    request(good({ name: '', email: 'not-an-email', message: 'short', subject: 'Crypto', consent: false })),
    p
  );
  assert.equal(res.status, 422);
  const body = await res.json();
  assert.equal(body.error, 'invalid');
  assert.deepEqual(Object.keys(body.fields).sort(), ['consent', 'email', 'message', 'name', 'subject']);
  assert.equal(p.sent.length, 0);
});

test('line breaks in single-line fields are refused (header injection)', async () => {
  const res = await call(request(good({ name: 'Eve\r\nBcc: victim@example.com' })));
  assert.equal(res.status, 422);
  const email = await call(request(good({ email: 'eve@example.com\nBcc: x@example.com' })));
  assert.equal(email.status, 422);
});

test('budget and timeline accept only the offered options', async () => {
  assert.equal((await call(request(good({ budget: '1 billion' })))).status, 422);
  assert.equal((await call(request(good({ timeline: 'yesterday' })))).status, 422);
  assert.equal((await call(request(good({ budget: '', timeline: '' })))).status, 200);
});

test('honeypot and too-fast submissions are rejected, not faked', async () => {
  const p = provider();
  const trap = await call(request(good({ company_url: 'http://spam.example' })), p);
  assert.equal(trap.status, 422);
  assert.equal((await trap.json()).error, 'rejected');
  const fast = await call(request(good({ started_at: NOW - 500 })), p);
  assert.equal(fast.status, 422);
  assert.equal(p.sent.length, 0);
});

test('rate limits one client, not everyone', async () => {
  const ip = '203.0.113.9';
  const statuses = [];
  for (let i = 0; i < 6; i++) statuses.push((await call(request(good(), { ip }))).status);
  assert.deepEqual(statuses, [200, 200, 200, 200, 200, 429]);
  const limited = await call(request(good(), { ip }));
  assert.ok(Number(limited.headers.get('retry-after')) > 0);
  assert.equal((await call(request(good(), { ip: '203.0.113.10' }))).status, 200);
});

test('refuses other methods, origins, content types, oversized and malformed bodies', async () => {
  assert.equal((await call(request(null, { method: 'GET' }))).status, 405);
  assert.equal((await call(request(good(), { origin: 'https://evil.example' }))).status, 403);
  assert.equal((await call(request(good(), { type: 'text/plain' }))).status, 415);
  assert.equal((await call(request(good({ message: 'x'.repeat(30_000) })))).status, 413);
  assert.equal((await call(request('{not json'))).status, 400);
  assert.equal((await call(request('[1,2]'))).status, 422);
});

test('responses are never cached', async () => {
  const res = await call(request(good()));
  assert.equal(res.headers.get('cache-control'), 'no-store');
});

test('visitor text is escaped in the HTML emails', () => {
  const v = validate(good({ name: 'Eve <script>alert(1)</script>', message: '<img src=x onerror=alert(1)> and more words' }), { now: NOW });
  assert.equal(v.ok, true);
  const { notification, confirmation } = buildEmails(v.data, { to: 't@example.test', from: 'f@example.test' });
  for (const html of [notification.html, confirmation.html]) {
    assert.doesNotMatch(html, /<script>|<img src=x/);
    assert.match(html, /&lt;script&gt;/);
  }
  assert.equal(escapeHtml(`"'&<>`), '&quot;&#39;&amp;&lt;&gt;');
});

test('control characters are stripped from the message', () => {
  const v = validate(good({ message: 'Hello\u0000 there,\u0007 we need a POS system.' }), { now: NOW });
  assert.equal(v.ok, true);
  assert.equal(v.data.message, 'Hello there, we need a POS system.');
});

test('rate limiter window resets', () => {
  const rl = createRateLimiter({ max: 1, windowMs: 1000 });
  assert.equal(rl.take('a', 0).allowed, true);
  assert.equal(rl.take('a', 10).allowed, false);
  assert.equal(rl.take('a', 1001).allowed, true);
});

test('the form offers exactly the options the server accepts', async () => {
  const { formOptions } = await import('../src/data/site.ts');
  const { OPTIONS } = await import('../api/_lib/enquiry.js');
  assert.deepEqual([...formOptions.subject], OPTIONS.subject);
  assert.deepEqual(['', ...formOptions.budget], OPTIONS.budget);
  assert.deepEqual(['', ...formOptions.timeline], OPTIONS.timeline);
});
