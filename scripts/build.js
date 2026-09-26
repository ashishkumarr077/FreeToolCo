import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { categories, tools } from '../src/data/tools.js';
import { seoEnhancements, workflowPages } from './seo-content.js';

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
const withBase = (url) => {
  if (!basePath || !url.startsWith('/')) return url;
  return url === '/' ? `${basePath}/` : `${basePath}${url}`;
};
const pageUrl = (url) => `${siteUrl}${url}`;
const applyBasePath = (html) => basePath
  ? html.replace(/(href|src)="\/(?!\/)/g, `$1="${basePath}/`)
  : html;

const ensure = (dir) => fs.mkdirSync(dir, { recursive: true });
const clean = (dir) => { if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true }); ensure(dir); };
const copy = (from, to) => { ensure(path.dirname(to)); fs.copyFileSync(from, to); };
const copyDir = (from, to) => {
  if (!fs.existsSync(from)) return;
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else copy(src, dest);
  }
};
const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
const slugPath = (slug) => `/${slug}/`;
const truncate = (value, max = 158) => value.length > max ? `${value.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : value;
const categoryById = (id) => categories.find((category) => category.id === id);

function write(file, content) {
  const full = path.join(dist, file);
  ensure(path.dirname(full));
  fs.writeFileSync(full, content);
}

function iconFor(tool) {
  if (tool.category === 'pdf') return '📄';
  if (tool.category === 'image') return '🖼️';
  if (tool.engine.includes('calculator')) return '🧮';
  if (tool.engine.includes('json') || tool.engine.includes('dev') || tool.engine.includes('regex')) return '💻';
  if (tool.engine.includes('password') || tool.engine.includes('hash')) return '🔐';
  if (tool.engine.includes('qr')) return '▦';
  return '⚙️';
}

function header() {
  return `<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="container nav">
    <a class="logo" href="/" aria-label="FreeToolCo home"><span class="logo-mark">F</span><span>FreeToolCo</span></a>
    <nav class="nav-links" id="nav-links" aria-label="Main navigation">
      ${categories.map((category) => `<a href="/${category.slug}/">${esc(category.shortName)}</a>`).join('')}
      <a href="/all-tools/">All Tools</a>
      <a href="/guides/">Guides</a>
      <a href="/privacy/">Privacy</a>
    </nav>
    <div class="nav-actions">
      <button class="search-trigger" aria-label="Search tools"><span>Search tools</span><span class="kbd">/</span></button>
      <button id="dark-toggle" class="pill-btn" aria-label="Toggle dark mode">◐</button>
      <button id="mobile-menu" class="pill-btn mobile-menu" aria-label="Open menu">☰</button>
    </div>
  </div>
</header>`;
}

function footer() {
  const popular = tools.filter((tool) => tool.popular).slice(0, 8);
  return `<footer class="footer">
  <div class="container footer-grid">
    <div>
      <h3>FreeToolCo</h3>
      <p class="section-sub">A modern, privacy-first toolbox for PDF, image, calculator, text, and developer tasks. Built as a plugin-style static website.</p>
      <small>© <span id="year"></span> FreeToolCo. All rights reserved.</small>
    </div>
    <div><h4>Categories</h4>${categories.map((cat) => `<a href="/${cat.slug}/">${esc(cat.shortName)}</a>`).join('')}<a href="/all-tools/">All tools</a></div>
    <div><h4>Popular</h4>${popular.map((tool) => `<a href="/${tool.slug}/">${esc(tool.name)}</a>`).join('')}</div>
    <div><h4>Resources</h4><a href="/guides/">Guides</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/contact/">Contact</a><a href="/about/">About</a><a href="/request-tool/">Request a tool</a><a href="/sitemap.xml">Sitemap</a></div>
  </div>
</footer>
<div class="search-modal" id="search-modal" role="dialog" aria-modal="true" aria-label="Search FreeToolCo tools">
  <div class="search-dialog">
    <div class="search-dialog-head"><span>🔎</span><input id="search-input" placeholder="Search PDF, image, calculator, JSON, QR..." autocomplete="off"></div>
    <div class="search-results" id="search-results"></div>
  </div>
</div>`;
}

function layout({ title, description, canonical, content, structured = [], scripts = [] }) {
  const jsonLd = structured.filter(Boolean).map((data) => `<script type="application/ld+json">${JSON.stringify(data)}</script>`).join('\n');
  const scriptTags = [
    '<script src="/assets/tools-data.js" defer></script>',
    ...scripts,
    '<script src="/assets/app.js" defer></script>'
  ].join('\n');
  return applyBasePath(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(truncate(description))}">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <meta name="theme-color" content="#2563eb">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(truncate(description))}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="FreeToolCo">
  <meta property="og:image" content="${siteUrl}/assets/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${siteUrl}/assets/og-image.png">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="apple-touch-icon" href="/assets/icons/icon-192.png">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="stylesheet" href="/assets/styles.css">
  ${jsonLd}
</head>
<body>
  ${header()}
  <main id="main">${content}</main>
  ${footer()}
  ${scriptTags}
</body>
</html>`);
}

function toolScripts(tool) {
  const tags = [];
  if (tool.engine.startsWith('pdf-')) {
    tags.push('<script src="/assets/vendor/pdf-lib.min.js" defer></script>');
  }
  if (tool.engine.startsWith('pdf-') || tool.engine === 'favicon-generator' || ['image-convert', 'image-compress', 'image-target-size'].includes(tool.engine)) {
    tags.push('<script src="/assets/vendor/jszip.min.js" defer></script>');
  }
  if (tool.engine === 'qr-generator') tags.push('<script src="/assets/vendor/qrcode.js" defer></script>');
  tags.push(`<script>window.FTC_TOOL_SLUG=${JSON.stringify(tool.slug)};</script>`);
  return tags;
}

function appSchema(tool, category) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    url: `${siteUrl}/${tool.slug}/`,
    applicationCategory: category.name,
    operatingSystem: 'Any modern browser',
    description: truncate(tool.description, 300),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: tool.features || [],
    publisher: { '@type': 'Organization', name: 'FreeToolCo', url: siteUrl }
  };
}

function faqSchema(tool) {
  const faqs = tool.faqs || defaultFaqs(tool);
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
  };
}

function howToSchema(tool) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to use ${tool.name}`,
    description: `Use ${tool.name} on FreeToolCo in three simple steps.`,
    step: [
      { '@type': 'HowToStep', name: 'Open the tool', text: `Open ${tool.name} in your browser.` },
      { '@type': 'HowToStep', name: 'Add input', text: 'Upload your file or enter the required values in the tool box.' },
      { '@type': 'HowToStep', name: 'Process and download', text: 'Run the tool, review the result, then download or copy the output.' }
    ]
  };
}

function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: item.url }))
  };
}

