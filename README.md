# FreeToolCo

Production-ready static website for **freetoolco.com** with **72 browser-based tools** across three high-demand categories:

1. PDF & Document Tools
2. Image Tools
3. Calculators, Text & Developer Tools

The project is designed for non-technical management using a plugin-style registry in `src/data/tools.js`. Each tool gets its own static SEO page, schema markup, FAQ content, related links, and a shared UI engine.

## Quick start from a clean checkout

```bash
npm ci
npm run build
npm run test
```

The deployable website is generated in `dist/`.

## Deploy

Upload the `dist/` folder to any static host:

- Cloudflare Pages
- Netlify
- Vercel static output
- GitHub Pages
- cPanel/static hosting

Recommended static-host settings:

```txt
Build command: npm run build
Output folder: dist
Node version: 20+
```

## GitHub Pages deployment

This project includes `.github/workflows/deploy-github-pages.yml` so GitHub Pages publishes the correct directory: `dist/`.

For a GitHub Pages project URL such as:

```txt
https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/
```

the workflow automatically builds with:

```txt
BASE_PATH=/YOUR_REPOSITORY
SITE_URL=https://YOUR_USERNAME.github.io/YOUR_REPOSITORY
```

This fixes root-absolute URL bugs such as `/assets/...` and `/jpg-to-pdf/` breaking under a project URL.

In GitHub repository settings, set:

```txt
Settings → Pages → Source → GitHub Actions
```

If you later use a custom domain such as `https://freetoolco.com`, build normally with no `BASE_PATH`:

```bash
npm run build
```

After build, verify `dist/index.html` exists:

```bash
npm run verify:dist
```

## Add a new tool

1. Open `src/data/tools.js`.
2. Copy an existing tool object from the same category.
3. Change `slug`, `name`, `title`, `description`, `keywords`, `features`, and `engine`.
4. If using an existing engine, no code change is needed.
5. Run `npm run test`.
6. Deploy the new `dist/` folder.

## Add a new category

1. Add a new object to `categories` in `src/data/tools.js`.
2. Set `id`, `name`, `slug`, `icon`, `color`, `description`, SEO title, and SEO description.
3. Assign tools to the new `category` id.
4. Run `npm run test`.

## Current engines

- PDF: image to PDF, merge, split, extract, delete pages, rotate, reorder, watermark, page numbers, metadata viewer/cleaner, page count, basic PDF optimizer, PDF to image, PDF to text.
- Images: resize, compress, target KB compression, convert, crop, rotate, flip, grayscale, watermark, metadata cleanup, Base64, passport photo, signature resize, favicon ZIP.
- Daily/dev: calculators, word/character counter, text cleanup, JSON tools, CSV converters, Base64, URL codec, password/UUID/hash generators, regex tester, QR generator.

## Testing

`npm run test` runs:

- JavaScript syntax checks
- build test
- tool registry audit
- 50-loop SEO audit

The SEO audit checks titles, meta descriptions, canonical URLs, robots meta, Open Graph/Twitter data, sitemap, schema, H1s, internal links, and tool mounts.

## Contact route

The static launch contact email used in legal/support pages is:

```txt
contact@freetoolco.com
```

Update this in `scripts/build.js` if you want to use a different email before deployment.
