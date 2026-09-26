# FreeToolCo Research, UX, and SEO Plan

## Competitor patterns mapped

The project is planned from the common winning patterns of successful browser tool websites:

- PDF tools: task-first upload boxes, no-install language, no-signup flows, trust badges, related PDF workflows, FAQ/how-to content.
- Image tools: drag and drop, quality controls, before/after size feedback, browser-local processing, target-size compression, batch export.
- Calculator/content tools: instant results, formulas, examples, explanatory text, internal linking by category.
- Developer tools: live validation, exact errors, copy/download buttons, dark mode, local processing.
- QR tools: simple content entry, customization, PNG/SVG export, no signup for static QR codes.

## FreeToolCo differentiation

1. Three-category architecture to keep navigation simple.
2. Processing-mode badges on every tool page.
3. Plugin registry for easier non-technical management.
4. Static SEO page per tool rather than SPA-only rendering.
5. Long-tail practical utilities for India-style form uploads: image to 20KB, 50KB, 100KB, passport photo, signature resizer.
6. No fake download buttons or confusing ad placement in the design.
7. Shared result pattern: download/copy + related tool links.

## SEO system

Every tool page has:

- Unique URL
- Unique title tag
- Unique meta description
- Canonical link
- One H1
- Breadcrumb links
- Static explanatory content
- Feature bullets
- FAQ section
- Related tools
- WebApplication schema
- FAQPage schema
- HowTo schema
- Sitemap inclusion

## Technical SEO optimization

- Static HTML output in `dist/`
- No client-side routing dependency for discoverability
- Clean semantic structure
- Lazy/conditional vendor loading by tool engine
- Sitemap and robots.txt generated automatically
- Internal links generated from registry
- Category ItemList schema
- WebSite SearchAction schema on homepage

## UI/UX design system

- Trust-heavy blue/cyan/green color system
- Soft card surfaces and modern rounded upload panels
- System font stack for speed and privacy
- Sticky navigation
- Command-style search opened with `/`
- Responsive mobile-first grids
- Dark mode support
- Large CTAs above the fold
- Clear upload, options, progress, output, preview, and related content areas

## Launch recommendation

1. Deploy current 72-tool static build.
2. Connect Google Search Console and Bing Webmaster Tools.
3. Submit `/sitemap.xml`.
4. Manually test the top 20 tools on mobile and desktop.
5. Create extra long-tail landing pages after search impressions appear.
6. Add server/API tools later only after local-browser tools rank and bring repeat traffic.