function defaultFaqs(tool) {
  return [
    [`Is ${tool.name} free to use?`, `Yes. ${tool.name} is free to use on FreeToolCo with no signup required.`],
    [`Does ${tool.name} work on mobile?`, `Yes. FreeToolCo tools are designed for modern browsers on desktop and mobile devices.`],
    [`Is my data private?`, `${tool.privacy || 'Many FreeToolCo tools run in your browser'}. Tool pages explain whether processing is local or server-based.`]
  ];
}

function toolCard(tool) {
  const cat = categoryById(tool.category);
  return `<a class="card tool-card" href="/${tool.slug}/" data-category="${tool.category}" data-search="${esc(`${tool.name} ${tool.description} ${(tool.keywords || []).join(' ')}`.toLowerCase())}">
    <div class="card-icon">${iconFor(tool)}</div>
    <h3>${esc(tool.name)}</h3>
    <p>${esc(tool.description)}</p>
    <div class="card-meta"><span class="badge">🔒 ${esc(tool.privacy)}</span><span class="badge blue">${esc(cat.shortName)}</span></div>
  </a>`;
}

function categoryCard(category) {
  const catTools = tools.filter((tool) => tool.category === category.id).slice(0, 6);
  return `<article class="card category-card" style="--cat-color:${category.color}">
    <div class="category-top"><div><h3>${esc(category.name)}</h3><p>${esc(category.description)}</p></div><div class="category-icon">${category.icon}</div></div>
    <div class="category-links">${catTools.map((tool) => `<a href="/${tool.slug}/">${esc(tool.name)} →</a>`).join('')}</div>
    <a class="btn" href="/${category.slug}/">View ${tools.filter((tool) => tool.category === category.id).length} tools</a>
  </article>`;
}

