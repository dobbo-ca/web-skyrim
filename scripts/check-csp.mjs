// Post-build guard: every inline <script> emitted into the built HTML must be
// covered by that page's Content-Security-Policy (a matching sha256 hash, or
// 'unsafe-inline'). Astro's CSP feature is known to miss the Solid hydration
// bootstrap, and dependency upgrades can change inline-script bytes — either
// would silently break the live site, since the CSP blocks the script while
// the build still succeeds. This fails the build instead.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

function htmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...htmlFiles(p));
    else if (entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const files = htmlFiles('dist');
if (files.length === 0) {
  console.error('check-csp: no built HTML found — run the build first');
  process.exit(1);
}

const sha256 = (s) => 'sha256-' + createHash('sha256').update(s, 'utf8').digest('base64');
const failures = [];

for (const file of files) {
  const html = readFileSync(file, 'utf8');

  // The content attribute is delimited by one quote char but contains the
  // other quote char throughout ('self', 'sha256-...'), so anchor on the
  // opening delimiter and read until the matching one via a backreference.
  const meta = html.match(
    /http-equiv=["']content-security-policy["'][^>]*?content=(["'])([\s\S]*?)\1/i,
  );
  if (!meta) {
    failures.push(`${file}: no CSP meta tag`);
    continue;
  }
  const scriptSrc = (meta[2].split(';').find((d) => d.trim().startsWith('script-src')) || '').trim();
  const allowsUnsafeInline = scriptSrc.includes("'unsafe-inline'");
  const listedHashes = new Set(scriptSrc.match(/'sha256-[^']+'/g)?.map((h) => h.slice(1, -1)) ?? []);

  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    const body = m[1];
    if (body.trim() === '') continue;
    const hash = sha256(body);
    if (!allowsUnsafeInline && !listedHashes.has(hash)) {
      failures.push(`${file}: inline script not in CSP script-src (need '${hash}')`);
    }
  }
}

if (failures.length) {
  console.error('check-csp: FAILED\n  ' + failures.join('\n  '));
  process.exit(1);
}
console.log(`check-csp: OK — all inline scripts covered across ${files.length} page(s)`);
