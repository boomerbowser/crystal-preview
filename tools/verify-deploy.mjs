#!/usr/bin/env node
/* Check every internal link the way a static host serves them: files only.
 *
 * `validate.py` already checks that local links resolve, but it resolves them on
 * a filesystem, where a directory exists. Vercel serves files: a directory with
 * no index.html is a 404. That difference hid five broken links in
 * validation/report.html — every capture link pointed at a directory, and every
 * one of them would have 404'd in production while passing locally, because
 * python's http.server invents directory listings and Vercel does not.
 *
 * Run against the tree that would actually be uploaded:
 *   node tools/verify-deploy.mjs <directory>
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';

const ROOT = process.argv[2];
/* What .vercelignore keeps out of the upload. src/pages holds body fragments that
   the shell composes into real pages; they are not deployed and their relative
   links are resolved from the composed page, not from where the fragment lives. */
const NOT_DEPLOYED = new Set(['tools', 'src', 'node_modules', '.venv', '__pycache__']);

const pages = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (NOT_DEPLOYED.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.html$/.test(entry)) pages.push(full);
  }
})(ROOT);

const broken = [];
for (const page of pages) {
  /* Strip code samples first: a documentation page shows markup as escaped text,
     and `href="crystal-theme.css"&gt;` inside a <pre> is an example, not a link. */
  const html = readFileSync(page, 'utf8')
    .replace(/<pre[\s\S]*?<\/pre>/gi, '')
    .replace(/<code[\s\S]*?<\/code>/gi, '');
  for (const m of html.matchAll(/(?:href|src)="([^"#?][^"]*)"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|data:|\/\/)/.test(href)) continue;
    const target = href.startsWith('/')
      ? join(ROOT, href.slice(1))
      : resolve(dirname(page), href.split('#')[0].split('?')[0]);
    if (!existsSync(target)) { broken.push(`${relative(ROOT, page)} -> ${href}  (missing)`); continue; }
    if (statSync(target).isDirectory() && !existsSync(join(target, 'index.html'))) {
      broken.push(`${relative(ROOT, page)} -> ${href}  (directory with no index.html: Vercel returns 404)`);
    }
  }
}
console.log(`${pages.length} pages checked.`);
if (broken.length) { console.log(`\n${broken.length} link(s) would 404 on Vercel:`); for (const b of [...new Set(broken)]) console.log('  - ' + b); process.exit(1); }
console.log('Every internal link resolves to a file.');
