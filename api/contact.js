/**
 * POST /api/contact — the website's project-enquiry endpoint (Vercel function).
 *
 * Configuration lives in environment variables, never in the page:
 *
 *   RESEND_API_KEY   Resend API key                              (required)
 *   CONTACT_FROM     Sender, on a domain verified in Resend,
 *                    e.g. "NYT Software Solutions <hello@nytsoftwaresolution.pro.et>"
 *                                                                 (required)
 *   CONTACT_TO       Where enquiries go        (default: the company email)
 *   CONTACT_ALLOWED_ORIGINS  Extra origins allowed to post, comma-separated
 *                    (the site's own origin is always allowed)
 *
 * Until RESEND_API_KEY and CONTACT_FROM are set the endpoint answers
 * 503 `not_configured`, and the form falls back to a pre-filled email draft —
 * it never claims to have sent anything it did not send.
 *
 * Responses are JSON: { ok: true, confirmation: boolean } on delivery, or
 * { ok: false, error, fields? } with a 4xx/5xx status.
 */
import { LIMITS, buildEmails, createRateLimiter, sendEmail, validate } from './_lib/enquiry.js';

const COMPANY_EMAIL = 'nytsoftwaresolutionplc@gmail.com';
const SITE_URL = 'https://nytsoftwaresolution.pro.et';
const SITE_NAME = 'NYT Software Solutions';

const limiter = createRateLimiter({ max: 5, windowMs: 10 * 60_000 });

const json = (status, body, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extra,
    },
  });

function allowedOrigin(request, env) {
  const origin = request.headers.get('origin');
  // Same-origin form posts from some browsers omit Origin; the CSP and the
  // JSON content type already rule out a plain cross-site form post.
  if (!origin) return true;
  const own = new URL(request.url).origin;
  const extra = (env.CONTACT_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return [own, SITE_URL, ...extra].includes(origin);
}

function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for') ?? '';
  return forwarded.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

/**
 * The request handler, with its dependencies injectable for tests.
 * @param {Request} request
 */
export async function handleContact(request, { env = process.env, fetchImpl = fetch, now = Date.now() } = {}) {
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' }, { Allow: 'POST' });
  }

  if (!allowedOrigin(request, env)) return json(403, { ok: false, error: 'forbidden' });

  if (!(request.headers.get('content-type') ?? '').includes('application/json')) {
    return json(415, { ok: false, error: 'unsupported_media_type' });
  }

  const { allowed, retryAfter } = limiter.take(clientIp(request), now);
  if (!allowed) {
    return json(429, { ok: false, error: 'rate_limited' }, { 'Retry-After': String(retryAfter) });
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > LIMITS.bodyBytes) {
    return json(413, { ok: false, error: 'too_large' });
  }

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  const result = validate(body, { now });
  if (!result.ok) {
    return json(422, { ok: false, error: result.spam ? 'rejected' : 'invalid', fields: result.errors });
  }

  // Checked after validation on purpose: a visitor with a typo should hear
  // about the typo, not about server configuration.
  const apiKey = env.RESEND_API_KEY;
  const from = env.CONTACT_FROM;
  if (!apiKey || !from) return json(503, { ok: false, error: 'not_configured' });

  const to = env.CONTACT_TO || COMPANY_EMAIL;
  const { notification, confirmation } = buildEmails(result.data, {
    to,
    from,
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
  });
  const transport = { apiKey, apiUrl: env.RESEND_API_URL || undefined, fetchImpl };

  const delivered = await sendEmail(notification, transport);
  if (!delivered.ok) {
    // Logged without the visitor's details: status only.
    console.error('contact: notification not accepted by provider', delivered.status, delivered.error ?? '');
    return json(502, { ok: false, error: 'delivery_failed' });
  }

  // The enquiry has arrived. A failed confirmation copy is reported to the
  // visitor, but it does not turn a delivered enquiry into a failure.
  const confirmed = await sendEmail(confirmation, transport);
  if (!confirmed.ok) console.error('contact: confirmation not accepted', confirmed.status, confirmed.error ?? '');

  return json(200, { ok: true, confirmation: confirmed.ok });
}

export function POST(request) {
  return handleContact(request);
}

export function GET(request) {
  return handleContact(request);
}
