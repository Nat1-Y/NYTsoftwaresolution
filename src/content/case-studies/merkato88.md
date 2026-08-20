---
order: 4
name: Merkato88 Marketplace
category: Multi-Vendor E-Commerce
tagline: High-Scale Local E-Commerce Consumer Directory
liveUrl: https://merkato88.com/
liveLabel: Live Marketplace
status:
  label: Sellers
  value: 150+ Local Merchants
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
  An online marketplace with over 150 local shops selling their products.
---

Most of the engineering budget went to **image delivery**. On a mobile-first
market, an unoptimised product photo is the difference between a sale and a
bounce, so uploads are normalised, re-encoded and served in responsive sizes.
