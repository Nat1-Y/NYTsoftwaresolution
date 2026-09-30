---
order: 1
name: Fikrekun Spagna System
category: Multi-Branch Retail & Food Service
tagline: Multi-Tenant Point-of-Sale & Live Inventory Engine
deployment:
  state: delivered
  checked: 29 Sep 2026
  note: The earlier public demo address no longer responds, so there is no link to open here. A walkthrough can be arranged on request.
overview: >-
  A point-of-sale and inventory system for a restaurant and butchery business
  in Addis Ababa with more than one branch. Staff take orders at the till, and
  the system follows the stock each order uses from the storage butchery to the
  guest's table, reporting the cost of goods sold as it happens.
challenge: >-
  Two problems at once. Stock was leaking between the butchery, the kitchen and
  the branches, and reconciling it was manual work. And the connection could not
  be relied on: a point of sale that stops taking orders when the network drops
  is worse than a paper notebook.
solution:
  - Offline-first ordering — every sale is written to a local queue on the device first, with an idempotency key, and synchronised when the connection returns.
  - Ingredient tracking from the storage butchery through the kitchen to the guest table.
  - Branch synchronisation, so stock levels do not drift apart between locations.
  - Real-time cost-of-goods-sold reporting for the owners.
  - A separate database schema per tenant, so one client's data can never be read across a tenant boundary.
  - Over-the-air updates that reload the application without downtime.
stack:
  - Offline-first web client (service worker)
  - IndexedDB local replica
  - Batch sync with idempotency keys
  - Schema-per-tenant database
  - Over-the-air updates
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
