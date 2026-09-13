const fs = require('fs');

console.log('=== FULL AUDIT OF 10 SYSTEM DIMENSIONS ===');

const db = require('../js/electrical-db.js');
const dbObj = db.PERSIAN_ELECTRICAL_DB || global.PERSIAN_ELECTRICAL_DB;

console.log('components type:', typeof dbObj.components, Array.isArray(dbObj.components) ? 'array' : 'object');
const compKeys = Object.keys(dbObj.components);
console.log('Total component keys:', compKeys.length);
console.log('Component IDs:', compKeys);

const whyList = Array.isArray(dbObj.why_data)
  ? dbObj.why_data
  : (dbObj.why_data && typeof dbObj.why_data === 'object' ? Object.values(dbObj.why_data) : []);
console.log('why_data count:', whyList.length);
if (whyList.length > 0) {
  console.log('why_data titles:', whyList.map(w => w.title || w.topic || w.question || '(untitled)'));
}

console.log('fat_sat_tests length:', dbObj.fat_sat_tests ? dbObj.fat_sat_tests.length : 0);
if (dbObj.fat_sat_tests) {
  console.log('Sample FAT/SAT test:', dbObj.fat_sat_tests[0]);
}

console.log('troubleshooting_matrix length:', dbObj.troubleshooting_matrix ? dbObj.troubleshooting_matrix.length : 0);
if (dbObj.troubleshooting_matrix) {
  console.log('Sample troubleshooting item:', dbObj.troubleshooting_matrix[0]);
}

const checkListCount = dbObj.checklists ? Object.keys(dbObj.checklists).length : 0;
console.log('checklists count:', checkListCount);
const calcCount = dbObj.calculators ? Object.keys(dbObj.calculators).length : 0;
console.log('calculators count:', calcCount);

