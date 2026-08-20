---
order: 3
name: Bora Amusement Park
category: Instant Payments & Booking
tagline: High-Performance QR Entrance & Queue Management System
liveUrl: https://boraticketing.vercel.app/
liveLabel: Live Ticket System
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
