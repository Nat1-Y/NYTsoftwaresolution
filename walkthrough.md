# Walkthrough

A tour of the site for anyone picking up the codebase.

---

## The idea

One page, two audiences — and a logo with exactly two colours to serve them.

A restaurant owner in Addis Ababa and a CTO hiring a remote team want
completely different things from the same company. Rather than write for the
average of the two and satisfy neither, the page has a **persona switcher**.

The logo is navy `#0F2350` with a blue `#2176FF` triangle. Those two colours
can be arranged two ways, and each way suits one audience:

| | Business Operations | Engineering & Tech Depth |
| --- | --- | --- |
| Navy is… | the ink | the ground |
| Page | White, soft shadows | Deep navy, glowing borders |
| Register | Corporate vendor | Technical / IDE |
| Hero copy | Outcomes and operations | Architecture and stack |
| Case studies | Business impact + metric | Specs, narrative, architecture diagram |

So the toggle is not a colour preference — it is the same brand shown from
the side that matters to whoever is looking.

The choice is stored in `localStorage` and applied by an inline script in
`<head>`, so a returning visitor never sees the wrong theme flash first.

---

## Journey through the page

1. **Header** — fixed nav, plus a ⌘K / Ctrl+K command palette for keyboard users.
2. **Persona switcher** — a real ARIA tablist; arrow keys work.
3. **Hero** — headline, two CTAs, four animated stat counters.
4. **Who We Are** — positioning, plus a trust bar (encryption, code ownership,
   warranty, timezone overlap, documentation).
5. **What We Do** — four service pillars and a benefits grid.
6. **Case Studies** — four production systems. Each card has a live link, and
   tabs for *Business Impact* (headline metric with its source) and *Technical
   Depth* (specs, narrative, and an inline SVG architecture diagram).
7. **Flagship** — NYT Cafe Manager with a CSS-rendered dashboard mockup.
8. **Tech Ecosystem** — 22 technologies, filterable by category.
9. **Process** — seven steps from discovery to support.
10. **Remote Partner Services** — the pitch for international clients.
11. **How We Work Together** — three engagement models, so leads self-qualify
    before they ever fill in the form.
12. **Blueprint Studio** — four answers in, and the page draws the architecture
    we would propose, splits the calendar into phases, and writes a brief that
    drops straight into the contact form.
13. **Testimonials** — auto-rotating carousel that pauses on hover and focus.
14. **FAQ** — eight straight answers; also feeds Google's FAQ rich result.
15. **Contact** — details panel plus a validating form.
16. **Chat assistant** — answers common questions from a scored intent matcher.

---

## Things worth knowing

### The contact form will not lie

If no form backend is configured, the form does **not** claim to have sent
anything. It validates the input, then offers a pre-filled email draft and a
copy-to-clipboard button. Once an endpoint is set in `src/data/site.ts` it
posts for real — and a failed request is reported as a failure.

This replaced a `setTimeout` that always displayed "your request has been
received" while sending nothing anywhere.

### The chatbot admits what it doesn't know

Intents are scored, with multi-word phrases weighted above single keywords and
a minimum threshold to fire. Below the threshold it says it can't answer
reliably and points at a human. The previous version matched the first keyword
it found anywhere in the message — and because one entry listed `'do'` and
`'what'`, nearly every question returned the same answer.

### Numbers carry their source

Every case-study metric has an optional `source` line rendered under it.
"85% — reported by Fikrekun Spagna operations after the first full quarter"
survives scrutiny in a way that a bare "85%" does not.

### The estimator refuses to name a price

The Blueprint Studio knows four facts about a project. That is enough to
propose a shape and a calendar; it is nowhere near enough to put a number on
an invoice. So it gives a duration **range** — widening with the size of the
job, because a twenty-week estimate is not as knowable as a six-week one — and
says on screen that this is a shape, not a quote.

A visitor who plans their year around a figure we guessed has been worse served
than one we asked to get in touch. The smoke suite asserts the absence: if a
currency symbol ever appears in that panel, the build fails.

### Accessibility is tested, not assumed

`npm run a11y` runs axe-core over six states: both personas, the technical
tabs, the chat assistant, the command palette, and mobile with the menu open.
Zero serious or critical violations.

Along the way this caught real problems: muted text at 3.07:1 contrast, the
architecture diagrams being scrollable but not keyboard-reachable, and floating
controls sitting outside every landmark.

### It works offline

A service worker serves pages network-first and falls back to a cached copy,
with a dedicated `/offline` page. Fitting, for a company that sells
offline-first point-of-sale systems.

---

## Bugs found in the previous version

Recorded because they are easy to reintroduce:

| Bug | Effect |
| --- | --- |
| `.mobile-nav-menu` was `display:none` and `.active` only changed transform/opacity | The mobile menu never opened at all |
| Contact form was a `setTimeout` with a hardcoded success message | Every lead was silently discarded |
| No `scroll-margin` under a fixed header | Every anchor link landed under the nav |
| Loader held the page 1.6s *after* `load` | Deliberately slowed a fast site |
| Chatbot matched `'do'` / `'what'` first | Almost every question got the services blurb |
| `repeat(2, 1fr)` with unbreakable card text | Horizontal overflow on phones |
| `--text-muted: #64748b` | Failed WCAG AA on every card surface |
| Carousel slides were reveal-animated | Slides 2–4 sat at opacity 0 until an 8s timer; clicking "next" showed a blank card |
| Footer kept light-theme ink on its navy panel | Navy text on navy — three separate elements unreadable |

---

## Running it

```bash
npm install
npm run dev

# and to verify
npm run build && npm run preview   # terminal 1
npm run smoke && npm run a11y && npm run csp   # terminal 2
```
