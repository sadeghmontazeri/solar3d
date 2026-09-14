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
console.log('----------------------------------------------------');
console.log(`SUCCESS: Single-file bundle created at: ${outputHtmlPath}`);
console.log(`Output Size: ${outputSize.toLocaleString()} bytes (${(outputSize / 1024 / 1024).toFixed(2)} MB)`);
console.log('----------------------------------------------------');
