import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://hobbesdigital.com',
  integrations: [sitemap()],
});
