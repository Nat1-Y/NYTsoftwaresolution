export type TechCategory = 'frontend' | 'backend' | 'databases' | 'infrastructure';

export interface TechItem {
  name: string;
  note: string;
  categories: TechCategory[];
}

export const techFilters: { id: TechCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Ecosystem' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'backend', label: 'Backend & APIs' },
  { id: 'databases', label: 'Databases' },
  { id: 'infrastructure', label: 'Infrastructure & DevOps' },
];

export const techStack: TechItem[] = [
  { name: 'Next.js', note: 'Edge server-side rendering', categories: ['frontend'] },
  { name: 'React', note: 'Interactive interfaces', categories: ['frontend'] },
  { name: 'Flutter', note: 'Cross-platform mobile', categories: ['frontend'] },
  { name: 'TypeScript', note: 'Strict type safety', categories: ['frontend', 'backend'] },
  { name: 'JavaScript', note: 'Dynamic app logic', categories: ['frontend'] },
  { name: 'Vue.js', note: 'Flexible frontends', categories: ['frontend'] },
  { name: 'Node.js', note: 'Server-side execution', categories: ['backend'] },
  { name: 'Express', note: 'RESTful endpoint routing', categories: ['backend'] },
  { name: 'NestJS', note: 'Scalable backend architecture', categories: ['backend'] },
  { name: 'Python', note: 'Scripting & data tooling', categories: ['backend'] },
  { name: 'FastAPI', note: 'Async Python services', categories: ['backend'] },
  { name: 'Laravel', note: 'Enterprise PHP MVC', categories: ['backend'] },
  { name: 'PostgreSQL', note: 'Advanced relational engine', categories: ['databases'] },
  { name: 'MySQL', note: 'Standard SQL server', categories: ['databases'] },
  { name: 'MongoDB', note: 'Flexible document storage', categories: ['databases'] },
  { name: 'Redis', note: 'High-speed caching', categories: ['databases'] },
  { name: 'Firebase', note: 'Real-time sync platform', categories: ['databases'] },
  { name: 'AWS', note: 'Global cloud host', categories: ['infrastructure'] },
  { name: 'Google Cloud', note: 'Serverless compute & storage', categories: ['infrastructure'] },
  { name: 'Docker', note: 'Consistent containerisation', categories: ['infrastructure'] },
  { name: 'Nginx', note: 'Reverse proxy & load balancing', categories: ['infrastructure'] },
  { name: 'CI/CD Pipelines', note: 'Automated test & deploy', categories: ['infrastructure'] },
];
