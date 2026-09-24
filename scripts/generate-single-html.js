import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Generating self-contained single-file dist/index.html and dist/404.html...');

const distDir = path.join(__dirname, '..', 'dist');
const distAssetsDir = path.join(distDir, 'assets');

if (!fs.existsSync(distAssetsDir)) {
  console.error('dist/assets directory does not exist! Run npm run build first.');
  process.exit(1);
}

const files = fs.readdirSync(distAssetsDir);
const jsFile = files.find(f => f.endsWith('.js') && f.startsWith('index-'));
const cssFile = files.find(f => f.endsWith('.css') && f.startsWith('index-'));

if (!jsFile || !cssFile) {
  console.error('Could not find compiled index js or css in dist/assets!');
  process.exit(1);
}

console.log('Using JS:', jsFile);
console.log('Using CSS:', cssFile);

const jsContent = fs.readFileSync(path.join(distAssetsDir, jsFile), 'utf8');
const cssContent = fs.readFileSync(path.join(distAssetsDir, cssFile), 'utf8');

// Build single-file index.html
const singleHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rittik Mobile Shop</title>
    <meta name="description" content="Buy and sell premium certified smartphones, customer reviews and star ratings, track orders, and manage cart & wishlist." />
    <meta property="og:title" content="Rittik Mobile Shop" />
    <meta property="og:description" content="Buy and sell premium certified smartphones, customer reviews and star ratings, track orders, and manage cart & wishlist." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDZlMmMzIiBzdHJva2Utd2lkdGg9IjIiPjxyZWN0IHg9IjUiIHk9IjIiIHdpZHRoPSIxNCIgaGVpZ2h0PSIyMCIgcng9IjIiIHJ5PSIyIi8+PGxpbmUgeDE9IjEyIiB5MT0iMTgiIHgyPSIxMi4wMSIgeTI9IjE4Ii8+PC9zdmc+" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
    <script type="module" crossorigin src="/RITTIK-MOBILE-Shop--2/assets/${jsFile}"></script>
    <link rel="stylesheet" crossorigin href="/RITTIK-MOBILE-Shop--2/assets/${cssFile}">
    <style>
${cssContent}
    </style>
  </head>
  <body class="bg-slate-950 text-slate-100 min-h-screen antialiased">
    <div id="root"></div>
  </body>
</html>`;

const distIndexPath = path.join(distDir, 'index.html');
const dist404Path = path.join(distDir, '404.html');

fs.writeFileSync(distIndexPath, singleHtml, 'utf8');
fs.writeFileSync(dist404Path, singleHtml, 'utf8');

console.log('Successfully generated dist/index.html and dist/404.html ready for GitHub Pages!');