function homePage() {
  const popular = tools.filter((tool) => tool.popular).slice(0, 16);
  const content = `<section class="hero">
    <div class="container hero-grid">
      <div>
        <span class="eyebrow">⚡ Free, fast, privacy-first browser tools</span>
        <h1>Finish digital tasks with <span class="gradient-text">FreeToolCo</span>.</h1>
        <p class="lede">Convert PDFs, resize images, calculate values, count words, format JSON, generate QR codes, and complete everyday tasks with no signup and no confusing download buttons.</p>
        <div class="hero-actions"><a class="btn primary" href="/all-tools/">Explore all ${tools.length}+ tools</a><button class="btn ghost" data-open-search>Search tools</button></div>
        <div class="trust-strip"><div class="trust-item">No signup</div><div class="trust-item">No watermark</div><div class="trust-item">Browser-first privacy</div><div class="trust-item">Mobile ready</div></div>
      </div>
      <div class="hero-card" aria-hidden="true"><div class="mock-window"><div class="window-top"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div><div class="mock-body"><div class="mock-upload">Drop file here</div><div class="mock-row"><span>compress-image-to-50kb.jpg</span><strong>Ready</strong></div><div class="mock-row"><span>Privacy mode</span><strong>Local</strong></div><div class="btn primary">Download result</div></div></div></div>
    </div>
  </section>
  <section class="section"><div class="container"><div class="search-panel"><input id="home-tool-search" placeholder="Search tools: JPG to PDF, image compressor, age calculator, JSON formatter..."><button class="btn primary" data-open-search>Search</button></div><div class="quick-chips">${popular.slice(0, 8).map((tool) => `<a class="chip" href="/${tool.slug}/">${iconFor(tool)} ${esc(tool.name)}</a>`).join('')}</div></div></section>
  <section class="section"><div class="container"><div class="section-head"><div><h2>Popular high-demand tools</h2><p class="section-sub">The homepage prioritizes researched demand: PDF document workflows, image optimization, and everyday calculator/developer utilities.</p></div><a class="btn" href="/all-tools/">View all</a></div><div class="grid tools" id="popular-tools-grid">${popular.map(toolCard).join('')}</div></div></section>
  <section class="section"><div class="container"><div class="section-head"><div><h2>Three focused demand categories</h2><p class="section-sub">A simpler structure for non-technical management: each tool belongs to one of three clear category plugins.</p></div></div><div class="grid categories">${categories.map(categoryCard).join('')}</div></div></section>
  <section class="section"><div class="container"><div class="section-head"><div><h2>Workflow-first experience</h2><p class="section-sub">FreeToolCo is designed to keep users moving after each result with related next actions, privacy badges, and simple SEO-friendly pages.</p></div></div><div class="workflow-strip"><a class="workflow" href="/prepare-documents-for-online-forms/"><h3>Prepare online form files</h3><p>Resize passport photos, compress signatures, convert JPG to PDF, and reduce images to target KB sizes.</p></a><a class="workflow" href="/organize-pdf-pages-workflow/"><h3>Clean document workflows</h3><p>Merge PDFs, split pages, add watermarks, count pages, and export PDF pages to images.</p></a><a class="workflow" href="/clean-and-format-json-data/"><h3>Developer productivity</h3><p>Format JSON, convert CSV, encode Base64, generate passwords, test regex, and create QR codes.</p></a></div></div></section>
  <section class="section"><div class="container"><div class="prose"><h2>Why FreeToolCo is different</h2><p>Competitors prove that simple upload boxes, no-install workflows, trust messaging, and category hubs work. FreeToolCo adds visible processing-mode labels, plugin-style management, workflow pages, India-friendly file-size utilities, and lightweight static SEO pages for every tool.</p></div></div></section>`;
  return layout({
    title: 'FreeToolCo — Free Online PDF, Image, Calculator & Developer Tools',
    description: 'Use 50+ free browser-based tools for PDF files, images, calculators, text, JSON, QR codes, passwords, and everyday productivity. No signup.',
    canonical: `${siteUrl}/`,
    content,
    structured: [
      { '@context': 'https://schema.org', '@type': 'WebSite', name: 'FreeToolCo', url: siteUrl, potentialAction: { '@type': 'SearchAction', target: `${siteUrl}/all-tools/?q={search_term_string}`, 'query-input': 'required name=search_term_string' } },
      { '@context': 'https://schema.org', '@type': 'Organization', name: 'FreeToolCo', url: siteUrl }
    ]
  });
}

