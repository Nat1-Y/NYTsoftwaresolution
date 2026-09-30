/**
 * Contact form.
 *
 * The rule this module exists to enforce: never tell a visitor their message
 * was sent unless the server says the email provider accepted it. Every other
 * outcome is reported as what it is, and wherever the website could not
 * deliver the message itself, the visitor is handed a pre-filled email draft
 * so the enquiry is never silently dropped.
 *
 * Validation here is for the visitor's convenience only; api/contact.js
 * validates everything again and is the one that decides.
 */
import { $, $$ } from './dom';
import { toast } from './toast';
import { applyRememberedSubject } from './subject';

interface Fields {
  name: string;
  email: string;
  subject: string;
  budget: string;
  timeline: string;
  message: string;
}

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function setError(input: Field, message: string): void {
  const errorEl = input.getAttribute('aria-describedby');
  const target = errorEl ? document.getElementById(errorEl) : null;
  if (target) target.textContent = message;
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

const field = <T extends Field>(form: HTMLFormElement, id: string) => form.querySelector<T>(`#${id}`)!;

function validate(form: HTMLFormElement): Fields | null {
  const name = field<HTMLInputElement>(form, 'form-name');
  const email = field<HTMLInputElement>(form, 'form-email');
  const message = field<HTMLTextAreaElement>(form, 'form-message');
  const consent = field<HTMLInputElement>(form, 'form-consent');

  let firstInvalid: HTMLElement | null = null;
  const fail = (el: Field, msg: string) => {
    setError(el, msg);
    if (!firstInvalid) firstInvalid = el;
  };

  [name, email, message, consent].forEach((el) => setError(el, ''));

  if (name.value.trim().length < 2) fail(name, 'Please tell us who you are.');
  if (!email.value.trim()) fail(email, 'We need an email address to reply to.');
  else if (!EMAIL_RE.test(email.value.trim())) fail(email, 'That email address does not look right.');
  if (message.value.trim().length < 10)
    fail(message, 'A sentence or two about your project helps us reply properly.');
  if (!consent.checked) fail(consent, 'Please confirm we may contact you about this enquiry.');

  if (firstInvalid) {
    (firstInvalid as HTMLElement).focus();
    return null;
  }

  return {
    name: name.value.trim(),
    email: email.value.trim(),
    subject: field<HTMLSelectElement>(form, 'form-subject').value,
    budget: field<HTMLSelectElement>(form, 'form-budget').value,
    timeline: field<HTMLSelectElement>(form, 'form-timeline').value,
    message: message.value.trim(),
  };
}

function composeBody(f: Fields): string {
  return [
    `Name / organisation: ${f.name}`,
    `Email: ${f.email}`,
    `Interest area: ${f.subject}`,
    `Budget range: ${f.budget || 'Not given'}`,
    `Timeline: ${f.timeline || 'Not given'}`,
    '',
    f.message,
  ].join('\n');
}

/** Map a server field name onto the input that shows its error. */
const SERVER_FIELDS: Record<string, string> = {
  name: 'form-name',
  email: 'form-email',
  message: 'form-message',
  consent: 'form-consent',
};

export function initContactForm(): void {
  const form = $<HTMLFormElement>('#contact-form');
  if (!form) return;

  const status = $('#form-status');
  const submit = form.querySelector<HTMLButtonElement>('.form-submit')!;
  const label = submit.querySelector<HTMLElement>('.submit-label')!;
  const fallback = $('#form-fallback');

  applyRememberedSubject(form.querySelector<HTMLSelectElement>('#form-subject'));

  const endpoint = form.dataset.endpoint ?? '';
  const mailto = form.dataset.mailto ?? '';

  // When the form was opened. The server rejects a brief "written" in under
  // three seconds — a script, not a person.
  const startedAt = Date.now();

  const say = (text: string, type: 'success' | 'error' | '') => {
    if (!status) return;
    status.textContent = text;
    status.className = `form-status${type ? ` ${type}` : ''}`;
  };

  /** Hand the visitor their message as an email draft instead. */
  const offerDraft = (fields: Fields) => {
    const subject = encodeURIComponent(`[Website enquiry] ${fields.subject} — ${fields.name}`);
    const body = encodeURIComponent(composeBody(fields));
    const mailLink = $<HTMLAnchorElement>('#fallback-mail');
    if (mailLink) mailLink.href = `mailto:${mailto}?subject=${subject}&body=${body}`;

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
    fallback?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  // Clear a field's error as soon as the visitor starts fixing it.
  $$<Field>('input, textarea, select', form).forEach((input) => {
    const clear = () => {
      if (input.getAttribute('aria-invalid') === 'true') setError(input, '');
    };
    input.addEventListener('input', clear);
    input.addEventListener('change', clear);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fields = validate(form);
    if (!fields) {
      say('Please check the highlighted fields.', 'error');
      return;
    }

    fallback?.setAttribute('hidden', '');

    /* ---- No endpoint at all: be honest and hand over a draft ----------- */
    if (!endpoint) {
      offerDraft(fields);
      say('Your message is ready to send from your email app.', '');
      return;
    }

    /* ---- Post it --------------------------------------------------------- */
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    const original = label.textContent;
    label.textContent = 'Sending…';
    say('Sending your message…', '');

    let response: Response | null = null;
    let result: { ok?: boolean; error?: string; confirmation?: boolean; fields?: Record<string, string> } = {};

    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...fields,
          consent: true,
          company_url: field<HTMLInputElement>(form, 'form-company-url').value,
          started_at: startedAt,
        }),
      });
      result = await response.json().catch(() => ({}));
    } catch {
      response = null;
    } finally {
      submit.disabled = false;
      form.removeAttribute('aria-busy');
      label.textContent = original;
    }

    /* Delivered — the only branch that says so. */
    if (response?.ok && result.ok) {
      say(
        result.confirmation
          ? `Thank you — your enquiry has been delivered to our team. A confirmation has been sent to ${fields.email}.`
          : `Thank you — your enquiry has been delivered to our team. We could not send you a confirmation copy, but we will reply to ${fields.email}.`,
        'success'
      );
      toast('Message delivered.', 'success');
      form.reset();
      return;
    }

    /* The server read it and found a problem with a field. */
    if (response?.status === 422 && result.error === 'invalid' && result.fields) {
      let focused = false;
      for (const [name, message] of Object.entries(result.fields)) {
        const id = SERVER_FIELDS[name];
        const input = id ? form.querySelector<Field>(`#${id}`) : null;
        if (!input) continue;
        setError(input, message);
        if (!focused) {
          input.focus();
          focused = true;
        }
      }
      say('Please check the highlighted fields.', 'error');
      return;
    }

    if (response?.status === 429) {
      say(
        `We have received several messages from this connection in a short time. Please wait a few minutes, or email us at ${mailto}.`,
        'error'
      );
      offerDraft(fields);
      return;
    }

    /*
     * Not configured, not deployed, unreachable, or refused by the email
     * provider. Whatever the cause, the message did not go — say so, and
     * give the visitor a way to send it themselves.
     */
    say(`We could not deliver that message through the website. Your details are ready to email to ${mailto} instead.`, 'error');
    toast('Message not sent — email draft ready.', 'error');
    offerDraft(fields);
  });
}
