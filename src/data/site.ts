/**
 * Single source of truth for company-wide facts.
 * Everything the site says about NYT lives here, not scattered through markup.
 */

export const site = {
  name: 'NYT Software Solutions',
  legalName: 'NYT Software Solutions PLC',
  shortName: 'NYT',
  /** Update to the real domain once it is linked, then rebuild. */
  url: 'https://www.nytsoftwaresolutions.com',
  tagline: 'Enterprise-Grade Engineering. Local Operational Excellence.',
  description:
    'NYT Software Solutions designs, develops and deploys high-availability custom software, SaaS platforms, ERPs and mobile apps — serving businesses in Ethiopia and engineering teams worldwide.',
  email: 'nytsoftwaresolutionplc@gmail.com',
  github: 'https://github.com/Nat1-Y',
  locality: 'Addis Ababa',
  country: 'Ethiopia',
  countryCode: 'ET',
  founded: '2023',
  timezone: 'EAT (UTC+3)',
} as const;

/**
 * Contact-form delivery.
 *
 * `endpoint` is intentionally empty. Until you paste a real one in, the form
 * does NOT pretend to send — it falls back to a pre-filled email draft so a
 * lead is never silently dropped. See README → "Wiring up the contact form".
 *
 * Works with any service that accepts a JSON POST, e.g.:
 *   Web3Forms  https://api.web3forms.com/submit   (add `accessKey`)
 *   Formspree  https://formspree.io/f/xxxxxxxx
 *   Getform / Basin / your own /api/contact route
 */
export const formConfig = {
  endpoint: '',
  accessKey: '',
} as const;

/**
 * Intro splash timing.
 *
 * `minMs` is a deliberate hold — the loader stays up at least this long even
 * when the page is ready sooner. `maxMs` is a hard ceiling so a slow asset can
 * never strand a visitor on the splash.
 *
 * Note this is an intentional delay, not a measurement of load time: the site
 * itself is ready in well under a second. Longer holds increase bounce rate,
 * so treat these numbers as a branding choice with a real conversion cost.
 * Set `minMs: 0` to show the page as soon as it is ready.
 */
export const loader = {
  minMs: 5000,
  maxMs: 7000,
} as const;

export const nav = [
  { href: '#about', label: 'Who We Are' },
  { href: '#services', label: 'What We Do' },
  { href: '#projects', label: 'Case Studies' },
  { href: '#flagship', label: 'Flagship' },
  { href: '#ecosystem', label: 'Tech Ecosystem' },
  { href: '#engagement', label: 'Engagement' },
] as const;

export const heroStats = [
  { value: 20, suffix: '+', label: 'Projects Delivered' },
  { value: 8, suffix: '+', label: 'Industries Served' },
  { value: 20, suffix: '+', label: 'Technologies Managed' },
  { value: 100, suffix: '%', label: 'Cloud Native / Scalable' },
] as const;

/** Copy that swaps when the visitor changes persona. */
export const personaCopy = {
  business: {
    badge: 'Serving Clients Worldwide | Based in Ethiopia',
    heroSubtitle:
      'We build robust, secure and highly scalable software. From hospital ERP systems and offline-first retail POS networks to multi-vendor marketplaces, we align technical depth with real business outcomes.',
    servicesSubtitle:
      'Enterprise software built to automate operations, eliminate data leaks and accelerate business growth.',
  },
  tech: {
    badge: 'Remote Engineering Partner | Agile & Fluent English',
    heroSubtitle:
      'Enterprise-grade engineering for scalable cloud networks. Specialising in schema-isolated multi-tenancy, background workers, offline-resilient local caches and optimised API design.',
    servicesSubtitle:
      'Vetted frameworks, modular components and structured logic layers built to international engineering standards.',
  },
} as const;

export const trustSignals = [
  { icon: 'shield', text: 'Encrypted data at rest & in transit' },
  { icon: 'git', text: 'Full source-code ownership handover' },
  { icon: 'clock', text: 'Post-launch warranty period included' },
  { icon: 'globe', text: 'Timezone-adapted collaboration' },
  { icon: 'doc', text: 'Documented APIs & runbooks' },
] as const;
