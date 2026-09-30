/**
 * Project enquiries — validation, rate limiting and email delivery.
 *
 * Kept free of any platform API so it can be tested directly
 * (tests/contact.test.mjs) and so the function in api/contact.js stays a thin
 * layer of HTTP around it. Files under api/_lib are not routed by Vercel.
 *
 * The one rule everything here serves: an enquiry is reported as delivered
 * only when the email provider has accepted it. Anything short of that is a
 * failure, and the visitor is told so.
 */

/* ----------------------------------------------------------------- limits -- */

export const LIMITS = {
  /** Largest request body accepted, in bytes. A long brief is ~6 kB. */
  bodyBytes: 20_000,
  name: 120,
  email: 254,
  message: 5000,
  messageMin: 10,
  /** A human cannot read the form and write a brief faster than this. */
  minFillMs: 3000,
};

/** The options the form offers. Anything else is rejected, not stored. */
export const OPTIONS = {
  subject: [
    'Custom ERP / SaaS platform',
    'Restaurant / POS system',
    'Healthcare system',
    'E-commerce / marketplace',
    'NYT Cafe Manager demo',
    'Remote developer partnership',
    'Free consultation call',
    'Other inquiry',
  ],
  budget: ['', 'Under $5,000', '$5,000–$15,000', '$15,000–$50,000', 'Over $50,000', 'Not sure yet'],
  timeline: ['', 'As soon as possible', 'Within 1–3 months', 'Within 3–6 months', 'Flexible / exploring'],
};

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

/* ------------------------------------------------------------- validation -- */

/**
 * Strip control characters. Single-line fields also refuse line breaks —
 * they end up in an email subject, and a newline there is header injection.
 */
function clean(value, { multiline = false } = {}) {
  if (typeof value !== 'string') return '';
  const stripped = multiline
    ? value.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '')
    : value.replace(/[\u0000-\u001F\u007F]/g, ' ');
  return stripped.normalize('NFC').trim();
}

/**
 * Validate an enquiry body.
 * @returns {{ ok: true, data: Enquiry } | { ok: false, errors: Record<string,string>, spam?: boolean }}
 */
export function validate(body, { now = Date.now() } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, errors: { form: 'The request was not understood.' } };
  }

  // Bot signals first. Neither is shown to people, so neither needs a
  // friendly message — but neither is reported as a success either.
  if (typeof body.company_url === 'string' && body.company_url.trim() !== '') {
    return { ok: false, spam: true, errors: { form: 'The enquiry could not be accepted.' } };
  }
  const started = Number(body.started_at);
  if (Number.isFinite(started) && started > 0 && now - started < LIMITS.minFillMs) {
    return { ok: false, spam: true, errors: { form: 'The enquiry could not be accepted.' } };
  }

  const rawName = typeof body.name === 'string' ? body.name : '';
  const rawEmail = typeof body.email === 'string' ? body.email : '';
  const name = clean(rawName);
  const email = clean(rawEmail).toLowerCase();
  const message = clean(body.message, { multiline: true });
  const subject = clean(body.subject);
  const budget = clean(body.budget);
  const timeline = clean(body.timeline);

  const errors = {};

  if (/[\r\n]/.test(rawName)) errors.name = 'Please keep your name on one line.';
  else if (name.length < 2) errors.name = 'Please tell us who you are.';
  else if (name.length > LIMITS.name) errors.name = `Please keep this under ${LIMITS.name} characters.`;

  if (/[\r\n]/.test(rawEmail) || !EMAIL_RE.test(email) || email.length > LIMITS.email) {
    errors.email = 'That email address does not look right.';
  }

  if (message.length < LIMITS.messageMin) {
    errors.message = 'A sentence or two about your project helps us reply properly.';
  } else if (message.length > LIMITS.message) {
    errors.message = `Please keep the description under ${LIMITS.message} characters.`;
  }

  if (!OPTIONS.subject.includes(subject)) errors.subject = 'Please choose an interest area.';
  if (!OPTIONS.budget.includes(budget)) errors.budget = 'Please choose a budget range from the list.';
  if (!OPTIONS.timeline.includes(timeline)) errors.timeline = 'Please choose a timeline from the list.';

  if (body.consent !== true) errors.consent = 'Please confirm we may contact you about this enquiry.';

  if (Object.keys(errors).length) return { ok: false, errors };

  return { ok: true, data: { name, email, subject, budget, timeline, message } };
}

/* ---------------------------------------------------------- rate limiting -- */

/**
 * A fixed-window counter per key (the client IP).
 *
 * In memory, so it holds per warm function instance rather than globally:
 * it stops a single client hammering the form, not a distributed attack.
 * The provider's own sending limits are the backstop. See README →
 * "Contact form" for moving this to a shared store if abuse ever appears.
 */
