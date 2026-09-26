# GitHub Pages Deployment Fixes

This project supports both custom-domain deployment and GitHub Pages project URLs.

## The three GitHub bugs fixed

### Bug 1: Build does not create `dist/index.html`

Run from the project root:

```bash
npm ci
npm run build
npm run verify:dist
```

`npm run verify:dist` fails clearly if `dist/index.html` or required runtime assets are missing.

### Bug 2: GitHub Pages publishes the wrong directory

Use the included GitHub Actions workflow:

```txt
.github/workflows/deploy-github-pages.yml
```

In your repository settings, choose:

```txt
Settings → Pages → Source → GitHub Actions
```

The workflow uploads `./dist` as the Pages artifact.

### Bug 3: Absolute URLs break under the GitHub Pages project URL

GitHub Pages project sites are usually served from:

```txt
https://USERNAME.github.io/REPOSITORY/
```

The workflow automatically builds with:

```txt
BASE_PATH=/REPOSITORY
SITE_URL=https://USERNAME.github.io/REPOSITORY
```

This makes assets and links resolve as:

```txt
/REPOSITORY/assets/styles.css
/REPOSITORY/jpg-to-pdf/
```

instead of the broken root paths:

```txt
/assets/styles.css
/jpg-to-pdf/
```

## Manual GitHub Pages build

If you are not using the workflow, build manually like this:

```bash
BASE_PATH=/YOUR_REPOSITORY SITE_URL=https://YOUR_USERNAME.github.io/YOUR_REPOSITORY npm run build
npm run verify:dist
```

Then publish the generated `dist/` directory.

## Custom domain build

For `https://freetoolco.com`, use the normal build with no base path:

```bash
npm run build
```
