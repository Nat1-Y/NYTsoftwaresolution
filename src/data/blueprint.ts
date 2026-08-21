/**
 * Blueprint Studio — the scoping model.
 *
 * Everything the estimator knows lives here. The rules it follows:
 *
 *   1. It estimates *calendar time and shape*, never price. We do not know a
 *      visitor's constraints well enough to put a number on their invoice, and
 *      a made-up figure is worse than no figure. Cost is a conversation.
 *   2. Every duration is a range, because a single number implies a precision
 *      nobody has before discovery.
 *   3. The architecture it draws is the one we would actually propose — the
 *      nodes below are the same building blocks used in the case studies.
 */

/** Columns of the generated diagram, left to right. */
export type Layer = 'client' | 'edge' | 'service' | 'data' | 'external';

export const layerLabels: Record<Layer, string> = {
  client: 'Clients',
  edge: 'Edge / API',
  service: 'Services',
  data: 'Data',
  external: 'Integrations',
};

export const layerOrder: Layer[] = ['client', 'edge', 'service', 'data', 'external'];

export interface BlueprintNode {
  id: string;
  label: string;
  layer: Layer;
  /** Shown under the label inside the node. Keep it to two or three words. */
  note?: string;
}

export interface SystemType {
  id: string;
  label: string;
  blurb: string;
  icon: string;
  /** Weeks for the system itself, before modules and scale. */
  baseWeeks: number;
  nodes: BlueprintNode[];
  /** Modules ticked on the visitor's behalf — the ones this system implies. */
  defaults: string[];
}

export interface Module {
  id: string;
  label: string;
  blurb: string;
  weeks: number;
  nodes: BlueprintNode[];
}

export interface Scale {
  id: string;
  label: string;
  blurb: string;
  /** Multiplies the summed build weeks. */
  multiplier: number;
  nodes: BlueprintNode[];
}

export interface Pace {
  id: string;
  label: string;
  blurb: string;
  /** Multiplies calendar weeks — more people compress the calendar, not the work. */
  factor: number;
  team: string;
}

/* ------------------------------------------------------------- systems --- */

export const systemTypes: SystemType[] = [
  {
    id: 'pos',
    label: 'Retail / restaurant POS',
    blurb: 'Tills, kitchen tickets and stock that keep working when the line drops.',
    icon: 'pos',
    baseWeeks: 9,
    defaults: ['offline', 'inventory', 'reporting'],
    nodes: [
      { id: 'till', label: 'POS terminal', layer: 'client', note: 'offline-first' },
      { id: 'kds', label: 'Kitchen display', layer: 'client' },
      { id: 'orders', label: 'Order service', layer: 'service' },
      { id: 'db', label: 'Primary database', layer: 'data', note: 'PostgreSQL' },
    ],
  },
  {
    id: 'erp',
    label: 'Custom ERP',
    blurb: 'One system of record for operations, people, stock and finance.',
    icon: 'briefcase',
    baseWeeks: 14,
    defaults: ['roles', 'reporting', 'inventory'],
    nodes: [
      { id: 'web', label: 'Admin web app', layer: 'client' },
      { id: 'api', label: 'REST / RPC API', layer: 'edge' },
      { id: 'domain', label: 'Domain services', layer: 'service' },
      { id: 'db', label: 'Primary database', layer: 'data', note: 'PostgreSQL' },
    ],
  },
  {
    id: 'saas',
    label: 'Multi-tenant SaaS',
    blurb: 'One product, many customers, each of them isolated from the rest.',
    icon: 'layers',
    baseWeeks: 16,
    defaults: ['roles', 'payments', 'reporting'],
    nodes: [
      { id: 'web', label: 'Web client', layer: 'client' },
      { id: 'gateway', label: 'API gateway', layer: 'edge', note: 'auth + rate limit' },
      { id: 'app', label: 'Application services', layer: 'service' },
      { id: 'tenantdb', label: 'Tenant database', layer: 'data', note: 'schema-isolated' },
    ],
  },
  {
    id: 'marketplace',
    label: 'Multi-vendor marketplace',
    blurb: 'Vendors, listings, orders and payouts — with the moderation to match.',
    icon: 'cart',
    baseWeeks: 15,
    defaults: ['payments', 'notifications', 'roles'],
    nodes: [
      { id: 'store', label: 'Storefront', layer: 'client' },
      { id: 'vendor', label: 'Vendor console', layer: 'client' },
      { id: 'gateway', label: 'API gateway', layer: 'edge' },
      { id: 'catalog', label: 'Catalogue & orders', layer: 'service' },
      { id: 'db', label: 'Primary database', layer: 'data' },
    ],
  },
  {
    id: 'mobile',
    label: 'Mobile application',
    blurb: 'Android and iOS from one codebase, with a backend built to match.',
    icon: 'pos',
    baseWeeks: 10,
    defaults: ['notifications', 'offline'],
    nodes: [
      { id: 'app', label: 'Mobile app', layer: 'client', note: 'Android + iOS' },
      { id: 'api', label: 'Mobile API', layer: 'edge' },
      { id: 'svc', label: 'Backend services', layer: 'service' },
      { id: 'db', label: 'Primary database', layer: 'data' },
    ],
  },
];

