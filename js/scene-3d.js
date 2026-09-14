/**
 * HybridSolar3DScene - Complete 3D Scene & Graphics Layer
 * 5kW Single-Phase Hybrid Solar PV 3D Simulator
 *
 * High-fidelity Three.js r128 Scene with:
 * - Dual PV Strings (12 Half-Cut monocrystalline panels with cell textures & ground lugs)
 * - Technical room with concrete wall, unislit mounting rails, floor grid, hazard warning zone
 * - DC Protection Enclosure with smoked transparent door, 2x 2P DC rotary isolators & 2x DC SPDs (shunt)
 * - 5kW Hybrid Inverter with heatsink fins, status halo LED ring, bottom cable glands & live dynamic OLED display
 * - Inverter X-Ray Internal Subsystems (MPPT1, MPPT2, Bidirectional DC-DC, H-Bridge, RCMU, Relays)
 * - Battery Energy Storage Rack (2x LiFePO4 modules with dynamic SOC LED bars, BMS, external DC disconnect)
 * - Main Earthing Terminal (MET) solid copper busbar with standoffs, brass screws & earth electrode lead
 * - Main AC Distribution Board (MDB) with 2P Grid MCB, AC SPD (Type 2 shunt), Smart Energy Meter
 * - EPS Distribution Board with 2P EPS MCB and 30mA RCD/RCBO with test button
 * - Split-Core CT sensor toroid clamped physically around incoming Grid Phase conductor
 * - Physical animated switchgear: toggleBreaker3D() with smooth rotary & lever pivoting animations
 * - Dynamic cable trajectories (CatmullRom curves) and glowing particle flow systems with Euclidean modulo
 * - 3D Floating telemetry labels/badges with screen-space coordinate projections
 * - Sun simulation adjusting intensity and angle based on solar irradiance
 * - Smooth camera preset transitions across all 10 key equipment viewpoints
 * - Raycasting for hover tooltip and click selection
 */

'use strict';

class HybridSolar3DScene {
  /**
   * @param {string|HTMLElement} container - DOM container id or element
   * @param {Object} options - Configuration options or SystemProfile
   * @param {Object} [profile=null] - Optional SystemProfile document
   */
  constructor(container = 'canvas-container', options = {}, profile = null) {
    if (options && (options.id || options.schemaVersion || options.familyId)) {
      profile = options;
      options = {};
    } else if (options && options.profile) {
      profile = options.profile;
    }
    this.activeProfile = profile || (typeof window !== 'undefined' ? window.SystemProfiles?.get('profile-hyb-1p-5kw-v1') : null) || null;

    this.containerId = typeof container === 'string' ? container : null;
    this.containerElement = typeof container === 'string' ? document.getElementById(container) : container;
    this.options = Object.assign({
      antialias: true,
      shadows: true,
      alpha: true,
      showGrid: true,
      showLabels: true,
      enableInteraction: true
    }, options);

    // State tracking
    this.initialized = false;
    this.isDisposed = false;
    this.animationFrameId = null;
    this.clock = new THREE.Clock();

    // Scene Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    // Lighting
    this.sunLight = null;
    this.ambientLight = null;
    this.roomLights = [];

    // Interactive & Animated Objects
    this.interactiveObjects = [];
    this.switchgear = {}; // id -> { type, mesh, currentVal, targetVal, minVal, maxVal, axis, light, auxMesh }
    this.animatedParticles = []; // Array of particle flow systems
    this.cables = {}; // id -> { curve, tubeMesh, particles }
    this.labels = []; // Array of { id, text, subtext, target, offset, element }
    this.xrayElements = []; // Objects that become transparent or visible in X-Ray
    this.isXRayActive = false;

    // Camera Animation State
    this.cameraTransition = {
      active: false,
      startTime: 0,
      duration: 1200,
      startPos: new THREE.Vector3(),
      targetPos: new THREE.Vector3(),
      startLookAt: new THREE.Vector3(),
      targetLookAt: new THREE.Vector3()
    };
    this.cameraHistory = null;
    this._cameraStack = [];
    this.activeLabelSubsystem = null;

    // Camera Presets
    this.presets = {
      OVERVIEW: {
        pos: new THREE.Vector3(0, 3.8, 6.8),
        target: new THREE.Vector3(0, 2.3, -0.6)
      },
      ROOFTOP: {
        pos: new THREE.Vector3(0, 7.0, 3.8),
        target: new THREE.Vector3(0, 4.6, 0.4)
      },
      DC_PROTECTION: {
        pos: new THREE.Vector3(-3.2, 2.4, -0.85),
        target: new THREE.Vector3(-3.2, 2.4, -2.2)
      },
      DC_BOX: {
        pos: new THREE.Vector3(-3.2, 2.4, -0.85),
        target: new THREE.Vector3(-3.2, 2.4, -2.2)
      },
      INVERTER: {
        pos: new THREE.Vector3(-1.0, 2.5, -0.5),
        target: new THREE.Vector3(-1.0, 2.5, -2.2)
      },
      INVERTER_XRAY: {
        pos: new THREE.Vector3(-1.0, 2.5, -1.1),
        target: new THREE.Vector3(-1.0, 2.5, -2.2)
      },
      BATTERY: {
        pos: new THREE.Vector3(1.2, 1.4, 0.6),
        target: new THREE.Vector3(1.2, 1.0, -1.8)
      },
      MDB_GRID: {
        pos: new THREE.Vector3(3.05, 2.40, -1.35),
        target: new THREE.Vector3(3.05, 2.40, -2.18)
      },
      EPS_BACKUP: {
        pos: new THREE.Vector3(4.05, 2.40, -1.35),
        target: new THREE.Vector3(4.05, 2.40, -2.18)
      },
      CT_SENSING: {
        pos: new THREE.Vector3(3.00, 2.46, -1.82),
        target: new THREE.Vector3(3.00, 2.46, -2.18)
      },
      EARTHING_MET: {
        pos: new THREE.Vector3(-0.5, 0.6, -1.0),
        target: new THREE.Vector3(-0.5, 0.4, -2.3)
      },
      AC_PANEL_INTERIOR: {
        pos: new THREE.Vector3(3.05, 2.40, -1.50),
        target: new THREE.Vector3(3.05, 2.40, -2.18)
      },
      AC_PANEL_WIRING: {
        pos: new THREE.Vector3(3.32, 2.38, -1.65),
        target: new THREE.Vector3(3.05, 2.38, -2.18)
      },
      AC_TERMINALS: {
        pos: new THREE.Vector3(2.98, 2.56, -1.82),
        target: new THREE.Vector3(2.98, 2.56, -2.18)
      },
      EPS_PANEL_INTERIOR: {
        pos: new THREE.Vector3(4.05, 2.40, -1.50),
        target: new THREE.Vector3(4.05, 2.40, -2.18)
      }
    };

    // Offscreen Canvas for Dynamic OLED Inverter Display
    this.oledCanvas = document.createElement('canvas');
    this.oledCanvas.width = 512;
    this.oledCanvas.height = 256;
    this.oledCtx = this.oledCanvas.getContext('2d');
    this.oledTexture = new THREE.CanvasTexture(this.oledCanvas);
    this.oledTexture.anisotropy = 4;

    // Offscreen Canvas for Monocrystalline PV Cells
    this.pvCellTexture = this._createPVCellTexture();

    // Offscreen Hazard Stripe Texture
    this.hazardTexture = this._createHazardTexture();

    // Offscreen Canvas for Dynamic Smart Energy Meter LCD Display
    this.meterCanvas = document.createElement('canvas');
    this.meterCanvas.width = 512;
    this.meterCanvas.height = 256;
    this.meterCtx = this.meterCanvas.getContext('2d');
    this.meterTexture = new THREE.CanvasTexture(this.meterCanvas);
    this.meterTexture.anisotropy = 4;

    // Helical Earth (PE) Stripe Texture
    this.peWireTexture = this._createPEStripeTexture();

    // Interactive Circuit Path Highlighting State
    this.highlightedCircuitMeshes = [];
    this.circuitGraph = {};
    this.acSpdFlags = [];

    // Raycaster & Interaction
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this._pointerDownPos = null;
    this.hoveredObject = null;
    this.eventListeners = {};
    this._listeners = {};

    // Auto-init if container exists
    if (this.containerElement) {
      this.init();
    } else if (typeof document !== 'undefined') {
      // Defer once if document not ready
      if (document.readyState === 'loading') {
        const onDomReady = () => {
          document.removeEventListener('DOMContentLoaded', onDomReady);
          if (!this.initialized) {
            this.containerElement = document.getElementById(this.containerId || 'canvas-container');
            if (this.containerElement) this.init();
          }
        };
        document.addEventListener('DOMContentLoaded', onDomReady);
      }
    }
  }

  // ==========================================
  // INITIALIZATION & LIFECYCLE
  // ==========================================

  /**
   * Initializes 3D scene with specific container and optional SystemProfile document
   * @param {string|HTMLElement} containerId
   * @param {Object} [profile=null]
   */
  initScene(containerId, profile = null) {
    if (profile) {
      this.activeProfile = profile;
    } else if (!this.activeProfile && typeof window !== 'undefined') {
      this.activeProfile = window.SystemProfiles?.get('profile-hyb-1p-5kw-v1') || null;
    }
    return this.init(containerId, profile);
  }

  /**
   * Initializes the complete 3D scene cleanly (guards against double-init)
   * @param {string|HTMLElement} [container]
   * @param {Object} [profile=null]
   */
  init(container, profile = null) {
    if (this.initialized) return;
    if (profile) {
      this.activeProfile = profile;
    }
    if (!this.activeProfile && typeof window !== 'undefined') {
      this.activeProfile = window.SystemProfiles?.get('profile-hyb-1p-5kw-v1') || null;
    }
    if (container) {
      this.containerElement = typeof container === 'string' ? document.getElementById(container) : container;
    }
    if (!this.containerElement) {
      console.warn('[HybridSolar3DScene] No container element found. Deferring init.');
      return;
    }

    this.initialized = true;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c111d);
    this.scene.fog = new THREE.FogExp2(0x0c111d, 0.025);

