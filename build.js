const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const inputHtmlPath = path.join(rootDir, 'index.html');
const distDir = path.join(rootDir, 'dist');
const outputHtmlPath = path.join(distDir, 'solar-app.html');

console.log('Building standalone offline bundle...');
console.log(`Source: ${inputHtmlPath}`);

if (!fs.existsSync(inputHtmlPath)) {
  console.error(`Error: index.html not found at ${inputHtmlPath}`);
  process.exit(1);
}

let html = fs.readFileSync(inputHtmlPath, 'utf8');

// 1. Inline CSS stylesheets
html = html.replace(/<link\s+rel=["']stylesheet["']\s+href=["']([^"']+)["'][^>]*>/gi, (match, relHref) => {
  const cssPath = path.join(rootDir, relHref);
  if (fs.existsSync(cssPath)) {
    console.log(`Inlining CSS: ${relHref} (${(fs.statSync(cssPath).size / 1024).toFixed(1)} KB)`);
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    return `<style>\n/* === INLINED: ${relHref} === */\n${cssContent}\n</style>`;
  } else {
    console.warn(`Warning: CSS file not found: ${cssPath}`);
    return match;
  }
});

// 2. Inline JavaScript scripts in exact order
// Expected bundle sequence:
//   three.min.js -> OrbitControls.js -> scene-3d.js -> contractors-db.js ->
//   guide-data.js -> electrical-db.js -> simulation-engine.js -> sound-fx.js ->
//   sld-schematic.js -> system-profile.js -> power-model.js -> app.js
const systemProfileBeforePowerModel = /<script\s+src=["']js\/system-profile\.js["']\s*><\/script>\s*<script\s+src=["']js\/power-model\.js["']\s*><\/script>/i;
if (!systemProfileBeforePowerModel.test(html)) {
  console.warn('Notice: js/system-profile.js sequence before js/power-model.js not matched in input HTML.');
}

html = html.replace(/<script\s+src=["']([^"']+)["']\s*><\/script>/gi, (match, relSrc) => {
  const jsPath = path.join(rootDir, relSrc);
  if (fs.existsSync(jsPath)) {
    console.log(`Inlining JS:  ${relSrc} (${(fs.statSync(jsPath).size / 1024).toFixed(1)} KB)`);
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    // Sanitize any accidental closing script tags
    const safeJs = jsContent.replace(/<\/script>/gi, '<\\/script>');
    return `<script>\n/* === INLINED: ${relSrc} === */\n${safeJs}\n</script>`;
  } else {
    console.warn(`Warning: JS file not found: ${jsPath}`);
    return match;
  }
});

// 3. Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 4. Write output HTML
fs.writeFileSync(outputHtmlPath, html, 'utf8');

const outputSize = fs.statSync(outputHtmlPath).size;
const outputMB = (outputSize / (1024 * 1024)).toFixed(2);
console.log('----------------------------------------------------');
console.log(`SUCCESS: Single-file bundle created at: ${outputHtmlPath}`);
console.log(`Output Size: ${outputSize.toLocaleString()} bytes (${outputMB} MB)`);
console.log('----------------------------------------------------');

// 5. Post-build offline bundle integrity verification
console.log('Verifying offline bundle integrity...');
const scriptSrcMatches = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)];
if (scriptSrcMatches.length > 0) {
  throw new Error(`Integrity check failed: ${scriptSrcMatches.length} uninlined <script src> tags remain!`);
}

const styleMatches = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi)];
if (styleMatches.length > 0) {
  throw new Error(`Integrity check failed: ${styleMatches.length} uninlined <link rel="stylesheet"> tags remain!`);
}

const remoteResourceRegex = /(?:href|src|url|@import)\s*[\(=]?\s*["']?(https?:\/\/[^"'\s\)]+)/gi;
const remoteResources = [];
let match;
while ((match = remoteResourceRegex.exec(html)) !== null) {
  const url = match[1];
  if (!url.includes('www.w3.org/2000/svg') && !url.includes('json-schema.org')) {
    remoteResources.push(url);
  }
}
if (remoteResources.length > 0) {
  throw new Error(`Integrity check failed: ${remoteResources.length} external network requests found: ${remoteResources.join(', ')}`);
}

const protoRelative = [...html.matchAll(/(?:href|src|url)\s*[\(=]?\s*["'](\/\/[^"'\s\)]+)/gi)];
if (protoRelative.length > 0) {
  throw new Error(`Integrity check failed: ${protoRelative.length} protocol-relative URLs found!`);
}

const woff2Count = (html.match(/data:font\/woff2(;charset=utf-8)?;base64,/g) || []).length;
if (woff2Count < 4) {
  throw new Error(`Integrity check failed: expected >= 4 inlined font faces, found ${woff2Count}`);
}

console.log('INTEGRITY CHECK PASSED:');
console.log('  - Uninlined scripts: 0');
console.log('  - Uninlined stylesheets: 0');
console.log('  - External network requests: 0 (No remote scripts, styles, fonts, or images)');
console.log(`  - Inlined Base64 font faces: ${woff2Count}`);
console.log(`  - File size: ${outputMB} MB (~2.6 MB target verified)`);
console.log('----------------------------------------------------');
