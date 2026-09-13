/**
 * Builder script to generate js/electrical-db.js
 * Run with: node scripts/build-db.js
 */

const fs = require('fs');
const path = require('path');
const { components } = require('./data-components');
const {
  why_data,
  fat_sat_tests,
  troubleshooting_matrix,
  checklists,
  calculators
} = require('./data-knowledge');

const header = `/**
 * ==============================================================================
 * 5kW Single-Phase Hybrid Solar PV 3D Simulator
 * Persian Electrical Database & Engineering Knowledge Base (PERSIAN_ELECTRICAL_DB)
 * Document Code: HYB-FA-001 Rev A (Single-Phase Architecture SLD-01)
 * Standards Compliance: IEC 60364-7-712, IEC 62109-1/2, IEC 62477, IEC 61643-11/31,
 *                       IEC 62619, IEC 61009-1, IEC 60898-1, IEEE 1547, VDE-AR-N 4105,
 *                       AS/NZS 4777.2, IEC 62446-1
 * ==============================================================================
 */

`;

const dbContent = `const PERSIAN_ELECTRICAL_DB = {
  // ============================================================================
  // 1. 27 CORE SINGLE-PHASE ELECTRICAL COMPONENTS (HYB-FA-001 SLD-01)
  // ============================================================================
  components: ${JSON.stringify(components, null, 2)},

  // ============================================================================
  // 2. 11 DETAILED "WHY?" ENGINEERING POPUPS & DEEP ELECTRICAL PHYSICS
  // ============================================================================
  why_data: ${JSON.stringify(why_data, null, 2)},

  // ============================================================================
  // 3. 22-POINT FAT/SAT COMMISSIONING TESTS MATRIX (SECTION 19)
  // ============================================================================
  fat_sat_tests: ${JSON.stringify(fat_sat_tests, null, 2)},

  // ============================================================================
  // 4. 20 OPERATIONAL TROUBLESHOOTING FAULTS & RESPONSES (SECTION 21)
  // ============================================================================
  troubleshooting_matrix: ${JSON.stringify(troubleshooting_matrix, null, 2)},

  // ============================================================================
  // 5. 5 SUPERVISOR CHECKLISTS (ACCEPTANCE CRITERIA, METHODS & WARNINGS)
  // ============================================================================
  checklists: ${JSON.stringify(checklists, null, 2)},

  // ============================================================================
  // 6. 5 REACTIVE ELECTRICAL ENGINEERING CALCULATORS
  // ============================================================================
  calculators: ${JSON.stringify(calculators, null, 2)}
};

// Export to global window object for browser and module.exports for Node
if (typeof window !== "undefined") {
  window.PERSIAN_ELECTRICAL_DB = PERSIAN_ELECTRICAL_DB;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { PERSIAN_ELECTRICAL_DB };
}
`;

const fullFile = header + dbContent;
const targetPath = path.resolve(__dirname, '../js/electrical-db.js');

fs.writeFileSync(targetPath, fullFile, 'utf8');
console.log(`Successfully built ${targetPath} (${fs.statSync(targetPath).size} bytes)`);
