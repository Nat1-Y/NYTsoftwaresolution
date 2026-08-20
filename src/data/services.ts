export interface Service {
  icon: string;
  title: string;
  items: string[];
}

export const services: Service[] = [
  {
    icon: 'layers',
    title: 'Enterprise ERP & SaaS',
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
