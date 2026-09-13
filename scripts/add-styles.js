const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../css/styles.css');
let css = fs.readFileSync(targetPath, 'utf8');

const newStyles = `
/* ==========================================================================
   SBY Changeover Switch & HYB-FA-001 Section 19/21/24 Modals & Controls
   ========================================================================== */

/* Telemetry Badge SBY */
.telemetry-badge.sby {
  border-color: rgba(168, 85, 247, 0.4);
  background: linear-gradient(135deg, rgba(30, 27, 75, 0.6) 0%, rgba(17, 24, 39, 0.8) 100%);
}
.telemetry-badge.sby:hover {
  border-color: var(--eps-magenta);
  box-shadow: 0 0 15px var(--eps-magenta-glow);
  transform: translateY(-2px);
}

/* SBY Cockpit Button Group */
.sby-control-group {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}
.sby-pos-btn {
  flex: 1;
  padding: 8px 4px;
  border-radius: var(--radius-sm);
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid var(--glass-border);
  color: var(--text-secondary);
  font-family: var(--font-persian);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-quick);
  text-align: center;
}
.sby-pos-btn:hover {
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
  transform: translateY(-1px);
}
.sby-pos-btn.active[data-pos="I"] {
  background: rgba(88, 28, 135, 0.6);
  border-color: #a855f7;
  color: #f3e8ff;
  box-shadow: 0 0 12px rgba(168, 85, 247, 0.35);
}
.sby-pos-btn.active[data-pos="0"] {
  background: rgba(127, 29, 29, 0.6);
  border-color: #ef4444;
  color: #fee2e2;
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.35);
}
.sby-pos-btn.active[data-pos="II"] {
  background: rgba(3, 105, 161, 0.6);
  border-color: #0284c7;
  color: #e0f2fe;
  box-shadow: 0 0 12px rgba(2, 132, 199, 0.35);
}

/* Troubleshooting Modal */
.modal-window.troubleshoot-modal {
  width: 1050px;
  height: 820px;
}
.troubleshoot-search-bar {
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.25);
  border-bottom: 1px solid var(--glass-border);
  display: flex;
  gap: 12px;
  align-items: center;
}
.troubleshoot-search-input {
  flex: 1;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  padding: 8px 14px;
  color: #fff;
  font-family: var(--font-persian);
  font-size: 0.85rem;
  outline: none;
}
.troubleshoot-search-input:focus {
  border-color: var(--solar-amber);
  box-shadow: 0 0 10px var(--solar-amber-glow);
}
.troubleshoot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(460px, 1fr));
  gap: 14px;
  padding: 20px;
  overflow-y: auto;
  max-height: calc(820px - 140px);
}
.troubleshoot-card {
  background: rgba(17, 24, 39, 0.7);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all var(--transition-quick);
}
.troubleshoot-card:hover {
  border-color: rgba(245, 158, 11, 0.5);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  transform: translateY(-2px);
}
.fault-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.fault-num-badge {
  background: rgba(245, 158, 11, 0.15);
  color: var(--solar-amber);
  border: 1px solid var(--solar-amber);
  border-radius: var(--radius-sm);
  padding: 2px 8px;
  font-size: 0.75rem;
  font-weight: 800;
  font-family: var(--font-mono);
}
.fault-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.4;
}
.fault-section {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 0.8rem;
}
.fault-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
}
.fault-causes {
  color: #cbd5e1;
  line-height: 1.45;
}
.fault-action {
  color: #38bdf8;
  line-height: 1.45;
  background: rgba(2, 132, 199, 0.1);
  padding: 6px 10px;
  border-radius: 4px;
  border-right: 3px solid #0284c7;
}
.fault-warning {
  color: #fca5a5;
  line-height: 1.45;
  background: rgba(239, 68, 68, 0.1);
  padding: 6px 10px;
  border-radius: 4px;
  border-right: 3px solid #ef4444;
  font-size: 0.78rem;
}

/* FAT / SAT Modal */
.modal-window.fatsat-modal {
  width: 1080px;
  height: 820px;
}
.fatsat-table-wrapper {
  padding: 16px 20px;
  overflow-y: auto;
  max-height: calc(820px - 120px);
}
.fatsat-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  text-align: right;
}
.fatsat-table th {
  background: rgba(15, 23, 42, 0.9);
  color: var(--solar-amber);
  padding: 10px 12px;
  border: 1px solid var(--glass-border);
  font-weight: 700;
  position: sticky;
  top: 0;
  z-index: 2;
}
.fatsat-table td {
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
  line-height: 1.45;
  vertical-align: top;
}
.fatsat-table tr:hover td {
  background: rgba(30, 41, 59, 0.5);
}
.fatsat-test-title {
  font-weight: 700;
  color: #fff;
  font-size: 0.85rem;
}
.fatsat-std-badge {
  display: inline-block;
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid #10b981;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.72rem;
  font-family: var(--font-mono);
  margin-top: 4px;
}
`;

if (!css.includes('.modal-window.troubleshoot-modal')) {
  css += '\n' + newStyles;
  fs.writeFileSync(targetPath, css, 'utf8');
  console.log('Added troubleshoot & FAT/SAT & SBY styles to css/styles.css');
} else {
  console.log('Styles already present in css/styles.css');
}
