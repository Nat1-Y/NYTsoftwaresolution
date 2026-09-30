/**
 * "Request a demo" and similar links carry the interest area they are about
 * (data-subject). The choice is handed to the contact form through
 * sessionStorage, so the visitor lands on a form that already knows why they
 * came. Purely a convenience: if storage is blocked, nothing breaks.
 */
const KEY = 'nyt-subject';

export function rememberSubject(): void {
  document.querySelectorAll<HTMLElement>('[data-subject]').forEach((link) => {
    link.addEventListener('click', () => {
      // Same page as the form: set it directly.
      const select = document.querySelector<HTMLSelectElement>('#form-subject');
      if (select && [...select.options].some((o) => o.value === link.dataset.subject)) {
        select.value = link.dataset.subject!;
        return;
      }
      try {
        sessionStorage.setItem(KEY, link.dataset.subject ?? '');
      } catch {
        /* storage blocked — the form keeps its default */
      }
    });
  });
}

/** Apply a remembered interest area to the form's select, once. */
export function applyRememberedSubject(select: HTMLSelectElement | null): void {
  if (!select) return;
  let subject = '';
  try {
    subject = sessionStorage.getItem(KEY) ?? '';
    sessionStorage.removeItem(KEY);
  } catch {
    return;
  }
  if (subject && [...select.options].some((o) => o.value === subject)) select.value = subject;
}
