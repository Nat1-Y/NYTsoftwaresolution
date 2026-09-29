export interface Testimonial {
  initials: string;
  quote: string;
  org: string;
  context: string;
  /**
   * A named person with a job title is far more persuasive than an org name.
   * Fill this in as clients approve attribution — see README → "Testimonials".
   */
  person?: { name: string; role: string };
  /** The case study this quote is about — its file name in src/content/case-studies. */
  caseStudy?: string;
}

export const testimonials: Testimonial[] = [
  {
    initials: 'FS',
    quote:
      'The Fikrekun Spagna system transformed how we manage our multi-branch operations. Inventory leaks are gone and our COGS reports are now real-time. NYT delivered exactly what we needed.',
    org: 'Fikrekun Spagna',
    context: 'Restaurant & Butchery Network, Addis Ababa',
    caseStudy: 'fikrekun-spagna',
  },
  {
    initials: 'SO',
    quote:
      'Patient management is now seamless. Appointment queues, billing and device inventory sit in one place, and the system handles thousands of records without downtime.',
    org: 'Saron Orthopedic Center',
    context: 'Healthcare ERP Client, Addis Ababa',
    caseStudy: 'saron-orthopedic',
  },
  {
    initials: 'BP',
    quote:
      'Our ticketing system handles 5,000+ daily QR validations without a single failure. Duplicate-entry attempts dropped to zero on day one.',
    org: 'Bora Amusement Park',
    context: 'High-Throughput Ticketing Client',
    caseStudy: 'bora-ticketing',
  },
  {
    initials: 'M8',
    quote:
      'Merkato88 gave 150+ local merchants a professional digital storefront. The platform is fast and intuitive, and our month-on-month vendor growth is up since launch.',
    org: 'Merkato88 Marketplace',
    context: 'Multi-Vendor E-Commerce Platform',
    caseStudy: 'merkato88',
  },
];
