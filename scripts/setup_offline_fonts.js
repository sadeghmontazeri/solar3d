const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, '..', 'assets', 'fonts');
const cssDir = path.join(__dirname, '..', 'css');
const fontsCssPath = path.join(cssDir, 'fonts.css');

if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

const fonts = [
  { name: 'Vazirmatn-Regular.woff2', weight: 400, url: 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-Regular.woff2' },
  { name: 'Vazirmatn-SemiBold.woff2', weight: 600, url: 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-SemiBold.woff2' },
  { name: 'Vazirmatn-Bold.woff2', weight: 700, url: 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-Bold.woff2' },
  { name: 'Vazirmatn-ExtraBold.woff2', weight: 800, url: 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-ExtraBold.woff2' }
];

const licenseUrl = 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/OFL.txt';

async function setup() {
  console.log('1. Downloading license...');
  const licRes = await fetch(licenseUrl);
  const licText = await licRes.text();
  fs.writeFileSync(path.join(fontsDir, 'LICENSE'), licText, 'utf8');
  console.log('Saved assets/fonts/LICENSE');

  let cssRules = '/* ==========================================================================\n' +
                 '   Vazirmatn Persian WebFont — Offline Base64 Embeddings\n' +
                 '   Weights: 400 (Regular), 600 (SemiBold), 700 (Bold), 800 (ExtraBold)\n' +
                 '   License: SIL Open Font License (assets/fonts/LICENSE)\n' +
                 '   ========================================================================== */\n\n';

  for (const f of fonts) {
    console.log(`2. Fetching ${f.name} (weight ${f.weight})...`);
    const res = await fetch(f.url);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filePath = path.join(fontsDir, f.name);
    fs.writeFileSync(filePath, buffer);
    console.log(`Saved ${filePath} (${(buffer.length / 1024).toFixed(1)} KB)`);

    const base64 = buffer.toString('base64');
    cssRules += `@font-face {\n` +
                `  font-family: 'Vazirmatn';\n` +
                `  font-style: normal;\n` +
                `  font-weight: ${f.weight};\n` +
                `  font-display: swap;\n` +
                `  src: url('data:font/woff2;base64,${base64}') format('woff2');\n` +
                `}\n\n`;
  }

  fs.writeFileSync(fontsCssPath, cssRules, 'utf8');
  console.log(`Generated ${fontsCssPath} (${(fs.statSync(fontsCssPath).size / 1024).toFixed(1)} KB)`);
  console.log('Done!');
}

setup().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