export function createRateLimiter({ max = 5, windowMs = 10 * 60_000 } = {}) {
  const hits = new Map();
  return {
    /** @returns {{ allowed: boolean, retryAfter: number }} seconds until reset */
    take(key, now = Date.now()) {
      let entry = hits.get(key);
      if (!entry || now >= entry.reset) {
        entry = { count: 0, reset: now + windowMs };
        hits.set(key, entry);
      }
      entry.count += 1;
      // Keep the map from growing without bound on a long-lived instance.
      if (hits.size > 5000) {
        for (const [k, v] of hits) if (now >= v.reset) hits.delete(k);
      }
      return { allowed: entry.count <= max, retryAfter: Math.ceil((entry.reset - now) / 1000) };
    },
  };
}

/* ----------------------------------------------------------------- emails -- */

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function details(e) {
  return [
    ['Name / organisation', e.name],
    ['Email', e.email],
    ['Interest area', e.subject],
    ['Budget range', e.budget || 'Not given'],
    ['Timeline', e.timeline || 'Not given'],
  ];
}

function renderHtml(intro, e, outro = '') {
  const rows = details(e)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 16px 4px 0;color:#5f6884;font:12px monospace;text-transform:uppercase;letter-spacing:.08em">${escapeHtml(k)}</td><td style="padding:4px 0;color:#131f3a">${escapeHtml(v)}</td></tr>`
    )
    .join('');
  return `<!doctype html><html><body style="margin:0;background:#fbfaf6;font-family:Arial,Helvetica,sans-serif;color:#131f3a">
<div style="max-width:600px;margin:0 auto;padding:32px 24px">
<p style="font:12px monospace;letter-spacing:.14em;text-transform:uppercase;color:#a8471a;margin:0 0 16px">NYT Software Solutions</p>
${intro}
<table style="border-collapse:collapse;margin:20px 0;font-size:14px">${rows}</table>
<div style="border-top:1px solid #e2dccc;padding-top:16px;white-space:pre-wrap;font-size:14px;line-height:1.6">${escapeHtml(e.message)}</div>
${outro}
</div></body></html>`;
}

function renderText(intro, e, outro = '') {
  const lines = details(e).map(([k, v]) => `${k}: ${v}`);
  return [intro, '', ...lines, '', e.message, outro ? `\n${outro}` : ''].join('\n').trim();
}

/**
 * The two messages an enquiry produces: the notification to the company,
 * replying straight to the visitor, and the visitor's confirmation copy.
 */
export function buildEmails(e, { to, from, siteName = 'NYT Software Solutions', siteUrl = '' }) {
  const notification = {
    from,
    to: [to],
    reply_to: e.email,
    subject: `[Website enquiry] ${e.subject} — ${e.name}`.slice(0, 200),
    text: renderText('New enquiry from the website contact form.', e),
    html: renderHtml(
      '<h1 style="font:600 22px Georgia,serif;margin:0">New enquiry from the website</h1><p style="color:#4a5570;margin:8px 0 0">Reply to this email to answer the sender directly.</p>',
      e
    ),
  };

  const outroText = `This is an automatic confirmation. There is no need to reply — we will answer from our own address.${siteUrl ? `\n${siteName} · ${siteUrl}` : ''}`;
  const confirmation = {
    from,
    to: [e.email],
    reply_to: to,
    subject: `We received your enquiry — ${siteName}`,
    text: renderText(
      `Hello ${e.name},\n\nThank you for contacting ${siteName}. Your enquiry has reached our team and we will reply to this address. A copy of what you sent is below.`,
      e,
      outroText
    ),
    html: renderHtml(
      `<h1 style="font:600 22px Georgia,serif;margin:0">Thank you, ${escapeHtml(e.name)}.</h1><p style="color:#4a5570;line-height:1.6">Your enquiry has reached our team and we will reply to this address. A copy of what you sent is below.</p>`,
      e,
      `<p style="color:#5f6884;font-size:12px;margin-top:24px;border-top:1px solid #e2dccc;padding-top:12px">${escapeHtml(outroText).replace(/\n/g, '<br>')}</p>`
    ),
  };

  return { notification, confirmation };
}

/* ---------------------------------------------------------------- sending -- */

/**
 * Send one message through Resend's REST API.
 * Success means the provider returned 2xx and an id — nothing less.
 */
export async function sendEmail(message, { apiKey, apiUrl = 'https://api.resend.com/emails', fetchImpl = fetch, timeoutMs = 10_000 }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(apiUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok && payload && typeof payload.id === 'string') return { ok: true, id: payload.id };
    return { ok: false, status: response.status };
  } catch (error) {
    return { ok: false, status: 0, error: error?.name === 'AbortError' ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}
