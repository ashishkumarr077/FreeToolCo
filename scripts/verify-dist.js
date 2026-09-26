import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const required = [
  'index.html',
  'assets/app.js',
  'assets/styles.css',
  'assets/tools-data.js',
  'sitemap.xml',
  'robots.txt',
  'manifest.webmanifest',
  '.nojekyll'
];
const missing = required.filter((file) => !fs.existsSync(path.join(dist, file)));
if (missing.length) {
  console.error(`dist verification failed. Missing: ${missing.join(', ')}`);
  console.error(`Expected build output directory: ${dist}`);
  process.exit(1);
}
console.log(`dist verification passed: ${required.length} required files found in ${dist}`);
