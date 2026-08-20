---
order: 1
name: Fikrekun Spagna System
category: Multi-Branch Retail & Food Service
tagline: Multi-Tenant Point-of-Sale & Live Inventory Engine
liveUrl: https://fikrekunspagna22a.vanguardxie.com/login
liveLabel: Live System
demo:
  email: guest@nyt.com
  password: guest123
business:
  metric:
    value: 85%
    description: Reduction in manual reconciliation time
    source: Reported by Fikrekun Spagna operations after the first full quarter.
  bullets:
    - title: Eliminates inventory leaks
      text: Tracks ingredients from the storage butchery through the kitchen to the guest table.
    - title: Coordinates branch orders
      text: Multi-branch synchronisation prevents stock mismatches between locations.
    - title: Protects margins
      text: Real-time reporting on dynamic Cost of Goods Sold (COGS).
tech:
  specs:
    - label: Architecture
      value: Schema-isolated database multi-tenancy
    - label: Hot Updates
      value: Over-the-air (OTA) zero-downtime reloading
    - label: Offline Engine
      value: IndexedDB caching & batch synchronisation
  narrative: >-
    Engineered to scale horizontally. Each tenant gets an isolated schema so one
    client's data can never be read across a tenant boundary, while a service
    worker maintains a local IndexedDB replica — the point of sale keeps taking
    orders through a network dropout and reconciles automatically on reconnect.
  diagram: multitenant
plain: >-
  A restaurant and butchery in Addis Ababa. We built their ordering and
  inventory system, so no more lost receipts or stock problems.
---

The hardest constraint was **network reliability**. A point of sale that stops
taking orders when the connection drops is worse than a paper notebook, so the
write path was designed offline-first from day one: every transaction lands in a
local queue, gets an idempotency key, and syncs when the link returns.
