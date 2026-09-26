# FreeToolCo Changelog

## 1.2.0 — SEO/content and production-polish upgrade

- Added researched workflow guide pages for online-form document preparation, image compression, image-to-PDF workflows, PDF organization, website image optimization, JSON cleanup, and business QR code creation.
- Added a Guides hub and navigation/footer links.
- Added deeper unique SEO sections for high-priority tools such as JPG to PDF, Merge PDF, Compress PDF, Image Compressor, target-KB image tools, Passport Photo Resizer, Signature Resizer, JSON Formatter, QR Code Generator, Word Counter, Age Calculator, GST Calculator, and Password Generator.
- Added competitor-informed content patterns: best-use cases, example workflows, troubleshooting, and quality notes.
- Expanded sitemap and SEO audit coverage for guide pages.

## 1.1.1 — GitHub Pages deployment fixes

- Added `BASE_PATH` and `SITE_URL` build support for GitHub Pages project URLs.
- Added GitHub Actions workflow that publishes the correct `dist/` directory.
- Added `.nojekyll` to the generated output.
- Added `npm run verify:dist` to fail clearly if `dist/index.html` or required assets are missing.
- Updated runtime search links and PDF worker path to respect the GitHub Pages base path.
- Updated manifest icon paths/start URL/scope for project-page deployment.

## 1.1.0 — Pre-launch bug-fix pass

- Added merge-PDF file ordering controls: move up, move down, remove, clear.
- Added processing guards to prevent duplicate file-processing submissions.
- Improved friendly error handling for invalid PDFs, password-protected PDFs, bad images, malformed Base64, malformed JSON, and QR errors.
- Reworded PDF compression/optimization messaging to avoid guaranteed-size claims.
- Reworded PDF metadata cleaner to accurately describe common metadata-field cleanup.
- Improved PDF-to-text behavior for scanned/image-only PDFs.
- Improved target-size image compression with iteration limits, quality/dimension fallback, and clear warning when target size is not reasonably reachable.
- Added safer Base64-to-image validation for raster image data URLs only.
- Fixed date calculator month-end/leap-year behavior with clamped month addition.
- Fixed regex tester non-global flag handling so matchAll-style processing no longer fails without `g`.
- Expanded unit converter to include Length, Weight, Temperature, Area, and Volume.
- Added calculator validation to avoid NaN/Infinity output.
- Added favicon, PWA icons, manifest.webmanifest, favicon.ico, and Open Graph image.
- Added Terms and Contact pages with non-placeholder `contact@freetoolco.com` contact route.
- Updated SEO audit to use dynamic page/tool counts instead of hard-coded totals.
- Added syntax checks to the test command.
- Verified npm ci, npm audit, build, tool audit, SEO audit, and HTTP smoke tests.
