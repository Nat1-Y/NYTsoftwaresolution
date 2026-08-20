import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Case studies. Add a new one by dropping a .md file into
 * src/content/case-studies/ — the grid, the command palette and the
 * chatbot knowledge base all pick it up automatically.
 */
const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/case-studies' }),
  schema: z.object({
    order: z.number(),
    name: z.string(),
    category: z.string(),
    tagline: z.string(),

    liveUrl: z.string().url(),
    liveLabel: z.string().default('Live System'),

    /** Public demo login, if the client has approved one. */
    demo: z
      .object({ email: z.string(), password: z.string() })
      .optional(),

    /** Small status pill shown beside the CTA. */
    status: z
      .object({
        label: z.string(),
        value: z.string(),
        variant: z.enum(['online', 'visitor', 'active-vendors']).default('online'),
      })
      .optional(),

    business: z.object({
      metric: z.object({
        value: z.string(),
        description: z.string(),
        /** Where the number came from. Never ship an unattributed metric. */
        source: z.string().optional(),
      }),
      bullets: z
        .array(z.object({ title: z.string(), text: z.string() }))
        .min(1),
    }),

    tech: z.object({
      specs: z.array(z.object({ label: z.string(), value: z.string() })).min(1),
      narrative: z.string(),
      /** Which architecture diagram to render. */
      diagram: z.enum(['multitenant', 'clinical', 'ticketing', 'marketplace']),
    }),

    /** Short plain-language summary used by the chatbot. */
    plain: z.string(),
  }),
});

export const collections = { 'case-studies': caseStudies };
