import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const distDir = resolve(root, 'dist');
const htmlPath = resolve(distDir, 'index.html');
const swSrc = resolve(root, 'public', 'sw.js');
const swOut = resolve(distDir, 'sw.js');

if (!existsSync(htmlPath)) {
  console.error('inject-pwa: dist/index.html not found — run `expo export -p web` first.');
  process.exit(1);
}

const buildId = `${Date.now().toString(36)}-${process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local'}`;

const headInject = `
    <meta name="theme-color" content="#0B0F1A" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="MyGoal" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="format-detection" content="telephone=no" />
    <meta name="build-id" content="${buildId}" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="icon" type="image/svg+xml" href="/icon.svg" />
    <link rel="apple-touch-icon" href="/icon.svg" />
`;

const swScript = `
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('/sw.js').then(function (reg) {
            reg.update();
          }).catch(function () {});
        });
      }
    </script>
`;

let html = readFileSync(htmlPath, 'utf8');

if (!html.includes('manifest.webmanifest')) {
  html = html.replace('</head>', `${headInject}</head>`);
}
if (!html.includes("serviceWorker.register('/sw.js')")) {
  html = html.replace('</body>', `${swScript}</body>`);
}

writeFileSync(htmlPath, html, 'utf8');

if (existsSync(swSrc)) {
  const sw = readFileSync(swSrc, 'utf8').replace(/__BUILD__/g, buildId);
  writeFileSync(swOut, sw, 'utf8');
}

console.log(`inject-pwa: PWA tags + service worker injected (build ${buildId})`);
