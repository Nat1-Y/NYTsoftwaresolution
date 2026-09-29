export interface Service {
  icon: string;
  title: string;
  /** What the drawing at the head of the column shows, for its alt text. */
  art: string;
  items: string[];
}

export const services: Service[] = [
  {
    icon: 'layers',
    title: 'Enterprise ERP & SaaS',
    art: 'three stacked tenant schemas beside a ledger of costs and a bar chart',
    items: [
      'Multi-tenant architectures',
      'Inventory & COGS tracking',
      'Role-based access control (RBAC)',
      'Financial dashboard systems',
    ],
  },
  {
    icon: 'pos',
    title: 'Hospitality & POS',
    art: 'a point-of-sale till sending tickets to a kitchen rail',
    items: [
      'Restaurant POS networks',
      'Kitchen display systems (KDS)',
      'Offline-first operations',
      'Automatic cloud synchronisation',
    ],
  },
  {
    icon: 'health',
    title: 'Healthcare Systems',
    art: 'an appointment schedule beside a patient record guarded by a padlocked shield',
    items: [
      'Patient record databases',
      'Doctor & appointment portals',
      'Laboratory & billing workflow',
      'Encrypted, audit-logged APIs',
    ],
  },
  {
    icon: 'cart',
    title: 'E-Commerce & Logistics',
    art: 'a grid of product cards and a delivery route from a shop to a map pin',
    items: [
      'Multi-vendor marketplaces',
      'Vendor portals & catalogues',
      'Image optimisation pipelines',
      'Payment & ledger integration',
    ],
  },
];

export const benefits = [
  'Modern UI/UX',
  'Secure architecture',
  'Multi-tenant SaaS',
  'Client offline sync',
  'OTA live updates',
  'Cloud-native deployment',
  'Documented API specs',
  'Enterprise support',
];