/* ------------------------------------------------------------- modules --- */

export const modules: Module[] = [
  {
    id: 'offline',
    label: 'Offline resilience',
    blurb: 'Local cache and a sync queue, so a dropped connection is a non-event.',
    weeks: 3,
    nodes: [
      { id: 'localcache', label: 'Local cache', layer: 'client', note: 'write-ahead queue' },
      { id: 'sync', label: 'Sync engine', layer: 'service', note: 'conflict resolution' },
    ],
  },
  {
    id: 'payments',
    label: 'Payments & billing',
    blurb: 'Checkout, reconciliation and an audit trail that survives a dispute.',
    weeks: 3,
    nodes: [
      { id: 'billing', label: 'Billing service', layer: 'service' },
      { id: 'psp', label: 'Payment provider', layer: 'external' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory & stock control',
    blurb: 'Stock levels, transfers and wastage tracked per location.',
    weeks: 3,
    nodes: [{ id: 'stock', label: 'Inventory service', layer: 'service' }],
  },
  {
    id: 'reporting',
    label: 'Reporting & dashboards',
    blurb: 'The numbers owners actually check, exportable and scheduled.',
    weeks: 2,
    nodes: [
      { id: 'reports', label: 'Reporting service', layer: 'service' },
      { id: 'warehouse', label: 'Analytics store', layer: 'data', note: 'read-optimised' },
    ],
  },
  {
    id: 'roles',
    label: 'Roles, permissions & audit',
    blurb: 'Who may do what, and an immutable record of who did.',
    weeks: 2,
    nodes: [
      { id: 'authz', label: 'Auth & policy', layer: 'edge' },
      { id: 'audit', label: 'Audit log', layer: 'data', note: 'append-only' },
    ],
  },
  {
    id: 'mobileapp',
    label: 'Companion mobile app',
    blurb: 'A phone client for staff or customers, sharing the same API.',
    weeks: 4,
    nodes: [{ id: 'companion', label: 'Companion app', layer: 'client', note: 'Android + iOS' }],
  },
  {
    id: 'integrations',
    label: 'Third-party integrations',
    blurb: 'Accounting, logistics, telecom or whatever you already run.',
    weeks: 2,
    nodes: [
      { id: 'connector', label: 'Integration workers', layer: 'service', note: 'retry + backoff' },
      { id: 'thirdparty', label: 'External systems', layer: 'external' },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    blurb: 'SMS, email and push, queued so a slow provider never blocks a request.',
    weeks: 2,
    nodes: [
      { id: 'queue', label: 'Job queue', layer: 'service', note: 'background workers' },
      { id: 'gateways', label: 'SMS / email / push', layer: 'external' },
    ],
  },
];

/* --------------------------------------------------------------- scale --- */

export const scales: Scale[] = [
  {
    id: 'single',
    label: 'One site or team',
    blurb: 'A single location, one set of books.',
    multiplier: 1,
    nodes: [],
  },
  {
    id: 'multi',
    label: 'Several branches',
    blurb: 'Multiple locations rolling up to one head office.',
    multiplier: 1.25,
    nodes: [{ id: 'branchsync', label: 'Branch sync gateway', layer: 'edge' }],
  },
  {
    id: 'national',
    label: 'National / many customers',
    blurb: 'Tenant isolation, replicas and capacity to grow into.',
    multiplier: 1.55,
    nodes: [
      { id: 'router', label: 'Tenant router', layer: 'edge' },
      { id: 'replica', label: 'Read replica', layer: 'data' },
    ],
  },
];

/* ---------------------------------------------------------------- pace --- */

export const paces: Pace[] = [
  {
    id: 'steady',
    label: 'Steady',
    blurb: 'One focused squad, predictable burn.',
    factor: 1,
    team: '2–3 engineers plus a lead',
  },
  {
    id: 'accelerated',
    label: 'Accelerated',
    blurb: 'More people in parallel to compress the calendar.',
    factor: 0.78,
    team: '4–6 engineers plus a lead',
  },
  {
    id: 'phased',
    label: 'Phased rollout',
    blurb: 'Ship a usable slice early, then extend it in the open.',
    factor: 1.12,
    team: '2 engineers plus a lead',
  },
];

/* -------------------------------------------------------------- phases --- */

/** Shares of the total calendar. They sum to 1. */
export const phases = [
  { id: 'discovery', label: 'Discovery & requirements', share: 0.12 },
  { id: 'architecture', label: 'Architecture & design', share: 0.14 },
  { id: 'build', label: 'Core build', share: 0.4 },
  { id: 'hardening', label: 'Integration & hardening', share: 0.2 },
  { id: 'launch', label: 'UAT, training & launch', share: 0.14 },
] as const;

/** Included in every engagement, regardless of what is ticked. */
export const alwaysIncluded = [
  'Full source-code ownership on handover',
  'Encrypted data at rest and in transit',
  'Documented API and an operations runbook',
  'Post-launch warranty period',
] as const;