    // 2. Camera
    const width = this.containerElement.clientWidth || window.innerWidth;
    const height = this.containerElement.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 100);
    this.camera.position.copy(this.presets.OVERVIEW.pos);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.options.antialias,
      alpha: this.options.alpha,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    if (this.options.shadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    this.containerElement.style.position = 'relative';
    this.containerElement.style.overflow = 'hidden';
    this.containerElement.appendChild(this.renderer.domElement);

    // 4. Floating Overlay Layer for 3D Badges & Tooltips
    this._createOverlayContainer();

    // 5. Controls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 + 0.02; // Prevent going beneath floor
      this.controls.minDistance = 0.02;
      this.controls.maxDistance = 25;
      this.controls.target.copy(this.presets.OVERVIEW.target);
      this.controls.update();
    }

    // 6. Lights
    this._setupLighting();

    // 7. Equipment Models & Geometry
    this._buildScene();

    // 8. Event Handlers
    this._setupEventListeners();

    // 9. Initial OLED display render
    this.updateOLED({
      pv1Power: 2450,
      pv2Power: 2180,
      pv1Volt: 295,
      pv2Volt: 290,
      batSoc: 88,
      batVolt: 51.8,
      batPower: 1200,
      gridVolt: 231.5,
      gridFreq: 50.0,
      gridPower: 450,
      epsPower: 850,
      mode: 'NORMAL'
    });

    // 10. Start Animation Loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  // ==========================================
  // TEXTURE GENERATORS (Canvas Procedural)
  // ==========================================

  /**
   * Generates realistic 12-busbar half-cut monocrystalline cell texture
   */
  _createPVCellTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Anti-reflective dark navy/black silicon base
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#0a1226');
    grad.addColorStop(0.5, '#0d1830');
    grad.addColorStop(1, '#080e1c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Subtle silicon wafer crystal noise
    ctx.fillStyle = 'rgba(25, 45, 80, 0.15)';
    for (let i = 0; i < 1500; i++) {
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }

    // Half-cut cell horizontal division gap
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 254, 512, 4);

    // Fine silver contact fingers (horizontal)
    ctx.strokeStyle = 'rgba(180, 210, 240, 0.28)';
    ctx.lineWidth = 1;
    for (let y = 8; y < 512; y += 12) {
      if (Math.abs(y - 256) < 6) continue;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // 12 Silver Busbars (vertical lines)
    ctx.strokeStyle = '#d8e4f0';
    ctx.lineWidth = 2.5;
    for (let x = 21; x < 512; x += 42) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();

      // Busbar solder pads / ribbons
      ctx.fillStyle = '#f0f6fc';
      ctx.fillRect(x - 2, 60, 4, 16);
      ctx.fillRect(x - 2, 180, 4, 16);
      ctx.fillRect(x - 2, 320, 4, 16);
      ctx.fillRect(x - 2, 440, 4, 16);
    }

    // Outer white/silver border bevel
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Generates industrial safety hazard black-and-yellow diagonal stripes
   */
  /**
   * Generates authentic 45° helical Yellow-and-Green safety ground stripes for PE conductors
   */
  _createPEStripeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Base Lime Green (RAL 6018 / IEC 60446)
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(0, 0, 128, 128);

    // Safety Yellow Diagonal Stripes at 45 degrees
    ctx.fillStyle = '#eab308';
    const stripeWidth = 16;
    for (let x = -128; x < 256; x += stripeWidth * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeWidth, 0);
      ctx.lineTo(x + stripeWidth + 128, 128);
      ctx.lineTo(x + 128, 128);
      ctx.closePath();
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(16, 1);
    return texture;
  }

  _createHazardTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f59e0b'; // Industrial safety yellow
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = '#18181b'; // Dark black/charcoal stripe
    ctx.beginPath();
    const stripeWidth = 32;
    for (let x = -256; x < 512; x += stripeWidth * 2) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeWidth, 0);
      ctx.lineTo(x + stripeWidth + 256, 256);
      ctx.lineTo(x + 256, 256);
      ctx.closePath();
    }
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 1);
    return texture;
  }

  // ==========================================
  // LIGHTING & ENVIRONMENT
  // ==========================================

  _setupLighting() {
    // Ambient Light (soft cool daylight)
    this.ambientLight = new THREE.AmbientLight(0xdbeafe, 0.65);
    this.scene.add(this.ambientLight);

    // Directional Sun Light
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.8);
    this.sunLight.position.set(8, 12, 9);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 35;
    this.sunLight.shadow.camera.left = -10;
    this.sunLight.shadow.camera.right = 10;
    this.sunLight.shadow.camera.top = 10;
    this.sunLight.shadow.camera.bottom = -5;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // Fill / technical room downlight
    const roomDownlight = new THREE.PointLight(0x93c5fd, 0.8, 12);
    roomDownlight.position.set(0, 4.2, -0.5);
    this.scene.add(roomDownlight);
    this.roomLights.push(roomDownlight);

    // Equipment accent light
    const equipSpot = new THREE.SpotLight(0xffffff, 1.2, 10, Math.PI / 4, 0.3);
    equipSpot.position.set(0, 4.0, 2.5);
    equipSpot.target.position.set(0, 2.2, -2.2);
    this.scene.add(equipSpot);
    this.scene.add(equipSpot.target);
    this.roomLights.push(equipSpot);

    // Dedicated High-CRI AC Distribution Panels Inspection Spotlight
    const acPanelSpot = new THREE.SpotLight(0xfff8ee, 1.8, 8, Math.PI / 3, 0.35);
    acPanelSpot.position.set(3.55, 3.4, -0.8);
    acPanelSpot.target.position.set(3.55, 2.4, -2.2);
    this.scene.add(acPanelSpot);
    this.scene.add(acPanelSpot.target);
    this.roomLights.push(acPanelSpot);

    // Dedicated High-CRI DC Combiner Box Inspection Spotlight
    const dcBoxSpot = new THREE.SpotLight(0xffffff, 2.4, 8, Math.PI / 3, 0.35);
    dcBoxSpot.position.set(-3.2, 3.4, -0.6);
    dcBoxSpot.target.position.set(-3.2, 2.4, -2.2);
    this.scene.add(dcBoxSpot);
    this.scene.add(dcBoxSpot.target);
    this.roomLights.push(dcBoxSpot);
  }

  _buildScene() {
    this._buildEnvironment();
    this._buildRoofAndPVArray();
    this._buildDCProtectionEnclosure();
    this._buildHybridInverter();
    this._buildInverterInternalSubsystems();
    this._buildBatteryEnergyStorage();
    this._buildEarthingSystemMET();
    this._buildMainDistributionBoard();
    this._buildEPSDistributionBoard();
    this._buildCTSensor();
    this._buildUtilityCutoutAndLoads();
    this._buildCablingAndConduits();
    this._buildParticleFlowSystems();

    if (this.activeProfile) {
      this.loadProfile(this.activeProfile);
    }
  }

  _buildEnvironment() {
    // 1. Concrete Mounting Wall (Z = -2.3)
    const wallGeo = new THREE.BoxGeometry(14, 6.5, 0.3);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1f293d,
      roughness: 0.85,
      metalness: 0.15
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(0, 3.25, -2.45);
    wall.receiveShadow = true;
    this.scene.add(wall);

    // Galvanized Unistrut Equipment Mounting Rails (horizontal steel channels)
    const strutMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.3
    });
    [-3.2, -1.0, 1.2, 3.2, 4.5].forEach(x => {
      [2.9, 1.9, 0.9].forEach(y => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.03), strutMat);
        rail.position.set(x, y, -2.29);
        this.scene.add(rail);
      });
    });

    // 2. Concrete Floor with Technical Grid
    const floorGeo = new THREE.PlaneGeometry(16, 12);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.6,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 2.0);
    floor.receiveShadow = true;
    this.scene.add(floor);

    if (this.options.showGrid) {
      const grid = new THREE.GridHelper(16, 32, 0x38bdf8, 0x1e293b);
      grid.position.set(0, 0.002, 2.0);
      this.scene.add(grid);
    }

    // 3. Hazard Warning Zone (perimeter tape around Battery & MDB)
    const hazardMat = new THREE.MeshBasicMaterial({
      map: this.hazardTexture,
      transparent: true,
      opacity: 0.9
    });
    // Battery area hazard tape
    const batHazard = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.12), hazardMat);
    batHazard.rotation.x = -Math.PI / 2;
    batHazard.position.set(1.2, 0.005, -0.6);
    this.scene.add(batHazard);

    // Technical Room Safety Sign on Wall
    this._createWallSign('CAUTION: 1000V DC / 230V AC DUAL SOURCE', -1.0, 4.2, -2.28);
  }

  _createWallSign(text, x, y, z) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 0, 512, 96);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(6, 6, 500, 84);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚠ ' + text, 256, 48);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({ map: tex });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.35), mat);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
  }

  // ==========================================
  // ROOFTOP & DUAL PV STRINGS (12 Half-Cut Panels)
  // ==========================================

  _buildRoofAndPVArray() {
    const roofGroup = new THREE.Group();
    roofGroup.position.set(0, 4.6, 0.4);
    roofGroup.rotation.x = THREE.MathUtils.degToRad(-22); // 22° rooftop tilt facing South

    // Roof Truss & Purlin Rails (Anodized Aluminum Unistrut)
    const railMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      metalness: 0.9,
      roughness: 0.2
    });
    for (let r = -1.2; r <= 1.2; r += 0.8) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.05, 0.08), railMat);
      rail.position.set(0, 0, r);
      roofGroup.add(rail);
    }

    // Dual PV Strings (String 1 on Left, String 2 on Right)
    // 6 Monocrystalline Half-Cut Panels each (2 rows x 3 columns per string)
    const panelW = 1.05;
    const panelH = 1.75;
    const panelThick = 0.035;

    const panelFrameMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Anodized aluminum frame
      metalness: 0.8,
      roughness: 0.25
    });

    const panelCellMat = new THREE.MeshStandardMaterial({
      map: this.pvCellTexture,
      roughness: 0.15,
      metalness: 0.45
    });

    // Helper to build 1 half-cut panel with frame, glass, and ground lug
    const createPanel = (stringNum, index, posX, posZ) => {
      const pGroup = new THREE.Group();
      pGroup.position.set(posX, 0.06, posZ);

      // Frame Box
      const frame = new THREE.Mesh(new THREE.BoxGeometry(panelW, panelThick, panelH), panelFrameMat);
      frame.castShadow = true;
      frame.receiveShadow = true;
      pGroup.add(frame);

      // Top Monocrystalline Silicon Cell Surface
      const cell = new THREE.Mesh(new THREE.PlaneGeometry(panelW - 0.04, panelH - 0.04), panelCellMat);
      cell.rotation.x = -Math.PI / 2;
      cell.position.y = panelThick / 2 + 0.002;
      pGroup.add(cell);

      // Rear Junction Box with MC4 leads
      const jbox = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.14), new THREE.MeshStandardMaterial({ color: 0x18181b }));
      jbox.position.set(0, -panelThick / 2 - 0.015, 0);
      pGroup.add(jbox);

      // Grounding Lug (brass/copper connector with tooth washer on frame)
      const lug = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 8), new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9 }));
      lug.position.set(panelW / 2 - 0.01, panelThick / 2 + 0.01, -panelH / 2 + 0.04);
      pGroup.add(lug);

      // Interactive registration
      frame.userData = {
        type: 'PV_PANEL',
        id: `pv_str${stringNum}_p${index}`,
        name: `PV Panel (String ${stringNum}, Module #${index})`,
        spec: '415W Monocrystalline Half-Cut PERC, Voc: 49.2V, Isc: 10.8A'
      };
      this.interactiveObjects.push(frame);

      return pGroup;
    };

    // String 1: 6 Panels (Left side, X: -3.3 to -1.1)
    const str1Offsets = [
      { x: -3.3, z: -0.7 }, { x: -2.2, z: -0.7 }, { x: -1.1, z: -0.7 },
      { x: -3.3, z:  0.7 }, { x: -2.2, z:  0.7 }, { x: -1.1, z:  0.7 }
    ];
    str1Offsets.forEach((pos, i) => {
      roofGroup.add(createPanel(1, i + 1, pos.x, pos.z));
    });

    // String 2: 6 Panels (Right side, X: +1.1 to +3.3)
    const str2Offsets = [
      { x: 1.1, z: -0.7 }, { x: 2.2, z: -0.7 }, { x: 3.3, z: -0.7 },
      { x: 1.1, z:  0.7 }, { x: 2.2, z:  0.7 }, { x: 3.3, z:  0.7 }
    ];
    str2Offsets.forEach((pos, i) => {
      roofGroup.add(createPanel(2, i + 1, pos.x, pos.z));
    });

    // Rooftop Junction Box for Array Output
    const arrayJBox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.25), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 }));
    arrayJBox.position.set(0, 0.12, -1.3);
    roofGroup.add(arrayJBox);

    this.scene.add(roofGroup);
    this.roofGroup = roofGroup;

    // Register 3D Floating Telemetry Label
    this._registerLabel('ROOFTOP_PV', '☀️ آرایه خورشیدی (PV)', '', roofGroup, new THREE.Vector3(0, 1.2, 0));
  }

  // ==========================================
  // DC PROTECTION ENCLOSURE (DC Combiner Box: gPV Fuses, DC-PV2 Disconnects, SPDs & PE Bar)
  // ==========================================

  _buildDCProtectionEnclosure() {
    const dcGroup = new THREE.Group();
    dcGroup.position.set(-3.2, 2.4, -2.2);

    const W = 0.90;
    const H = 1.05;
    const D = 0.24;
    const T = 0.015;

    // --- 1. IP65 Polycarbonate Hollow Enclosure Tub (5-Sided Cabinet with open front) ---
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.45,
      metalness: 0.2
    });

    const casingGroup = new THREE.Group();

    // Back wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(W, H, T), boxMat);
    backWall.position.set(0, 0, -D / 2 + T / 2);
    backWall.userData = { type: 'ENCLOSURE_BODY' };
    casingGroup.add(backWall);

    // Top wall
    const topWall = new THREE.Mesh(new THREE.BoxGeometry(W, T, D), boxMat);
    topWall.position.set(0, H / 2 - T / 2, 0);
    topWall.userData = { type: 'ENCLOSURE_BODY' };
    casingGroup.add(topWall);

    // Bottom wall
    const btmWall = new THREE.Mesh(new THREE.BoxGeometry(W, T, D), boxMat);
    btmWall.position.set(0, -H / 2 + T / 2, 0);
    btmWall.userData = { type: 'ENCLOSURE_BODY' };
    casingGroup.add(btmWall);

    // Left wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(T, H - 2 * T, D), boxMat);
    leftWall.position.set(-W / 2 + T / 2, 0, 0);
    leftWall.userData = { type: 'ENCLOSURE_BODY' };
    casingGroup.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(T, H - 2 * T, D), boxMat);
    rightWall.position.set(W / 2 - T / 2, 0, 0);
    rightWall.userData = { type: 'ENCLOSURE_BODY' };
    casingGroup.add(rightWall);

    // 4 Heavy-duty Wall Mounting Brackets (Galvanized Steel)
    const bracketMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 });
    [
      [-W / 2 - 0.02, H / 2 - 0.04],
      [W / 2 + 0.02, H / 2 - 0.04],
      [-W / 2 - 0.02, -H / 2 + 0.04],
      [W / 2 + 0.02, -H / 2 + 0.04]
    ].forEach(([bx, by]) => {
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.07, 0.01), bracketMat);
      bMesh.position.set(bx, by, -D / 2 - 0.005);
      casingGroup.add(bMesh);
    });

    dcGroup.add(casingGroup);

    // --- 2. Galvanized Zinc-Plated Steel Backplate (Mounting Pan) ---
    const backplate = new THREE.Mesh(
      new THREE.BoxGeometry(W - 0.06, H - 0.06, 0.008),
      new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.85, roughness: 0.25 })
    );
    backplate.position.set(0, 0, -D / 2 + T + 0.004);
    dcGroup.add(backplate);

    // --- 3. Smoked Transparent Polycarbonate Hinged Door (Swinging Hinge) ---
    const dcDoorHinge = new THREE.Group();
    dcDoorHinge.position.set(-W / 2 + 0.015, 0, D / 2 + 0.006);

    const doorGeo = new THREE.BoxGeometry(W - 0.02, H - 0.02, 0.012);
    const doorMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.35,
      transmission: 0.85,
      roughness: 0.12,
      ior: 1.58,
      clearcoat: 0.95,
      clearcoatRoughness: 0.08
    });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set((W - 0.02) / 2, 0, 0);
    dcDoorHinge.add(door);

    // Industrial Quarter-Turn Latches on Opening Edge
    [-0.30, 0.30].forEach(ly => {
      const latch = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.02, 16), new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.85 }));
      latch.rotation.x = Math.PI / 2;
      latch.position.set(W - 0.05, ly, 0.010);
      dcDoorHinge.add(latch);
    });

    // Warning Sticker on Door
    const warningDecal = new THREE.Mesh(
      new THREE.PlaneGeometry(0.14, 0.14),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.1 })
    );
    warningDecal.position.set((W - 0.02) / 2, 0.20, 0.007);
    dcDoorHinge.add(warningDecal);

    door.userData = {
      id: 'dc_door',
      type: 'DOOR',
      name: 'درب کمباینر باکس DC (کلیک جهت باز/بستن)',
      action: 'toggle_dc_door'
    };
    this.interactiveObjects.push(door);
    dcGroup.add(dcDoorHinge);
    this.dcDoorHinge = dcDoorHinge;
    this.dcDoorOpen = false;
    this.dcDoorTargetAngle = 0;

    // --- 4. Industrial Slotted PVC Wiring Ducts (Grey Trunking) ---
    const ductMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5, metalness: 0.1 });
    const ductCoverMat = new THREE.MeshPhysicalMaterial({ color: 0x64748b, transparent: true, opacity: 0.55, transmission: 0.45, roughness: 0.25 });

    const makeDuct = (dw, dh, dd, dx, dy, dz) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(dw, dh, dd), ductMat);
      g.add(body);
      const cover = new THREE.Mesh(new THREE.BoxGeometry(dw, dh * 0.95, 0.004), ductCoverMat);
      cover.position.set(0, 0, dd / 2 + 0.002);
      g.add(cover);
      g.position.set(dx, dy, dz);
      dcGroup.add(g);
      return g;
    };

    // Left and Right Vertical Wire Routing Channels
    makeDuct(0.045, H - 0.14, 0.045, -0.38, 0, -D / 2 + 0.05);
    makeDuct(0.045, H - 0.14, 0.045, 0.38, 0, -D / 2 + 0.05);
    // Middle Horizontal Separation Duct
    makeDuct(0.68, 0.038, 0.038, 0, 0.08, -D / 2 + 0.05);

    // --- 5. Slotted Galvanized DIN Rails ---
    const dinMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.2 });
    // Top DIN Rail: Fuses
    const topDin = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.035, 0.015), dinMat);
    topDin.position.set(0, 0.24, -D / 2 + 0.038);
    dcGroup.add(topDin);
    // Bottom DIN Rail: Isolators and SPDs
    const btmDin = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.035, 0.015), dinMat);
    btmDin.position.set(0, -0.08, -D / 2 + 0.038);
    dcGroup.add(btmDin);

    // --- 6. Solid Brass PE Earthing Busbar (Main Grounding Bar on Green Standoffs) ---
    const peBarMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.2 });
    const peBar = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.020, 0.010), peBarMat);
    peBar.position.set(0, -0.36, -D / 2 + 0.042);
    peBar.userData = {
      type: 'BUSBAR',
      id: 'dc_pe_bar',
      name: 'شین ارت داخلی کمباینر باکس (PE Bar)',
      desc: 'شین برنجی اتصال زمین حفاظتی متصل به سرج ارسترها و شین اصلی MET'
    };
    this.interactiveObjects.push(peBar);
    dcGroup.add(peBar);

    // Green Insulated Standoff Pillars
    const standoffMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.3 });
    [-0.24, 0.24].forEach(sx => {
      const standoff = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.025, 12), standoffMat);
      standoff.rotation.x = Math.PI / 2;
      standoff.position.set(sx, -0.36, -D / 2 + 0.025);
      dcGroup.add(standoff);
    });

    // M5 Brass Terminal Screws on PE Bar
    const screwMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, metalness: 0.9, roughness: 0.2 });
    for (let i = 0; i < 9; i++) {
      const scr = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.005, 8), screwMat);
      scr.rotation.x = Math.PI / 2;
      scr.position.set(-0.28 + i * 0.07, -0.36, -D / 2 + 0.048);
      dcGroup.add(scr);
    }

    // --- 7. IP68 Cable Glands (Top String Inputs & Bottom Inverter/MET Outputs) ---
    const glandBodyMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.85, roughness: 0.3 });
    const glandRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });
    const glandBlueMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3 });
    const glandGreenMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.3 });

    const makeGland = (gx, gy, gz, collarMat) => {
      const gGroup = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.045, 6), glandBodyMat);
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.012, 12), collarMat);
      collar.position.y = gy > 0 ? 0.022 : -0.022;
      gGroup.add(body);
      gGroup.add(collar);
      gGroup.position.set(gx, gy, gz);
      dcGroup.add(gGroup);
    };

    // 4 Top Entry Glands (From Rooftop PV Strings)
    makeGland(-0.28, H / 2 + 0.02, 0.02, glandRedMat);
    makeGland(-0.18, H / 2 + 0.02, 0.02, glandBlueMat);
    makeGland(0.14, H / 2 + 0.02, 0.02, glandRedMat);
    makeGland(0.24, H / 2 + 0.02, 0.02, glandBlueMat);

    // 5 Bottom Exit Glands (To Inverter MPPT1, MPPT2 and MET)
    makeGland(-0.27, -H / 2 - 0.02, 0.02, glandRedMat);
    makeGland(-0.19, -H / 2 - 0.02, 0.02, glandBlueMat);
    makeGland(0.00, -H / 2 - 0.02, 0.02, glandGreenMat);
    makeGland(0.15, -H / 2 - 0.02, 0.02, glandRedMat);
    makeGland(0.23, -H / 2 - 0.02, 0.02, glandBlueMat);

    // --- 8. Helper: Realistic 10x38mm gPV Modular DIN-Rail Fuse Holder ---
    const fuseHolderMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.15 });
    const fuseCarrierMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.2 });
    const ceramicMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.05 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 });
    const terminalScrewMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.2 });
    const ledGreenMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });

    const makeFuseHolder = (id, name, desc, spec, fx, fy, fz, polarity) => {
      const fGroup = new THREE.Group();
      fGroup.position.set(fx, fy, fz);

      // Main PA66 Modular Base Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.15, 0.075), fuseHolderMat);
      fGroup.add(body);

      // Ergonomic Pull-out Cartridge Carrier Handle
      const carrier = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.085, 0.025), fuseCarrierMat);
      carrier.position.set(0, 0, 0.042);
      fGroup.add(carrier);

      // Visible 10x38 Ceramic Fuse Cartridge inside Cavity
      const ceramicTube = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.038, 16), ceramicMat);
      ceramicTube.position.set(0, 0, 0.045);
      fGroup.add(ceramicTube);

      // Silver Contact Caps
      [-0.016, 0.016].forEach(cy => {
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.0075, 0.008, 16), capMat);
        cap.position.set(0, cy, 0.045);
        fGroup.add(cap);
      });

      // Neon / Optical Health Status Indicator Window
      const led = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.004, 12), ledGreenMat);
      led.rotation.x = Math.PI / 2;
      led.position.set(0, 0.028, 0.056);
      fGroup.add(led);

      // Top and Bottom Terminal Screw Clamps (Apertures clear for wire insertion)
      [0.062, -0.062].forEach(ty => {
        const tCavity = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.012, 12), terminalScrewMat);
        tCavity.rotation.x = Math.PI / 2;
        tCavity.position.set(0, ty, 0.025);
        fGroup.add(tCavity);
      });

      // Distinct Polarity Identifiers (Positioned clearly on top and bottom face bevels)
      const polColor = polarity === '+' ? 0xdc2626 : 0x2563eb;
      const symMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

      [0.050, -0.050].forEach(py => {
        const polDisc = new THREE.Mesh(
          new THREE.CylinderGeometry(0.007, 0.007, 0.003, 16),
          new THREE.MeshStandardMaterial({ color: polColor, roughness: 0.3 })
        );
        polDisc.rotation.x = Math.PI / 2;
        polDisc.position.set(0, py, 0.038);
        fGroup.add(polDisc);

        const barH = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.0018, 0.002), symMat);
        barH.position.set(0, py, 0.040);
        fGroup.add(barH);
        if (polarity === '+') {
          const barV = new THREE.Mesh(new THREE.BoxGeometry(0.0018, 0.008, 0.002), symMat);
          barV.position.set(0, py, 0.040);
          fGroup.add(barV);
        }
      });

      body.userData = { type: 'FUSE', id, name, desc, spec };
      carrier.userData = { type: 'FUSE', id, name, desc, spec };
      this.interactiveObjects.push(body);
      this.interactiveObjects.push(carrier);

      dcGroup.add(fGroup);
      return fGroup;
    };

    // 4 Modular gPV Fuse Holders on Top DIN Rail
    // String 1 Fuses
    makeFuseHolder(
      'string_fuse_pos_1',
      'پایه فیوز استرینگ ۱ مثبت FPV1+ (gPV 15A 1000V DC)',
      'فیوز سیلندری سرامیکی ۱۰x۳۸ محافظ خط مثبت استرینگ ۱ خورشیدی',
      '1000V DC | 15A | 10x38mm | IEC 60269-6',
      -0.28, 0.24, -0.01, '+'
    );
    makeFuseHolder(
      'string_fuse_neg_1',
      'پایه فیوز استرینگ ۱ منفی FPV1- (gPV 15A 1000V DC)',
      'فیوز سیلندری سرامیکی ۱۰x۳۸ محافظ خط منفی استرینگ ۱ خورشیدی',
      '1000V DC | 15A | 10x38mm | IEC 60269-6',
      -0.18, 0.24, -0.01, '-'
    );
    // String 2 Fuses
    makeFuseHolder(
      'string_fuse_pos_2',
      'پایه فیوز استرینگ ۲ مثبت FPV2+ (gPV 15A 1000V DC)',
      'فیوز سیلندری سرامیکی ۱۰x۳۸ محافظ خط مثبت استرینگ ۲ خورشیدی',
      '1000V DC | 15A | 10x38mm | IEC 60269-6',
      0.14, 0.24, -0.01, '+'
    );
    makeFuseHolder(
      'string_fuse_neg_2',
      'پایه فیوز استرینگ ۲ منفی FPV2- (gPV 15A 1000V DC)',
      'فیوز سیلندری سرامیکی ۱۰x۳۸ محافظ خط منفی استرینگ ۲ خورشیدی',
      '1000V DC | 15A | 10x38mm | IEC 60269-6',
      0.24, 0.24, -0.01, '-'
    );

    // --- 9. Helper: DC Rotary Load-Break Switch-Isolator (DC-PV2 1000V 32A) ---
    const makeRotarySwitch = (id, name, desc, spec, sx, sy, sz) => {
      const sGroup = new THREE.Group();
      sGroup.position.set(sx, sy, sz);

      // Heavy Polycarbonate Housing Base
      const sBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.16, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
      );
      sGroup.add(sBase);

      // Yellow Safety Bezel Ring
      const yellowRing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.052, 0.052, 0.006, 32),
        new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 })
      );
      yellowRing.rotation.x = Math.PI / 2;
      yellowRing.position.set(0, 0, 0.043);
      sGroup.add(yellowRing);

      // Rotatable Knob Assembly
      const knobGroup = new THREE.Group();
      knobGroup.position.set(0, 0, 0.048);

      const knobMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.038, 0.042, 0.035, 24),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 })
      );
      knobMesh.rotation.x = Math.PI / 2;
      knobGroup.add(knobMesh);

      // White Index Pointer Bar
      const pointerBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, 0.065, 0.016),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
      );
      pointerBar.position.z = 0.020;
      knobGroup.add(pointerBar);

      sGroup.add(knobGroup);

      // 4 Heavy Screw Terminals with Color-Coded Polarity Collars (Top: L1+, L2- and Bottom: T1+, T2-)
      const redTermMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35 });
      const blueTermMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.35 });

      [
        { tx: -0.03, ty: 0.075, mat: redTermMat },
        { tx: 0.03, ty: 0.075, mat: blueTermMat },
        { tx: -0.03, ty: -0.075, mat: redTermMat },
        { tx: 0.03, ty: -0.075, mat: blueTermMat }
      ].forEach(({ tx, ty, mat }) => {
        const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.003, 16), mat);
        collar.rotation.x = Math.PI / 2;
        collar.position.set(tx, ty, 0.040);
        sGroup.add(collar);

        const term = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.012, 12), terminalScrewMat);
        term.rotation.x = Math.PI / 2;
        term.position.set(tx, ty, 0.035);
        sGroup.add(term);
      });

      knobMesh.userData = { type: 'SWITCH', id, name, desc, spec, action: 'toggle' };
      this.interactiveObjects.push(knobMesh);

      this.switchgear[id] = {
        type: 'rotary',
        object: knobGroup,
        currentAngle: 0,
        targetAngle: 0,
        state: true
      };

      dcGroup.add(sGroup);
      return sGroup;
    };

    // 2 DC Rotary Switch Isolators on Bottom DIN Rail
    makeRotarySwitch(
      'dc_iso_1',
      'کلید ایزولاتور DC استرینگ ۱ (QPV1 1000V 32A)',
      'سکسیونر قطع زیر بار استاندارد DC-PV2 استرینگ ۱ خورشیدی',
      '1000V DC | 32A | DC-PV2 | IEC 60947-3',
      -0.23, -0.08, 0.00
    );
    makeRotarySwitch(
      'dc_iso_2',
      'کلید ایزولاتور DC استرینگ ۲ (QPV2 1000V 32A)',
      'سکسیونر قطع زیر بار استاندارد DC-PV2 استرینگ ۲ خورشیدی',
      '1000V DC | 32A | DC-PV2 | IEC 60947-3',
      0.19, -0.08, 0.00
    );

    // --- 10. Helper: DC Surge Protection Device (SPD Type 2, 1000V DC) ---
    const spdBaseMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 });
    const spdCartridgeMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.35 });

    const makeSPD = (id, name, desc, spec, px, py, pz) => {
      const spdGroup = new THREE.Group();
      spdGroup.position.set(px, py, pz);

      // Base DIN-Rail Socket Block
      const spdBase = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 0.075), spdBaseMat);
      spdGroup.add(spdBase);

      // 2 Pluggable MOV Cartridges
      [-0.022, 0.022].forEach(cx => {
        const cart = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.085, 0.032), spdCartridgeMat);
        cart.position.set(cx, 0, 0.040);
        spdGroup.add(cart);

        // Visual Optical Status Inspection Window
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.020, 0.016), ledGreenMat);
        win.position.set(cx, 0.022, 0.058);
        spdGroup.add(win);
      });

      // Terminal Screws with Polarity Collars: Top (+ and -) and Bottom (PE Earth)
      const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35 });
      const blueMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.35 });
      const greenMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.35 });

      [
        { tx: -0.022, ty: 0.075, mat: redMat },
        { tx: 0.022, ty: 0.075, mat: blueMat },
        { tx: 0.000, ty: -0.075, mat: greenMat }
      ].forEach(({ tx, ty, mat }) => {
        const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.003, 16), mat);
        collar.rotation.x = Math.PI / 2;
        collar.position.set(tx, ty, 0.038);
        spdGroup.add(collar);

        const term = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.012, 12), terminalScrewMat);
        term.rotation.x = Math.PI / 2;
        term.position.set(tx, ty, 0.032);
        spdGroup.add(term);
      });

      spdBase.userData = { type: 'SPD', id, name, desc, spec };
      this.interactiveObjects.push(spdBase);

      dcGroup.add(spdGroup);
      return spdGroup;
    };

    // 2 DC SPDs on Bottom DIN Rail
    makeSPD(
      'dc_spd_1',
      'سرج ارستر DC استرینگ ۱ (Type 2, 1000V DC)',
      'برقگیر واریستوری موازی تخلیه اضافه ولتاژهای صاعقه به ارت',
      'Un: 1000V DC | In: 20kA | Imax: 40kA | Up < 3.8kV',
      -0.07, -0.08, -0.005
    );
    makeSPD(
      'dc_spd_2',
      'سرج ارستر DC استرینگ ۲ (Type 2, 1000V DC)',
      'برقگیر واریستوری موازی تخلیه اضافه ولتاژهای صاعقه به ارت',
      'Un: 1000V DC | In: 20kA | Imax: 40kA | Up < 3.8kV',
      0.35, -0.08, -0.005
    );

    // --- 10b. Helper: Modular DIN-Rail Terminal Blocks ---
    const makeTerminalBlocks = (bx, by, bz) => {
      const tbGroup = new THREE.Group();
      tbGroup.position.set(bx, by, bz);

      const blockCount = 6;
      const blockW = 0.015;
      const blockH = 0.065;
      const blockD = 0.052;

      const tbMatRed = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4 });
      const tbMatBlue = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4 });
      const tbMatPE = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 });
      const tbMatGrey = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
      const tbMatOrange = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.4 });

      // End bracket left
      const endLeft = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.050, 0.045), tbMatGrey);
      endLeft.position.set(- (blockCount * blockW) / 2 - 0.005, 0, 0.015);
      tbGroup.add(endLeft);

      // End bracket right
      const endRight = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.050, 0.045), tbMatGrey);
      endRight.position.set((blockCount * blockW) / 2 + 0.005, 0, 0.015);
      tbGroup.add(endRight);

      // Slices: 1+ (Red), 1- (Blue), 2+ (Red), 2- (Blue), PE (Green), PE (Green)
      const slices = [
        { label: '1+', mat: tbMatRed },
        { label: '1-', mat: tbMatBlue },
        { label: '2+', mat: tbMatRed },
        { label: '2-', mat: tbMatBlue },
        { label: 'PE', mat: tbMatPE },
        { label: 'PE', mat: tbMatPE }
      ];

      slices.forEach((cfg, idx) => {
        const sx = - (blockCount * blockW) / 2 + (idx + 0.5) * blockW;
        const slice = new THREE.Mesh(new THREE.BoxGeometry(blockW - 0.002, blockH, blockD), cfg.mat);
        slice.position.set(sx, 0, 0.020);
        tbGroup.add(slice);

        // Terminal clamp screws
        [0.020, -0.020].forEach(sy => {
          const scr = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.008, 8), terminalScrewMat);
          scr.rotation.x = Math.PI / 2;
          scr.position.set(sx, sy, 0.042);
          tbGroup.add(scr);
        });

        // Top white marking tag
        const tag = new THREE.Mesh(new THREE.BoxGeometry(blockW - 0.004, 0.007, 0.004), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        tag.position.set(sx, blockH / 2 - 0.005, 0.038);
        tbGroup.add(tag);
      });

      // Orange circuit divider partition plates
      [-0.015, 0.015].forEach(px => {
        const part = new THREE.Mesh(new THREE.BoxGeometry(0.0025, blockH + 0.006, blockD + 0.004), tbMatOrange);
        part.position.set(px, 0, 0.020);
        tbGroup.add(part);
      });

      tbGroup.userData = {
        type: 'TERMINAL_BLOCK',
        id: 'dc_terminal_block',
        name: 'ردیف ترمینال‌های ریلی مدولار کمباینر باکس (DIN-Rail Terminal Blocks)',
        desc: 'ترمینال‌های ریلی استاندارد DIN-Rail برای اتصال مطمئن هادی‌های DC و ارت',
        spec: '1000V DC | 32A | IEC 60947-7-1'
      };
      this.interactiveObjects.push(tbGroup);

      dcGroup.add(tbGroup);
      return tbGroup;
    };

    // Mount Modular DIN-Rail Terminal Blocks on Bottom DIN Rail
    makeTerminalBlocks(0.06, -0.08, 0.00);

    // --- 11. INTERNAL HIGH-FIDELITY WIRING (19 Tubed Runs with Distinct Polarity & Earth Paths) ---
    const wireRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, metalness: 0.1 });
    const wireBlueMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, metalness: 0.1 });
    const wireGreenMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.3, metalness: 0.1 });

    const makeWire = (pts, radius, mat, name, desc) => {
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, radius, 8, false);
      const tubeMesh = new THREE.Mesh(tubeGeo, mat);
      tubeMesh.userData = { type: 'INTERNAL_CONDUCTOR', name, desc };
      this.interactiveObjects.push(tubeMesh);
      dcGroup.add(tubeMesh);
      return tubeMesh;
    };

    // WIRE 1: String 1 Positive Entry -> FPV1+ Top Terminal
    makeWire([
      new THREE.Vector3(-0.28, 0.525, 0.02),
      new THREE.Vector3(-0.28, 0.420, 0.035),
      new THREE.Vector3(-0.28, 0.315, 0.025)
    ], 0.0055, wireRedMat, 'هادی مثبت ورودی استرینگ ۱ (PV1+ Incomer)', 'سیم خورشیدی 4mm² هادی مثبت متصل به ورودی فیوز FPV1+');

    // WIRE 2: String 1 Negative Entry -> FPV1- Top Terminal
    makeWire([
      new THREE.Vector3(-0.18, 0.525, 0.02),
      new THREE.Vector3(-0.18, 0.420, 0.035),
      new THREE.Vector3(-0.18, 0.315, 0.025)
    ], 0.0055, wireBlueMat, 'هادی منفی ورودی استرینگ ۱ (PV1- Incomer)', 'سیم خورشیدی 4mm² هادی منفی متصل به ورودی فیوز FPV1-');

    // WIRE 3: FPV1+ Bottom Terminal -> QPV1 Top Pole 1 (L1+)
    makeWire([
      new THREE.Vector3(-0.28, 0.165, 0.025),
      new THREE.Vector3(-0.28, 0.080, 0.035),
      new THREE.Vector3(-0.26, 0.005, 0.035)
    ], 0.0055, wireRedMat, 'هادی مثبت خروجی فیوز FPV1+ به کلید QPV1', 'اتصال هادی مثبت به پل ورودی ۱ کلید ایزولاتور DC-PV2');

    // WIRE 4: FPV1- Bottom Terminal -> QPV1 Top Pole 2 (L2-)
    makeWire([
      new THREE.Vector3(-0.18, 0.165, 0.025),
      new THREE.Vector3(-0.19, 0.080, 0.035),
      new THREE.Vector3(-0.20, 0.005, 0.035)
    ], 0.0055, wireBlueMat, 'هادی منفی خروجی فیوز FPV1- به کلید QPV1', 'اتصال هادی منفی به پل ورودی ۲ کلید ایزولاتور DC-PV2');

    // WIRE 5: SPD1 Positive Shunt Tap (from QPV1 Pole 1 across to SPD1 +)
    makeWire([
      new THREE.Vector3(-0.26, 0.005, 0.035),
      new THREE.Vector3(-0.24, 0.040, 0.040),
      new THREE.Vector3(-0.11, 0.040, 0.040),
      new THREE.Vector3(-0.092, 0.005, 0.030)
    ], 0.0050, wireRedMat, 'انشعاب موازی سرج ارستر مثبت استرینگ ۱ (SPD1 +)', 'مسیر انشعاب موازی برقگیر جهت تخلیه اضافه ولتاژهای فاز مثبت');

    // WIRE 6: SPD1 Negative Shunt Tap (from QPV1 Pole 2 across to SPD1 -)
    makeWire([
      new THREE.Vector3(-0.20, 0.005, 0.035),
      new THREE.Vector3(-0.18, 0.030, 0.038),
      new THREE.Vector3(-0.065, 0.030, 0.038),
      new THREE.Vector3(-0.048, 0.005, 0.030)
    ], 0.0050, wireBlueMat, 'انشعاب موازی سرج ارستر منفی استرینگ ۱ (SPD1 -)', 'مسیر انشعاب موازی برقگیر جهت تخلیه اضافه ولتاژهای فاز منفی');

    // WIRE 7: SPD1 Ground Terminal -> PE Busbar
    makeWire([
      new THREE.Vector3(-0.070, -0.165, 0.030),
      new THREE.Vector3(-0.070, -0.260, 0.035),
      new THREE.Vector3(-0.070, -0.355, 0.042)
    ], 0.0065, wireGreenMat, 'هادی تخلیه سرج ارستر ۱ به شین ارت (SPD1 Grounding)', 'سیم 6mm² سبز-زرد اتصال زمین کوتاه تخلیه صاعقه به شین ارت');

    // WIRE 8: QPV1 Bottom Pole 1 (T1+) -> Bottom Exit Gland (MPPT1+)
    makeWire([
      new THREE.Vector3(-0.26, -0.165, 0.035),
      new THREE.Vector3(-0.26, -0.280, 0.040),
      new THREE.Vector3(-0.27, -0.420, 0.035),
      new THREE.Vector3(-0.27, -0.525, 0.020)
    ], 0.0055, wireRedMat, 'هادی خروجی کلید ایزولاتور QPV1 قطب مثبت (MPPT1+)', 'کابل DC خورشیدی 4mm² خارج شده از کمباینر به سمت MPPT1 اینورتر');

    // WIRE 9: QPV1 Bottom Pole 2 (T2-) -> Bottom Exit Gland (MPPT1-)
    makeWire([
      new THREE.Vector3(-0.20, -0.165, 0.035),
      new THREE.Vector3(-0.20, -0.280, 0.040),
      new THREE.Vector3(-0.19, -0.420, 0.035),
      new THREE.Vector3(-0.19, -0.525, 0.020)
    ], 0.0055, wireBlueMat, 'هادی خروجی کلید ایزولاتور QPV1 قطب منفی (MPPT1-)', 'کابل DC خورشیدی 4mm² خارج شده از کمباینر به سمت MPPT1 اینورتر');

    // WIRE 10: String 2 Positive Entry -> FPV2+ Top Terminal
    makeWire([
      new THREE.Vector3(0.14, 0.525, 0.02),
      new THREE.Vector3(0.14, 0.420, 0.035),
      new THREE.Vector3(0.14, 0.315, 0.025)
    ], 0.0055, wireRedMat, 'هادی مثبت ورودی استرینگ ۲ (PV2+ Incomer)', 'سیم خورشیدی 4mm² هادی مثبت متصل به ورودی فیوز FPV2+');

    // WIRE 11: String 2 Negative Entry -> FPV2- Top Terminal
    makeWire([
      new THREE.Vector3(0.24, 0.525, 0.02),
      new THREE.Vector3(0.24, 0.420, 0.035),
      new THREE.Vector3(0.24, 0.315, 0.025)
    ], 0.0055, wireBlueMat, 'هادی منفی ورودی استرینگ ۲ (PV2- Incomer)', 'سیم خورشیدی 4mm² هادی منفی متصل به ورودی فیوز FPV2-');

    // WIRE 12: FPV2+ Bottom Terminal -> QPV2 Top Pole 1 (L1+)
    makeWire([
      new THREE.Vector3(0.14, 0.165, 0.025),
      new THREE.Vector3(0.15, 0.080, 0.035),
      new THREE.Vector3(0.16, 0.005, 0.035)
    ], 0.0055, wireRedMat, 'هادی مثبت خروجی فیوز FPV2+ به کلید QPV2', 'اتصال هادی مثبت به پل ورودی ۱ کلید ایزولاتور DC-PV2');

    // WIRE 13: FPV2- Bottom Terminal -> QPV2 Top Pole 2 (L2-)
    makeWire([
      new THREE.Vector3(0.24, 0.165, 0.025),
      new THREE.Vector3(0.23, 0.080, 0.035),
      new THREE.Vector3(0.22, 0.005, 0.035)
    ], 0.0055, wireBlueMat, 'هادی منفی خروجی فیوز FPV2- به کلید QPV2', 'اتصال هادی منفی به پل ورودی ۲ کلید ایزولاتور DC-PV2');

    // WIRE 14: SPD2 Positive Shunt Tap (from QPV2 Pole 1 across to SPD2 +)
    makeWire([
      new THREE.Vector3(0.16, 0.005, 0.035),
      new THREE.Vector3(0.18, 0.040, 0.040),
      new THREE.Vector3(0.31, 0.040, 0.040),
      new THREE.Vector3(0.328, 0.005, 0.030)
    ], 0.0050, wireRedMat, 'انشعاب موازی سرج ارستر مثبت استرینگ ۲ (SPD2 +)', 'مسیر انشعاب موازی برقگیر جهت تخلیه اضافه ولتاژهای فاز مثبت');

    // WIRE 15: SPD2 Negative Shunt Tap (from QPV2 Pole 2 across to SPD2 -)
    makeWire([
      new THREE.Vector3(0.22, 0.005, 0.035),
      new THREE.Vector3(0.24, 0.030, 0.038),
      new THREE.Vector3(0.35, 0.030, 0.038),
      new THREE.Vector3(0.372, 0.005, 0.030)
    ], 0.0050, wireBlueMat, 'انشعاب موازی سرج ارستر منفی استرینگ ۲ (SPD2 -)', 'مسیر انشعاب موازی برقگیر جهت تخلیه اضافه ولتاژهای فاز منفی');

    // WIRE 16: SPD2 Ground Terminal -> PE Busbar
    makeWire([
      new THREE.Vector3(0.35, -0.165, 0.030),
      new THREE.Vector3(0.35, -0.260, 0.035),
      new THREE.Vector3(0.20, -0.355, 0.042)
    ], 0.0065, wireGreenMat, 'هادی تخلیه سرج ارستر ۲ به شین ارت (SPD2 Grounding)', 'سیم 6mm² سبز-زرد اتصال زمین کوتاه تخلیه صاعقه به شین ارت');

    // WIRE 17: QPV2 Bottom Pole 1 (T1+) -> Bottom Exit Gland (MPPT2+)
    makeWire([
      new THREE.Vector3(0.16, -0.165, 0.035),
      new THREE.Vector3(0.16, -0.280, 0.040),
      new THREE.Vector3(0.15, -0.420, 0.035),
      new THREE.Vector3(0.15, -0.525, 0.020)
    ], 0.0055, wireRedMat, 'هادی خروجی کلید ایزولاتور QPV2 قطب مثبت (MPPT2+)', 'کابل DC خورشیدی 4mm² خارج شده از کمباینر به سمت MPPT2 اینورتر');

    // WIRE 18: QPV2 Bottom Pole 2 (T2-) -> Bottom Exit Gland (MPPT2-)
    makeWire([
      new THREE.Vector3(0.22, -0.165, 0.035),
      new THREE.Vector3(0.22, -0.280, 0.040),
      new THREE.Vector3(0.23, -0.420, 0.035),
      new THREE.Vector3(0.23, -0.525, 0.020)
    ], 0.0055, wireBlueMat, 'هادی خروجی کلید ایزولاتور QPV2 قطب منفی (MPPT2-)', 'کابل DC خورشیدی 4mm² خارج شده از کمباینر به سمت MPPT2 اینورتر');

    // WIRE 19: PE Busbar Center -> Bottom Center Exit Gland (To External MET)
    makeWire([
      new THREE.Vector3(0.00, -0.370, 0.042),
      new THREE.Vector3(0.00, -0.440, 0.035),
      new THREE.Vector3(0.00, -0.525, 0.020)
    ], 0.0075, wireGreenMat, 'هادی اصلی هم‌بندی ارت کمباینر باکس به شین MET', 'کابل مسی 16mm² ارت حفاظتی جهت اتصال شینه کمباینر به شینه اصلی ارت زمین');

    this.scene.add(dcGroup);
    this.dcEnclosure = dcGroup;

    this._registerLabel('DC_BOX', '⚡ کمباینر باکس DC', '', dcGroup, new THREE.Vector3(0, 0.65, 0));
  }

  // ==========================================
  // 5kW HYBRID INVERTER (Chassis, Heatsinks, Halo Ring & Live OLED)
  // ==========================================

  _buildHybridInverter() {
    const invGroup = new THREE.Group();
    invGroup.position.set(-1.0, 2.5, -2.2);

    // 1. Sleek Modern Front Chassis (Solis/Deye style chamfered white metal)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.25,
      metalness: 0.35
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.25, 0.26), bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    invGroup.add(body);
    this.inverterBodyMesh = body;

    // 2. Rear Aluminum Extruded Heatsink Fins
    const heatsinkMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.95,
      roughness: 0.2
    });
    for (let hx = -0.42; hx <= 0.42; hx += 0.035) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.008, 1.22, 0.07), heatsinkMat);
      fin.position.set(hx, 0, -0.16);
      invGroup.add(fin);
    }

    // 3. Status Halo Ring (Multi-color LED circle on front face)
    const haloGeo = new THREE.RingGeometry(0.15, 0.175, 32);
    this.haloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8, // Normal generating cyan-blue
      side: THREE.DoubleSide
    });
    const haloMesh = new THREE.Mesh(haloGeo, this.haloMat);
    haloMesh.position.set(0, 0.28, 0.132);
    invGroup.add(haloMesh);

    // 4. ACTIVE DYNAMIC OLED DISPLAY (CanvasTexture on Inverter Display Mesh)
    const screenGeo = new THREE.PlaneGeometry(0.48, 0.26);
    const screenMat = new THREE.MeshBasicMaterial({
      map: this.oledTexture
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 0.02, 0.132);
    invGroup.add(screenMesh);
    this.inverterScreenMesh = screenMesh;

    screenMesh.userData = {
      type: 'DISPLAY',
      id: 'inv_oled_display',
      name: '5kW Hybrid Inverter OLED Telemetry Display',
      desc: 'Live high-resolution telemetry: MPPT1/2, Battery SOC, Grid V/Hz, EPS Status'
    };
    this.interactiveObjects.push(screenMesh);

    // 5. Inverter Bottom Connection Glands (PV in, Bat DC, Grid AC, EPS AC, CT, Comms, PE)
    const glandMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 });
    const glandLabels = ['PV1', 'PV2', 'BAT+', 'BAT-', 'GRID', 'EPS', 'CT', 'PE'];
    glandLabels.forEach((lbl, idx) => {
      const gx = -0.35 + idx * 0.10;
      const gland = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.06, 8), glandMat);
      gland.position.set(gx, -0.65, 0);
      invGroup.add(gland);
    });

    // Brand / Model Badge on Chassis
    const brandCanvas = document.createElement('canvas');
    brandCanvas.width = 256;
    brandCanvas.height = 64;
    const bctx = brandCanvas.getContext('2d');
    bctx.fillStyle = '#0f172a';
    bctx.font = 'bold 24px sans-serif';
    bctx.fillText('HYBRID 5000W', 20, 42);
    const brandTex = new THREE.CanvasTexture(brandCanvas);
    const brandMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.09), new THREE.MeshBasicMaterial({ map: brandTex, transparent: true }));
    brandMesh.position.set(0, -0.42, 0.132);
    invGroup.add(brandMesh);

    this.scene.add(invGroup);
    this.inverterGroup = invGroup;

    this._registerLabel('INVERTER', '⚡ اینورتر هایبرید ۵kW', '', invGroup, new THREE.Vector3(0, 0.85, 0));
  }

  // ==========================================
  // INVERTER X-RAY INTERNAL SUBSYSTEMS
  // ==========================================

  _buildInverterInternalSubsystems() {
    const xrayGroup = new THREE.Group();
    xrayGroup.position.copy(this.inverterGroup.position);
    xrayGroup.visible = false; // Enabled during X-Ray view

    // 1. MPPT 1 Boost Converter Subsystem
    const mppt1 = this._createMPPTModule('MPPT 1 Boost Converter (PV String 1)');
    mppt1.position.set(-0.25, -0.18, 0);
    xrayGroup.add(mppt1);

    // 2. MPPT 2 Boost Converter Subsystem
    const mppt2 = this._createMPPTModule('MPPT 2 Boost Converter (PV String 2)');
    mppt2.position.set(-0.25, -0.42, 0);
    xrayGroup.add(mppt2);

    // 3. Bidirectional DC-DC Battery Stage (Buck-Boost Choke & 400V DC Bus Caps)
    const dcdc = this._createDCDCModule();
    dcdc.position.set(-0.25, 0.22, 0);
    xrayGroup.add(dcdc);

    // 4. Inverter H-Bridge with Heatsink & IGBT Modules
    const hbridge = this._createHBridgeModule();
    hbridge.position.set(0.18, 0.12, 0);
    xrayGroup.add(hbridge);

    // 5. RCMU (Residual Current Monitoring Unit) Toroid Core
    const rcmu = new THREE.Mesh(
      new THREE.TorusGeometry(0.045, 0.015, 12, 24),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 }) // Blue toroidal core
    );
    rcmu.position.set(0.24, -0.32, 0);
    rcmu.userData = {
      type: 'XRAY_SUB',
      name: 'RCMU (Residual Current Monitoring Unit)',
      desc: 'Type B 30mA AC/DC leakage current detection toroidal sensor'
    };
    this.interactiveObjects.push(rcmu);
    xrayGroup.add(rcmu);

    // 6. Grid Disconnect Safety Relays (Redundant Dual 30A Relays)
    const gridRelays = this._createRelayBank('Grid Disconnect Relays (VDE-AR-N 4105 Redundant)', 0xd97706);
    gridRelays.position.set(0.12, -0.44, 0);
    xrayGroup.add(gridRelays);

    // 7. EPS Transfer Relays (<10ms Islanding Transfer Relay)
    const epsRelays = this._createRelayBank('EPS High-Speed Transfer Relays (<10ms Switchover)', 0x7c3aed);
    epsRelays.position.set(0.32, -0.44, 0);
    xrayGroup.add(epsRelays);

    // 8. Dynamic N-PE Grounding Relay
    const npeRelay = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.07, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x16a34a, metalness: 0.4 })
    );
    npeRelay.position.set(0.35, -0.22, 0);
    npeRelay.userData = {
      type: 'XRAY_SUB',
      name: 'N-PE Bonding Relay',
      desc: 'IEC 62109-2 automatic neutral-to-earth bonding during islanded EPS operation'
    };
    this.interactiveObjects.push(npeRelay);
    xrayGroup.add(npeRelay);

    this.scene.add(xrayGroup);
    this.xrayGroup = xrayGroup;
  }

  _createMPPTModule(name) {
    const group = new THREE.Group();
    // Toroidal Power Inductor (copper wire winding on ferrite)
    const toroid = new THREE.Mesh(
      new THREE.TorusGeometry(0.038, 0.016, 12, 24),
      new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.85, roughness: 0.3 })
    );
    toroid.rotation.x = Math.PI / 2;
    group.add(toroid);

    // TO-247 SiC MOSFET switches on small heatsink
    const hs = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.02), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 }));
    hs.position.set(0.07, 0, 0);
    group.add(hs);

    // DC Film Capacitors
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.03), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    cap.position.set(-0.07, 0, 0);
    group.add(cap);

    toroid.userData = { type: 'XRAY_SUB', name, desc: 'High-frequency DC boost stage with maximum power point tracking' };
    this.interactiveObjects.push(toroid);
    return group;
  }

  _createDCDCModule() {
    const group = new THREE.Group();
    // Bidirectional Buck-Boost Choke
    const choke = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.08, 16),
      new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.85, roughness: 0.3 })
    );
    group.add(choke);

    // 400V Electrolytic DC Bus Capacitor Bank (4 cylinders)
    const capMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.3 });
    [[-0.06, 0.05], [-0.06, -0.05], [0.06, 0.05], [0.06, -0.05]].forEach(([cx, cy]) => {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.09, 16), capMat);
      c.position.set(cx, cy, 0.03);
      group.add(c);
    });

    choke.userData = {
      type: 'XRAY_SUB',
      name: 'Bidirectional DC-DC Battery Stage',
      desc: '48V <-> 400V high-efficiency buck-boost converter managing battery charge/discharge'
    };
    this.interactiveObjects.push(choke);
    return group;
  }

  _createHBridgeModule() {
    const group = new THREE.Group();
    // Heatsink baseplate
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.03), new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 }));
    group.add(base);

    // 4x IGBT / SiC Full-Bridge Power Modules
    const igbtMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4 });
    [[-0.06, 0.04], [0.06, 0.04], [-0.06, -0.04], [0.06, -0.04]].forEach(([ix, iy]) => {
      const igbt = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.02), igbtMat);
      igbt.position.set(ix, iy, 0.02);
      group.add(igbt);
    });

    base.userData = {
      type: 'XRAY_SUB',
      name: 'Inverter H-Bridge (DC to 230V 50Hz AC)',
      desc: 'SPWM driven full-bridge IGBT stage with ultra-low THD (<2%) pure sinewave output'
    };
    this.interactiveObjects.push(base);
    return group;
  }

  _createRelayBank(name, colorHex) {
    const group = new THREE.Group();
    const relayMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.35 });
    const r1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.05), relayMat);
    const r2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.05), relayMat);
    r1.position.x = -0.035;
    r2.position.x = 0.035;
    group.add(r1);
    group.add(r2);

    r1.userData = { type: 'XRAY_SUB', name, desc: 'Mechanical isolation relays with dual physical contact feedback' };
    this.interactiveObjects.push(r1);
    return group;
  }

  // ==========================================
  // BATTERY ENERGY STORAGE RACK & DISCONNECT
  // ==========================================

  _buildBatteryEnergyStorage() {
    const bessGroup = new THREE.Group();
    bessGroup.position.set(1.2, 0.85, -1.8);

    // 19" Server-Style Rack Cabinet
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.5 });
    const rackFrame = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.65, 0.75), rackMat);
    rackFrame.castShadow = true;
    bessGroup.add(rackFrame);

    // --- Master BMS Unit (Top Rack Slot, Y = 0.55) ---
    const bms = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.22, 0.65), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    bms.position.set(0, 0.55, 0.03);
    bessGroup.add(bms);

    // BMS Mini LCD Screen
    const bmsScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.08), new THREE.MeshBasicMaterial({ color: 0x0284c7 }));
    bmsScreen.position.set(-0.2, 0.55, 0.38);
    bessGroup.add(bmsScreen);

    // --- 2x 48V / 51.2V 100Ah LiFePO4 Modules (Slot 2 & Slot 3) ---
    this.batteryModules = [];
    [-0.05, -0.45].forEach((my, idx) => {
      const modGroup = new THREE.Group();
      modGroup.position.set(0, my, 0.03);

      // Module Front Chassis
      const modBody = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.32, 0.65), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 }));
      modGroup.add(modBody);

      // Heavy-Duty Rack Handles (black steel)
      const handleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 });
      [-0.38, 0.38].forEach(hx => {
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.06), handleMat);
        handle.position.set(hx, 0, 0.36);
        modGroup.add(handle);
      });

      // Power Terminals (Positive RED, Negative BLACK)
      const posTerm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.04, 12), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
      posTerm.rotation.x = Math.PI / 2;
      posTerm.position.set(0.24, 0.06, 0.36);
      modGroup.add(posTerm);

      const negTerm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.04, 12), new THREE.MeshStandardMaterial({ color: 0x18181b }));
      negTerm.rotation.x = Math.PI / 2;
      negTerm.position.set(0.32, 0.06, 0.36);
      modGroup.add(negTerm);

      // Dynamic 5-Segment SOC LED Bar (20%, 40%, 60%, 80%, 100%)
      const socSegments = [];
      for (let s = 0; s < 5; s++) {
        const ledMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
        const led = new THREE.Mesh(new THREE.PlaneGeometry(0.025, 0.012), ledMat);
        led.position.set(-0.15 + s * 0.035, 0.06, 0.36);
        modGroup.add(led);
        socSegments.push(ledMat);
      }

      // RUN LED (green) & ALARM LED (red)
      const runLed = new THREE.Mesh(new THREE.PlaneGeometry(0.015, 0.015), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
      runLed.position.set(0.06, 0.06, 0.36);
      modGroup.add(runLed);

      modBody.userData = {
        type: 'BATTERY_MODULE',
        id: `bat_mod_${idx + 1}`,
        name: `LiFePO4 Module #${idx + 1} (51.2V 100Ah 5.12kWh)`,
        desc: '16S Grade-A LiFePO4 cells with smart BMS cell balancing & temperature sensors'
      };
      this.interactiveObjects.push(modBody);

      this.batteryModules.push({
        group: modGroup,
        socSegments,
        runLed
      });

      bessGroup.add(modGroup);
    });

    // --- External Wall-Mounted Battery OCPD & DC Disconnect Enclosure ---
    const batDiscGroup = new THREE.Group();
    batDiscGroup.position.set(1.2, 2.6, -2.2);

    const discBox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.58, 0.18), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    batDiscGroup.add(discBox);

    // Heavy-duty 2P 125A DC Circuit Breaker / Isolator
    const mcbBase = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.12), new THREE.MeshStandardMaterial({ color: 0xf1f5f9 }));
    mcbBase.position.set(0, 0, 0.06);
    batDiscGroup.add(mcbBase);

    // Pivoting Breaker Lever
    const leverGroup = new THREE.Group();
    leverGroup.position.set(0, 0.03, 0.13);
    const lever = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
    leverGroup.add(lever);
    batDiscGroup.add(leverGroup);

    lever.userData = {
      type: 'SWITCH',
      id: 'bat_breaker',
      name: 'Battery DC Overcurrent Protection & Disconnect (2P 125A DC MCB)',
      action: 'toggle'
    };
    this.interactiveObjects.push(lever);

    this.switchgear['bat_breaker'] = {
      type: 'lever',
      object: leverGroup,
      currentAngle: 0.45, // UP = ON (0.45 rad), DOWN = OFF (-0.35 rad)
      targetAngle: 0.45,
      state: true
    };

    this.scene.add(bessGroup);
    this.scene.add(batDiscGroup);
    this.bessGroup = bessGroup;

    this._registerLabel('BATTERY', '🔋 بانک باتری LiFePO4', '', bessGroup, new THREE.Vector3(0, 1.05, 0));
  }

  // ==========================================
  // MAIN EARTHING TERMINAL (MET) SOLID COPPER BUSBAR
  // ==========================================

  _buildEarthingSystemMET() {
    const metGroup = new THREE.Group();
    metGroup.position.set(-0.5, 0.4, -2.3);

    // Insulating Standoff Brackets (Green Polyester Resin)
    const standoffMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 });
    [-0.32, 0.32].forEach(sx => {
      const so = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.06, 12), standoffMat);
      so.rotation.x = Math.PI / 2;
      so.position.set(sx, 0, 0.02);
      metGroup.add(so);
    });

    // Solid Copper Busbar (Heavy gauge conductive copper)
    const busbarMat = new THREE.MeshStandardMaterial({
      color: 0xb45309, // Conductive bare copper
      metalness: 0.95,
      roughness: 0.15
    });
    const busbar = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.07, 0.015), busbarMat);
    busbar.position.set(0, 0, 0.05);
    metGroup.add(busbar);

    // Brass Cable Connection Screws & Washers (8 terminals along bar)
    const screwMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.2 });
    for (let i = -0.28; i <= 0.28; i += 0.08) {
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 8), screwMat);
      screw.rotation.x = Math.PI / 2;
      screw.position.set(i, 0, 0.06);
      metGroup.add(screw);
    }

    // Main Grounding Electrode Lead (Heavy green/yellow copper conductor into floor)
    const groundLead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.45, 8),
      new THREE.MeshStandardMaterial({ color: 0x84cc16 }) // Green-yellow earth cable
    );
    groundLead.position.set(-0.28, -0.22, 0.05);
    metGroup.add(groundLead);

    busbar.userData = {
      type: 'MET',
      id: 'met_busbar',
      name: 'Main Earthing Terminal (MET) Solid Copper Busbar',
      desc: 'Central equipotential bonding point: PV frames, DC/AC SPDs, Inverter PE, BESS PE, MDB PE, and Earth Rod'
    };
    this.interactiveObjects.push(busbar);

    this.scene.add(metGroup);
    this.metGroup = metGroup;

    this._registerLabel('EARTHING_MET', '⏚ شین اصلی ارت (MET)', '', metGroup, new THREE.Vector3(0, 0.25, 0));
  }

  // ==========================================
  // MAIN AC DISTRIBUTION BOARD (MDB) & GRID
  // ==========================================

  /**
   * Helper to construct realistic dressed conductors with 90-degree bends and bootlace ferrules
   */
  _createDressedConductor(points, radius, colorHex, parentGroup, userData, isPE = false) {
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.08);
    const tubeGeo = new THREE.TubeGeometry(curve, Math.max(24, points.length * 8), radius, 8, false);

    let tubeMat;
    if (isPE) {
      tubeMat = new THREE.MeshStandardMaterial({
        map: this.peWireTexture,
        roughness: 0.35,
        metalness: 0.1
      });
    } else {
      tubeMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.28,
        metalness: 0.15
      });
    }

    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    tubeMesh.userData = Object.assign({ type: 'INTERNAL_CONDUCTOR' }, userData);
    parentGroup.add(tubeMesh);
    this.interactiveObjects.push(tubeMesh);

    // Add bootlace ferrules with color-coded nylon collars at start and end
    const ferruleGeo = new THREE.CylinderGeometry(radius * 1.18, radius * 1.18, 0.012, 10);
    const ferruleMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 }); // Tin-plated brass

    const startP = points[0];
    const endP = points[points.length - 1];

    const f1 = new THREE.Mesh(ferruleGeo, ferruleMat);
    f1.position.copy(startP);
    parentGroup.add(f1);

    const f2 = new THREE.Mesh(ferruleGeo, ferruleMat);
    f2.position.copy(endP);
    parentGroup.add(f2);

    // Register in circuit graph for interactive path tracing
    if (userData.circuitId) {
      if (!this.circuitGraph[userData.circuitId]) this.circuitGraph[userData.circuitId] = [];
      this.circuitGraph[userData.circuitId].push(tubeMesh);
    }

    return tubeMesh;
  }

  // ============================================================================
  // 1. MAIN AC DISTRIBUTION BOARD (MDB - HIGH-FIDELITY MASTER ELECTRICIAN BUILD)
  // IEC 60364-7-712:2025, IEC 60364-4-41, IEC 61643-11, IEC 60898-1, IEC 61439-1/2
  // ============================================================================

  _buildMainDistributionBoard() {
    const mdbGroup = new THREE.Group();
    // Center of Main Board in 3D Technical Room
    mdbGroup.position.set(3.05, 2.40, -2.20);

    const W = 0.60, H = 0.80, D = 0.22;

    // --- 1. Industrial Sheet Steel Hollow Enclosure (5-Sided Cabinet with open front aperture) ---
    const t = 0.015;
    const caseMat = new THREE.MeshStandardMaterial({ color: 0xdfe4ea, metalness: 0.25, roughness: 0.45 });
    const casingGroup = new THREE.Group();

    // 1a. Back Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(W, H, t), caseMat);
    backWall.position.set(0, 0, -D / 2 + t / 2);
    backWall.receiveShadow = true;
    casingGroup.add(backWall);

    // 1b. Left Wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(t, H, D), caseMat);
    leftWall.position.set(-W / 2 + t / 2, 0, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    casingGroup.add(leftWall);

    // 1c. Right Wall
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(t, H, D), caseMat);
    rightWall.position.set(W / 2 - t / 2, 0, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    casingGroup.add(rightWall);

    // 1d. Top Wall
    const topWall = new THREE.Mesh(new THREE.BoxGeometry(W, t, D), caseMat);
    topWall.position.set(0, H / 2 - t / 2, 0);
    topWall.castShadow = true;
    topWall.receiveShadow = true;
    casingGroup.add(topWall);

    // 1e. Bottom Wall (Cable Gland Baseplate)
    const bottomWall = new THREE.Mesh(new THREE.BoxGeometry(W, t, D), caseMat);
    bottomWall.position.set(0, -H / 2 + t / 2, 0);
    bottomWall.receiveShadow = true;
    casingGroup.add(bottomWall);

    // 1f. Perimeter Gasket Flange (20mm border along front rim, NO FRONT WALL in center!)
    const flangeRim = 0.020;
    const flangeD = 0.008;
    const fZ = D / 2 - flangeD / 2;
    const flangeMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.35, roughness: 0.35 });

    const fTop = new THREE.Mesh(new THREE.BoxGeometry(W, flangeRim, flangeD), flangeMat);
    fTop.position.set(0, H / 2 - flangeRim / 2, fZ);
    casingGroup.add(fTop);

    const fBottom = new THREE.Mesh(new THREE.BoxGeometry(W, flangeRim, flangeD), flangeMat);
    fBottom.position.set(0, -H / 2 + flangeRim / 2, fZ);
    casingGroup.add(fBottom);

    const fLeft = new THREE.Mesh(new THREE.BoxGeometry(flangeRim, H - 2 * flangeRim, flangeD), flangeMat);
    fLeft.position.set(-W / 2 + flangeRim / 2, 0, fZ);
    casingGroup.add(fLeft);

    const fRight = new THREE.Mesh(new THREE.BoxGeometry(flangeRim, H - 2 * flangeRim, flangeD), flangeMat);
    fRight.position.set(W / 2 - flangeRim / 2, 0, fZ);
    casingGroup.add(fRight);

    mdbGroup.add(casingGroup);
    const casing = backWall;

    // Galvanized Steel Mounting Backplate (Plane 0: Z = -0.09)
    const backplateGeo = new THREE.BoxGeometry(W - 0.06, H - 0.06, 0.005);
    const backplateMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
    const backplate = new THREE.Mesh(backplateGeo, backplateMat);
    backplate.position.set(0, 0, -0.09);
    mdbGroup.add(backplate);

    // --- 2. Smoked Transparent Polycarbonate Hinged Door (Interactive Swinging Hinge) ---
    const mdbDoorHinge = new THREE.Group();
    mdbDoorHinge.position.set(-W / 2 + 0.01, 0, D / 2 + 0.006);

    const doorGeo = new THREE.BoxGeometry(W - 0.02, H - 0.02, 0.010);
    const doorMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.35,
      transmission: 0.88,
      roughness: 0.12,
      ior: 1.58,
      clearcoat: 0.95,
      clearcoatRoughness: 0.08
    });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set((W - 0.02) / 2, 0, 0);
    mdbDoorHinge.add(door);

    // Quarter-turn industrial cam lock latch & zinc handle on opening edge
    const latch = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 12), new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.9 }));
    latch.rotation.x = Math.PI / 2;
    latch.position.set(W - 0.05, 0, 0.010);
    mdbDoorHinge.add(latch);

    door.userData = { id: 'mdb_door', type: 'DOOR', name: 'درب تابلوی اصلی MDB (کلیک جهت باز/بستن)', action: 'toggle_mdb_door' };
    this.interactiveObjects.push(door);
    mdbGroup.add(mdbDoorHinge);
    this.mdbDoorHinge = mdbDoorHinge;
    this.mdbDoorOpen = false;
    this.mdbDoorTargetAngle = 0;

    // --- 3. Industrial Slotted PVC Wiring Ducts (Grey Trunking with visible open fingers) ---
    const ductMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5, metalness: 0.1 });
    const ductCoverMat = new THREE.MeshPhysicalMaterial({ color: 0x64748b, transparent: true, opacity: 0.55, transmission: 0.45, roughness: 0.25 });

    // Helper to make slotted trunking channel with open slot fingers
    const makeDuct = (dw, dh, dd, x, y, z) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(dw, dh, dd), ductMat);
      g.add(body);
      const cover = new THREE.Mesh(new THREE.BoxGeometry(dw, dh * 0.92, 0.004), ductCoverMat);
      cover.position.set(0, 0, dd / 2 + 0.002);
      g.add(cover);
      g.position.set(x, y, z);
      mdbGroup.add(g);
      return g;
    };

    makeDuct(0.52, 0.045, 0.05, 0, 0.32, -0.04);  // Top horizontal duct
    makeDuct(0.52, 0.045, 0.05, 0, 0.00, -0.04);  // Middle horizontal duct (between rails)
    makeDuct(0.52, 0.045, 0.05, 0, -0.32, -0.04); // Bottom horizontal duct
    makeDuct(0.04, 0.68, 0.05, -0.24, 0, -0.04);  // Left vertical duct
    makeDuct(0.04, 0.68, 0.05, 0.24, 0, -0.04);   // Right vertical duct

    // --- 4. Compression Cable Glands Schedule on Bottom Plate (Y = -0.40) ---
    const glandMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3, metalness: 0.2 });
    const locknutMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 }); // Brass locknut
    const makeGland = (gx, labelText) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.04, 12), glandMat);
      body.position.set(0, -0.02, 0);
      g.add(body);
      const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.012, 6), locknutMat); // Hexagonal nut
      nut.position.set(0, 0.006, 0);
      g.add(nut);
      g.position.set(gx, -H / 2, 0);
      mdbGroup.add(g);
      return g;
    };

    makeGland(-0.17, 'G1: Grid Incomer (3x10mm²)');
    makeGland(-0.07, 'G2: Inverter AC Grid (3x6mm²)');
    makeGland(0.03, 'G3: MET Earth Lead (1x16mm²)');
    makeGland(0.11, 'G4: CT Signal STP (2x0.75mm²)');
    makeGland(0.17, 'G5: RS485 Modbus (2x0.5mm²)');
    makeGland(0.23, 'G6: Non-Critical Loads (3x4mm²)');

    // --- 5. Galvanized DIN Rails TS 35/7.5 (Plane 2: Z = -0.02) ---
    const dinMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.92, roughness: 0.18 });
    const dinTop = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.035, 0.008), dinMat);
    dinTop.position.set(0, 0.16, -0.02);
    mdbGroup.add(dinTop);

    const dinBtm = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.035, 0.008), dinMat);
    dinBtm.position.set(0, -0.16, -0.02);
    mdbGroup.add(dinBtm);

    // --- 6. Feed-Through Modular Terminal Blocks on Top Rail (X = -0.18) ---
    const makeTerminalBlock = (tx, ty, tz, colorHex, labelText, id) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.055, 0.045), new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4 }));
      g.add(body);
      const clampTop = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.008, 8), locknutMat);
      clampTop.position.set(0, 0.022, 0.01);
      g.add(clampTop);
      const clampBtm = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.008, 8), locknutMat);
      clampBtm.position.set(0, -0.022, 0.01);
      g.add(clampBtm);
      g.position.set(tx, ty, tz);
      g.userData = { id, type: 'TERMINAL_BLOCK', name: labelText };
      mdbGroup.add(g);
      this.interactiveObjects.push(body);
      return g;
    };

    makeTerminalBlock(-0.19, 0.16, 0.01, 0x475569, 'X1-L: Grid Phase Incoming Terminal', 'x1_l');
    makeTerminalBlock(-0.176, 0.16, 0.01, 0x2563eb, 'X1-N: Grid Neutral Incoming Terminal', 'x1_n');
    makeTerminalBlock(-0.162, 0.16, 0.01, 0x16a34a, 'X1-PE: Grid PE Grounding Terminal', 'x1_pe');

    // --- 7. Top Rail Switchgear (Q1 Main Incomer, Smart Meter, Voltage Tap Fuse) ---

    // Q1: Main Service Incomer MCB (2P 40A Curve C, 10kA per IEC 60898-1)
    const q1Group = new THREE.Group();
    q1Group.position.set(-0.09, 0.16, 0.025);
    const q1Body = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.085, 0.068), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 }));
    q1Group.add(q1Body);
    // Terminal screw holes
    [-0.009, 0.009].forEach(sx => {
      const sc1 = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.008, 8), locknutMat);
      sc1.position.set(sx, 0.036, 0.02);
      q1Group.add(sc1);
      const sc2 = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.008, 8), locknutMat);
      sc2.position.set(sx, -0.036, 0.02);
      q1Group.add(sc2);
    });
    // Pivoting Lever with Red (ON) / Green (OFF) band
    const q1LeverGroup = new THREE.Group();
    q1LeverGroup.position.set(0, 0.01, 0.038);
    const q1Lever = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.045, 0.025), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
    q1LeverGroup.add(q1Lever);
    q1Group.add(q1LeverGroup);
    q1Lever.userData = { id: 'grid_mcb', type: 'SWITCH', name: 'Q1: Main Service Incomer MCB (2P 40A Curve C 10kA)', action: 'toggle' };
    this.interactiveObjects.push(q1Lever);
    this.switchgear['grid_mcb'] = { type: 'lever', object: q1LeverGroup, currentAngle: 0.45, targetAngle: 0.45, state: true };
    this.switchgear['grid_incomer_mcb'] = this.switchgear['grid_mcb'];
    mdbGroup.add(q1Group);

    // Smart Energy Meter (SDM230 Bi-directional with LIVE Dynamic LCD Canvas)
    const meterGroup = new THREE.Group();
    meterGroup.position.set(0.02, 0.16, 0.025);
    const meterBody = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.090, 0.068), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 }));
    meterGroup.add(meterBody);

    // Active Dynamic LCD Display Screen
    const meterScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.030, 0.038), new THREE.MeshBasicMaterial({ map: this.meterTexture }));
    meterScreen.position.set(0, 0.015, 0.035);
    meterGroup.add(meterScreen);

    // Pulsing Red Impulse LED (1000 imp/kWh)
    this.meterImpulseLED = new THREE.Mesh(new THREE.CircleGeometry(0.002, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    this.meterImpulseLED.position.set(-0.01, -0.025, 0.035);
    meterGroup.add(this.meterImpulseLED);

    meterBody.userData = { id: 'smart_meter', type: 'METER', name: 'SDM230 Smart Energy Meter (Bi-Directional RS485 Modbus)' };
    this.interactiveObjects.push(meterBody);
    mdbGroup.add(meterGroup);

    // FUSE_VT: Voltage Tap 1P 2A Fuse Holder
    const fuseVtGroup = new THREE.Group();
    fuseVtGroup.position.set(0.08, 0.16, 0.025);
    const fuseBody = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.080, 0.065), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 }));
    fuseVtGroup.add(fuseBody);
    mdbGroup.add(fuseVtGroup);

    // N_BAR_MDB: Main Grid Neutral Busbar on Blue Insulating Carrier (Row 1 Right)
    const nBarGroup = new THREE.Group();
    nBarGroup.position.set(0.17, 0.16, 0.015);
    const nCarrier = new THREE.Mesh(new THREE.BoxGeometry(0.080, 0.030, 0.025), new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4 }));
    nBarGroup.add(nCarrier);
    const nBrassBar = new THREE.Mesh(new THREE.BoxGeometry(0.076, 0.010, 0.012), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9 }));
    nBrassBar.position.set(0, 0, 0.01);
    nBarGroup.add(nBrassBar);
    for (let bx = -0.03; bx <= 0.03; bx += 0.012) {
      const bScrew = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.008, 8), locknutMat);
      bScrew.rotation.x = Math.PI / 2;
      bScrew.position.set(bx, 0, 0.017);
      nBarGroup.add(bScrew);
    }
    nBarGroup.userData = { id: 'n_bar_mdb', type: 'BUSBAR_NEUTRAL', name: 'Main Grid Neutral Busbar (N-GRID)' };
    this.interactiveObjects.push(nBrassBar);
    mdbGroup.add(nBarGroup);

    // --- 8. Bottom Rail Switchgear (AC SPD, Inverter MCB Q2, Branch MCBs, PE Bar) ---

    // AC SPD Type 2 (1P+N, Uc 275V, In 20kA, Shunt Connected)
    const spdGroup = new THREE.Group();
    spdGroup.position.set(-0.16, -0.16, 0.025);
    const spdBody = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.090, 0.065), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 }));
    spdGroup.add(spdBody);

    // 2x Mechanical Inspection Status Flags (Emerald Green = Healthy, Safety Red = Tripped)
    this.acSpdFlags = [];
    [-0.009, 0.009].forEach(fx => {
      const fMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
      const fMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 0.016), fMat);
      fMesh.position.set(fx, 0.02, 0.034);
      spdGroup.add(fMesh);
      this.acSpdFlags.push(fMat);
    });
    spdBody.userData = { id: 'ac_spd', type: 'SPD', name: 'Type 2 AC Surge Protective Device (Uc 275V, In 20kA, Imax 40kA)' };
    this.interactiveObjects.push(spdBody);
    mdbGroup.add(spdGroup);

    // Q_SPD: 2P 20A SPD Backup MCB
    const qSpdGroup = new THREE.Group();
    qSpdGroup.position.set(-0.09, -0.16, 0.025);
    const qSpdBody = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.085, 0.068), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 }));
    qSpdGroup.add(qSpdBody);
    const qSpdLeverGroup = new THREE.Group();
    qSpdLeverGroup.position.set(0, 0.01, 0.038);
    const qSpdLever = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.045, 0.025), new THREE.MeshStandardMaterial({ color: 0x18181b }));
    qSpdLeverGroup.add(qSpdLever);
    qSpdGroup.add(qSpdLeverGroup);
    qSpdLever.userData = { id: 'spd_backup_mcb', type: 'SWITCH', name: 'Q_SPD: AC SPD Backup MCB (2P 20A Curve C)', title: 'نمایشی — در مدل شبیه‌سازی نشده', action: 'toggle' };
    this.interactiveObjects.push(qSpdLever);
    this.switchgear['spd_backup_mcb'] = { type: 'lever', object: qSpdLeverGroup, currentAngle: 0.45, targetAngle: 0.45, state: true };
    mdbGroup.add(qSpdGroup);

    // Q2: Inverter AC Grid Interconnection Breaker (2P 32A Curve C, 6kA per IEC 60364-7-712)
    const q2Group = new THREE.Group();
    q2Group.position.set(-0.01, -0.16, 0.025);
    const q2Body = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.085, 0.068), new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3 }));
    q2Group.add(q2Body);
    const q2LeverGroup = new THREE.Group();
    q2LeverGroup.position.set(0, 0.01, 0.038);
    const q2Lever = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.045, 0.025), new THREE.MeshStandardMaterial({ color: 0x18181b }));
    q2LeverGroup.add(q2Lever);
    q2Group.add(q2LeverGroup);
    q2Lever.userData = { id: 'inv_grid_mcb', type: 'SWITCH', name: 'Q2: Inverter Grid Interconnection MCB (2P 32A Curve C)', action: 'toggle' };
    this.interactiveObjects.push(q2Lever);
    this.switchgear['inv_grid_mcb'] = { type: 'lever', object: q2LeverGroup, currentAngle: 0.45, targetAngle: 0.45, state: true };
    mdbGroup.add(q2Group);

    // Non-Critical Load Branch Breakers (Q3 16A Sockets, Q4 10A Lighting, Q5 20A HVAC)
    const makeBranchMCB = (bx, name, id, amp) => {
      const g = new THREE.Group();
      g.position.set(bx, -0.16, 0.025);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.085, 0.068), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35 }));
      g.add(b);
      const levG = new THREE.Group();
      levG.position.set(0, 0.01, 0.038);
      const lev = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.042, 0.025), new THREE.MeshStandardMaterial({ color: 0x18181b }));
      levG.add(lev);
      g.add(levG);
      lev.userData = { id, type: 'SWITCH', name: name + ' (' + amp + 'A)', action: 'toggle' };
      this.interactiveObjects.push(lev);
      this.switchgear[id] = { type: 'lever', object: levG, currentAngle: 0.45, targetAngle: 0.45, state: true };
      mdbGroup.add(g);
      return g;
    };

    makeBranchMCB(0.05, 'Q3: Non-Critical Sockets Branch', 'load_mcb_1', 16);
    makeBranchMCB(0.09, 'Q4: General House Lighting Branch', 'load_mcb_2', 10);
    makeBranchMCB(0.13, 'Q5: Heavy Load (HVAC / EVSE)', 'load_mcb_3', 20);

    // 80A Rated Insulated Copper Comb Busbar (BB-L) spanning line side of breakers
    const combBar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.018, 0.012), new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 }));
    combBar.position.set(0.06, -0.12, 0.045);
    mdbGroup.add(combBar);

    // PE_BAR_MDB: Solid Brass Earth Busbar on Green Standoffs (Row 2 Right)
    const peBarGroup = new THREE.Group();
    peBarGroup.position.set(0.19, -0.16, 0.015);
    const peCarrier = new THREE.Mesh(new THREE.BoxGeometry(0.090, 0.025, 0.025), new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 }));
    peBarGroup.add(peCarrier);
    const peBrassBar = new THREE.Mesh(new THREE.BoxGeometry(0.086, 0.010, 0.012), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9 }));
    peBrassBar.position.set(0, 0, 0.01);
    peBarGroup.add(peBrassBar);
    for (let px = -0.035; px <= 0.035; px += 0.010) {
      const pScrew = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.008, 8), locknutMat);
      pScrew.rotation.x = Math.PI / 2;
      pScrew.position.set(px, 0, 0.017);
      peBarGroup.add(pScrew);
    }
    peBarGroup.userData = { id: 'pe_bar_mdb', type: 'BUSBAR_EARTH', name: 'Main Protective Earth (PE) Busbar' };
    this.interactiveObjects.push(peBrassBar);
    mdbGroup.add(peBarGroup);

    // --- 9. Split-Core CT Toroid Clamped Around Brown Phase Conductor ---
    const ctToroid = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.008, 12, 24), new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 }));
    ctToroid.position.set(-0.04, 0.06, 0.01); // In between Q1 and Smart Meter
    ctToroid.rotation.x = Math.PI / 2;
    mdbGroup.add(ctToroid);
    const ctArrow = new THREE.Mesh(new THREE.ConeGeometry(0.004, 0.012, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    ctArrow.rotation.z = -Math.PI / 2;
    ctArrow.position.set(-0.04, 0.06, 0.025);
    mdbGroup.add(ctArrow);

    // --- 10. EXACT INTERNAL CONDUCTOR ROUTING (100% VISIBLE & TRACEABLE) ---
    // Circuit Colors per IEC: Brown = L, Blue = N, Helical Stripe = PE, Orange/White = CT Signal

    // Conductor 1: Incoming Grid Phase L (Gland G1 -> X1-L) [10mm² Brown]
    this._createDressedConductor([
      new THREE.Vector3(-0.17, -0.40, 0.00),
      new THREE.Vector3(-0.17, -0.32, -0.04),
      new THREE.Vector3(-0.24, -0.32, -0.04),
      new THREE.Vector3(-0.24, 0.16, -0.04),
      new THREE.Vector3(-0.19, 0.138, 0.01)
    ], 0.0042, 0x854d0e, mdbGroup, { id: 'W_GRD_L1', circuitId: 'circ_grid_incomer', label: 'Grid Phase (L) Feeder' });

    // Conductor 2: Incoming Grid Neutral N (Gland G1 -> X1-N) [10mm² Blue]
    this._createDressedConductor([
      new THREE.Vector3(-0.16, -0.40, 0.00),
      new THREE.Vector3(-0.16, -0.31, -0.03),
      new THREE.Vector3(-0.23, -0.31, -0.03),
      new THREE.Vector3(-0.23, 0.16, -0.03),
      new THREE.Vector3(-0.176, 0.138, 0.01)
    ], 0.0042, 0x2563eb, mdbGroup, { id: 'W_GRD_N1', circuitId: 'circ_grid_incomer', label: 'Grid Neutral (N) Feeder' });

    // Conductor 3: Incoming Grid PE (Gland G1 -> PE_BAR_MDB) [10mm² Helical PE]
    this._createDressedConductor([
      new THREE.Vector3(-0.15, -0.40, 0.00),
      new THREE.Vector3(-0.15, -0.32, -0.02),
      new THREE.Vector3(0.18, -0.32, -0.02),
      new THREE.Vector3(0.18, -0.175, 0.015)
    ], 0.0042, 0x16a34a, mdbGroup, { id: 'W_GRD_PE1', circuitId: 'circ_earth', label: 'Grid PE Ground Lead' }, true);

    // Conductor 4: X1-L to Main MCB Q1 Top Pole 1 [10mm² Brown]
    this._createDressedConductor([
      new THREE.Vector3(-0.19, 0.182, 0.01),
      new THREE.Vector3(-0.19, 0.32, -0.04),
      new THREE.Vector3(-0.099, 0.32, -0.04),
      new THREE.Vector3(-0.099, 0.205, 0.025)
    ], 0.0042, 0x854d0e, mdbGroup, { id: 'W_X1_Q1_L', circuitId: 'circ_grid_incomer', label: 'Phase Incomer to Q1' });

    // Conductor 5: X1-N to Main MCB Q1 Top Pole 2 [10mm² Blue]
    this._createDressedConductor([
      new THREE.Vector3(-0.176, 0.182, 0.01),
      new THREE.Vector3(-0.176, 0.31, -0.03),
      new THREE.Vector3(-0.081, 0.31, -0.03),
      new THREE.Vector3(-0.081, 0.205, 0.025)
    ], 0.0042, 0x2563eb, mdbGroup, { id: 'W_X1_Q1_N', circuitId: 'circ_grid_incomer', label: 'Neutral Incomer to Q1' });

    // Conductor 6: Q1 Btm Pole 1 -> Passes through CT Toroid -> Smart Meter Pin 1 [10mm² Brown]
    this._createDressedConductor([
      new THREE.Vector3(-0.099, 0.115, 0.025),
      new THREE.Vector3(-0.099, 0.00, -0.04),
      new THREE.Vector3(-0.04, 0.06, 0.01), // Through CT Toroid!
      new THREE.Vector3(0.011, 0.00, -0.04),
      new THREE.Vector3(0.011, 0.115, 0.025)
    ], 0.0042, 0x854d0e, mdbGroup, { id: 'W_Q1_MTR_L', circuitId: 'circ_grid_bus', label: 'Q1 Out Phase through CT to Meter' });

    // Conductor 7: Q1 Btm Pole 2 -> Smart Meter Pin 2 [10mm² Blue]
    this._createDressedConductor([
      new THREE.Vector3(-0.081, 0.115, 0.025),
      new THREE.Vector3(-0.081, -0.01, -0.03),
      new THREE.Vector3(0.029, -0.01, -0.03),
      new THREE.Vector3(0.029, 0.115, 0.025)
    ], 0.0042, 0x2563eb, mdbGroup, { id: 'W_Q1_MTR_N', circuitId: 'circ_grid_bus', label: 'Q1 Out Neutral to Meter' });

    // Conductor 8: Smart Meter Pin 3 (L Out) -> Down to Comb Busbar BB-L [10mm² Brown]
    this._createDressedConductor([
      new THREE.Vector3(0.011, 0.205, 0.025),
      new THREE.Vector3(0.011, 0.32, -0.04),
      new THREE.Vector3(-0.01, 0.32, -0.04),
      new THREE.Vector3(-0.01, 0.00, -0.04),
      new THREE.Vector3(-0.01, -0.115, 0.045) // Feeds BB-L at Q2
    ], 0.0042, 0x854d0e, mdbGroup, { id: 'W_MTR_BBL', circuitId: 'circ_grid_bus', label: 'Meter Out Phase to AC Comb Busbar' });

    // Conductor 9: Smart Meter Pin 4 (N Out) -> N_BAR_MDB [10mm² Blue]
    this._createDressedConductor([
      new THREE.Vector3(0.029, 0.205, 0.025),
      new THREE.Vector3(0.029, 0.31, -0.03),
      new THREE.Vector3(0.17, 0.31, -0.03),
      new THREE.Vector3(0.17, 0.175, 0.015)
    ], 0.0042, 0x2563eb, mdbGroup, { id: 'W_MTR_NBAR', circuitId: 'circ_grid_bus', label: 'Meter Out Neutral to N-GRID Bar' });

    // Conductor 10: Comb Busbar BB-L to SPD Backup MCB Q_SPD Top 1 [4mm² Brown]
    this._createDressedConductor([
      new THREE.Vector3(-0.01, -0.115, 0.045),
      new THREE.Vector3(-0.099, -0.115, 0.025)
    ], 0.0028, 0x854d0e, mdbGroup, { id: 'W_BBL_QSPD', circuitId: 'circ_spd', label: 'Phase Tap to SPD Backup MCB' });

    // Conductor 11: N_BAR_MDB to Q_SPD Top 2 [4mm² Blue]
    this._createDressedConductor([
      new THREE.Vector3(0.16, 0.145, 0.015),
      new THREE.Vector3(0.16, 0.00, -0.04),
      new THREE.Vector3(-0.081, 0.00, -0.04),
      new THREE.Vector3(-0.081, -0.115, 0.025)
    ], 0.0028, 0x2563eb, mdbGroup, { id: 'W_NBAR_QSPD', circuitId: 'circ_spd', label: 'Neutral Tap to SPD Backup MCB' });

    // Conductor 12: Q_SPD Btm to AC_SPD Top [4mm² Brown & Blue]
    this._createDressedConductor([
      new THREE.Vector3(-0.099, -0.205, 0.025),
      new THREE.Vector3(-0.099, -0.28, -0.04),
      new THREE.Vector3(-0.169, -0.28, -0.04),
      new THREE.Vector3(-0.169, -0.205, 0.025)
    ], 0.0028, 0x854d0e, mdbGroup, { id: 'W_QSPD_SPD_L', circuitId: 'circ_spd', label: 'SPD Protected Phase Feed' });

    this._createDressedConductor([
      new THREE.Vector3(-0.081, -0.205, 0.025),
      new THREE.Vector3(-0.081, -0.27, -0.03),
      new THREE.Vector3(-0.151, -0.27, -0.03),
      new THREE.Vector3(-0.151, -0.205, 0.025)
    ], 0.0028, 0x2563eb, mdbGroup, { id: 'W_QSPD_SPD_N', circuitId: 'circ_spd', label: 'SPD Protected Neutral Feed' });

    // Conductor 13: AC_SPD Earth Discharge Lead -> PE_BAR_MDB (<0.40m length!) [6mm² Helical PE]
    this._createDressedConductor([
      new THREE.Vector3(-0.16, -0.205, 0.025),
      new THREE.Vector3(-0.16, -0.32, -0.02),
      new THREE.Vector3(0.19, -0.32, -0.02),
      new THREE.Vector3(0.19, -0.175, 0.015)
    ], 0.0034, 0x16a34a, mdbGroup, { id: 'W_SPD_PE', circuitId: 'circ_earth', label: 'AC SPD Earth Discharge Lead' }, true);

    // Conductor 14: Inverter AC Grid Line (Gland G2 -> Q2 Incomer) [6mm² Brown & Blue]
    this._createDressedConductor([
      new THREE.Vector3(-0.07, -0.40, 0.00),
      new THREE.Vector3(-0.07, -0.32, -0.04),
      new THREE.Vector3(-0.019, -0.32, -0.04),
      new THREE.Vector3(-0.019, -0.205, 0.025)
    ], 0.0034, 0x854d0e, mdbGroup, { id: 'W_INV_L', circuitId: 'circ_inverter_grid', label: 'Inverter AC Grid Phase' });

    this._createDressedConductor([
      new THREE.Vector3(-0.06, -0.40, 0.00),
      new THREE.Vector3(-0.06, -0.31, -0.03),
      new THREE.Vector3(-0.001, -0.31, -0.03),
      new THREE.Vector3(-0.001, -0.205, 0.025)
    ], 0.0034, 0x2563eb, mdbGroup, { id: 'W_INV_N', circuitId: 'circ_inverter_grid', label: 'Inverter AC Grid Neutral' });

    // Conductor 15: Inverter PE Ground Lead (Gland G2 -> PE_BAR_MDB) [6mm² Helical PE]
    this._createDressedConductor([
      new THREE.Vector3(-0.05, -0.40, 0.00),
      new THREE.Vector3(-0.05, -0.32, -0.02),
      new THREE.Vector3(0.20, -0.32, -0.02),
      new THREE.Vector3(0.20, -0.175, 0.015)
    ], 0.0034, 0x16a34a, mdbGroup, { id: 'W_INV_PE', circuitId: 'circ_earth', label: 'Inverter AC Earth Lead' }, true);

    // Conductor 16: Main MET Earth Bonding Lead (Gland G3 -> PE_BAR_MDB) [16mm² Helical PE]
    this._createDressedConductor([
      new THREE.Vector3(0.03, -0.40, 0.00),
      new THREE.Vector3(0.03, -0.32, -0.02),
      new THREE.Vector3(0.21, -0.32, -0.02),
      new THREE.Vector3(0.21, -0.175, 0.015)
    ], 0.0050, 0x16a34a, mdbGroup, { id: 'W_MET_MDB_PE', circuitId: 'circ_earth', label: 'Main MET Equipotential Earth Bond' }, true);

    // Conductor 17: Outgoing Non-Critical Loads (Branch Breakers -> Gland G6) [2.5mm² Brown, Blue, PE]
    this._createDressedConductor([
      new THREE.Vector3(0.05, -0.205, 0.025),
      new THREE.Vector3(0.05, -0.32, -0.04),
      new THREE.Vector3(0.23, -0.32, -0.04),
      new THREE.Vector3(0.23, -0.40, 0.00)
    ], 0.0022, 0x854d0e, mdbGroup, { id: 'W_LOAD_L', circuitId: 'circ_non_critical', label: 'Non-Critical Outgoing Phase' });

    this._createDressedConductor([
      new THREE.Vector3(0.18, 0.145, 0.015),
      new THREE.Vector3(0.24, 0.145, -0.04),
      new THREE.Vector3(0.24, -0.32, -0.04),
      new THREE.Vector3(0.235, -0.40, 0.00)
    ], 0.0022, 0x2563eb, mdbGroup, { id: 'W_LOAD_N', circuitId: 'circ_non_critical', label: 'Non-Critical Outgoing Neutral' });

    this._createDressedConductor([
      new THREE.Vector3(0.22, -0.175, 0.015),
      new THREE.Vector3(0.22, -0.32, -0.02),
      new THREE.Vector3(0.24, -0.40, 0.00)
    ], 0.0022, 0x16a34a, mdbGroup, { id: 'W_LOAD_PE', circuitId: 'circ_earth', label: 'Non-Critical Outgoing Earth' }, true);

    // Registration and References
    mdbGroup.userData = {
      type: 'MDB_ENCLOSURE',
      id: 'main_distribution_board',
      name: 'تابلو توزیع اصلی AC و مبادله با شبکه (Main AC Board - MDB)',
      desc: 'حاوی کلید اصلی Q1، ترانس جریان کلمپی CT، کنتور هوشمند، ارستر اضافه ولتاژ AC، کلید تزریق اینورتر Q2 و خروجی بارهای عادی.'
    };
    this.interactiveObjects.push(casing);
    this.scene.add(mdbGroup);
    this.mdbGroup = mdbGroup;

    this._registerLabel('MDB_GRID', '🏢 تابلوی اصلی MDB', '', mdbGroup, new THREE.Vector3(0, 0.48, 0));
  }

  // ============================================================================
  // 2. EPS CRITICAL BACKUP LOADS SUB-PANEL (HIGH-FIDELITY MASTER ELECTRICIAN BUILD)
  // IEC 60364-7-712:2025 Cl. 712.411.3, IEC 61008-1 Type A, IEC 60898-1
  // ============================================================================

  _buildEPSDistributionBoard() {
    const epsGroup = new THREE.Group();
    // Positioned side-by-side with MDB with 0.50m separation
    epsGroup.position.set(4.05, 2.40, -2.20);

    const W = 0.50, H = 0.80, D = 0.22;

    // --- 1. EPS Sheet Steel Hollow Enclosure (5-Sided Cabinet with open front aperture) ---
    const t = 0.015;
    const caseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.35, roughness: 0.4 });
    const casingGroup = new THREE.Group();

    // 1a. Back Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(W, H, t), caseMat);
    backWall.position.set(0, 0, -D / 2 + t / 2);
    backWall.receiveShadow = true;
    casingGroup.add(backWall);

    // 1b. Left Wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(t, H, D), caseMat);
    leftWall.position.set(-W / 2 + t / 2, 0, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    casingGroup.add(leftWall);

    // 1c. Right Wall
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(t, H, D), caseMat);
    rightWall.position.set(W / 2 - t / 2, 0, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    casingGroup.add(rightWall);

    // 1d. Top Wall
    const topWall = new THREE.Mesh(new THREE.BoxGeometry(W, t, D), caseMat);
    topWall.position.set(0, H / 2 - t / 2, 0);
    topWall.castShadow = true;
    topWall.receiveShadow = true;
    casingGroup.add(topWall);

    // 1e. Bottom Wall (Cable Gland Baseplate)
    const bottomWall = new THREE.Mesh(new THREE.BoxGeometry(W, t, D), caseMat);
    bottomWall.position.set(0, -H / 2 + t / 2, 0);
    bottomWall.receiveShadow = true;
    casingGroup.add(bottomWall);

    // 1f. Perimeter Gasket Flange (20mm border along front rim, NO FRONT WALL in center!)
    const flangeRim = 0.020;
    const flangeD = 0.008;
    const fZ = D / 2 - flangeD / 2;
    const flangeMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.35, roughness: 0.35 });

    const fTop = new THREE.Mesh(new THREE.BoxGeometry(W, flangeRim, flangeD), flangeMat);
    fTop.position.set(0, H / 2 - flangeRim / 2, fZ);
    casingGroup.add(fTop);

    const fBottom = new THREE.Mesh(new THREE.BoxGeometry(W, flangeRim, flangeD), flangeMat);
    fBottom.position.set(0, -H / 2 + flangeRim / 2, fZ);
    casingGroup.add(fBottom);

    const fLeft = new THREE.Mesh(new THREE.BoxGeometry(flangeRim, H - 2 * flangeRim, flangeD), flangeMat);
    fLeft.position.set(-W / 2 + flangeRim / 2, 0, fZ);
    casingGroup.add(fLeft);

    const fRight = new THREE.Mesh(new THREE.BoxGeometry(flangeRim, H - 2 * flangeRim, flangeD), flangeMat);
    fRight.position.set(W / 2 - flangeRim / 2, 0, fZ);
    casingGroup.add(fRight);

    epsGroup.add(casingGroup);
    const casing = backWall;

    // Distinct Magenta Identification Header Banner
    const banner = new THREE.Mesh(new THREE.BoxGeometry(W - 0.04, 0.035, 0.01), new THREE.MeshStandardMaterial({ color: 0x7c3aed }));
    banner.position.set(0, H / 2 - 0.025, D / 2 + 0.002);
    epsGroup.add(banner);

    // Galvanized Steel Mounting Backplate
    const backplateGeo = new THREE.BoxGeometry(W - 0.06, H - 0.06, 0.005);
    const backplate = new THREE.Mesh(backplateGeo, new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 }));
    backplate.position.set(0, 0, -0.09);
    epsGroup.add(backplate);

    // Hinged EPS Door with Left Hinge
    const epsDoorHinge = new THREE.Group();
    epsDoorHinge.position.set(-W / 2 + 0.01, 0, D / 2 + 0.006);

    const doorGeo = new THREE.BoxGeometry(W - 0.02, H - 0.02, 0.010);
    const doorMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.38,
      transmission: 0.85,
      roughness: 0.12,
      ior: 1.58,
      clearcoat: 0.95
    });
    const epsDoor = new THREE.Mesh(doorGeo, doorMat);
    epsDoor.position.set((W - 0.02) / 2, 0, 0);
    epsDoorHinge.add(epsDoor);

    const epsLatch = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 12), new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.9 }));
    epsLatch.rotation.x = Math.PI / 2;
    epsLatch.position.set(W - 0.05, 0, 0.010);
    epsDoorHinge.add(epsLatch);

    epsDoor.userData = { id: 'eps_door', type: 'DOOR', name: 'درب تابلوی اضطراری EPS (کلیک جهت باز/بستن)', action: 'toggle_eps_door' };
    this.interactiveObjects.push(epsDoor);
    epsGroup.add(epsDoorHinge);
    this.epsDoorHinge = epsDoorHinge;
    this.epsDoorOpen = false;
    this.epsDoorTargetAngle = 0;

    // --- 2. Slotted PVC Ducts in EPS Panel ---
    const ductMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const ductCoverMat = new THREE.MeshPhysicalMaterial({ color: 0x475569, transparent: true, opacity: 0.55, transmission: 0.45, roughness: 0.25 });
    const makeDuct = (dw, dh, dd, x, y, z) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(dw, dh, dd), ductMat);
      g.add(body);
      const cover = new THREE.Mesh(new THREE.BoxGeometry(dw, dh * 0.92, 0.004), ductCoverMat);
      cover.position.set(0, 0, dd / 2 + 0.002);
      g.add(cover);
      g.position.set(x, y, z);
      epsGroup.add(g);
      return g;
    };

    makeDuct(0.42, 0.045, 0.05, 0, 0.32, -0.04);  // Top duct
    makeDuct(0.42, 0.045, 0.05, 0, 0.00, -0.04);  // Middle duct
    makeDuct(0.42, 0.045, 0.05, 0, -0.32, -0.04); // Bottom duct
    makeDuct(0.04, 0.68, 0.05, -0.19, 0, -0.04);  // Left vertical duct
    makeDuct(0.04, 0.68, 0.05, 0.19, 0, -0.04);   // Right vertical duct

    // Inter-panel Connecting Duct Bridge to MDB
    const bridgeDuct = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.045, 0.05), ductMat);
    bridgeDuct.position.set(-0.50, -0.32, -0.04);
    epsGroup.add(bridgeDuct);

    // --- 3. Glands on Bottom Plate (Y = -0.40) ---
    const glandMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.3 }); // Purple identification gland
    const makeGland = (gx, labelText) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.04, 12), glandMat);
      body.position.set(0, -0.02, 0);
      g.add(body);
      g.position.set(gx, -H / 2, 0);
      epsGroup.add(g);
      return g;
    };

    makeGland(-0.13, 'E1: Inverter EPS AC Input (3x6mm²)');
    makeGland(0.00, 'E2: Critical Backup Loads (3x4mm²)');
    makeGland(0.13, 'E3: EPS PE Cross-Bond Lead (1x10mm²)');

    // --- 4. Galvanized DIN Rails ---
    const dinMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.92, roughness: 0.18 });
    const dinTop = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.035, 0.008), dinMat);
    dinTop.position.set(0, 0.16, -0.02);
    epsGroup.add(dinTop);

    const dinBtm = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.035, 0.008), dinMat);
    dinBtm.position.set(0, -0.16, -0.02);
    epsGroup.add(dinBtm);

    // Modular Feed-Through Terminals (X_EPS & X_BYPASS)
    const locknutMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9 });
    const makeTerminalBlock = (tx, ty, tz, colorHex, labelText, id) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.055, 0.045), new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4 }));
      g.add(body);
      g.position.set(tx, ty, tz);
      g.userData = { id, type: 'TERMINAL_BLOCK', name: labelText };
      epsGroup.add(g);
      this.interactiveObjects.push(body);
      return g;
    };

    // X_EPS Incomer Terminals from Inverter EPS Port
    makeTerminalBlock(-0.16, 0.16, 0.01, 0x7c3aed, 'X_EPS-L: Inverter EPS Phase Terminal', 'x_eps_l');
    makeTerminalBlock(-0.146, 0.16, 0.01, 0x06b6d4, 'X_EPS-N: Inverter EPS Neutral Terminal', 'x_eps_n');
    makeTerminalBlock(-0.132, 0.16, 0.01, 0x16a34a, 'X_EPS-PE: Inverter EPS PE Terminal', 'x_eps_pe');

    // X_BYPASS Incomer Terminals from MDB Grid Bypass (QBP)
    makeTerminalBlock(0.12, 0.16, 0.01, 0x854d0e, 'X_BYPASS-L: Grid Bypass Phase Terminal', 'x_bypass_l');
    makeTerminalBlock(0.134, 0.16, 0.01, 0x06b6d4, 'X_BYPASS-N: Grid Bypass Neutral Terminal', 'x_bypass_n');
    makeTerminalBlock(0.148, 0.16, 0.01, 0x16a34a, 'X_BYPASS-PE: Grid Bypass PE Terminal', 'x_bypass_pe');

    // --- 5. Switchgear on DIN Rails ---

    // QE (Q_EPS): 2P 25A Curve C 6kA EPS Incomer MCB (Top Rail, X = -0.08)
    const qEpsGroup = new THREE.Group();
    qEpsGroup.position.set(-0.08, 0.16, 0.025);
    const qEpsBody = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.085, 0.068), new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.3 }));
    qEpsGroup.add(qEpsBody);
    const qEpsLeverGroup = new THREE.Group();
    qEpsLeverGroup.position.set(0, 0.01, 0.038);
    const qEpsLever = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.045, 0.025), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    qEpsLeverGroup.add(qEpsLever);
    qEpsGroup.add(qEpsLeverGroup);
    qEpsLever.userData = { id: 'eps_mcb', type: 'SWITCH', name: 'QE: EPS Incomer MCB (2P 25A Curve C 6kA - IEC 60898-1)', action: 'toggle' };
    this.interactiveObjects.push(qEpsLever);
    this.switchgear['eps_mcb'] = { type: 'lever', object: qEpsLeverGroup, currentAngle: 0.45, targetAngle: 0.45, state: true };
    this.switchgear['qe_mcb'] = this.switchgear['eps_mcb'];
    epsGroup.add(qEpsGroup);

    // SBY: 3-Position Manual Changeover / Bypass Switch (I - 0 - II) Break-Before-Make
    const sbyGroup = new THREE.Group();
    sbyGroup.position.set(-0.01, 0.16, 0.025);
    const sbyBody = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.085, 0.068), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 }));
    sbyGroup.add(sbyBody);

    // SBY Physical Terminals (Brass Cylinders with Screws)
    const makeSbyTerm = (sx, sy, sz, label, termId) => {
      const tc = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.008, 10), locknutMat);
      tc.rotation.x = Math.PI / 2;
      tc.position.set(sx, sy, sz);
      tc.userData = { id: termId, name: label, type: 'TERMINAL' };
      sbyGroup.add(tc);
      this.interactiveObjects.push(tc);
      return tc;
    };
    // Source I (EPS) terminals (Top)
    makeSbyTerm(-0.014, 0.038, 0.025, 'SBY Source I (L) - Inverter EPS', 'T_SBY_I_L');
    makeSbyTerm(0.014, 0.038, 0.025, 'SBY Source I (N) - Inverter EPS', 'T_SBY_I_N');
    // Source II (Bypass) terminals (Bottom Left)
    makeSbyTerm(-0.014, -0.038, 0.025, 'SBY Source II (L) - Grid Bypass', 'T_SBY_II_L');
    makeSbyTerm(-0.004, -0.038, 0.025, 'SBY Source II (N) - Grid Bypass', 'T_SBY_II_N');
    // Common Output terminals (Bottom Right)
    makeSbyTerm(0.006, -0.038, 0.025, 'SBY Common (L) - Output to QO', 'T_SBY_COM_L');
    makeSbyTerm(0.016, -0.038, 0.025, 'SBY Common (N) - Output to QO', 'T_SBY_COM_N');

    const sbyKnobGroup = new THREE.Group();
    sbyKnobGroup.position.set(0, 0, 0.038);
    const sbyDial = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.020, 0.014, 24), new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 }));
    sbyDial.rotation.x = Math.PI / 2;
    sbyKnobGroup.add(sbyDial);

    const sbyPointer = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.024, 0.006), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    sbyPointer.position.set(0, 0.007, 0.009);
    sbyKnobGroup.add(sbyPointer);
    sbyGroup.add(sbyKnobGroup);

    sbyDial.userData = { id: 'sby_switch', type: 'SWITCH', name: 'SBY: کلید تبدیل دستی سه‌حالته دستی (I - 0 - II) با مکانیزم Break-Before-Make', action: 'toggle' };
    this.interactiveObjects.push(sbyDial);
    this.switchgear['sby_switch'] = {
      type: 'rotary',
      object: sbyKnobGroup,
      currentAngle: -Math.PI / 4,
      targetAngle: -Math.PI / 4,
      state: 'I'
    };
    epsGroup.add(sbyGroup);

    // QO: 2P 25A Curve C 6kA Essential DB Incomer MCB (Top Rail, X = 0.055)
    const qoGroup = new THREE.Group();
    qoGroup.position.set(0.055, 0.16, 0.025);
    const qoBody = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.085, 0.068), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 }));
    qoGroup.add(qoBody);
    const qoLeverGroup = new THREE.Group();
    qoLeverGroup.position.set(0, 0.01, 0.038);
    const qoLever = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.045, 0.025), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    qoLeverGroup.add(qoLever);
    qoGroup.add(qoLeverGroup);
    qoLever.userData = { id: 'qo_mcb', type: 'SWITCH', name: 'QO: کلید مینیاتوری ورودی تابلوی بارهای بحرانی (2P 25A Curve C 6kA)', action: 'toggle' };
    this.interactiveObjects.push(qoLever);
    this.switchgear['qo_mcb'] = { type: 'lever', object: qoLeverGroup, currentAngle: 0.45, targetAngle: 0.45, state: true };
    this.switchgear['eps_incomer_mcb'] = this.switchgear['qo_mcb'];
    epsGroup.add(qoGroup);

    // N_BAR_EPS: Dedicated Isolated Neutral Busbar (N-EPS - STRICTLY ISOLATED FROM N_GRID)
    const nEpsBarGroup = new THREE.Group();
    nEpsBarGroup.position.set(0.14, -0.05, 0.015);
    const nEpsCarrier = new THREE.Mesh(new THREE.BoxGeometry(0.060, 0.026, 0.025), new THREE.MeshStandardMaterial({ color: 0x0891b2, roughness: 0.4 }));
    nEpsBarGroup.add(nEpsCarrier);
    const nEpsBrassBar = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.010, 0.012), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9 }));
    nEpsBrassBar.position.set(0, 0, 0.01);
    nEpsBarGroup.add(nEpsBrassBar);
    for (let bx = -0.02; bx <= 0.02; bx += 0.010) {
      const bScrew = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.008, 8), locknutMat);
      bScrew.rotation.x = Math.PI / 2;
      bScrew.position.set(bx, 0, 0.017);
      nEpsBarGroup.add(bScrew);
    }
    nEpsBarGroup.userData = { id: 'n_bar_eps', type: 'BUSBAR_NEUTRAL', name: 'N_BAR_EPS: شینه نول ایزوله بارهای اضطراری (کاملاً مستقل از نول شبکه)' };
    this.interactiveObjects.push(nEpsBrassBar);
    epsGroup.add(nEpsBarGroup);

    // PE_BAR_EPS: Solid Brass Grounding Bar
    const peEpsBarGroup = new THREE.Group();
    peEpsBarGroup.position.set(0.14, -0.25, 0.015);
    const peEpsCarrier = new THREE.Mesh(new THREE.BoxGeometry(0.060, 0.025, 0.025), new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 }));
    peEpsBarGroup.add(peEpsCarrier);
    const peEpsBrassBar = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.010, 0.012), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9 }));
    peEpsBrassBar.position.set(0, 0, 0.01);
    peEpsBarGroup.add(peEpsBrassBar);
    peEpsBarGroup.userData = { id: 'pe_bar_eps', type: 'BUSBAR_EARTH', name: 'PE_BAR_EPS: شینه زمین حفاظتی تابلو بارهای اضطراری' };
    this.interactiveObjects.push(peEpsBrassBar);
    epsGroup.add(peEpsBarGroup);

    // 4 BRANCH RCBOs (1P+N 30mA Type A per SLD-01)
    const makeRCBO = (cx, name, id, amp, loadName) => {
      const g = new THREE.Group();
      g.position.set(cx, -0.16, 0.025);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.085, 0.068), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }));
      g.add(b);

      // Lever (Blue for RCBO)
      const levG = new THREE.Group();
      levG.position.set(-0.007, 0.01, 0.038);
      const lev = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.042, 0.025), new THREE.MeshStandardMaterial({ color: 0x2563eb }));
      levG.add(lev);
      g.add(levG);

      // Test Button ('T')
      const btnT = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.010, 8), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
      btnT.rotation.x = Math.PI / 2;
      btnT.position.set(0.008, 0.02, 0.038);
      g.add(btnT);

      lev.userData = { id, type: 'SWITCH', name: `${name} (${amp}A 30mA Type A) - ${loadName}`, action: 'toggle' };
      btnT.userData = { id: `${id}_test`, type: 'BUTTON', name: `دکمه تست ماهانه RCBO (${loadName})`, action: 'press' };
      this.interactiveObjects.push(lev);
      this.interactiveObjects.push(btnT);
      this.switchgear[id] = { type: 'lever', object: levG, currentAngle: 0.45, targetAngle: 0.45, state: true };
      this.switchgear[`${id}_test`] = { type: 'button', object: btnT, currentAngle: 0, targetAngle: 0, state: false };

      epsGroup.add(g);
      return g;
    };

    makeRCBO(-0.13, 'RCBO 1', 'crit_rcbo_1', 10, 'روشنایی اضطراری');
    makeRCBO(-0.06, 'RCBO 2', 'crit_rcbo_2', 16, 'پریزهای بحرانی و اداری');
    makeRCBO(0.01, 'RCBO 3', 'crit_rcbo_3', 16, 'سرور و تجهیزات شبکه');
    makeRCBO(0.07, 'RCBO 4', 'crit_rcbo_4', 16, 'یخچال و بارهای پزشکی');
    this.switchgear['eps_rcd'] = this.switchgear['crit_rcbo_1'];

    // --- 6. EXACT INTERNAL EPS CONDUCTOR ROUTING WITH RICH METADATA ---
    // W_EPS_L_IN: Gland E1 -> X_EPS-L -> QE Top 1 [6mm² Violet]
    this._createDressedConductor([
      new THREE.Vector3(-0.13, -0.40, 0.00),
      new THREE.Vector3(-0.13, -0.32, -0.04),
      new THREE.Vector3(-0.19, -0.32, -0.04),
      new THREE.Vector3(-0.19, 0.16, -0.04),
      new THREE.Vector3(-0.16, 0.138, 0.01)
    ], 0.0034, 0x7c3aed, epsGroup, {
      id: 'W_EPS_L_FEED',
      sourceTerminalId: 'T_INV_EPS_L',
      destTerminalId: 'T_XEPS_L',
      pathId: 'inv_eps',
      conductorType: 'Phase L (Inverter EPS)',
      circuitId: 'circ_eps_incomer',
      label: 'هادی فاز ورودی اینورتر به ترمینال X_EPS',
      voltage: 230,
      current: 16.5,
      source: 'Inverter EPS Port',
      spec: '6mm² Cu PVC Class 5'
    });

    this._createDressedConductor([
      new THREE.Vector3(-0.16, 0.182, 0.01),
      new THREE.Vector3(-0.16, 0.32, -0.04),
      new THREE.Vector3(-0.089, 0.32, -0.04),
      new THREE.Vector3(-0.089, 0.205, 0.025)
    ], 0.0034, 0x7c3aed, epsGroup, {
      id: 'W_XEPS_QE_L',
      sourceTerminalId: 'T_XEPS_L',
      destTerminalId: 'T_QE_1_L',
      pathId: 'inv_eps',
      conductorType: 'Phase L',
      circuitId: 'circ_eps_incomer',
      label: 'اتصال ترمینال X_EPS به ورودی کلید QE',
      voltage: 230,
      current: 16.5,
      source: 'Inverter EPS Port',
      spec: '6mm² Cu PVC Class 5'
    });

    // W_EPS_N_IN: Gland E1 -> X_EPS-N -> QE Top 2 [6mm² Cyan]
    this._createDressedConductor([
      new THREE.Vector3(-0.12, -0.40, 0.00),
      new THREE.Vector3(-0.12, -0.31, -0.03),
      new THREE.Vector3(-0.18, -0.31, -0.03),
      new THREE.Vector3(-0.18, 0.16, -0.03),
      new THREE.Vector3(-0.146, 0.138, 0.01)
    ], 0.0034, 0x06b6d4, epsGroup, {
      id: 'W_EPS_N_FEED',
      sourceTerminalId: 'T_INV_EPS_N',
      destTerminalId: 'T_XEPS_N',
      pathId: 'inv_eps',
      conductorType: 'Neutral N (Inverter EPS)',
      circuitId: 'circ_eps_incomer',
      label: 'هادی نول ورودی اینورتر به ترمینال X_EPS',
      voltage: 0,
      current: 16.5,
      source: 'Inverter EPS Port',
      spec: '6mm² Cu PVC Class 5'
    });

    this._createDressedConductor([
      new THREE.Vector3(-0.146, 0.182, 0.01),
      new THREE.Vector3(-0.146, 0.31, -0.03),
      new THREE.Vector3(-0.071, 0.31, -0.03),
      new THREE.Vector3(-0.071, 0.205, 0.025)
    ], 0.0034, 0x06b6d4, epsGroup, {
      id: 'W_XEPS_QE_N',
      sourceTerminalId: 'T_XEPS_N',
      destTerminalId: 'T_QE_3_N',
      pathId: 'inv_eps',
      conductorType: 'Neutral N',
      circuitId: 'circ_eps_incomer',
      label: 'اتصال نول X_EPS به ورودی کلید QE',
      voltage: 0,
      current: 16.5,
      source: 'Inverter EPS Port',
      spec: '6mm² Cu PVC Class 5'
    });

    // W_QE_SBY_L: QE Bottom 1 -> SBY Source I (L) [6mm² Violet]
    this._createDressedConductor([
      new THREE.Vector3(-0.089, 0.115, 0.025),
      new THREE.Vector3(-0.089, 0.08, 0.01),
      new THREE.Vector3(-0.024, 0.08, 0.01),
      new THREE.Vector3(-0.024, 0.198, 0.025)
    ], 0.0034, 0x7c3aed, epsGroup, {
      id: 'W_QE_SBY_L',
      sourceTerminalId: 'T_QE_2_L',
      destTerminalId: 'T_SBY_I_L',
      pathId: 'inv_eps',
      conductorType: 'Phase L (Source I)',
      circuitId: 'circ_eps_source1',
      label: 'خروجی کلید QE به ترمینال موقعیت I کلید تبدیل SBY',
      voltage: 230,
      current: 16.5,
      source: 'QE MCB',
      spec: '6mm² Cu PVC Class 5'
    });

    // W_QE_SBY_N: QE Bottom 2 -> SBY Source I (N) [6mm² Cyan]
    this._createDressedConductor([
      new THREE.Vector3(-0.071, 0.115, 0.025),
      new THREE.Vector3(-0.071, 0.09, 0.01),
      new THREE.Vector3(0.004, 0.09, 0.01),
      new THREE.Vector3(0.004, 0.198, 0.025)
    ], 0.0034, 0x06b6d4, epsGroup, {
      id: 'W_QE_SBY_N',
      sourceTerminalId: 'T_QE_4_N',
      destTerminalId: 'T_SBY_I_N',
      pathId: 'inv_eps',
      conductorType: 'Neutral N (Source I)',
      circuitId: 'circ_eps_source1',
      label: 'خروجی نول کلید QE به ترمینال نول موقعیت I کلید تبدیل SBY',
      voltage: 0,
      current: 16.5,
      source: 'QE MCB',
      spec: '6mm² Cu PVC Class 5'
    });

    // W_BYPASS_SBY_L: X_BYPASS-L -> SBY Source II (L) [6mm² Brown]
    this._createDressedConductor([
      new THREE.Vector3(0.12, 0.138, 0.01),
      new THREE.Vector3(0.12, 0.06, 0.01),
      new THREE.Vector3(-0.024, 0.06, 0.01),
      new THREE.Vector3(-0.024, 0.122, 0.025)
    ], 0.0034, 0x854d0e, epsGroup, {
      id: 'W_BYPASS_SBY_L',
      sourceTerminalId: 'T_XBYPASS_L',
      destTerminalId: 'T_SBY_II_L',
      pathId: 'grid_bypass',
      conductorType: 'Phase L (Source II - Grid Bypass)',
      circuitId: 'circ_bypass',
      label: 'مسیر بای‌پاس مستقیم شبکه از تابلوی اصلی به ورودی II کلید تبدیل SBY',
      voltage: 230,
      current: 0,
      source: 'MDB Grid Bypass QBP',
      spec: '6mm² Cu PVC Class 5'
    });

    // W_BYPASS_SBY_N: X_BYPASS-N -> SBY Source II (N) [6mm² Cyan]
    this._createDressedConductor([
      new THREE.Vector3(0.134, 0.138, 0.01),
      new THREE.Vector3(0.134, 0.05, 0.01),
      new THREE.Vector3(-0.014, 0.05, 0.01),
      new THREE.Vector3(-0.014, 0.122, 0.025)
    ], 0.0034, 0x06b6d4, epsGroup, {
      id: 'W_BYPASS_SBY_N',
      sourceTerminalId: 'T_XBYPASS_N',
      destTerminalId: 'T_SBY_II_N',
      pathId: 'grid_bypass',
      conductorType: 'Neutral N (Source II - Grid Bypass)',
      circuitId: 'circ_bypass',
      label: 'نول مسیر بای‌پاس شبکه به ورودی نول II کلید تبدیل SBY',
      voltage: 0,
      current: 0,
      source: 'MDB Grid Bypass QBP',
      spec: '6mm² Cu PVC Class 5'
    });

    // W_SBY_QO_L: SBY Common (L) -> QO Top 1 (L) [6mm² Violet]
    this._createDressedConductor([
      new THREE.Vector3(-0.004, 0.122, 0.025),
      new THREE.Vector3(-0.004, 0.07, 0.01),
      new THREE.Vector3(0.046, 0.07, 0.01),
      new THREE.Vector3(0.046, 0.205, 0.025)
    ], 0.0034, 0x7c3aed, epsGroup, {
      id: 'W_SBY_QO_L',
      sourceTerminalId: 'T_SBY_COM_L',
      destTerminalId: 'T_QO_1_L',
      pathId: 'load_critical',
      conductorType: 'Phase L (Selected Supply)',
      circuitId: 'circ_eps_main',
      label: 'خروجی مشترک کلید تبدیل SBY به ورودی کلید اصلی توزیع QO',
      voltage: 230,
      current: 16.5,
      source: 'SBY Common Output',
      spec: '6mm² Cu PVC Class 5'
    });

    // W_SBY_QO_N: SBY Common (N) -> QO Top 2 (N) [6mm² Cyan]
    this._createDressedConductor([
      new THREE.Vector3(0.006, 0.122, 0.025),
      new THREE.Vector3(0.006, 0.08, 0.01),
      new THREE.Vector3(0.064, 0.08, 0.01),
      new THREE.Vector3(0.064, 0.205, 0.025)
    ], 0.0034, 0x06b6d4, epsGroup, {
      id: 'W_SBY_QO_N',
      sourceTerminalId: 'T_SBY_COM_N',
      destTerminalId: 'T_QO_3_N',
      pathId: 'load_critical',
      conductorType: 'Neutral N (Selected Supply)',
      circuitId: 'circ_eps_main',
      label: 'خروجی نول مشترک SBY به ورودی نول کلید اصلی QO',
      voltage: 0,
      current: 16.5,
      source: 'SBY Common Output',
      spec: '6mm² Cu PVC Class 5'
    });

    // W_QO_BUS_L: QO Bottom 1 -> Line Comb Busbar feeding 4 RCBOs [6mm² Violet]
    this._createDressedConductor([
      new THREE.Vector3(0.046, 0.115, 0.025),
      new THREE.Vector3(0.046, 0.00, -0.04),
      new THREE.Vector3(-0.137, 0.00, -0.04),
      new THREE.Vector3(-0.137, -0.115, 0.025)
    ], 0.0034, 0x7c3aed, epsGroup, {
      id: 'W_QO_BUS_L',
      sourceTerminalId: 'T_QO_2_L',
      destTerminalId: 'T_RCBO1_LINE',
      pathId: 'load_critical',
      conductorType: 'Phase L (Distribution Busbar)',
      circuitId: 'circ_eps_distrib',
      label: 'خروجی فاز کلید QO به شینه شانه‌ای تغذیه کلیدهای RCBO',
      voltage: 230,
      current: 16.5,
      source: 'QO MCB',
      spec: '6mm² Cu Comb Busbar'
    });

    // W_QO_NBAR: QO Bottom 2 -> N_BAR_EPS [6mm² Cyan]
    this._createDressedConductor([
      new THREE.Vector3(0.064, 0.115, 0.025),
      new THREE.Vector3(0.064, 0.01, -0.03),
      new THREE.Vector3(0.14, 0.01, -0.03),
      new THREE.Vector3(0.14, -0.045, 0.015)
    ], 0.0034, 0x06b6d4, epsGroup, {
      id: 'W_QO_NBAR',
      sourceTerminalId: 'T_QO_4_N',
      destTerminalId: 'T_NEPS_MAIN',
      pathId: 'load_critical',
      conductorType: 'Neutral N',
      circuitId: 'circ_eps_distrib',
      label: 'خروجی نول کلید اصلی QO به شینه نول اختصاصی بارهای بحرانی N_BAR_EPS',
      voltage: 0,
      current: 16.5,
      source: 'QO MCB',
      spec: '6mm² Cu PVC Class 5'
    });

    // W_RCBO_OUT: 4 Protected Branch Circuits to Gland E2 [2.5mm²]
    this._createDressedConductor([
      new THREE.Vector3(-0.13, -0.205, 0.025),
      new THREE.Vector3(-0.13, -0.32, -0.04),
      new THREE.Vector3(0.00, -0.32, -0.04),
      new THREE.Vector3(0.00, -0.40, 0.00)
    ], 0.0024, 0x7c3aed, epsGroup, {
      id: 'W_CRIT_L1',
      sourceTerminalId: 'T_RCBO1_OUT_L',
      destTerminalId: 'T_LOAD_CRIT_L1',
      pathId: 'load_critical',
      conductorType: 'Phase L (RCBO 1 Protected)',
      circuitId: 'circ_lighting',
      label: 'فاز حفاظت‌شده مدار روشنایی اضطراری (RCBO 1 - 10A 30mA Type A)',
      voltage: 230,
      current: 3.5,
      source: 'RCBO 1',
      spec: '2.5mm² Cu PVC'
    });

    this._createDressedConductor([
      new THREE.Vector3(0.14, -0.055, 0.015),
      new THREE.Vector3(0.18, -0.055, -0.03),
      new THREE.Vector3(0.18, -0.32, -0.03),
      new THREE.Vector3(0.01, -0.40, 0.00)
    ], 0.0024, 0x06b6d4, epsGroup, {
      id: 'W_CRIT_N',
      sourceTerminalId: 'T_NEPS_BRANCH',
      destTerminalId: 'T_LOAD_CRIT_N',
      pathId: 'load_critical',
      conductorType: 'Neutral N (N-EPS Dedicated)',
      circuitId: 'circ_eps_protected',
      label: 'نول مدارهای بحرانی برگشتی به شینه N_BAR_EPS',
      voltage: 0,
      current: 16.5,
      source: 'N_BAR_EPS',
      spec: '2.5mm² Cu PVC'
    });

    // Earth leads to PE_BAR_EPS
    this._createDressedConductor([
      new THREE.Vector3(-0.132, 0.138, 0.01),
      new THREE.Vector3(-0.132, -0.25, -0.02),
      new THREE.Vector3(0.14, -0.25, 0.015)
    ], 0.0034, 0x16a34a, epsGroup, {
      id: 'W_XEPS_PE',
      sourceTerminalId: 'T_XEPS_PE',
      destTerminalId: 'T_PE_BAR_EPS',
      pathId: 'earthing',
      conductorType: 'Earth PE',
      circuitId: 'circ_earth',
      label: 'هادی زمین حفاظتی ورودی اینورتر به شینه زمین تابلو EPS',
      voltage: 0,
      current: 0,
      source: 'MET Busbar',
      spec: '6mm² Cu Earth'
    }, true);

    this._createDressedConductor([
      new THREE.Vector3(0.14, -0.26, 0.015),
      new THREE.Vector3(0.14, -0.32, -0.02),
      new THREE.Vector3(0.02, -0.40, 0.00)
    ], 0.0024, 0x16a34a, epsGroup, {
      id: 'W_CRIT_PE',
      sourceTerminalId: 'T_PE_BAR_EPS',
      destTerminalId: 'T_LOAD_CRIT_PE',
      pathId: 'earthing',
      conductorType: 'Earth PE',
      circuitId: 'circ_earth',
      label: 'هادی ارت حفاظتی به سمت بارهای بحرانی',
      voltage: 0,
      current: 0,
      source: 'PE_BAR_EPS',
      spec: '2.5mm² Cu Earth'
    }, true);

    // W_PE_XBOND: Heavy Cross-Panel Earth Bond between MDB PE Bar and EPS PE Bar [10mm² Helical PE]
    this._createDressedConductor([
      new THREE.Vector3(0.14, -0.25, 0.015),
      new THREE.Vector3(0.14, -0.32, -0.02),
      new THREE.Vector3(-0.50, -0.32, -0.02),
      new THREE.Vector3(-1.00, -0.32, -0.02)
    ], 0.0042, 0x16a34a, epsGroup, {
      id: 'W_PE_XBOND',
      sourceTerminalId: 'T_MDB_PE_BAR',
      destTerminalId: 'T_PE_BAR_EPS',
      pathId: 'earthing',
      conductorType: 'Equipotential Earth Cross-Bond',
      circuitId: 'circ_earth',
      label: 'هم‌بندی ارت حفاظتی ۱۰ میلی‌مترمربع بین تابلوی اصلی MDB و تابلوی EPS',
      voltage: 0,
      current: 0,
      source: 'MDB PE Busbar',
      spec: '10mm² Cu Class 5'
    }, true);

    epsGroup.userData = {
      type: 'EPS_ENCLOSURE',
      id: 'critical_loads_board',
      name: 'تابلو بارهای بحرانی و اضطراری (EPS Critical Panel)',
      desc: 'حاوی کلید اصلی Q_EPS، کلید محافظ جان ۳۰ میلی‌آمپر تیپ A، شینه نول کاملاً ایزوله و خروجی بارهای اضطراری.'
    };
    this.interactiveObjects.push(casing);
    this.scene.add(epsGroup);
    this.epsGroup = epsGroup;

    this._registerLabel('EPS_BACKUP', '🚨 تابلوی اضطراری EPS', '', epsGroup, new THREE.Vector3(0, 0.48, 0));
  }

  // ==========================================
  // DYNAMIC SMART METER 60FPS LCD CANVAS DISPLAY
  // ==========================================

  /**
   * Updates the high-resolution 2D Canvas texture on the Smart Energy Meter
   */
  updateSmartMeterLCD(data = {}) {
    if (!this.meterCtx || !this.meterTexture) return;

    const ctx = this.meterCtx;
    const v = data.gridVolt !== undefined ? Number(data.gridVolt) : 0.0;
    const a = data.gridCurrent !== undefined ? Number(data.gridCurrent) : 0.0;
    const w = data.gridPower !== undefined ? Number(data.gridPower) : 0.0;
    const f = data.gridFreq !== undefined ? Number(data.gridFreq) : 0.0;
    const kwh = data.totalKWh !== undefined ? Number(data.totalKWh) : 4892.5;

    // Electroluminescent Cyan Backlight Matrix Background
    ctx.fillStyle = '#083344';
    ctx.fillRect(0, 0, 512, 256);

    // Matrix scanline effect
    ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
    for (let y = 0; y < 256; y += 4) {
      ctx.fillRect(0, y, 512, 2);
    }

    // Outer border
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 500, 244);

    // Header: Meter Model & Status
    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('EASTON SDM230-MODBUS [BI-DIR]', 24, 40);

    // Line 1: Voltage & Frequency
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px monospace';
    ctx.fillText(v.toFixed(1) + ' V   ' + f.toFixed(2) + ' Hz', 24, 90);

    // Line 2: Current & Active Power
    const isExport = w < 0;
    const pSign = isExport ? '-' : '+';
    ctx.fillStyle = isExport ? '#34d399' : '#38bdf8';
    ctx.font = 'bold 44px monospace';
    ctx.fillText(pSign + Math.abs(w) + ' W  (' + a.toFixed(1) + ' A)', 24, 150);

    // Line 3: Energy Counter & Directional Arrows
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('TOT: ' + kwh.toFixed(1) + ' kWh', 24, 200);

    // Directional Arrow Banner
    ctx.fillStyle = isExport ? '#10b981' : '#0284c7';
    ctx.font = 'bold 24px sans-serif';
    const dirText = isExport ? 'PV ◀◀ EXPORT TO GRID' : 'GRID ▶▶ IMPORT TO HOME';
    ctx.fillText(dirText, 24, 235);

    // Pulse impulse LED
    if (this.meterImpulseLED) {
      const isPulsing = (Date.now() % 1000) < 150 && Math.abs(w) > 50;
      this.meterImpulseLED.material.color.setHex(isPulsing ? 0xffffff : 0xdc2626);
    }

    this.meterTexture.needsUpdate = true;
  }
  _buildCTSensor() {
    const ctGroup = new THREE.Group();
    // Clamped around the Grid L conductor at X = 3.2, Y = 1.7, Z = -2.12
    ctGroup.position.set(3.2, 1.7, -2.12);

    // High-Impact ABS Split-Core Toroid Housing
    const toroidGeo = new THREE.TorusGeometry(0.048, 0.022, 16, 32);
    const toroidMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.4,
      metalness: 0.2
    });
    const toroid = new THREE.Mesh(toroidGeo, toroidMat);
    toroid.rotation.y = Math.PI / 2;
    ctGroup.add(toroid);

    // Mechanical Latch & Hinge Detail
    const latch = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.035, 0.025), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    latch.position.set(0, 0.05, 0);
    ctGroup.add(latch);

    // Directional Arrow Sticker: GRID -> INVERTER / LOAD
    const arrowCanvas = document.createElement('canvas');
    arrowCanvas.width = 128;
    arrowCanvas.height = 64;
    const actx = arrowCanvas.getContext('2d');
    actx.fillStyle = '#ffffff';
    actx.fillRect(0, 0, 128, 64);
    actx.fillStyle = '#000000';
    actx.font = 'bold 20px sans-serif';
    actx.fillText('K -> L ▶', 18, 40);
    const arrowTex = new THREE.CanvasTexture(arrowCanvas);
    const arrowMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.03), new THREE.MeshBasicMaterial({ map: arrowTex }));
    arrowMesh.position.set(0.025, 0, 0.03);
    arrowMesh.rotation.y = Math.PI / 2;
    ctGroup.add(arrowMesh);

    toroid.userData = {
      type: 'CT_SENSOR',
      id: 'grid_ct_sensor',
      name: 'Split-Core CT Sensor (100A / 33.3mA)',
      desc: 'Clamped around incoming Grid Phase conductor for zero-export regulation & dynamic load management'
    };
    this.interactiveObjects.push(toroid);

    this.scene.add(ctGroup);
    this.ctGroup = ctGroup;

    this._registerLabel('CT_SENSING', '📡 سنسور جریان (CT)', '', ctGroup, new THREE.Vector3(0, 0.22, 0));
  }

  _buildUtilityCutoutAndLoads() {
    // 1. Utility Service Cutout Fuse Box (Mounted low at X = 3.2, Y = 0.95, Z = -2.2)
    const cutoutGroup = new THREE.Group();
    cutoutGroup.position.set(3.2, 0.95, -2.2);
    const cutoutBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.65, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.7 }) // Black phenolic resin
    );
    cutoutGroup.add(cutoutBox);

    // Red Tamper-Evident Utility Seal
    const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.03, 8), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
    seal.position.set(0, -0.22, 0.1);
    cutoutGroup.add(seal);

    cutoutBox.userData = {
      type: 'UTILITY_CUTOUT',
      name: 'DNO Utility Service Cutout (100A BS 1361 Fuse)',
      desc: 'Incoming single-phase service feed from regional electrical distribution grid'
    };
    this.interactiveObjects.push(cutoutBox);
    this.scene.add(cutoutGroup);

    // 2. Non-Critical House Loads Block (HVAC, EV Charger, Oven)
    const ncLoad = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.75, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 })
    );
    ncLoad.position.set(5.5, 0.4, -1.0);
    ncLoad.userData = {
      type: 'LOAD_NON_CRIT',
      name: 'Non-Critical House Loads',
      desc: 'Heavy appliances shed automatically during grid outage: EVSE, Heat Pump, Water Heater'
    };
    this.interactiveObjects.push(ncLoad);
    this.scene.add(ncLoad);

    // 3. Critical House Loads Block (Lighting, Fridge, Router, Server)
    const critLoad = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.85, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 })
    );
    critLoad.position.set(5.5, 1.5, -1.0);
    critLoad.userData = {
      type: 'LOAD_CRIT',
      name: 'Critical EPS Backup Loads',
      desc: 'Uninterruptible circuits powered continuously via hybrid inverter EPS port (<10ms switch)'
    };
    this.interactiveObjects.push(critLoad);
    this.scene.add(critLoad);
  }

  // ==========================================
  // CABLING, CONDUITS & 3D TUBES (8 PATHWAYS)
  // ==========================================

  _buildCablingAndConduits() {
    // Define 8 accurate electrical 3D trajectories (CatmullRomCurve3)
    const cableConfigs = {
      // Path 1: PV String 1 (Rooftop -> DC Combiner Box -> Inverter MPPT1)
      pv1: {
        points: [
          new THREE.Vector3(-2.2, 4.4, 0.0),
          new THREE.Vector3(-3.2, 3.8, -1.8),
          new THREE.Vector3(-3.2, 2.9, -2.18), // DC Box top entry
          new THREE.Vector3(-3.4, 1.9, -2.18), // DC Box bottom exit
          new THREE.Vector3(-2.2, 1.6, -2.18),
          new THREE.Vector3(-1.35, 1.85, -2.2)  // Inverter PV1 gland
        ],
        radius: 0.016,
        color: 0xd97706, // Solar DC Amber
        flowColor: 0xf59e0b
      },

      // Path 2: PV String 2 (Rooftop -> DC Combiner Box -> Inverter MPPT2)
      pv2: {
        points: [
          new THREE.Vector3(2.2, 4.4, 0.0),
          new THREE.Vector3(-0.5, 3.8, -1.8),
          new THREE.Vector3(-3.0, 2.9, -2.18), // DC Box top entry
          new THREE.Vector3(-3.1, 1.9, -2.18), // DC Box bottom exit
          new THREE.Vector3(-2.0, 1.5, -2.18),
          new THREE.Vector3(-1.25, 1.85, -2.2)  // Inverter PV2 gland
        ],
        radius: 0.016,
        color: 0xb45309,
        flowColor: 0xfbbf24
      },

      // Path 3: Battery DC (LiFePO4 Rack -> Battery Disconnect -> Inverter Bat Port)
      battery: {
        points: [
          new THREE.Vector3(1.4, 0.9, -1.5),
          new THREE.Vector3(1.2, 1.8, -2.18),
          new THREE.Vector3(1.2, 2.3, -2.18), // Battery Disconnect bottom
          new THREE.Vector3(1.2, 2.9, -2.18), // Disconnect top
          new THREE.Vector3(0.1, 2.0, -2.18),
          new THREE.Vector3(-0.85, 1.85, -2.2) // Inverter Bat gland
        ],
        radius: 0.024,
        color: 0x059669, // Battery Emerald Green
        flowColor: 0x34d399
      },

      // Path 4: Incoming Grid (Utility Cutout -> Clamped CT Toroid -> MDB Gland G1)
      grid_in: {
        points: [
          new THREE.Vector3(3.2, 0.6, -2.2),  // Ground service entry
          new THREE.Vector3(3.2, 1.3, -2.15), // Cutout exit
          new THREE.Vector3(3.05, 1.65, -2.18),
          new THREE.Vector3(2.88, 2.0, -2.20)  // MDB Gland G1 entry
        ],
        radius: 0.022,
        color: 0x854d0e, // IEC Brown (Live Conductor)
        flowColor: 0x60a5fa
      },

      // Path 5: Inverter Grid AC Line (Inverter AC Port <-> MDB Gland G2)
      inv_grid: {
        points: [
          new THREE.Vector3(-0.75, 1.85, -2.2), // Inverter Grid gland
          new THREE.Vector3(0.5, 1.5, -2.18),
          new THREE.Vector3(2.5, 1.5, -2.18),
          new THREE.Vector3(2.98, 2.0, -2.20)   // MDB Gland G2 entry
        ],
        radius: 0.020,
        color: 0x2563eb, // AC Blue
        flowColor: 0x38bdf8
      },

      // Path 6: Non-Critical Loads Feed (MDB Gland G6 -> House Loads)
      load_non_critical: {
        points: [
          new THREE.Vector3(3.28, 2.0, -2.20), // MDB Gland G6 exit
          new THREE.Vector3(3.6, 1.7, -2.18),
          new THREE.Vector3(4.5, 1.2, -1.8),
          new THREE.Vector3(5.2, 0.5, -1.0)
        ],
        radius: 0.016,
        color: 0x475569,
        flowColor: 0x94a3b8
      },

      // Path 7: Inverter EPS Port (Inverter EPS Port -> EPS Gland E1)
      inv_eps: {
        points: [
          new THREE.Vector3(-0.65, 1.85, -2.2), // Inverter EPS gland
          new THREE.Vector3(0.8, 1.35, -2.18),
          new THREE.Vector3(3.4, 1.35, -2.18),
          new THREE.Vector3(3.92, 2.0, -2.20)   // EPS Board Gland E1
        ],
        radius: 0.018,
        color: 0x7c3aed, // EPS Purple
        flowColor: 0xc084fc
      },

      // Path 8: Critical Loads Feed (EPS Board Gland E2 -> Critical Loads Block)
      load_critical: {
        points: [
          new THREE.Vector3(4.05, 2.0, -2.20), // EPS Board Gland E2 (Critical Loads Out)
          new THREE.Vector3(4.6, 1.8, -1.8),
          new THREE.Vector3(5.2, 1.6, -1.0)     // Critical load block
        ],
        radius: 0.018,
        color: 0x9333ea,
        flowColor: 0xd8b4fe
      },

      // Path 9: Grid Bypass Feed (MDB Gland G5 -> Inter-Panel Duct -> EPS Board)
      grid_bypass: {
        points: [
          new THREE.Vector3(3.20, 2.0, -2.20), // MDB Gland G5 exit
          new THREE.Vector3(3.55, 1.8, -2.18),
          new THREE.Vector3(3.88, 2.0, -2.20)  // EPS Board Gland E0 entry
        ],
        radius: 0.018,
        color: 0xeab308, // Bypass Gold
        flowColor: 0xfde047
      },

      // Path 10: Earthing Equipotential Bonding (Earth Rod -> MET -> All Chassis & SPDs)
      earthing: {
        points: [
          new THREE.Vector3(-0.78, 0.0, -2.3),
          new THREE.Vector3(-0.78, 0.4, -2.3), // MET busbar
          new THREE.Vector3(-0.5, 0.4, -2.3),
          new THREE.Vector3(-1.0, 0.8, -2.25),
          new THREE.Vector3(-3.2, 0.8, -2.25)
        ],
        radius: 0.014,
        color: 0x65a30d, // Green-yellow grounding
        flowColor: 0xa3e635
      }
    };

    // Build 3D Tube Meshes along CatmullRom curves
    for (const [key, cfg] of Object.entries(cableConfigs)) {
      const curve = new THREE.CatmullRomCurve3(cfg.points, false, 'catmullrom', 0.15);
      const tubeGeo = new THREE.TubeGeometry(curve, 64, cfg.radius, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.4,
        metalness: 0.25
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      this.scene.add(tubeMesh);

      this.cables[key] = {
        curve,
        tubeMesh,
        color: cfg.color,
        flowColor: cfg.flowColor
      };
    }
  }

  // ==========================================
  // GLOWING PARTICLE FLOW SYSTEMS (Euclidean Modulo Logic)
  // ==========================================

  _buildParticleFlowSystems() {
    // Glowing particle texture
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 64;
    pCanvas.height = 64;
    const pctx = pCanvas.getContext('2d');
    const grad = pctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.25)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    pctx.fillStyle = grad;
    pctx.fillRect(0, 0, 64, 64);
    const particleTex = new THREE.CanvasTexture(pCanvas);

    // Instantiate flow system for each cable pathway
    for (const [key, cable] of Object.entries(this.cables)) {
      const count = 28;
      const positions = new Float32Array(count * 3);
      const progressArray = new Float32Array(count);

      // Distribute evenly along curve initially
      for (let i = 0; i < count; i++) {
        const u = i / count;
        progressArray[i] = u;
        const pt = cable.curve.getPointAt(u);
        positions[i * 3] = pt.x;
        positions[i * 3 + 1] = pt.y;
        positions[i * 3 + 2] = pt.z;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const mat = new THREE.PointsMaterial({
        color: cable.flowColor,
        size: 0.085,
        map: particleTex,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const points = new THREE.Points(geo, mat);
      this.scene.add(points);

      this.animatedParticles.push({
        id: key,
        cable,
        pointsMesh: points,
        count,
        progressArray,
        speed: 0.15, // Default forward speed (fraction per second)
        active: key === 'earthing' ? false : true, // PE earthing inactive during normal operation
        direction: 1 // +1 = forward, -1 = reverse
      });
    }
  }

  /**
   * Updates particle flows along cables using robust Euclidean modulo logic.
   * Seamlessly handles forward (>0), stationary (0), and reverse (<0) flow directions.
   */
  _updateParticleFlows(delta) {
    for (const p of this.animatedParticles) {
      if (!p.active || Math.abs(p.speed) < 0.0001) {
        p.pointsMesh.visible = false;
        continue;
      }
      p.pointsMesh.visible = true;

      const posAttr = p.pointsMesh.geometry.attributes.position;
      const positions = posAttr.array;
      const effectiveSpeed = p.speed * p.direction * delta;

      for (let i = 0; i < p.count; i++) {
        // Robust Euclidean modulo: ((u % 1) + 1) % 1 prevents negative jumps on reverse flow
        let u = p.progressArray[i] + effectiveSpeed;
        u = ((u % 1.0) + 1.0) % 1.0;
        p.progressArray[i] = u;

        const pt = p.cable.curve.getPointAt(u);
        positions[i * 3] = pt.x;
        positions[i * 3 + 1] = pt.y;
        positions[i * 3 + 2] = pt.z;
      }
      posAttr.needsUpdate = true;
    }
  }

  // ==========================================
  // DYNAMIC OLED DISPLAY RENDERER
  // ==========================================

  /**
   * Updates and redraws the live OLED Inverter Display canvas texture
   * @param {Object} data - Telemetry values
   */
  updateOLED(data = {}) {
    const currentTime = Date.now();
    if (this._lastOledUpdateTime && (currentTime - this._lastOledUpdateTime < 250)) {
      return; // Throttle to 4Hz (250ms) to eliminate GPU pipeline readback stalls
    }
    this._lastOledUpdateTime = currentTime;
    const ctx = this.oledCtx;
    const w = 512;
    const h = 256;

    // Dark sleek technical OLED background
    ctx.fillStyle = '#050b14';
    ctx.fillRect(0, 0, w, h);

    // Subtle cyan header border
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, w - 4, h - 4);

    // Top Header Banner
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(4, 4, w - 8, 42);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('⚡ 5kW HYBRID INVERTER', 16, 32);

    // Status Badge
    const mode = data.mode || 'NORMAL';
    let badgeColor = '#22c55e';
    if (mode === 'EPS') badgeColor = '#f59e0b';
    if (mode === 'FAULT') badgeColor = '#ef4444';

    ctx.fillStyle = badgeColor;
    ctx.fillRect(380, 10, 116, 28);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(mode, 438, 29);
    ctx.textAlign = 'left';

    // Grid 4 Telemetry Quadrants
    // Q1: Solar PV Input (PV1 + PV2)
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px sans-serif';
    ctx.fillText('SOLAR PV ARRAYS', 20, 72);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 24px monospace';
    const totalPv = ((data.pv1Power || 0) + (data.pv2Power || 0)) / 1000;
    ctx.fillText(`${totalPv.toFixed(2)} kW`, 20, 102);
    ctx.fillStyle = '#64748b';
    ctx.font = '12px monospace';
    ctx.fillText(`PV1:${data.pv1Power || 0}W | PV2:${data.pv2Power || 0}W`, 20, 122);

    // Q2: Battery Storage
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px sans-serif';
    ctx.fillText('LiFePO4 BATTERY', 270, 72);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 24px monospace';
    const soc = data.batSoc !== undefined ? data.batSoc : 85;
    ctx.fillText(`${soc}% SOC`, 270, 102);
    ctx.fillStyle = '#64748b';
    ctx.font = '12px monospace';
    const batP = data.batPower || 0;
    const batStatus = batP >= 0 ? `CHG: +${batP}W` : `DIS: ${batP}W`;
    const batV = data.batVolt !== undefined ? Number(data.batVolt).toFixed(1) : '0.0';
    ctx.fillText(`${batStatus} | ${batV}V`, 270, 122);

    // Horizontal Divider
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(15, 138);
    ctx.lineTo(495, 138);
    ctx.stroke();

    // Q3: Grid AC Port
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px sans-serif';
    ctx.fillText('GRID CONNECTION', 20, 164);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px monospace';
    const gV = data.gridVolt !== undefined ? Number(data.gridVolt).toFixed(1) : '0.0';
    const gF = data.gridFreq !== undefined ? Number(data.gridFreq).toFixed(1) : '0.0';
    ctx.fillText(`${gV}V / ${gF}Hz`, 20, 192);
    ctx.fillStyle = '#64748b';
    ctx.font = '12px monospace';
    const gridP = data.gridPower || 0;
    const gridTxt = gridP >= 0 ? `IMPORT: ${gridP}W` : `EXPORT: ${Math.abs(gridP)}W`;
    ctx.fillText(gridTxt, 20, 212);

    // Q4: EPS Backup & House Loads
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px sans-serif';
    ctx.fillText('HOUSE LOAD & EPS', 270, 164);
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 22px monospace';
    const epsP = data.epsPower || 0;
    ctx.fillText(`${epsP} W`, 270, 192);
    ctx.fillStyle = '#64748b';
    ctx.font = '12px monospace';
    ctx.fillText('EPS Port Active (<10ms)', 270, 212);

    // Mini Live Pulse Dot
    const now = Date.now() / 400;
    if (Math.sin(now) > 0) {
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(488, 238, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    this.oledTexture.needsUpdate = true;

    // Synchronously update Smart Meter LCD display
    this.updateSmartMeterLCD({
      gridVolt: data.gridVolt,
      gridCurrent: Math.abs((data.gridPower || 0) / 230),
      gridPower: data.gridPower,
      gridFreq: data.gridFreq,
      totalKWh: 4892.4 + (Date.now() % 100000) / 10000
    });

    // Also update Status Halo Ring Color
    if (this.haloMat) {
      if (mode === 'EPS') this.haloMat.color.setHex(0xf59e0b); // Orange
      else if (mode === 'FAULT') this.haloMat.color.setHex(0xef4444); // Red
      else this.haloMat.color.setHex(0x38bdf8); // Normal Cyan
    }

    // Update battery module physical SOC LEDs
    if (this.batteryModules && this.batteryModules.length > 0) {
      const activeSegs = Math.round((soc / 100) * 5);
      this.batteryModules.forEach(mod => {
        mod.socSegments.forEach((segMat, idx) => {
          if (idx < activeSegs) {
            segMat.color.setHex(0x22c55e); // Bright green
          } else {
            segMat.color.setHex(0x1e293b); // Off
          }
        });
      });
    }
  }

  // ==========================================
  // PHYSICAL ANIMATED SWITCHGEAR (Breakers & Isolators)
  // ==========================================

  /**
   * Updates SBY 3-Position changeover switch position in 3D
   * @param {string} pos - 'I', '0', 'II'
   * @param {string} origin - 'user', 'orchestrator', 'sld'
   */
  setSbyPosition3D(pos, origin = 'user') {
    const sw = this.switchgear['sby_switch'];
    if (!sw) return;
    if (!['I', '0', 'II'].includes(pos)) {
      console.warn('[scene-3d] setSbyPosition3D: invalid position', pos, '- ignored');
      return;
    }
    if (sw.state === pos && origin === 'orchestrator') return;
    sw.state = pos;
    // 'I' = -Math.PI / 4 (EPS), '0' = 0 (OFF), 'II' = Math.PI / 4 (Grid Bypass)
    if (pos === 'I') sw.targetAngle = -Math.PI / 4;
    else if (pos === '0') sw.targetAngle = 0;
    else if (pos === 'II') sw.targetAngle = Math.PI / 4;
    if (origin !== 'orchestrator') {
      this._emit('switchChange', { id: 'sby_switch', state: pos });
    }
  }

  /**
   * Sets breaker/switch state in 3D with origin gating to prevent circular events
   */
  setBreakerState3D(id, state, origin = 'user') {
    if (id === 'sby_switch') {
      return this.setSbyPosition3D(state, origin);
    }
    let targetId = id;
    if (id === 'dc_isolator' || id === 'qpv_isolator' || id === 'sld-dc-iso-1') targetId = 'dc_iso_1';
    else if (id === 'sld-dc-iso-2') targetId = 'dc_iso_2';
    else if (id === 'battery_ocpd' || id === 'battery_qb' || id === 'sld-bat-fuse') targetId = 'bat_breaker';
    else if (id === 'grid_mcb' || id === 'q0_mcb' || id === 'grid_incomer_mcb' || id === 'sld-q0') targetId = 'grid_mcb';
    else if (id === 'eps_mcb' || id === 'qe_mcb' || id === 'sld-qe') targetId = 'eps_mcb';
    else if (id === 'qo_mcb' || id === 'eps_incomer_mcb' || id === 'sld-qo') targetId = 'qo_mcb';
    else if (id === 'qbp_mcb' || id === 'grid_bypass_mcb' || id === 'sld-qbp') targetId = 'qbp_mcb';
    else if (id === 'eps_rcd' || id === 'sld-rcd' || id === 'crit_rcbo_1') targetId = 'eps_rcd';

    const sw = this.switchgear[targetId];
    if (!sw) return;

    const newState = state !== undefined ? !!state : !sw.state;
    if (sw.state === newState && origin === 'orchestrator') return;
    sw.state = newState;

    if (sw.type === 'rotary') {
      sw.targetAngle = sw.state ? 0 : -Math.PI / 2;
    } else if (sw.type === 'lever') {
      sw.targetAngle = sw.state ? 0.45 : -0.35;
    } else if (sw.type === 'button') {
      sw.targetZ = -0.015;
      setTimeout(() => { sw.targetZ = 0; }, 250);
    }

    if (origin !== 'orchestrator') {
      this._emit('switchChange', { id: targetId, state: sw.state });
    }
  }

  toggleBreaker3D(id, state, animated = true) {
    return this.setBreakerState3D(id, state, 'user');
  }

  /**
   * Animates the camera to an arbitrary position/target using the existing
   * cameraTransition machinery (same path as setCameraPreset).
   */
  _animateCamera(targetPos, targetLookAt, durationMs = 1200) {
    this.cameraTransition.active = true;
    this.cameraTransition.startTime = performance.now();
    this.cameraTransition.duration = durationMs;
    this.cameraTransition.startPos.copy(this.camera.position);
    this.cameraTransition.targetPos.copy(targetPos);
    if (this.controls) {
      this.cameraTransition.startLookAt.copy(this.controls.target);
    } else {
      this.cameraTransition.startLookAt.set(0, 0, 0);
    }
    this.cameraTransition.targetLookAt.copy(targetLookAt);
  }

  setCameraFrontView() {
    this._animateCamera(
      new THREE.Vector3(0.5, 2.3, 4.2),
      new THREE.Vector3(0.5, 2.3, -2.18),
      900
    );
  }

  resetCamera() {
    this.setCameraPreset('OVERVIEW');
    this.setSubsystemLabelsVisible(null);
  }

  pushCameraState() {
    if (!this.camera) return;
    this.cameraHistory = {
      position: this.camera.position.clone(),
      target: this.controls ? this.controls.target.clone() : new THREE.Vector3(0, 0, 0)
    };
    if (typeof document !== 'undefined') {
      const btn = document.getElementById('btn-camera-prev');
      if (btn) btn.style.display = 'inline-flex';
    }
  }

  popCameraState(durationMs = 900) {
    if (this.cameraHistory) {
      const { position, target } = this.cameraHistory;
      this._animateCamera(position, target, durationMs);
      this.cameraHistory = null;
      this.setSubsystemLabelsVisible(null);
      if (typeof document !== 'undefined') {
        const btn = document.getElementById('btn-camera-prev');
        if (btn) btn.style.display = 'none';
      }
      return true;
    }
    return false;
  }

  focusMDB(durationMs = 1200) {
    this.pushCameraState();
    this.openMDBDoor(true);
    const targetPos = new THREE.Vector3(3.25, 2.40, -1.40);
    const targetLookAt = new THREE.Vector3(3.20, 2.40, -2.18);
    this._animateCamera(targetPos, targetLookAt, durationMs);
    this.setSubsystemLabelsVisible('mdb');
    if (typeof window !== 'undefined' && window.AppOrchestrator?.openInspectorForComponent) {
      window.AppOrchestrator.openInspectorForComponent('bus_g');
    }
  }

  focusSubsystem(name, durationMs = 1200) {
    if (!name || name === 'all') {
      this.resetCamera();
      this.setSubsystemLabelsVisible(null);
      return;
    }
    const key = typeof name === 'string' ? name.toLowerCase() : name;
    if (key === 'mdb') {
      this.focusMDB(durationMs);
      return;
    }

    this.pushCameraState();

    const presetMap = {
      'pv': 'ROOFTOP',
      'dc_box': 'DC_BOX',
      'dc': 'DC_BOX',
      'inverter': 'INVERTER',
      'battery': 'BATTERY',
      'bess': 'BATTERY',
      'eps': 'EPS_BACKUP',
      'met': 'EARTHING_MET'
    };

    const presetName = presetMap[key];
    if (presetName && this.presets[presetName]) {
      const target = this.presets[presetName];
      if (key === 'dc_box' || key === 'dc') {
        this.openDCDoor(true);
      } else if (key === 'eps') {
        this.openEPSDoor(true);
      }
      this._animateCamera(target.pos, target.target, durationMs);
      this.setSubsystemLabelsVisible(key);
    }
  }

  setSubsystemLabelsVisible(subsystemName) {
    this.activeLabelSubsystem = subsystemName && subsystemName !== 'all' ? subsystemName.toLowerCase() : null;
    if (!this.labels) return;
    for (const item of this.labels) {
      if (!item.element) continue;
      if (!this.activeLabelSubsystem) {
        item.element.style.opacity = '1';
        item.element.style.pointerEvents = 'auto';
      } else {
        const isMatch = this._isLabelInSubsystem(item, this.activeLabelSubsystem);
        if (isMatch) {
          item.element.style.opacity = '1';
          item.element.style.pointerEvents = 'auto';
        } else {
          item.element.style.opacity = '0.15';
          item.element.style.pointerEvents = 'none';
        }
      }
    }
  }

  _isLabelInSubsystem(item, subsystemName) {
    if (!item || !subsystemName) return false;
    const name = subsystemName.toLowerCase();
    if (name === 'mdb') {
      return item.id === 'MDB_GRID' || (this.mdbGroup && (item.targetObject === this.mdbGroup || this.mdbGroup.children.includes(item.targetObject)));
    }
    if (name === 'pv' || name === 'rooftop') {
      return item.id === 'ROOFTOP_PV' || (this.roofGroup && (item.targetObject === this.roofGroup || this.roofGroup.children.includes(item.targetObject)));
    }
    if (name === 'dc_box' || name === 'dc') {
      return item.id === 'DC_BOX' || (this.dcEnclosure && (item.targetObject === this.dcEnclosure || this.dcEnclosure.children.includes(item.targetObject)));
    }
    if (name === 'inverter') {
      return item.id === 'INVERTER' || (this.inverterGroup && (item.targetObject === this.inverterGroup || this.inverterGroup.children.includes(item.targetObject)));
    }
    if (name === 'battery' || name === 'bess') {
      return item.id === 'BATTERY' || (this.bessGroup && (item.targetObject === this.bessGroup || this.bessGroup.children.includes(item.targetObject)));
    }
    if (name === 'eps') {
      return item.id === 'EPS_BACKUP' || (this.epsGroup && (item.targetObject === this.epsGroup || this.epsGroup.children.includes(item.targetObject)));
    }
    if (name === 'met') {
      return item.id === 'EARTHING_MET' || (this.metGroup && (item.targetObject === this.metGroup || this.metGroup.children.includes(item.targetObject)));
    }
    return false;
  }

  toggleEnclosureShell() {
    this.enclosuresVisible = this.enclosuresVisible === undefined ? false : !this.enclosuresVisible;
    const targetOpacity = this.enclosuresVisible ? 0.95 : 0.15;
    const transparent = !this.enclosuresVisible;

    if (this.dcEnclosure) {
      this.dcEnclosure.traverse(child => {
        if (child.isMesh && (child.userData.type === 'ENCLOSURE_BODY' || child.name === 'casing')) {
          child.material.transparent = transparent;
          child.material.opacity = targetOpacity;
        }
      });
    }
    if (this.mdbGroup) {
      this.mdbGroup.traverse(child => {
        if (child.isMesh && (child.userData.type === 'ENCLOSURE_BODY' || child.name === 'casing')) {
          child.material.transparent = transparent;
          child.material.opacity = targetOpacity;
        }
      });
    }
    if (this.epsGroup) {
      this.epsGroup.traverse(child => {
        if (child.isMesh && (child.userData.type === 'ENCLOSURE_BODY' || child.name === 'casing')) {
          child.material.transparent = transparent;
          child.material.opacity = targetOpacity;
        }
      });
    }
  }

  isolateSubsystem(name) {
    const subsystemGroups = {
      'pv': [this.roofGroup, this.dcEnclosure],
      'dc_box': [this.dcEnclosure],
      'inverter': [this.inverterGroup, this.xrayGroup],
      'battery': [this.bessGroup],
      'mdb': [this.mdbGroup],
      'eps': [this.epsGroup],
      'met': [this.metGroup]
    };

    if (!name || name === 'all') {
      this.scene.traverse(obj => {
        if (obj.isMesh && obj.userData && obj.userData._origMat && obj.material) {
          obj.material.opacity = obj.userData._origMat.opacity;
          obj.material.transparent = obj.userData._origMat.transparent;
        }
      });
      return;
    }

    const key = typeof name === 'string' ? name.toLowerCase() : name;
    const activeGroups = subsystemGroups[key] || subsystemGroups[name] || [];
    const activeMeshes = new Set();
    for (const g of activeGroups) {
      if (g && typeof g.traverse === 'function') {
        g.traverse(child => {
          if (child.isMesh) activeMeshes.add(child);
        });
      }
    }

    this.scene.traverse(obj => {
      if (obj.isMesh && obj.material && obj !== this.groundMesh) {
        if (obj.userData._origMat === undefined) {
          obj.userData._origMat = {
            opacity: obj.material.opacity,
            transparent: obj.material.transparent
          };
        }
        if (!obj.userData._matCloned) {
          obj.material = obj.material.clone();
          obj.userData._matCloned = true;
        }
        const isActive = activeMeshes.has(obj);
        obj.material.transparent = !isActive ? true : obj.userData._origMat.transparent;
        obj.material.opacity = isActive ? obj.userData._origMat.opacity : 0.15;
      }
    });
  }

  _updateSwitchgearAnimations(delta) {
    const lerpSpeed = 12.0 * delta;
    for (const [id, sw] of Object.entries(this.switchgear)) {
      if (sw.type === 'rotary') {
        sw.currentAngle = THREE.MathUtils.lerp(sw.currentAngle, sw.targetAngle, lerpSpeed);
        sw.object.rotation.z = sw.currentAngle;
      } else if (sw.type === 'lever') {
        sw.currentAngle = THREE.MathUtils.lerp(sw.currentAngle, sw.targetAngle, lerpSpeed);
        sw.object.rotation.x = sw.currentAngle;
      }
    }
  }

  // ==========================================
  // X-RAY SUBSYSTEMS VIEW
  // ==========================================

  /**
   * Toggles internal X-Ray subsystem view for the Hybrid Inverter
   * @param {boolean} enabled
   * @param {number} opacity - Casing transparency when enabled
   */
  setXRayMode(enabled, opacity = 0.22) {
    this.isXRayActive = !!enabled;
    if (this.xrayGroup) this.xrayGroup.visible = this.isXRayActive;

    if (this.inverterBodyMesh) {
      if (this.isXRayActive) {
        this.inverterBodyMesh.material.transparent = true;
        this.inverterBodyMesh.material.opacity = opacity;
        this.inverterBodyMesh.material.wireframe = false;
      } else {
        this.inverterBodyMesh.material.transparent = false;
        this.inverterBodyMesh.material.opacity = 1.0;
      }
    }
  }

  // ==========================================
  // SUN SIMULATION & IRRADIANCE LIGHTING
  // ==========================================

  /**
   * Adjusts sun direction and lighting intensity based on irradiance and time
   * @param {number} irradianceWpm2 - Solar irradiance in W/m² (0 to 1000)
   * @param {number} timeOfDayHours - Time of day in decimal hours (0 to 24)
   */
  setSunIrradiance(irradianceWpm2 = 800, timeOfDayHours = 12.0) {
    if (!this.sunLight) return;

    const ratio = Math.max(0, Math.min(irradianceWpm2 / 1000, 1.0));

    // Sun intensity: 0 at night to 2.2 at peak noon
    this.sunLight.intensity = ratio * 2.2;
    this.ambientLight.intensity = 0.35 + ratio * 0.45;

    // Calculate solar elevation angle along diurnal arc
    // Noon = peak overhead angle, Dawn/Dusk = low horizon angle
    const sunAngle = ((timeOfDayHours - 6) / 12) * Math.PI;
    const elevation = Math.max(0.1, Math.sin(sunAngle));
    const azimuth = Math.cos(sunAngle);

    this.sunLight.position.set(azimuth * 12, elevation * 14, 8);

    // Warm golden tint during low sun, neutral white during peak
    if (ratio < 0.35) {
      this.sunLight.color.setHex(0xfb923c); // Warm amber
    } else {
      this.sunLight.color.setHex(0xfffaed); // Bright sunlight
    }
  }

  // ==========================================
  // CAMERA TRANSITIONS & PRESETS
  // ==========================================

  /**
   * Smoothly transitions the camera to one of the 10 defined equipment viewpoints
   * @param {string} presetName - 'OVERVIEW', 'ROOFTOP', 'DC_PROTECTION', 'INVERTER', 'INVERTER_XRAY', 'BATTERY', 'MDB_GRID', 'EPS_BACKUP', 'CT_SENSING', 'EARTHING_MET'
   * @param {number} durationMs - Animation duration in milliseconds
   */
  setCameraPreset(presetName, durationMs = 1200) {
    const target = this.presets[presetName];
    if (!target) {
      console.warn(`[HybridSolar3DScene] Unknown camera preset: ${presetName}`);
      return;
    }

    // Auto-enable X-Ray mode if transitioning into INVERTER_XRAY
    if (presetName === 'INVERTER_XRAY') {
      this.setXRayMode(true);
    } else if (this.isXRayActive && presetName !== 'INVERTER_XRAY') {
      this.setXRayMode(false);
    }

    // Auto-open panel doors on close inspection presets
    if (presetName === 'DC_BOX' || presetName === 'DC_PROTECTION') {
      this.openDCDoor(true);
    }
    if (presetName === 'AC_PANEL_INTERIOR' || presetName === 'AC_PANEL_WIRING' || presetName === 'AC_TERMINALS' || presetName === 'MDB_GRID') {
      this.openMDBDoor(true);
    }
    if (presetName === 'EPS_PANEL_INTERIOR' || presetName === 'EPS_BACKUP') {
      this.openEPSDoor(true);
    }

    this.cameraTransition.active = true;
    this.cameraTransition.startTime = performance.now();
    this.cameraTransition.duration = durationMs;
    this.cameraTransition.startPos.copy(this.camera.position);
    this.cameraTransition.targetPos.copy(target.pos);

    if (this.controls) {
      this.cameraTransition.startLookAt.copy(this.controls.target);
      this.cameraTransition.targetLookAt.copy(target.target);
    } else {
      this.cameraTransition.startLookAt.set(0, 0, 0);
      this.cameraTransition.targetLookAt.copy(target.target);
    }
  }

  _updateCameraTransition() {
    if (!this.cameraTransition.active) return;

    const elapsed = performance.now() - this.cameraTransition.startTime;
    const progress = Math.min(elapsed / this.cameraTransition.duration, 1.0);

    // Cubic ease-in-out
    const t = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    this.camera.position.lerpVectors(this.cameraTransition.startPos, this.cameraTransition.targetPos, t);

    if (this.controls) {
      this.controls.target.lerpVectors(this.cameraTransition.startLookAt, this.cameraTransition.targetLookAt, t);
      this.controls.update();
    } else {
      const curLook = new THREE.Vector3().lerpVectors(this.cameraTransition.startLookAt, this.cameraTransition.targetLookAt, t);
      this.camera.lookAt(curLook);
    }

    if (progress >= 1.0) {
      this.cameraTransition.active = false;
    }
  }

  // ==========================================
  // 3D FLOATING TELEMETRY LABELS / BADGES
  // ==========================================

  _createOverlayContainer() {
    this.overlayContainer = document.createElement('div');
    this.overlayContainer.className = 'scene-3d-overlay';
    this.overlayContainer.style.position = 'absolute';
    this.overlayContainer.style.top = '0';
    this.overlayContainer.style.left = '0';
    this.overlayContainer.style.width = '100%';
    this.overlayContainer.style.height = '100%';
    this.overlayContainer.style.pointerEvents = 'none';
    this.overlayContainer.style.overflow = 'hidden';
    this.containerElement.appendChild(this.overlayContainer);

    // Tooltip Element
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'scene-3d-tooltip';
    this.tooltipEl.style.position = 'absolute';
    this.tooltipEl.style.display = 'none';
    this.tooltipEl.style.padding = '8px 12px';
    this.tooltipEl.style.background = 'rgba(15, 23, 42, 0.92)';
    this.tooltipEl.style.border = '1px solid #38bdf8';
    this.tooltipEl.style.borderRadius = '6px';
    this.tooltipEl.style.color = '#ffffff';
    this.tooltipEl.style.fontSize = '12px';
    this.tooltipEl.style.fontFamily = 'system-ui, sans-serif';
    this.tooltipEl.style.pointerEvents = 'none';
    this.tooltipEl.style.zIndex = '100';
    this.tooltipEl.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';
    this.overlayContainer.appendChild(this.tooltipEl);
  }

  _registerLabel(id, text, subtext, targetObject, offset = new THREE.Vector3(0, 0, 0)) {
    if (!this.options.showLabels) return;

    const el = document.createElement('div');
    el.className = `scene-badge badge-${id.toLowerCase()}`;
    el.style.position = 'absolute';
    el.style.transform = 'translate(-50%, -100%)';
    el.style.background = 'rgba(15, 23, 42, 0.88)';
    el.style.border = '1px solid rgba(56, 189, 248, 0.4)';
    el.style.borderRadius = '6px';
    el.style.padding = '4px 8px';
    el.style.color = '#f8fafc';
    el.style.fontSize = '11px';
    el.style.fontFamily = 'system-ui, sans-serif';
    el.style.whiteSpace = 'nowrap';
    el.style.pointerEvents = 'auto';
    el.style.cursor = 'pointer';
    el.style.transition = 'opacity 0.2s, border-color 0.2s';
    el.innerHTML = subtext
      ? `<strong>${text}</strong><div style="font-size:9px;color:#94a3b8">${subtext}</div>`
      : `<strong>${text}</strong>`;

    el.addEventListener('click', () => {
      this.setCameraPreset(id);
    });

    this.overlayContainer.appendChild(el);
    this.labels.push({ id, targetObject, offset, element: el });
  }

  _updateFloatingLabels() {
    if (!this.overlayContainer || !this.options.showLabels) return;

    const width = this.containerElement.clientWidth;
    const height = this.containerElement.clientHeight;
    const camPos = this.camera.position;

    const tempV = new THREE.Vector3();
    for (const item of this.labels) {
      if (this.activeLabelSubsystem && this.activeLabelSubsystem !== 'all') {
        const isMatch = this._isLabelInSubsystem(item, this.activeLabelSubsystem);
        if (!isMatch) {
          item.element.style.display = 'none';
          continue;
        }
      }

      item.targetObject.getWorldPosition(tempV);

      // Hide badge if camera is zoomed close into equipment to avoid obscuring internal components & wiring
      if (camPos.distanceTo(tempV) < 2.0 && (item.id === 'DC_BOX' || item.id === 'MDB_GRID' || item.id === 'EPS_BACKUP' || item.id === 'INVERTER')) {
        item.element.style.display = 'none';
        continue;
      }

      tempV.add(item.offset);

      // Project 3D coordinate to screen coordinates (-1 to +1)
      tempV.project(this.camera);

      // Behind camera check
      if (tempV.z > 1) {
        item.element.style.display = 'none';
        continue;
      }

      item.element.style.display = 'block';
      const screenX = (tempV.x * 0.5 + 0.5) * width;
      const screenY = (-tempV.y * 0.5 + 0.5) * height;
      item.element.style.left = `${screenX}px`;
      item.element.style.top = `${screenY}px`;
    }
  }

  // ==========================================
  // RAYCASTING & INTERACTION
  // ==========================================

  _setupEvents() {
    this._onPointerDown = (event) => {
      this._pointerDownPos = { x: event.clientX, y: event.clientY };
    };
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onClick = this._onClick.bind(this);
    this._onDoubleClick = this._onDoubleClick.bind(this);
    this._onResize = this._onResize.bind(this);

    this.renderer.domElement.addEventListener('pointerdown', this._onPointerDown);
    this.renderer.domElement.addEventListener('pointermove', this._onPointerMove);
    this.renderer.domElement.addEventListener('click', this._onClick);
    this.renderer.domElement.addEventListener('dblclick', this._onDoubleClick);
    window.addEventListener('resize', this._onResize);
  }

  _setupEventListeners() {
    this._setupEvents();
  }

  _onPointerMove(event) {
    if (!this.options.enableInteraction) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

    if (intersects.length > 0) {
      let hit = intersects[0].object;
      while (hit && !hit.userData.type && hit.parent) hit = hit.parent;

      if (hit && hit.userData && hit.userData.name) {
        this.renderer.domElement.style.cursor = 'pointer';
        this.tooltipEl.style.display = 'block';
        this.tooltipEl.style.left = `${event.clientX - rect.left + 14}px`;
        this.tooltipEl.style.top = `${event.clientY - rect.top + 14}px`;
        this.tooltipEl.innerHTML = `<strong>${hit.userData.name}</strong>${hit.userData.desc ? `<div style="color:#94a3b8;font-size:11px;margin-top:2px;">${hit.userData.desc}</div>` : ''}${hit.userData.spec ? `<div style="color:#38bdf8;font-size:10px;margin-top:2px;">${hit.userData.spec}</div>` : ''}`;
        this.hoveredObject = hit;
        return;
      }
    }

    this.renderer.domElement.style.cursor = 'default';
    this.tooltipEl.style.display = 'none';
    this.hoveredObject = null;
  }

  _onClick(event) {
    if (this._pointerDownPos && Math.hypot(event.clientX - this._pointerDownPos.x, event.clientY - this._pointerDownPos.y) > 5) {
      return;
    }
    if (!this.options.enableInteraction || !this.hoveredObject) return;

    const data = this.hoveredObject.userData;
    this._emit('objectSelected', data);
    this._emit('objectClick', data);
  }

  _onResize() {
    if (!this.renderer || !this.camera || !this.containerElement) return;
    const width = this.containerElement.clientWidth || window.innerWidth;
    const height = this.containerElement.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // ==========================================
  // EXTERNAL CONTROL & API
  // ==========================================

  /**
   * Updates power flow directions and magnitudes along cables
   * @param {Object} flows - e.g. { pv1: { active: true, watts: 2400 }, battery: { active: true, watts: -1200 }, grid_in: { active: true, watts: 450 } }
   */
  updatePowerFlows(flows = {}) {
    for (const p of this.animatedParticles) {
      const flow = flows[p.id];
      if (flow !== undefined) {
        p.active = !!flow.active;
        if (flow.watts !== undefined) {
          // Direction: positive = normal forward, negative = reverse (e.g. battery discharge or grid export)
          p.direction = flow.watts >= 0 ? 1 : -1;
          const mag = Math.abs(flow.watts);
          // V13 fix: scale particle speed relative to circuit's rated capacity
          const circuit = this.activeProfile?.connectivity?.circuits?.[p.id];
          const capacity = flow.capacity || flow.circuitCapacity || circuit?.ratedPower_W || circuit?.ratedCapacity_W || (this.activeProfile?.equipment?.inverter?.acRating_W) || 5000;
          p.speed = Math.min(0.45, Math.max(0.05, (mag / capacity) * 0.45));
        }
      }
    }
  }

  getParticleSpeed(circuitId, watts, capacity) {
    const p = this.animatedParticles.find(item => item.id === circuitId);
    const circuit = this.activeProfile?.connectivity?.circuits?.[circuitId];
    const cap = capacity || circuit?.ratedPower_W || (this.activeProfile?.equipment?.inverter?.acRating_W) || 5000;
    const mag = Math.abs(watts !== undefined ? watts : (p?.watts || 0));
    return Math.min(0.45, Math.max(0.05, (mag / cap) * 0.45));
  }

  on(event, callback) {
    if (!this.eventListeners[event]) this.eventListeners[event] = [];
    this.eventListeners[event].push(callback);
  }

  _emit(event, payload) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(cb => {
        try { cb(payload); } catch (e) { console.error(e); }
      });
    }
  }

  // ==========================================
  // PANEL ENCLOSURE DOOR ANIMATIONS & API
  // ==========================================

  toggleDCDoor() {
    this.openDCDoor(!this.dcDoorOpen);
  }

  openDCDoor(isOpen = true) {
    this.dcDoorOpen = !!isOpen;
    this.dcDoorTargetAngle = this.dcDoorOpen ? -Math.PI * 0.65 : 0;
    this._emit('doorChange', { panel: 'dc', isOpen: this.dcDoorOpen });
  }

  toggleMDBDoor() {
    this.openMDBDoor(!this.mdbDoorOpen);
  }

  openMDBDoor(isOpen = true) {
    this.mdbDoorOpen = !!isOpen;
    this.mdbDoorTargetAngle = this.mdbDoorOpen ? -Math.PI * 0.65 : 0;
    this._emit('doorChange', { panel: 'mdb', isOpen: this.mdbDoorOpen });
  }

  toggleEPSDoor() {
    this.openEPSDoor(!this.epsDoorOpen);
  }

  openEPSDoor(isOpen = true) {
    this.epsDoorOpen = !!isOpen;
    this.epsDoorTargetAngle = this.epsDoorOpen ? -Math.PI * 0.65 : 0;
    this._emit('doorChange', { panel: 'eps', isOpen: this.epsDoorOpen });
  }

  _onDoubleClick(event) {
    if (!this.options.enableInteraction) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

    if (intersects.length > 0) {
      let hit = intersects[0].object;
      while (hit && !hit.userData.type && hit.parent) hit = hit.parent;

      if (hit && hit.userData) {
        const id = (hit.userData.id || '').toLowerCase();
        // Double click inside DC Combiner Box -> zoom inside DC box & open door
        if (id.includes('dc_') || id.includes('fuse') || id.includes('qpv') || id.includes('spd_1') || id.includes('spd_2') || id.includes('combiner')) {
          this.setCameraPreset('DC_BOX');
          this.openDCDoor(true);
        } else if (id.includes('mdb') || id.includes('grid_incomer') || id.includes('grid_mcb') || 
            id.includes('smart_meter') || id.includes('ac_spd') || id.includes('spd_backup') || 
            id.includes('inv_grid') || id.includes('split_core') || id.includes('load_mcb')) {
          this.setCameraPreset('AC_PANEL_INTERIOR');
          this.openMDBDoor(true);
        } else if (id.includes('eps') || id.includes('rcd')) {
          this.setCameraPreset('EPS_PANEL_INTERIOR');
          this.openEPSDoor(true);
        } else if (id.includes('inv') || id.includes('hybrid')) {
          this.setCameraPreset('INVERTER');
        } else if (id.includes('bat') || id.includes('bess') || id.includes('bms')) {
          this.setCameraPreset('BATTERY');
        } else if (id.includes('pv') || id.includes('roof') || id.includes('panel')) {
          this.setCameraPreset('ROOFTOP');
        }
      }
    }
  }

  // ==========================================
  // MAIN ANIMATION LOOP
  // ==========================================

  animate() {
    if (this.isDisposed) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // 1. Controls Inertia Damping
    if (this.controls) {
      this.controls.update();
    }

    // 2. Camera Preset Transitions
    this._updateCameraTransition();

    // 3. Physical Switchgear Smooth Animations
    this._updateSwitchgearAnimations(delta);

    // 3b. Panel Door Hinges Smooth Animations
    if (this.dcDoorHinge) {
      this.dcDoorHinge.rotation.y = THREE.MathUtils.lerp(this.dcDoorHinge.rotation.y, this.dcDoorTargetAngle, 8.0 * delta);
    }
    if (this.mdbDoorHinge) {
      this.mdbDoorHinge.rotation.y = THREE.MathUtils.lerp(this.mdbDoorHinge.rotation.y, this.mdbDoorTargetAngle, 8.0 * delta);
    }
    if (this.epsDoorHinge) {
      this.epsDoorHinge.rotation.y = THREE.MathUtils.lerp(this.epsDoorHinge.rotation.y, this.epsDoorTargetAngle, 8.0 * delta);
    }

    // 4. Glowing Electrical Particle Flows
    this._updateParticleFlows(delta);

    // 5. 3D Floating Telemetry Overlays Screen Coordinates
    this._updateFloatingLabels();

    // 6. Render Frame
    this.renderer.render(this.scene, this.camera);
  }

  loadProfile(profile) {
    if (!profile) return;
    this.activeProfile = profile;
    const acRating = profile.equipment?.inverter?.acRating_W || profile.systemRatings?.acRatedPower_W || 5000;
    this.circuitCapacity = acRating;

    // Adapt 3D presentation to profile topology
    const hasBattery = profile.equipment?.batteryBank?.present !== false;
    if (!hasBattery) {
      // Turn off battery particle flows
      this.updatePowerFlows({
        battery: { active: false, watts: 0 }
      });
      // Dim or hide battery meshes in scene
      if (this.scene) {
        this.scene.traverse((child) => {
          if (child.name && (child.name.toLowerCase().includes('battery') || child.name.toLowerCase().includes('bess'))) {
            if (child.isMesh && child.material) {
              child.material.transparent = true;
              child.material.opacity = 0.2;
            }
          }
        });
      }
    } else {
      if (this.scene) {
        this.scene.traverse((child) => {
          if (child.name && (child.name.toLowerCase().includes('battery') || child.name.toLowerCase().includes('bess'))) {
            if (child.isMesh && child.material) {
              child.material.opacity = 1.0;
            }
          }
        });
      }
    }
    return true;
  }

  // ==========================================
  // CLEANUP & DISPOSAL (V14 FIX)
  // ==========================================

  dispose() {
    this.isDisposed = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // 1. Controls disposal
    if (this.controls && typeof this.controls.dispose === 'function') {
      this.controls.dispose();
      this.controls = null;
    }

    // 2. Remove all DOM event listeners
    if (this.renderer && this.renderer.domElement) {
      if (this._onPointerDown) {
        this.renderer.domElement.removeEventListener('pointerdown', this._onPointerDown);
      }
      if (this._onPointerMove) {
        this.renderer.domElement.removeEventListener('pointermove', this._onPointerMove);
      }
      if (this._onClick) {
        this.renderer.domElement.removeEventListener('click', this._onClick);
      }
      if (this._onDoubleClick) {
        this.renderer.domElement.removeEventListener('dblclick', this._onDoubleClick);
      }
    }
    if (this._onResize) {
      window.removeEventListener('resize', this._onResize);
    }

    let disposedGeometries = 0;
    let disposedMaterials = 0;
    let disposedParticles = 0;

    // 3. Traverse this.scene and dispose all geometries, materials, textures
    if (this.scene) {
      this.scene.traverse(child => {
        if (child.isMesh || child.isPoints || child.isLine) {
          if (child.geometry) {
            child.geometry.dispose();
            disposedGeometries++;
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => {
                if (m.map) m.map.dispose();
                m.dispose();
                disposedMaterials++;
              });
            } else {
              if (child.material.map) child.material.map.dispose();
              child.material.dispose();
              disposedMaterials++;
            }
          }
        }
      });
      while (this.scene.children.length > 0) {
        this.scene.remove(this.scene.children[0]);
      }
    }

    // 4. Dispose this.cables
    if (this.cables) {
      for (const key of Object.keys(this.cables)) {
        const c = this.cables[key];
        if (c && c.mesh) {
          if (c.mesh.geometry) { c.mesh.geometry.dispose(); disposedGeometries++; }
          if (c.mesh.material) {
            if (Array.isArray(c.mesh.material)) c.mesh.material.forEach(m => { m.dispose(); disposedMaterials++; });
            else { c.mesh.material.dispose(); disposedMaterials++; }
          }
        }
      }
      this.cables = {};
    }

    // 5. Dispose this.animatedParticles
    if (this.animatedParticles) {
      for (const p of this.animatedParticles) {
        if (p && p.pointsMesh) {
          if (p.pointsMesh.geometry) { p.pointsMesh.geometry.dispose(); disposedGeometries++; }
          if (p.pointsMesh.material) {
            if (p.pointsMesh.material.map) p.pointsMesh.material.map.dispose();
            p.pointsMesh.material.dispose();
            disposedMaterials++;
          }
        }
        disposedParticles++;
      }
      this.animatedParticles = [];
    }

    // 6. Clear labels and tooltip DOM
    if (this.labels) {
      for (const item of this.labels) {
        if (item && item.element && item.element.parentNode) {
          item.element.parentNode.removeChild(item.element);
        }
      }
      this.labels = [];
    }
    if (this.tooltipEl && this.tooltipEl.parentNode) {
      this.tooltipEl.parentNode.removeChild(this.tooltipEl);
      this.tooltipEl = null;
    }

    // 7. Remove overlayContainer and renderer canvas
    if (this.overlayContainer && this.overlayContainer.parentNode) {
      this.overlayContainer.parentNode.removeChild(this.overlayContainer);
      this.overlayContainer = null;
    }
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    // 8. Clear state, collections and event listeners
    const disposedListeners = Object.keys(this.eventListeners || {}).reduce((acc, k) => acc + (this.eventListeners[k]?.length || 0), 0);
    this.switchgear = {};
    this.interactiveObjects = [];
    this._cameraStack = [];
    this.circuitGraph = {};
    this.highlightedCircuitMeshes = [];
    this.eventListeners = {};

    // 9. Call this.renderer.dispose()
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    this.scene = null;
    this.camera = null;

    this.disposalReport = {
      disposedGeometries,
      disposedMaterials,
      disposedParticles,
      disposedListeners,
      isCleaned: true
    };
  }
}

// Global attachment for non-module script tag usage
if (typeof window !== 'undefined') {
  window.HybridSolar3DScene = HybridSolar3DScene;
}

// Module export if ES/CommonJS environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HybridSolar3DScene };
}
