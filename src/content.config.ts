import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
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

    /**
     * A public link a visitor can open. Omit it when there is none that works
     * — a dead link on a card whose argument is "open it and judge" does more
     * harm than no link.
     */
    liveUrl: z.url().optional(),
    liveLabel: z.string().default('Live System'),

    /**
     * Where the system stands, stated plainly and dated. `checked` is when the
     * public link (or its absence) was last verified.
     *
     *   production — running for the client, verified reachable
     *   delivered  — built and handed over; not publicly verifiable now
     *   prototype  — a demonstration or pilot, not a production deployment
     */
    deployment: z.object({
      state: z.enum(['production', 'delivered', 'prototype']),
      checked: z.string(),
      note: z.string().optional(),
    }),

    /*
     * Public demo logins were removed on purpose: a credential printed on a
     * public page is a credential for anyone. Demos are arranged on request,
     * against an isolated environment — see README → "Demos".
     */

    /** Case-study page sections. Written from what was actually delivered. */
    overview: z.string(),
    challenge: z.string(),
    solution: z.array(z.string()).min(1),
    stack: z.array(z.string()).min(1),

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
