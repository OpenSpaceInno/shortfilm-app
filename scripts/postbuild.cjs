const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..', '.output', 'public');
const distDir = path.resolve(__dirname, '..', 'dist');

if (fs.existsSync(srcDir)) {
  fs.cpSync(srcDir, distDir, { recursive: true });
  console.log(`[PWA Build] Copied .output/public -> dist successfully.`);

  // Find the primary entry CSS and JS
  const assetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    const cssFile = files.find(f => f.startsWith('styles-') && f.endsWith('.css')) || '';
    const mainJs = files.find(f => f.startsWith('index-') && f.endsWith('.js')) || '';

    const indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
  <meta name="theme-color" content="#09090b" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="ShortReel" />
  <title>ShortReel — Vertical Short-Series OTT</title>
  <meta name="description" content="Vertical short-series streaming: binge dramas, thrillers and romance in portrait." />
  <link rel="manifest" href="/manifest.json" />
  <link rel="icon" href="/favicon.ico" type="image/x-icon" />
  <link rel="apple-touch-icon" href="/icon-192.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" />
  ${cssFile ? `<link rel="stylesheet" href="/assets/${cssFile}" />` : ''}
</head>
<body class="bg-black text-foreground antialiased selection:bg-primary/20">
  <div id="root"></div>
  ${mainJs ? `<script type="module" src="/assets/${mainJs}"></script>` : ''}
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }
  </script>
</body>
</html>
`;

    fs.writeFileSync(path.join(distDir, 'index.html'), indexHtmlContent, 'utf-8');
    fs.writeFileSync(path.join(srcDir, 'index.html'), indexHtmlContent, 'utf-8');
    console.log(`[PWA Build] Generated dist/index.html and .output/public/index.html successfully.`);
  }
} else {
  console.log(`[PWA Build] Source directory ${srcDir} not found, skipping sync.`);
}
