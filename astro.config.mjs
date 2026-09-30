// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://nytsoftwaresolution.pro.et',
  integrations: [
    sitemap({
      // The offline fallback and the error page are not content to index.
      filter: (page) => !/\/(offline|404)\/?$/.test(page),
    }),
  ],

  build: {
    // One stylesheet instead of a request waterfall — the whole design system
    // is small enough that inlining beats splitting here.
    inlineStylesheets: 'auto',
  },

  vite: {
    build: {
      cssCodeSplit: false,
    },
  },

  compressHTML: true,
});
