# Claims register and owner actions

Every figure and checkable statement the site makes, where it appears, where it
comes from, and what still needs the company to confirm. Updated 30 Sep 2026.

**Status key**

- **Verified** — checked directly (on the page itself, or on the live system,
  with the date).
- **Attributed** — the site names a source, but the evidence is held by the
  company or the client. Confirm it exists, and that the client agreed to
  publication, or withdraw the claim.
- **Changed** — rewritten or removed in this pass, with the reason.
- **Held** — kept off the page until confirmed.

---

## Figures

| Claim | Where | Source | Status |
| --- | --- | --- | --- |
| 20+ projects delivered | Hero stats | Company records | Attributed — confirm the count |
| 8+ industries served | Hero stats | Company records | Attributed — the site itself shows 4 |
| 20+ technologies | Hero stats | The ecosystem lists 22 | Verified |
| 4 case studies | Hero stats | The case studies section | Verified |
| ~~100% cloud native / scalable~~ | Hero stats | — | Changed — not a measurement; removed |
| 85% less manual reconciliation time | Fikrekun card and page | "Reported by Fikrekun Spagna operations after the first full quarter" | Attributed |
| 60% fewer check-in bottlenecks | Saron card and page | "Measured against the clinic's pre-rollout intake timings" | Attributed |
| 100k+ historical clinic records | Saron technical specs | — | Attributed — no source given |
| 100% of gate entries digitised | Bora card and page | "All gate entries now issue and validate through the platform" | Attributed |
| 5k+ daily validations | Bora status, Bora testimonial | Client | Attributed |
| +40% merchant conversions | Merkato card and page | "Platform analytics, comparing the two quarters after launch" | Attributed |
| Search in double-digit milliseconds | Merkato technical specs | — | Attributed — no source given |
| ~~150+ local merchants~~ → 50+ active sellers | Merkato status, chatbot | merkato88.com home page, 29 Sep 2026 | Changed — the client's own site shows 50+ |
| ~~Five-star ratings~~ | Testimonials | — | Changed — no rating source existed; removed |

## Case studies and demos

| Item | Status |
| --- | --- |
| Fikrekun live link (`fikrekunspagna22a.vanguardxie.com`) | Changed — the domain does not resolve (checked 29 Sep 2026). Link removed; the card offers a walkthrough on request |
| Fikrekun public demo login (`guest@nyt.com` / `guest123`) | Changed — removed from the site, README and chatbot. **Rotate or disable this account wherever it exists** — it was published |
| Fikrekun deployment state | Set to "Delivered" — not publicly verifiable now. Change it to "In production" if it is, and restore a working link |
| Saron link | Verified reachable (sign-in page only). **The page reads "Powered by Syntax Software Solution".** Confirm NYT's role, or a prospect who clicks through will doubt it |
| Bora, Merkato88 links | Verified reachable, 29 Sep 2026 |
| Case-study technical details (schemas, locks, caches, workers) | Taken from the existing case studies. Confirm each against the delivered code — this repo cannot see it |
| Screenshots | Bora and Merkato88 public pages only; nothing behind a login. Confirm the clients are content to be shown |

## Testimonials

| Quote | Status |
| --- | --- |
| Fikrekun Spagna, Saron, Bora | Published — **confirm each client approved publication**. Add a named person with their agreement (`person` in `src/data/testimonials.ts`) |
| Merkato88 | **Held** — the quote cites 150+ merchants; merkato88.com shows 50+. Re-confirm the wording with the client, then remove `hold` |

## Practices the site commits to

These are company practices, stated on the site. They are fine to publish only
if they are true of every engagement.

- Encrypted data at rest and in transit
- Full source-code handover on final payment
- Post-launch warranty period (length not stated anywhere — agree it per contract)
- Weekly written progress reports; overlap hours with the client's time zone
- Free first consultation and written estimate
- Paid audit before taking over an existing codebase
- Fluent technical English

No security certification or regulatory compliance is claimed anywhere on the
site. Keep it that way unless there is evidence.

---

# Owner actions

What only the company can do to finish this work, most important first.

1. **Turn on the contact form.** In Vercel → Project → Settings → Environment
   Variables, set `RESEND_API_KEY` and `CONTACT_FROM` (and `CONTACT_TO` if
   enquiries should go somewhere other than the Gmail address). `CONTACT_FROM`
   must be on a domain verified in Resend, which means adding Resend's DNS
   records to `nytsoftwaresolution.pro.et`. Redeploy, then send a real test
   enquiry. Until then the form honestly falls back to an email draft. See
   README → "Contact form".
2. **Rotate the published demo password** on any system where
   `guest@nyt.com` / `guest123` exists.
3. **Confirm or withdraw the attributed figures** in the table above, and
   confirm testimonial permissions. Resolve the Merkato88 quote.
4. **Settle the Saron attribution** ("Powered by Syntax Software Solution").
5. **Supply verified details:** the LinkedIn company page and a business phone
   (`linkedin` and `phone` in `src/data/site.ts`), and team members who have
   agreed to be listed (`team`). Each appears automatically once set.
6. **Review the legal pages.** `/privacy/` describes what the site actually does;
   confirm the retention statement, and add the governing law and jurisdiction
   to `/terms/`.
7. **If a public product demo is wanted,** run it as a separate demo
   environment: synthetic data only, a read-only role with no admin access and
   no path to production databases, session expiry, rate limiting, and an
   automatic data reset. Link it from the case study or product page only once
   it exists.
8. **Consider an address on the company domain** (e.g. `hello@nytsoftwaresolution.pro.et`)
   instead of Gmail — it is the first thing an international client checks.
