import { defineConfig } from 'astro/config';
import solidJs from '@astrojs/solid-js';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.dobbo.ca',
  base: '/skyrim',
  output: 'static',
  // Content-Security-Policy delivered via <meta> (GitHub Pages can't set HTTP
  // headers). Astro hashes every inline script/style it emits and re-hashes on
  // each build, so the policy stays correct across dependency upgrades with no
  // manual hash maintenance. The app renders no inline style="" attributes, so
  // hash-mode styles don't break anything.
  experimental: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      scriptDirective: {
        // Astro's CSP doesn't hash the Solid hydration bootstrap that
        // @astrojs/solid-js injects (window._$HY||...), so add it explicitly.
        // scripts/check-csp.mjs fails the build if any emitted inline script
        // is left uncovered (e.g. after a solid-js/astro upgrade changes it).
        hashes: ['sha256-VmEf2BGdqVUwcvyhTyarJo/bY7DNqS2+T2sz4IO/kbw='],
      },
    },
  },
  integrations: [solidJs()],
});
