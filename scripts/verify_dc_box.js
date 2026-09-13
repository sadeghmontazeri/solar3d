const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('--- 1. Testing JS Syntax for all modified files ---');
const filesToTest = [
  'js/scene-3d.js',
  'js/app.js',
  'js/sld-schematic.js',
  'js/electrical-db.js'
];

for (const file of filesToTest) {
  const fullPath = path.join(process.cwd(), file);
  const code = fs.readFileSync(fullPath, 'utf8');
  try {
    new vm.Script(code, { filename: file });
    console.log('✓ VM Script parsed cleanly: ' + file);
  } catch (vmErr) {
    console.error('✗ Parse error in ' + file + ':', vmErr.message);
    process.exit(1);
  }
}

console.log('\n--- 2. Checking index.html DOM Elements ---');
const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
const requiredIds = [
  'quick-btn-dc-box',
  'quick-btn-dc-door',
  'btn-toggle-dc-door',
  'btn-toggle-mdb-door',
  'btn-toggle-eps-door',
  'quick-btn-mdb',
  'quick-btn-wiring',
  'quick-btn-terminals',
  'quick-btn-eps',
  'quick-btn-door',
  'quick-btn-overview'
];

for (const id of requiredIds) {
  if (indexHtml.includes('id="' + id + '"')) {
    console.log('✓ Element found in HTML: #' + id);
  } else {
    console.error('✗ Element missing in HTML: #' + id);
    process.exit(1);
  }
}

console.log('\n--- 3. Checking DC Combiner Box Elements in SLD Schematic ---');
const sldCode = fs.readFileSync(path.join(process.cwd(), 'js/sld-schematic.js'), 'utf8');
const sldRequired = [
  'string_fuse_pos',
  'string_fuse_neg',
  'F1+ (gPV)',
  'F1- (gPV)',
  'F2+ (gPV)',
  'F2- (gPV)',
  '#ef4444',
  '#38bdf8'
];

for (const req of sldRequired) {
  if (sldCode.includes(req)) {
    console.log('✓ SLD contains: ' + req);
  } else {
    console.error('✗ SLD missing: ' + req);
    process.exit(1);
  }
}

console.log('\n--- 4. Checking 3D DC Combiner Box Components in scene-3d.js ---');
const sceneCode = fs.readFileSync(path.join(process.cwd(), 'js/scene-3d.js'), 'utf8');
const sceneRequired = [
  'string_fuse_pos_1',
  'string_fuse_neg_1',
  'string_fuse_pos_2',
  'string_fuse_neg_2',
  'dc_iso_1',
  'dc_iso_2',
  'dc_spd_1',
  'dc_spd_2',
  'dc_pe_bar',
  'dc_door',
  'toggleDCDoor',
  'openDCDoor',
  'dcDoorHinge',
  'dcDoorTargetAngle',
  '0xdc2626',
  '0x2563eb',
  '0x16a34a'
];

for (const req of sceneRequired) {
  if (sceneCode.includes(req)) {
    console.log('✓ 3D Scene contains: ' + req);
  } else {
    console.error('✗ 3D Scene missing: ' + req);
    process.exit(1);
  }
}

console.log('\n==========================================');
console.log('ALL DC COMBINER BOX VERIFICATION CHECKS PASSED!');
console.log('==========================================');
