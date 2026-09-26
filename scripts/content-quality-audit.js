import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seoEnhancements, workflowPages } from './seo-content.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const errors = [];
let checks = 0;
const check = (condition, message) => { checks += 1; if (!condition) errors.push(message); };
const strip = (html) => html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

for (const slug of Object.keys(seoEnhancements)) {
  const file = path.join(dist, slug, 'index.html');
  check(fs.existsSync(file), `Enhanced SEO page missing: ${slug}`);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const text = strip(html);
  check(html.includes('Best way to use'), `${slug} missing enhanced SEO section.`);
  check(text.length >= 3200, `${slug} content is still too thin for a priority page: ${text.length} chars.`);
  check(html.includes('Troubleshooting'), `${slug} missing troubleshooting content.`);
}

for (const guide of workflowPages) {
  const file = path.join(dist, guide.slug, 'index.html');
  check(fs.existsSync(file), `Workflow page missing: ${guide.slug}`);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const text = strip(html);
  check(text.length >= 1800, `${guide.slug} guide content is too thin: ${text.length} chars.`);
  for (const tool of guide.tools) check(html.includes(`/${tool}/`), `${guide.slug} missing link to ${tool}`);
}

const allHtml = [...fs.readdirSync(dist, { recursive: true })]
  .filter((file) => String(file).endsWith('.html'))
  .map((file) => fs.readFileSync(path.join(dist, file), 'utf8'))
  .join('\n');
for (const forbidden of ['TODO', 'lorem ipsum', 'Why this page is SEO-ready']) {
  check(!allHtml.toLowerCase().includes(forbidden.toLowerCase()), `Forbidden placeholder/programmatic phrase found: ${forbidden}`);
}
check(fs.existsSync(path.join(dist, 'guides', 'index.html')), 'Guides hub missing.');
check(allHtml.includes('/guides/'), 'Guides are not internally linked.');

if (errors.length) {
  console.error(`Content quality audit failed: ${errors.length} issue(s) after ${checks} checks.`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Content quality audit passed: ${checks} checks across ${Object.keys(seoEnhancements).length} enhanced tools and ${workflowPages.length} workflow guides.`);
