export interface Faq {
  q: string;
  /** Plain text feeds the JSON-LD FAQPage; `html` renders on the page. */
  a: string;
  html?: string;
}

export const faqs: Faq[] = [
  {
    q: 'How much does a project cost?',
    a: 'It depends on scope. Small, well-defined projects are quoted as a fixed price against milestones; ongoing work is billed monthly. The first consultation and the written estimate that follows are free.',
    html: 'It depends on scope. Small, well-defined projects are quoted as a <strong>fixed price against milestones</strong>; ongoing work is billed monthly. The first consultation and the written estimate that follows are free — describe your project in the contact form and you will get a realistic figure, not a placeholder.',
  },
  {
    q: 'How long does a build take?',
    a: 'A focused website or app is usually 2 to 4 weeks. A medium system such as a POS or booking platform runs 1 to 3 months. Large multi-tenant platforms and clinical systems take 3 to 6 months. You get a dated timeline before any work starts.',
    html: 'A focused website or app is usually <strong>2 to 4 weeks</strong>. A medium system such as a POS or booking platform runs <strong>1 to 3 months</strong>. Large multi-tenant platforms, marketplaces and clinical systems take <strong>3 to 6 months</strong>. You get a dated timeline before any work starts.',
  },
  {
    q: 'Do I own the code you write?',
    a: 'Yes. On final payment you receive the full source code, the repository history and the deployment configuration. There is no vendor lock-in and no licence you have to keep paying to use your own system.',
    html: 'Yes. On final payment you receive the <strong>full source code</strong>, the repository history and the deployment configuration. There is no vendor lock-in and no licence you have to keep paying to use your own system.',
  },
  {
    q: 'Do you work with clients outside Ethiopia?',
    a: 'Yes, remote engagements are a core part of our work. We schedule overlap hours with your timezone, work inside your repository and review process, and send written weekly reports. All communication is in fluent technical English.',
    html: 'Yes — remote engagements are a core part of our work. We schedule <strong>overlap hours with your timezone</strong>, work inside your repository and review process, and send written weekly reports. All communication is in fluent technical English.',
  },
  {
    q: 'What happens after launch?',
    a: 'Every project includes a warranty period during which defects are fixed at no cost. After that you can take the system in-house with the documentation we hand over, or keep us on a support retainer for monitoring, updates and new features.',
    html: 'Every project includes a <strong>warranty period</strong> during which defects are fixed at no cost. After that you can either take the system in-house with the documentation we hand over, or keep us on a support retainer for monitoring, updates and new features.',
  },
  {
    q: 'Can the system keep working when the internet drops?',
    a: 'For point-of-sale and field systems, yes. Transactions are written to a local database on the device, queued with idempotency keys, and synchronised automatically when connectivity returns.',
    html: 'For point-of-sale and field systems, yes — that is a deliberate design choice we make often. Transactions are written to a <strong>local database on the device</strong>, queued with idempotency keys, and synchronised automatically when connectivity returns. It is how the Fikrekun Spagna POS keeps taking orders during an outage.',
  },
  {
    q: 'How do you handle sensitive data, such as patient records?',
    a: 'Data is encrypted in transit and at rest, access is granted per role rather than per user, and reads of sensitive records are audit-logged. Where a specific regulatory framework applies in your jurisdiction, we design to its requirements and state plainly what our work does and does not cover.',
    html: 'Data is encrypted in transit and at rest, access is granted <strong>per role rather than per user</strong>, and reads of sensitive records are audit-logged so access can be reconstructed later. Where a specific regulatory framework applies in your jurisdiction, we design to its requirements and tell you plainly what is and is not covered by our work.',
  },
  {
    q: 'Can you take over a project someone else started?',
    a: 'Often, yes. We start with a short paid audit of the existing codebase and infrastructure, then give you an honest assessment of what is salvageable, what needs replacing, and what each path would cost.',
    html: 'Often, yes. We start with a short paid <strong>audit of the existing codebase</strong>, then give you an honest assessment: what is salvageable, what needs replacing, and what it would cost either way. Sometimes the honest answer is that a rewrite is cheaper, and we will say so.',
  },
];
