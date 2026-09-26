import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { categories, tools } from '../src/data/tools.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const errors = [];
let checks = 0;
const check = (condition, message) => { checks += 1; if (!condition) errors.push(message); };

const engines = new Set([
  'pdf-image-to-pdf','pdf-merge','pdf-split','pdf-extract','pdf-delete-pages','pdf-rotate','pdf-reorder','pdf-page-numbers','pdf-watermark','pdf-metadata-viewer','pdf-metadata-cleaner','pdf-page-counter','pdf-compress-basic','pdf-to-image','pdf-to-text',
  'image-resize','image-compress','image-target-size','image-convert','image-crop','image-rotate','image-flip','image-grayscale','image-watermark','image-metadata-remover','image-to-base64','base64-to-image','passport-photo-resizer','signature-resizer','favicon-generator',
  'calculator-age','calculator-bmi','calculator-percentage','calculator-emi','calculator-loan','calculator-gst','calculator-discount','calculator-compound-interest','calculator-sip','calculator-date-add','calculator-days-between','calculator-unit-converter','calculator-unix-time',
  'text-word-counter','text-character-counter','text-case-converter','text-remove-spaces','text-duplicate-line-remover','text-sorter','text-find-replace','text-slug-generator',
  'dev-json-formatter','dev-json-validator','dev-json-minifier','dev-csv-to-json','dev-json-to-csv','dev-base64','dev-url-codec','security-password-generator','dev-uuid-generator','dev-hash-generator','dev-regex-tester','qr-generator'
]);

check(categories.length === 3, 'Project must have exactly three demand categories.');
check(tools.length >= 50, 'Project must include 50+ tools.');
check(new Set(tools.map((tool) => tool.slug)).size === tools.length, 'Tool slugs must be unique.');

for (const category of categories) {
  check(category.slug && category.name && category.description, `Category missing fields: ${category.id}`);
  check(fs.existsSync(path.join(dist, category.slug, 'index.html')), `Category page missing: ${category.slug}`);
  const count = tools.filter((tool) => tool.category === category.id).length;
  check(count >= 10, `Category ${category.name} should contain at least 10 tools; found ${count}.`);
}

for (const tool of tools) {
  check(Boolean(tool.slug), 'Tool missing slug.');
  check(/^[a-z0-9-]+$/.test(tool.slug), `Tool slug is not URL-safe: ${tool.slug}`);
  check(Boolean(tool.name), `Tool missing name: ${tool.slug}`);
  check(Boolean(tool.title), `Tool missing SEO title: ${tool.slug}`);
  check(Boolean(tool.description), `Tool missing meta description: ${tool.slug}`);
  check(Boolean(tool.category), `Tool missing category: ${tool.slug}`);
  check(Boolean(categories.some((cat) => cat.id === tool.category)), `Tool has unknown category: ${tool.slug}`);
  check(Boolean(tool.engine), `Tool missing engine: ${tool.slug}`);
  check(engines.has(tool.engine), `Tool uses unregistered engine: ${tool.slug} (${tool.engine})`);
  check(Array.isArray(tool.keywords) && tool.keywords.length >= 2, `Tool needs 2+ keywords: ${tool.slug}`);
  check(Array.isArray(tool.features) && tool.features.length >= 3, `Tool needs 3+ features: ${tool.slug}`);
  check(Boolean(tool.privacy), `Tool missing privacy badge: ${tool.slug}`);
  check(fs.existsSync(path.join(dist, tool.slug, 'index.html')), `Tool page missing: ${tool.slug}`);
}

const vendorFiles = ['pdf-lib.min.js', 'jszip.min.js', 'qrcode.js', 'pdf.mjs', 'pdf.worker.mjs'];
for (const file of vendorFiles) check(fs.existsSync(path.join(dist, 'assets/vendor', file)), `Vendor file missing: ${file}`);
check(fs.existsSync(path.join(dist, 'assets/app.js')), 'App JS missing.');
check(fs.existsSync(path.join(dist, 'assets/styles.css')), 'CSS missing.');
check(fs.existsSync(path.join(dist, 'sitemap.xml')), 'Sitemap missing.');
check(fs.existsSync(path.join(dist, 'robots.txt')), 'Robots.txt missing.');

if (errors.length) {
  console.error(`Tool audit failed: ${errors.length} issue(s) after ${checks} checks.`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Tool audit passed: ${checks} checks across ${tools.length} tools and ${categories.length} categories.`);
