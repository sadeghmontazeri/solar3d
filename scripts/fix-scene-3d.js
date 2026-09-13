const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../js/scene-3d.js');
let code = fs.readFileSync(targetPath, 'utf8');

// 1. Add SBY 3D switch in EPS panel after line 2065
if (!code.includes("id: 'sby_switch'")) {
  const insertTarget = `    this.switchgear['eps_mcb'] = { type: 'lever', object: qEpsLeverGroup, currentAngle: 0.45, targetAngle: 0.45, state: true };
    epsGroup.add(qEpsGroup);`;

  const sby3DBlock = `    this.switchgear['eps_mcb'] = { type: 'lever', object: qEpsLeverGroup, currentAngle: 0.45, targetAngle: 0.45, state: true };
    epsGroup.add(qEpsGroup);

    // SBY: 3-Position Manual Changeover / Bypass Switch (I - 0 - II) per SLD-01
    const sbyGroup = new THREE.Group();
    sbyGroup.position.set(0.045, 0.16, 0.025);
    const sbyBody = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.085, 0.068), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 }));
    sbyGroup.add(sbyBody);

    const sbyKnobGroup = new THREE.Group();
    sbyKnobGroup.position.set(0, 0, 0.038);
    const sbyDial = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.020, 0.014, 24), new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 }));
    sbyDial.rotation.x = Math.PI / 2;
    sbyKnobGroup.add(sbyDial);

    const sbyPointer = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.024, 0.006), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    sbyPointer.position.set(0, 0.007, 0.009);
    sbyKnobGroup.add(sbyPointer);
    sbyGroup.add(sbyKnobGroup);

    sbyDial.userData = { id: 'sby_switch', type: 'SWITCH', name: 'SBY: کلید گردان تبدیل دستی سه‌حالته (I - 0 - II)', action: 'toggle' };
    this.interactiveObjects.push(sbyDial);
    this.switchgear['sby_switch'] = {
      type: 'rotary',
      object: sbyKnobGroup,
      currentAngle: -Math.PI / 4,
      targetAngle: -Math.PI / 4,
      state: 'I'
    };
    epsGroup.add(sbyGroup);`;

  code = code.replace(insertTarget, sby3DBlock);
}

// 2. Add setSbyPosition3D method and update toggleBreaker3D with aliases
if (!code.includes('setSbyPosition3D(pos)')) {
  const toggleTarget = `  toggleBreaker3D(id, state, animated = true) {
    const sw = this.switchgear[id];
    if (!sw) {
      console.warn(\`[HybridSolar3DScene] Switchgear not found: \${id}\`);
      return;
    }`;

  const toggleReplacement = `  setSbyPosition3D(pos) {
    const sw = this.switchgear['sby_switch'];
    if (!sw) return;
    sw.state = pos;
    // 'I' = -Math.PI / 4 (EPS), '0' = 0 (OFF), 'II' = Math.PI / 4 (Grid Bypass)
    if (pos === 'I') sw.targetAngle = -Math.PI / 4;
    else if (pos === '0') sw.targetAngle = 0;
    else if (pos === 'II') sw.targetAngle = Math.PI / 4;
    this._emit('switchChange', { id: 'sby_switch', state: pos });
  }

  toggleBreaker3D(id, state, animated = true) {
    if (id === 'sby_switch') {
      if (['I', '0', 'II'].includes(state)) {
        return this.setSbyPosition3D(state);
      }
      const cur = this.switchgear['sby_switch']?.state || 'I';
      const next = cur === 'I' ? '0' : (cur === '0' ? 'II' : 'I');
      return this.setSbyPosition3D(next);
    }

    let targetId = id;
    if (id === 'dc_isolator' || id === 'qpv_isolator') targetId = 'dc_iso_1';
    else if (id === 'battery_ocpd' || id === 'battery_qb') targetId = 'bat_breaker';
    else if (id === 'grid_mcb' || id === 'q0_mcb' || id === 'grid_incomer_mcb') targetId = 'grid_mcb';
    else if (id === 'eps_mcb' || id === 'qe_mcb') targetId = 'eps_mcb';

    const sw = this.switchgear[targetId];
    if (!sw) {
      console.warn(\`[HybridSolar3DScene] Switchgear not found: \${id} (\${targetId})\`);
      return;
    }`;

  code = code.replace(toggleTarget, toggleReplacement);
}

// 3. Add 4Hz texture update throttling in updateOLED
if (!code.includes('this._lastOledUpdateTime')) {
  const oledTarget = `  updateOLED(data = {}) {
    const ctx = this.oledCtx;`;

  const oledReplacement = `  updateOLED(data = {}) {
    const now = Date.now();
    if (this._lastOledUpdateTime && (now - this._lastOledUpdateTime < 250)) {
      return; // Throttle to 4Hz (250ms) to eliminate GPU pipeline readback stalls
    }
    this._lastOledUpdateTime = now;
    const ctx = this.oledCtx;`;

  code = code.replace(oledTarget, oledReplacement);
}

fs.writeFileSync(targetPath, code, 'utf8');
console.log('Successfully updated scene-3d.js');
