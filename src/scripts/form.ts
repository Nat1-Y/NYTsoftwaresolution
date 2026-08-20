/**
 * Contact form.
 *
 * The rule this module exists to enforce: never tell a visitor their message
 * was sent unless a server actually accepted it. With no endpoint configured
 * the form says so plainly and hands them a pre-filled email instead, so a
 * lead is never silently dropped.
 */
import { $, $$ } from './dom';
import { toast } from './toast';

interface Fields {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function setError(input: HTMLInputElement | HTMLTextAreaElement, message: string): void {
  const errorEl = input.getAttribute('aria-describedby');
  const target = errorEl ? document.getElementById(errorEl) : null;
  if (target) target.textContent = message;
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function validate(form: HTMLFormElement): Fields | null {
  const name = form.querySelector<HTMLInputElement>('#form-name')!;
  const email = form.querySelector<HTMLInputElement>('#form-email')!;
  const message = form.querySelector<HTMLTextAreaElement>('#form-message')!;
  const consent = form.querySelector<HTMLInputElement>('#form-consent')!;
  const subject = form.querySelector<HTMLSelectElement>('#form-subject')!;

  let firstInvalid: HTMLElement | null = null;
  const fail = (el: HTMLInputElement | HTMLTextAreaElement, msg: string) => {
    setError(el, msg);
    if (!firstInvalid) firstInvalid = el;
  };

  setError(name, '');
  setError(email, '');
  setError(message, '');

  if (!name.value.trim()) fail(name, 'Please tell us who you are.');
  if (!email.value.trim()) fail(email, 'We need an email address to reply to.');
  else if (!EMAIL_RE.test(email.value.trim())) fail(email, 'That email address does not look right.');
  if (message.value.trim().length < 10)
    fail(message, 'A sentence or two about your project helps us reply properly.');

  if (!consent.checked) {
    if (!firstInvalid) firstInvalid = consent;
    consent.setAttribute('aria-invalid', 'true');
  } else {
    consent.setAttribute('aria-invalid', 'false');
  }

  if (firstInvalid) {
    (firstInvalid as HTMLElement).focus();
    return null;
  }

  return {
    name: name.value.trim(),
    email: email.value.trim(),
    subject: subject.value,
    message: message.value.trim(),
  };
}

function composeBody(f: Fields): string {
  return [
    `Name / organisation: ${f.name}`,
    `Email: ${f.email}`,
    `Interest area: ${f.subject}`,
    '',
    f.message,
  ].join('\n');
}

export function initContactForm(): void {
  const form = $<HTMLFormElement>('#contact-form');
  if (!form) return;

  const status = $('#form-status');
  const submit = form.querySelector<HTMLButtonElement>('.form-submit')!;
  const label = submit.querySelector<HTMLElement>('.submit-label')!;
  const fallback = $('#form-fallback');

  const endpoint = form.dataset.endpoint ?? '';
  const accessKey = form.dataset.accessKey ?? '';
  const mailto = form.dataset.mailto ?? '';

  const say = (text: string, type: 'success' | 'error' | '') => {
    if (!status) return;
    status.textContent = text;
    status.className = `form-status${type ? ` ${type}` : ''}`;
  };

  // Clear a field's error as soon as the visitor starts fixing it.
  $$<HTMLInputElement>('input, textarea', form).forEach((input) => {
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') setError(input, '');
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Honeypot: a real person never fills this in.
    const trap = form.querySelector<HTMLInputElement>('#form-company-url');
    if (trap?.value) return;

    const fields = validate(form);
    if (!fields) {
      say('Please check the highlighted fields.', 'error');
      return;
    }

    /* ---- No backend configured: be honest and hand over a draft --------- */
    if (!endpoint) {
      const subject = encodeURIComponent(`[Website enquiry] ${fields.subject} — ${fields.name}`);
      const body = encodeURIComponent(composeBody(fields));
      const href = `mailto:${mailto}?subject=${subject}&body=${body}`;

      const mailLink = $<HTMLAnchorElement>('#fallback-mail');
      if (mailLink) mailLink.href = href;

      const copyBtn = $<HTMLButtonElement>('#fallback-copy');
      if (copyBtn) {
        copyBtn.onclick = async () => {
          try {
            await navigator.clipboard.writeText(
              `To: ${mailto}\nSubject: Website enquiry — ${fields.name}\n\n${composeBody(fields)}`
            );
            toast('Message copied to your clipboard.', 'success');
          } catch {
            toast('Could not copy — please select the text manually.', 'error');
          }
        };
      }

      fallback?.removeAttribute('hidden');
      say('Your message is ready to send from your email app.', '');
      fallback?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }

    /* ---- Backend configured: actually POST ------------------------------ */
    submit.disabled = true;
    const original = label.textContent;
    label.textContent = 'Sending…';
    say('', '');

    try {
      const payload: Record<string, string> = {
        ...fields,
        from_name: fields.name,
        subject: `[Website] ${fields.subject} — ${fields.name}`,
      };
      if (accessKey) payload.access_key = accessKey;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Request failed with ${response.status}`);

      say(
        'Thank you — your message has been delivered. We reply to every enquiry, usually within one business day.',
        'success'
      );
      toast('Message sent successfully.', 'success');
      form.reset();
    } catch {
      // A failed send must read as a failed send.
      say(
        `We could not deliver that message. Please email us directly at ${mailto} and we will pick it up straight away.`,
        'error'
      );
      toast('Message could not be sent.', 'error');
    } finally {
      submit.disabled = false;
      label.textContent = original;
    }
  });
}
