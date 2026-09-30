---
order: 3
name: Bora Amusement Park
category: Instant Payments & Booking
tagline: High-Performance QR Entrance & Queue Management System
liveUrl: https://boraticketing.vercel.app/
liveLabel: Live Ticket System
deployment:
  state: production
  checked: 29 Sep 2026
  note: The public booking site was reachable when checked.
overview: >-
  Online ticketing and gate control for an amusement park in Addis Ababa.
  Visitors buy tickets on the web; staff scan a QR code at the entrance, and the
  park's operators see gate traffic as it happens.
challenge: >-
  Entry was checked by hand against paper receipts, which was slow at busy
  times and left the gate open to duplicate tickets. The technical problem underneath is concurrency, not
  scale: two gates scanning the same forged or copied QR code within
  milliseconds must produce exactly one admission.
solution:
  - QR tickets issued online and validated by an instant scan at the gate.
  - Redemption inside a database transaction that locks the ticket row before flipping its state, so a duplicate is rejected at the point of scan.
  - QR tokens validated against the issuing API by webhook.
  - An operations dashboard with live charts of peak visiting windows and gate throughput.
stack:
  - Next.js
  - Vercel (static path caching)
  - Transactional row locks (SELECT … FOR UPDATE)
  - Webhook token validation
status:
  label: Scale
  value: 5k+ Daily Validations
  variant: visitor
business:
  metric:
    value: 100%
    description: Digitised entrance gate lifecycle
    source: All gate entries now issue and validate through the platform.
  bullets:
    - title: Zero bottlenecks
      text: Replaces manual receipt verification with an instant QR scan at the gate.
    - title: Revenue protection
      text: Duplicate-ticket attempts are rejected at the point of scan.
    - title: Operations dashboard
      text: Live charts showing peak visitation windows and gate throughput.
tech:
  specs:
    - label: Frontend
      value: Next.js on Vercel with static path caching
    - label: Concurrency Guard
      value: Atomic transaction locks on ticket redemption
    - label: Integrations
      value: Webhook validation of QR tokens against the issuing API
  narrative: >-
    The interesting problem here is concurrency, not scale. Two gates scanning
    the same forged QR code within milliseconds must produce exactly one
    admission, so redemption runs inside a database transaction that locks the
    ticket row before flipping its state.
  diagram: ticketing
plain: >-
  We built their ticketing system. Over 5,000 tickets are scanned every day
  without issues.
---

Ticketing looks simple until you consider **double-spend at the gate**. The
redemption path is deliberately the slowest thing in the system — a serialised
row lock — because correctness at the turnstile matters more than shaving
twenty milliseconds off a scan.
