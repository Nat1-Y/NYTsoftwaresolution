export interface Engagement {
  title: string;
  audience: string;
  description: string;
  featured?: boolean;
  meta: { label: string; value: string }[];
  includes: string[];
  cta: string;
}

/**
 * Engagement models rather than fixed prices — it qualifies leads without
 * publishing numbers that go stale or undercut a bespoke quote.
 */
export const engagements: Engagement[] = [
  {
    title: 'Fixed-Scope Project',
    audience: 'For a defined system with clear requirements',
    description:
      'We scope the work, agree a price and a delivery date, and build to it. Payment is staged against milestones you sign off.',
    meta: [
      { label: 'Typical timeline', value: '3 weeks – 3 months' },
      { label: 'Billing', value: 'Milestone-based' },
      { label: 'Best for', value: 'POS, booking, MVPs' },
    ],
    includes: [
      'Written scope & architecture document',
      'Clickable UI prototype before development',
      'Staged milestone demos',
      'Source code + deployment handover',
      'Post-launch warranty period',
    ],
    cta: 'Scope a project',
  },
  {
    title: 'Dedicated Engineering Team',
    audience: 'For companies scaling technical capacity',
    description:
      'One or more of our engineers work as an extension of your team — your standups, your board, your repository, your review process.',
    featured: true,
    meta: [
      { label: 'Typical timeline', value: 'Monthly, rolling' },
      { label: 'Billing', value: 'Per engineer / month' },
      { label: 'Best for', value: 'Remote partners abroad' },
    ],
    includes: [
      'Engineers dedicated to your backlog',
      'Overlap hours with your timezone',
      'Weekly written progress reports',
      'Your version control & CI standards',
      'Scale the team up or down monthly',
    ],
    cta: 'Discuss a team',
  },
  {
    title: 'Platform & Support Retainer',
    audience: 'For systems already running in production',
    description:
      'Ongoing maintenance for software we built or inherited — monitoring, fixes, database health and incremental features as your business changes.',
    meta: [
      { label: 'Typical timeline', value: 'Ongoing' },
      { label: 'Billing', value: 'Monthly retainer' },
      { label: 'Best for', value: 'Live ERP / SaaS' },
    ],
    includes: [
      'Agreed response times for incidents',
      'Over-the-air fixes and updates',
      'Database backups & health checks',
      'A monthly pool of feature hours',
      'Capacity and scaling reviews',
    ],
    cta: 'Arrange support',
  },
];
