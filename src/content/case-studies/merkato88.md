---
order: 4
name: Merkato88 Marketplace
category: Multi-Vendor E-Commerce
tagline: High-Scale Local E-Commerce Consumer Directory
liveUrl: https://merkato88.com/
liveLabel: Live Marketplace
deployment:
  state: production
  checked: 29 Sep 2026
  note: The public marketplace was reachable when checked; its home page listed 50+ active sellers.
overview: >-
  A multi-vendor marketplace where local sellers list goods and services and
  buyers browse, filter and get in touch — with a dashboard for each seller to
  manage their own listings and orders.
challenge: >-
  The traffic is read-heavy and mostly on phones, often over slow connections.
  One busy storefront must not slow down the rest of the marketplace, and an
  unoptimised product photo on a mobile connection is the difference between a
  sale and a bounce.
solution:
  - A dashboard for every seller to manage their own listings and orders.
  - Live filtering of the catalogue by category, price and region.
  - A checkout and payment flow tuned for mobile.
  - Hot catalogue reads served from a Redis cache, with the database as the source of truth.
  - Seller photo uploads re-encoded to WebP by a background worker, off the request path, and served in responsive sizes.
  - Indexed search queries.
stack:
  - Redis
  - PostgreSQL
  - Background media worker (WebP)
  - Indexed search
status:
  label: Sellers
  value: 50+ Active
  variant: active-vendors
business:
  metric:
    value: +40%
    description: Growth in merchant month-on-month conversions
    source: Platform analytics, comparing the two quarters after launch.
  bullets:
    - title: Vendor empowerment
      text: Every local store gets a dashboard to manage its own listings and orders.
    - title: Low-friction checkout
      text: Localised payment flow tuned for mobile conversion.
    - title: Smart catalogues
      text: Live filtering by category, price and region.
tech:
  specs:
    - label: Caching Engine
      value: Redis keyspace strategy for product and catalogue reads
    - label: Asset Pipeline
      value: Background service converting uploads to WebP
    - label: Search
      value: Indexed queries returning in double-digit milliseconds
  narrative: >-
    Built for read-heavy traffic on mobile connections. Merchant photo uploads
    are re-encoded to WebP by a background worker rather than on the request
    path, and hot catalogue reads are served from Redis so a traffic spike on
    one storefront does not degrade the rest of the marketplace.
  diagram: marketplace
plain: >-
  An online marketplace where local sellers list their goods and services, each
  with their own dashboard.
---

Most of the engineering budget went to **image delivery**. On a mobile-first
market, an unoptimised product photo is the difference between a sale and a
bounce, so uploads are normalised, re-encoded and served in responsive sizes.