function categoryPage(category) {
  const catTools = tools.filter((tool) => tool.category === category.id).sort((a, b) => a.priority - b.priority);
  const content = `<section class="tool-shell"><div class="container"><nav class="breadcrumb"><a href="/">Home</a><span>›</span><span>${esc(category.name)}</span></nav><div class="tool-title-card"><span class="eyebrow">${category.icon} ${catTools.length} browser tools</span><h1>${esc(category.name)}</h1><p class="lede">${esc(category.description)} Every page has its own SEO title, meta description, schema markup, FAQ, and related-tool links.</p></div><div class="section" style="padding-bottom:0"><div class="grid tools">${catTools.map(toolCard).join('')}</div></div><div class="content-grid"><article class="prose"><h2>About ${esc(category.shortName)}</h2><p>${esc(category.seoDescription)}</p><h2>How this category is organized</h2><ol><li>Choose the tool that exactly matches your task.</li><li>Use the upload box or input fields directly in the browser.</li><li>Download, copy, or continue with a related tool.</li></ol><h2>Privacy-first promise</h2><p>FreeToolCo labels each tool by processing mode. Many tools run locally in your browser, which means your file never needs to leave your device.</p></article><aside class="sidebar-card"><h3>Popular in this category</h3><div class="side-links">${catTools.slice(0, 10).map((tool) => `<a href="/${tool.slug}/">${esc(tool.name)}</a>`).join('')}</div></aside></div></div></section>`;
  return layout({
    title: category.seoTitle,
    description: category.seoDescription,
    canonical: `${siteUrl}/${category.slug}/`,
    content,
    structured: [
      breadcrumbSchema([{ name: 'Home', url: `${siteUrl}/` }, { name: category.name, url: `${siteUrl}/${category.slug}/` }]),
      { '@context': 'https://schema.org', '@type': 'ItemList', name: category.name, itemListElement: catTools.map((tool, i) => ({ '@type': 'ListItem', position: i + 1, url: `${siteUrl}/${tool.slug}/`, name: tool.name })) }
    ]
  });
}

function allToolsPage() {
  const content = `<section class="tool-shell" id="all-tools-page"><div class="container"><nav class="breadcrumb"><a href="/">Home</a><span>›</span><span>All tools</span></nav><div class="tool-title-card"><span class="eyebrow">🧰 ${tools.length}+ tools in one hub</span><h1>All FreeToolCo tools</h1><p class="lede">Browse the complete plugin registry: PDF and document tools, image tools, calculators, text utilities, developer tools, QR tools, and security helpers.</p></div><div class="all-tools-filter"><button class="filter-btn active" data-filter="all">All</button>${categories.map((category) => `<button class="filter-btn" data-filter="${category.id}">${esc(category.shortName)}</button>`).join('')}</div><div class="grid tools">${tools.map(toolCard).join('')}</div></div></section>`;
  return layout({ title: 'All Free Online Tools — FreeToolCo', description: `Browse ${tools.length}+ free online browser-based tools for PDF, images, calculators, text, developer utilities, QR codes, and security tasks.`, canonical: `${siteUrl}/all-tools/`, content, structured: [{ '@context': 'https://schema.org', '@type': 'ItemList', name: 'All FreeToolCo tools', itemListElement: tools.map((tool, i) => ({ '@type': 'ListItem', position: i + 1, url: `${siteUrl}/${tool.slug}/`, name: tool.name })) }] });
}


