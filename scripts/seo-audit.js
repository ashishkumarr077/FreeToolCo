import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { categories, tools } from '../src/data/tools.js';
import { workflowPages } from './seo-content.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const normalizeBasePath = (value = '') => {
  const cleaned = String(value || '').trim();
  if (!cleaned || cleaned === '/') return '';
  return `/${cleaned.replace(/^\/+|\/+$/g, '')}`;
};
const basePath = normalizeBasePath(process.env.BASE_PATH || '');
const siteUrl = String(process.env.SITE_URL || 'https://freetoolco.com').replace(/\/+$/g, '');
const stripBasePath = (url) => basePath && url.startsWith(`${basePath}/`) ? (url.slice(basePath.length) || '/') : url;
const loops = Number(process.env.SEO_AUDIT_LOOPS || 50);
let totalChecks = 0;

const expectedPages = [
  { url: '/', file: 'index.html', type: 'home', titlePart: 'FreeToolCo' },
  { url: '/all-tools/', file: 'all-tools/index.html', type: 'hub', titlePart: 'All Free' },
  { url: '/guides/', file: 'guides/index.html', type: 'hub', titlePart: 'Guides' },
  ...workflowPages.map((guide) => ({ url: `/${guide.slug}/`, file: `${guide.slug}/index.html`, type: 'workflow', titlePart: guide.h1 })),
  ...categories.map((cat) => ({ url: `/${cat.slug}/`, file: `${cat.slug}/index.html`, type: 'category', titlePart: cat.shortName })),
  ...tools.map((tool) => ({ url: `/${tool.slug}/`, file: `${tool.slug}/index.html`, type: 'tool', titlePart: tool.name })),
  { url: '/privacy/', file: 'privacy/index.html', type: 'info', titlePart: 'Privacy' },
  { url: '/terms/', file: 'terms/index.html', type: 'info', titlePart: 'Terms' },
  { url: '/contact/', file: 'contact/index.html', type: 'info', titlePart: 'Contact' },
  { url: '/about/', file: 'about/index.html', type: 'info', titlePart: 'About' },
  { url: '/request-tool/', file: 'request-tool/index.html', type: 'info', titlePart: 'Request' }
];

function get(html, regex) { return html.match(regex)?.[1] || ''; }
function strip(html) { return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
function assert(condition, message, errors) { totalChecks += 1; if (!condition) errors.push(message); }
function fileForUrl(url) { return url === '/' ? 'index.html' : `${url.replace(/^\//, '').replace(/\/$/, '')}/index.html`; }

function runAudit(pass) {
  const errors = [];
  const sitemapPath = path.join(dist, 'sitemap.xml');
  const sitemap = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, 'utf8') : '';

  for (const page of expectedPages) {
    const file = path.join(dist, page.file);
    assert(fs.existsSync(file), `Missing page file ${page.file}`, errors);
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, 'utf8');
    const text = strip(html);
    const title = get(html, /<title>([^<]+)<\/title>/i);
    const desc = get(html, /<meta name="description" content="([^"]+)"/i);
    const canonical = get(html, /<link rel="canonical" href="([^"]+)"/i);
    const h1s = html.match(/<h1[\s>]/gi) || [];

    assert(title.length >= 18 && title.length <= 78, `${page.url} title length should be 18-78 chars; got ${title.length}`, errors);
    assert(desc.length >= 55 && desc.length <= 170, `${page.url} description length should be 55-170 chars; got ${desc.length}`, errors);
    assert(canonical === `${siteUrl}${page.url}`, `${page.url} canonical mismatch: ${canonical}`, errors);
    assert(h1s.length === 1, `${page.url} should have exactly one H1; found ${h1s.length}`, errors);
    assert(html.includes('<meta name="robots" content="index,follow'), `${page.url} missing index robots meta`, errors);
    assert(html.includes('property="og:title"'), `${page.url} missing Open Graph title`, errors);
    assert(html.includes('name="twitter:card"'), `${page.url} missing Twitter card`, errors);
    assert(text.length > 600, `${page.url} has thin content`, errors);
    assert(sitemap.includes(`${siteUrl}${page.url}`), `${page.url} missing in sitemap`, errors);

    const hrefs = [...html.matchAll(/href="(\/[^"#?]+\/)"/g)].map((m) => stripBasePath(m[1]));
    for (const href of hrefs) {
      if (href.endsWith('.xml')) continue;
      const expected = path.join(dist, fileForUrl(href));
      assert(fs.existsSync(expected), `${page.url} has broken internal link ${href}`, errors);
    }

    if (page.type === 'tool') {
      assert(title.toLowerCase().includes(page.titlePart.split(' ')[0].toLowerCase()), `${page.url} title does not include tool keyword`, errors);
      assert(html.includes('"@type":"WebApplication"'), `${page.url} missing WebApplication schema`, errors);
      assert(html.includes('"@type":"FAQPage"'), `${page.url} missing FAQ schema`, errors);
      assert(html.includes('"@type":"HowTo"'), `${page.url} missing HowTo schema`, errors);
      assert(html.includes('Related tools'), `${page.url} missing related tools section`, errors);
      assert(html.includes('id="tool-app"'), `${page.url} missing tool app mount`, errors);
    }
  }

  assert(expectedPages.length === tools.length + categories.length + workflowPages.length + 8, `Expected dynamic page count mismatch; found ${expectedPages.length}`, errors);
  assert(tools.length >= 50, `Expected at least 50 tools, found ${tools.length}`, errors);
  assert(categories.length === 3, `Expected 3 demand categories, found ${categories.length}`, errors);
  assert(fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8').includes('Sitemap:'), 'robots.txt missing sitemap directive', errors);

  if (errors.length) {
    console.error(`SEO audit pass ${pass}/${loops} failed with ${errors.length} issue(s):`);
    for (const error of errors.slice(0, 60)) console.error(`- ${error}`);
    if (errors.length > 60) console.error(`...and ${errors.length - 60} more.`);
    process.exit(1);
  }
}

for (let pass = 1; pass <= loops; pass += 1) runAudit(pass);
console.log(`SEO audit passed: ${loops} loops, ${totalChecks} total checks, ${expectedPages.length} pages, ${tools.length} tools.`);
