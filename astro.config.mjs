import { defineConfig } from 'astro/config';
import solidJs from '@astrojs/solid-js';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.dobbo.ca',
  base: '/skyrim/alchemy',
  output: 'static',
  integrations: [solidJs()],
});