function renderSeoEnhancement(tool) {
  const extra = seoEnhancements[tool.slug];
  if (!extra) return '';
  return `<h2>Best way to use ${esc(tool.name)}</h2><p>${esc(extra.intro)}</p><h3>Best for</h3><ul>${(extra.bestFor || []).map((item) => `<li>${esc(item)}</li>`).join('')}</ul><h3>Example workflow</h3><p>${esc(extra.example || '')}</p><h3>Quality notes</h3><p>${esc(extra.quality || '')}</p><h3>Before you download</h3><ul><li>Check that the output format matches the website, form, or software where you will upload it.</li><li>Open the downloaded file once before final submission so you can confirm quality, page order, dimensions, and readability.</li><li>If the result is too large, use the related compression or resize tools instead of repeating the same step many times.</li><li>If the source file is password-protected, corrupted, scanned, or extremely large, use a desktop or specialist tool when browser processing is not enough.</li></ul><h3>Troubleshooting</h3><ul>${(extra.troubleshooting || []).map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`;
}

function guideCard(guide) {
  return `<a class="card tool-card" href="/${guide.slug}/" data-category="guide" data-search="${esc(`${guide.h1} ${guide.description}`.toLowerCase())}"><div class="card-icon">🧭</div><h3>${esc(guide.h1)}</h3><p>${esc(guide.description)}</p><div class="card-meta"><span class="badge blue">Workflow guide</span><span class="badge">Related tools</span></div></a>`;
}

function guidesIndexPage() {
  const content = `<section class="tool-shell"><div class="container"><nav class="breadcrumb"><a href="/">Home</a><span>›</span><span>Guides</span></nav><div class="tool-title-card"><span class="eyebrow">🧭 Practical tool workflows</span><h1>FreeToolCo Guides</h1><p class="lede">Step-by-step workflows that combine multiple FreeToolCo tools for real tasks such as online form uploads, PDF organization, website image optimization, JSON cleanup, and QR code creation.</p></div><div class="section" style="padding-bottom:0"><div class="grid tools">${workflowPages.map(guideCard).join('')}</div></div><article class="prose" style="margin-top:24px"><h2>Why workflow pages matter</h2><p>Most users do not think in isolated tools. They think in outcomes: prepare a form, reduce a file, create a QR code, clean data, or organize a PDF. These guides connect the right tools in the right order.</p></article></div></section>`;
  return layout({
    title: 'FreeToolCo Guides — Practical PDF, Image & Developer Workflows',
    description: 'Follow practical FreeToolCo guides for online form uploads, image compression, PDF organization, JSON cleanup, website image optimization, and QR code creation.',
    canonical: `${siteUrl}/guides/`,
    content,
    structured: [{ '@context': 'https://schema.org', '@type': 'ItemList', name: 'FreeToolCo Guides', itemListElement: workflowPages.map((guide, i) => ({ '@type': 'ListItem', position: i + 1, url: `${siteUrl}/${guide.slug}/`, name: guide.h1 })) }]
  });
}

