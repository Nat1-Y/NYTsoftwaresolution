/**
 * Single source of truth for company-wide facts.
 * Everything the site says about NYT lives here, not scattered through markup.
 */

export const site = {
  name: 'NYT Software Solutions',
  legalName: 'NYT Software Solutions PLC',
  shortName: 'NYT',
  /**
   * The live domain. Canonical URLs, Open Graph, structured data, the sitemap
   * and robots.txt all derive from this (and `site` in astro.config.mjs) —
   * they previously pointed at www.nytsoftwaresolutions.com, which does not
   * resolve, so search engines were being told the real pages were copies of
   * a page that did not exist.
   */
  url: 'https://nytsoftwaresolution.pro.et',
  tagline: 'Enterprise-Grade Engineering. Local Operational Excellence.',
  description:
    'NYT Software Solutions designs, develops and deploys high-availability custom software, SaaS platforms, ERPs and mobile apps — serving businesses in Ethiopia and engineering teams worldwide.',
  email: 'nytsoftwaresolutionplc@gmail.com',
  github: 'https://github.com/Nat1-Y',
  /**
   * Verified profiles only. Leave empty until the account exists and is
   * checked — an empty value hides the link everywhere rather than showing a
   * placeholder or a link to an unrelated page.
   */
  linkedin: '' as string,
  /** A verified business phone number, in international format. */
  phone: '' as string,
  locality: 'Addis Ababa',
  country: 'Ethiopia',
  countryCode: 'ET',
  founded: '2023',
  timezone: 'EAT (UTC+3)',
} as const;

/**
 * Contact-form delivery.
 *
 * The form posts to the site's own function (api/contact.js), which holds the
 * email-provider key server-side. Nothing secret belongs in this file — it
 * ships to every visitor. See README → "Contact form".
 *
 * If the function is not configured yet (or not reachable, as under
 * `astro preview`), the form says so and falls back to a pre-filled email
 * draft, so a lead is never silently dropped.
 */
export const formConfig = {
  endpoint: '/api/contact',
} as const;

/** The options the form offers. Must match OPTIONS in api/_lib/enquiry.js. */
export const formOptions = {
  subject: [
    'Custom ERP / SaaS platform',
    'Restaurant / POS system',
    'Healthcare system',
    'E-commerce / marketplace',
    'NYT Cafe Manager demo',
    'Remote developer partnership',
    'Free consultation call',
    'Other inquiry',
  ],
  budget: ['Under $5,000', '$5,000–$15,000', '$15,000–$50,000', 'Over $50,000', 'Not sure yet'],
  timeline: ['As soon as possible', 'Within 1–3 months', 'Within 3–6 months', 'Flexible / exploring'],
} as const;

/** `hint` is the one-line description the phone menu shows under each label. */
export const nav = [
  { href: '#about', label: 'Who We Are', icon: 'globe', hint: 'Company, facts & guarantees' },
  { href: '#services', label: 'What We Do', icon: 'layers', hint: 'ERP, POS, healthcare, commerce' },
  { href: '#projects', label: 'Case Studies', icon: 'briefcase', hint: 'Four systems we built' },
  { href: '#flagship', label: 'Flagship', icon: 'pos', hint: 'NYT Cafe Manager' },
  { href: '#ecosystem', label: 'Tech Ecosystem', icon: 'code', hint: 'The stack we work in' },
  { href: '#engagement', label: 'Engagement', icon: 'clock', hint: 'Three ways to work together' },
  { href: '#blueprint', label: 'Blueprint', icon: 'sparkle', hint: 'Scope your build in 30 seconds' },
] as const;

/**
 * The four figures under the hero. Each carries where it comes from — see
 * docs/claims-register.md for the full list and what still needs confirming.
 *
 * "100% Cloud Native / Scalable" was removed: a percentage of nothing in
 * particular is not a measurement. It is replaced by a count a visitor can
 * check on the page itself.
 */
export const heroStats = [
  // Company records — confirm the count before relying on it (claims register).
  { value: 20, suffix: '+', label: 'Projects Delivered' },
  // Company records — confirm (claims register).
  { value: 8, suffix: '+', label: 'Industries Served' },
  // Verifiable on this page: the ecosystem lists 22.
  { value: 20, suffix: '+', label: 'Technologies Managed' },
  // Verifiable on this page.
  { value: 4, suffix: '', label: 'Case Studies Below' },
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

/**
 * The people behind the company, shown in "Who We Are" once filled in.
 *
 * Empty on purpose: nobody is listed until they have agreed to be, and only
 * with their real role. Mark contractors and partners as such — the page
 * labels them separately from employees. A photo is optional; without one the
 * entry is set as type, never as a stock portrait.
 *
 *   { name: 'Full Name', role: 'Technical Lead', type: 'employee',
 *     summary: 'One or two factual sentences.', linkedin: 'https://…' }
 */
export interface TeamMember {
  name: string;
  role: string;
  type: 'employee' | 'contractor' | 'partner';
  summary?: string;
  linkedin?: string;
}

export const team: TeamMember[] = [];