function workflowPage(guide) {
  const linkedTools = guide.tools.map((slug) => tools.find((tool) => tool.slug === slug)).filter(Boolean);
  const faq = guide.faqs || [];
  const content = `<section class="tool-shell"><div class="container"><nav class="breadcrumb"><a href="/">Home</a><span>›</span><a href="/guides/">Guides</a><span>›</span><span>${esc(guide.h1)}</span></nav><div class="tool-title-card"><span class="eyebrow">🧭 Workflow guide</span><h1>${esc(guide.h1)}</h1><p class="lede">${esc(guide.intro)}</p></div><div class="content-grid"><article class="prose"><h2>Recommended workflow</h2><ol>${guide.steps.map((step) => `<li>${esc(step)}</li>`).join('')}</ol><h2>Tools used in this workflow</h2><ul>${linkedTools.map((tool) => `<li><a href="/${tool.slug}/">${esc(tool.name)}</a> — ${esc(tool.description)}</li>`).join('')}</ul><h2>Why this workflow works</h2><p>It follows a safe order: fix dimensions and format first, then optimize size, then verify the final output. This prevents quality loss and reduces repeated uploads.</p><h2>Frequently asked questions</h2><div class="faq">${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></article><aside class="sidebar-card"><h3>Open a tool</h3><div class="side-links">${linkedTools.map((tool) => `<a href="/${tool.slug}/">${esc(tool.name)}</a>`).join('')}</div></aside></div></div></section>`;
  return layout({
    title: guide.title,
    description: guide.description,
    canonical: `${siteUrl}/${guide.slug}/`,
    content,
    structured: [
      breadcrumbSchema([{ name: 'Home', url: `${siteUrl}/` }, { name: 'Guides', url: `${siteUrl}/guides/` }, { name: guide.h1, url: `${siteUrl}/${guide.slug}/` }]),
      { '@context': 'https://schema.org', '@type': 'HowTo', name: guide.h1, description: guide.description, step: guide.steps.map((step, i) => ({ '@type': 'HowToStep', position: i + 1, text: step })) },
      { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
    ]
  });
}

function toolPage(tool) {
  const category = categoryById(tool.category);
  const related = tools.filter((item) => item.category === tool.category && item.slug !== tool.slug).sort((a, b) => a.priority - b.priority).slice(0, 8);
  const faqs = tool.faqs || defaultFaqs(tool);
  const useCases = tool.category === 'pdf'
    ? ['prepare documents for online forms', 'combine or clean scanned certificates', 'create smaller document files for sharing']
    : tool.category === 'image'
      ? ['prepare photos for forms and profiles', 'optimize website images', 'convert images for compatibility']
      : ['finish daily calculations quickly', 'clean text or developer data', 'copy validated results without installing software'];
  const tips = tool.category === 'pdf'
    ? 'Use valid, unlocked PDF files where possible. For scanned PDFs, text extraction may need OCR because image-only pages do not contain selectable text.'
    : tool.category === 'image'
      ? 'For the best balance of size and quality, start with a clear original image and choose JPG or WebP for smaller photo files.'
      : 'Check empty, zero, or malformed inputs carefully. FreeToolCo shows clear validation messages instead of silent broken results.';
  const content = `<section class="tool-shell"><div class="container"><nav class="breadcrumb"><a href="/">Home</a><span>›</span><a href="/${category.slug}/">${esc(category.shortName)}</a><span>›</span><span>${esc(tool.name)}</span></nav><div class="tool-hero"><article class="tool-title-card"><span class="eyebrow">${iconFor(tool)} ${esc(tool.privacy)} · ${esc(tool.demand)} demand</span><h1>${esc(tool.name)}</h1><p class="lede">${esc(tool.description)}</p><div class="hero-actions"><a class="btn primary" href="#tool-box">Use tool now</a><a class="btn ghost" href="/${category.slug}/">More ${esc(category.shortName)}</a></div></article><aside class="tool-side"><div class="stat-list"><div class="stat"><span>Price</span><strong>Free</strong></div><div class="stat"><span>Signup</span><strong>Not required</strong></div><div class="stat"><span>Privacy</span><strong>${esc(tool.privacy)}</strong></div><div class="stat"><span>Category</span><strong>${esc(category.shortName)}</strong></div></div></aside></div><section class="tool-panel" id="tool-box"><div class="tool-panel-head"><div><h2>${esc(tool.name)} tool</h2><small>${esc(tool.privacy)} · works in modern browsers</small></div><span class="badge">No watermark</span></div><div class="tool-app" id="tool-app"></div></section><div class="content-grid"><article class="prose"><h2>How to use ${esc(tool.name)}</h2><ol><li>Open the tool box above and add your file, text, or values.</li><li>Choose simple options such as quality, size, page range, format, or calculation mode.</li><li>Click the main button, review the result, and download or copy the output.</li></ol><h2>Features</h2><ul>${(tool.features || []).map((feature) => `<li>${esc(feature)}</li>`).join('')}</ul>${renderSeoEnhancement(tool)}<h2>Common uses for ${esc(tool.name)}</h2><ul>${useCases.map((item) => `<li>${esc(item)}</li>`).join('')}</ul><h2>Tips for better results</h2><p>${esc(tips)}</p><h2>Privacy and processing</h2><p><strong>${esc(tool.privacy)}.</strong> FreeToolCo uses visible processing labels so users know whether a tool runs locally in the browser or needs server processing. This tool is designed as a browser-based utility.</p><h2>Frequently asked questions</h2><div class="faq">${faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></article><aside class="sidebar-card"><h3>Related tools</h3><div class="side-links">${related.map((item) => `<a href="/${item.slug}/">${esc(item.name)}</a>`).join('')}</div></aside></div></div></section>`;
  return layout({
    title: tool.title,
    description: tool.description,
    canonical: `${siteUrl}/${tool.slug}/`,
    content,
    structured: [
      breadcrumbSchema([{ name: 'Home', url: `${siteUrl}/` }, { name: category.name, url: `${siteUrl}/${category.slug}/` }, { name: tool.name, url: `${siteUrl}/${tool.slug}/` }]),
      appSchema(tool, category),
      faqSchema(tool),
      howToSchema(tool)
    ],
    scripts: toolScripts(tool)
  });
}

function infoPage(slug, title, description, body) {
  return layout({ title, description, canonical: `${siteUrl}/${slug}/`, content: `<section class="tool-shell"><div class="container"><nav class="breadcrumb"><a href="/">Home</a><span>›</span><span>${esc(title)}</span></nav><div class="tool-title-card"><h1>${esc(title)}</h1><p class="lede">${esc(description)}</p></div><article class="prose" style="margin-top:24px">${body}</article></div></section>` });
}

function build() {
  clean(dist);
  copyDir(path.join(root, 'src/static'), dist);
  ensure(path.join(dist, 'assets/vendor'));
  copy(path.join(root, 'src/css/styles.css'), path.join(dist, 'assets/styles.css'));
  copy(path.join(root, 'src/js/app.js'), path.join(dist, 'assets/app.js'));
  copy(path.join(root, 'node_modules/pdf-lib/dist/pdf-lib.min.js'), path.join(dist, 'assets/vendor/pdf-lib.min.js'));
  copy(path.join(root, 'node_modules/jszip/dist/jszip.min.js'), path.join(dist, 'assets/vendor/jszip.min.js'));
  copy(path.join(root, 'node_modules/qrcode-generator/dist/qrcode.js'), path.join(dist, 'assets/vendor/qrcode.js'));
  copy(path.join(root, 'node_modules/pdfjs-dist/build/pdf.mjs'), path.join(dist, 'assets/vendor/pdf.mjs'));
  copy(path.join(root, 'node_modules/pdfjs-dist/build/pdf.worker.mjs'), path.join(dist, 'assets/vendor/pdf.worker.mjs'));
  write('assets/tools-data.js', `window.FTC_BASE_PATH=${JSON.stringify(basePath)};\nwindow.FTC_SITE_URL=${JSON.stringify(siteUrl)};\nwindow.FTC_CATEGORIES=${JSON.stringify(categories)};\nwindow.FTC_TOOLS=${JSON.stringify(tools)};`);

  write('index.html', homePage());
  write('all-tools/index.html', allToolsPage());
  write('guides/index.html', guidesIndexPage());
  workflowPages.forEach((guide) => write(`${guide.slug}/index.html`, workflowPage(guide)));
  categories.forEach((category) => write(`${category.slug}/index.html`, categoryPage(category)));
  tools.forEach((tool) => write(`${tool.slug}/index.html`, toolPage(tool)));
  write('privacy/index.html', infoPage('privacy', 'FreeToolCo Privacy Policy', 'FreeToolCo is designed around simple, transparent, browser-first privacy.', `<h2>Browser-first processing</h2><p>FreeToolCo is a static browser-first website. The included tools use local browser APIs and bundled local scripts. For these tools, processing happens in your browser after the page has loaded.</p><h2>Network requests</h2><p>The production build does not require third-party CDNs for core tool processing. If analytics or advertising is added later, update this policy before launch.</p><h2>No fake download buttons</h2><p>The interface is intentionally clean and avoids misleading ads or confusing download buttons.</p><h2>Contact</h2><p>For privacy questions, email <a href="mailto:contact@freetoolco.com">contact@freetoolco.com</a>.</p>`));
  write('terms/index.html', infoPage('terms', 'FreeToolCo Terms of Use', 'Simple terms for using FreeToolCo browser-based tools responsibly.', `<h2>Use at your own responsibility</h2><p>FreeToolCo provides free utility tools for convenience. Always review outputs before submitting documents, forms, applications, or business files.</p><h2>No illegal use</h2><p>Do not use FreeToolCo to process, create, hide, or distribute illegal, harmful, or unauthorized content.</p><h2>No warranty</h2><p>Tools are provided as-is. We try to keep them accurate and reliable, but we cannot guarantee suitability for every file, browser, or professional requirement.</p><h2>Contact</h2><p>Questions: <a href="mailto:contact@freetoolco.com">contact@freetoolco.com</a>.</p>`));
  write('contact/index.html', infoPage('contact', 'Contact FreeToolCo Support', 'Contact the FreeToolCo team for bugs, privacy questions, and tool requests.', `<h2>Email</h2><p>For launch support, bug reports, and privacy questions, email <a href="mailto:contact@freetoolco.com">contact@freetoolco.com</a>.</p><h2>Bug report checklist</h2><ul><li>Tool name and URL</li><li>Browser and device</li><li>File type and approximate file size</li><li>Expected result and actual result</li></ul><h2>Tool requests</h2><p>For new tool ideas, use the Request Tool page and include the expected input and output.</p>`));
  write('about/index.html', infoPage('about', 'About FreeToolCo Tools', 'FreeToolCo is a modern all-in-one platform for free browser-based tools.', `<h2>Mission</h2><p>Help students, professionals, creators, developers, and everyday users complete digital tasks quickly without installing software.</p><h2>What makes it different</h2><ul><li>Plugin-style tool registry for easier maintenance.</li><li>Separate SEO page for every tool.</li><li>Visible privacy and processing-mode badges.</li><li>Workflow-based related tools after each task.</li></ul>`));
  write('request-tool/index.html', infoPage('request-tool', 'Request a Free Online Tool', 'Use this page to prepare new tool requests for future FreeToolCo development.', `<h2>Suggested request details</h2><p>Email <a href="mailto:contact@freetoolco.com">contact@freetoolco.com</a> with the tool name, problem description, expected input, expected output, and example use case.</p><h2>Popular future requests</h2><ul><li>Background remover</li><li>PDF OCR</li><li>Video compressor</li><li>Resume builder</li><li>Invoice generator</li></ul>`));

  const urls = ['/', '/all-tools/', '/guides/', ...workflowPages.map((guide) => `/${guide.slug}/`), ...categories.map((category) => `/${category.slug}/`), ...tools.map((tool) => `/${tool.slug}/`), '/privacy/', '/terms/', '/contact/', '/about/', '/request-tool/'];
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `\n  <url><loc>${siteUrl}${url}</loc><changefreq>${url === '/' ? 'daily' : 'weekly'}</changefreq><priority>${url === '/' ? '1.0' : url.includes('-tools') || url === '/all-tools/' ? '0.8' : '0.7'}</priority></url>`).join('')}\n</urlset>`);
  write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
  const manifest = {
    name: 'FreeToolCo — Free Browser Tools',
    short_name: 'FreeToolCo',
    description: 'Free browser-based tools for PDF, images, calculators, text, developer utilities, and QR codes.',
    start_url: withBase('/'),
    scope: withBase('/'),
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#2563eb',
    icons: [
      { src: withBase('/assets/icons/icon-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: withBase('/assets/icons/icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
    ]
  };
  write('manifest.webmanifest', JSON.stringify(manifest, null, 2));
  write('manifest.json', JSON.stringify(manifest, null, 2));
  write('llms.txt', `# FreeToolCo\n\nFreeToolCo is a privacy-first, browser-based toolbox with ${tools.length}+ tools across PDF, image, and daily utility categories. Each tool has a static SEO page, structured data, related links, and a shared plugin architecture.\n`);
  write('.nojekyll', '');
  write('404.html', homePage());

  if (!fs.existsSync(path.join(dist, 'index.html'))) {
    throw new Error('Build failed: dist/index.html was not created. Check the build working directory and script output.');
  }
  console.log(`Built ${urls.length} public pages with ${tools.length} tools. Output: ${dist}. Base path: ${basePath || '/'}.`);
}

build();
