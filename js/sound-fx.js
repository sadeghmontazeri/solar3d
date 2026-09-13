/**
 * 5kW Single-Phase Hybrid Solar PV 3D Simulator - Web Audio Procedural Sound Engine
 * 
 * 100% Offline, Pure Web Audio API Procedural Synthesis.
 * Zero external audio files, samples, or network requests.
 * 
 * Features:
 * - Mechanical Relay Click (contact bounce + armature impact)
 * - Spring-Loaded Breaker Trip (high-energy pop + metallic resonance)
 * - Continuous Inverter Hum (50Hz harmonic magnetostriction + 16kHz PWM carrier)
 * - Industrial Pulsed Alarm Beep (dual-cadence emergency tone)
 * - Subtle UI Click (tactile micro-blip)
 * - Volume control and persistent mute state via localStorage
 * - Auto-resumes AudioContext on initial user gesture
 * 
 * @module SoundEffectsEngine
 * @author Agent 2: Simulation Physics & Sound Specialist
 */

class SoundEffectsEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isInitialized = false;

    // Persistent Mute State
    const savedMute = (typeof localStorage !== 'undefined')
      ? localStorage.getItem('hybrid_pv_audio_muted')
      : null;
    this._isMuted = savedMute === 'true';

    // Master volume level (0.0 to 1.0)
    this._volume = 0.7;

    // Persistent Inverter Hum State
    this._humNodes = null;
    this._humActive = false;
    this._humTargetVolume = 0.35;

    // Persistent Alarm State
    this._alarmTimer = null;
    this._alarmActive = false;

    // Setup user interaction listener to unlock AudioContext
    this._bindGestureUnlock();
  }

  // ==========================================================================
  // 1. LIFECYCLE & WEB AUDIO INITIALIZATION
  // ==========================================================================

  /**
   * Initializes or returns active AudioContext
   * @returns {AudioContext|null}
   */
  init() {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('Web Audio API is not supported in this environment');
        return null;
      }

      this.ctx = new AudioContextClass();

      // Master gain node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this._isMuted ? 0.0 : this._volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.isInitialized = true;
      return this.ctx;
    } catch (err) {
      console.error('Failed to initialize Web Audio context:', err);
      return null;
    }
  }

  /**
   * Ensures AudioContext is created and resumed
   * @private
   */
  _ensureAudio() {
    const ctx = this.init();
    if (!ctx) return null;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  /**
   * Binds one-time user interaction listener to unlock suspended AudioContext
   * @private
   */
  _bindGestureUnlock() {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;

    const unlockHandler = () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          console.log('[SoundEngine] AudioContext resumed via user gesture');
        }).catch(() => {});
      } else if (!this.ctx) {
        this.init();
      }

      window.removeEventListener('pointerdown', unlockHandler);
      window.removeEventListener('keydown', unlockHandler);
      window.removeEventListener('touchstart', unlockHandler);
    };

    window.addEventListener('pointerdown', unlockHandler, { passive: true });
    window.addEventListener('keydown', unlockHandler, { passive: true });
    window.addEventListener('touchstart', unlockHandler, { passive: true });
  }

  // ==========================================================================
  // 2. MUTE & VOLUME CONTROLS
  // ==========================================================================

  get isMuted() {
    return this._isMuted;
  }

  /**
   * Sets mute state with smooth gain ramping and localStorage persistence
   * @param {boolean} muted
   */
  setMuted(muted) {
    this._isMuted = Boolean(muted);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('hybrid_pv_audio_muted', String(this._isMuted));
      } catch (_) {}
    }

    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      const target = this._isMuted ? 0.0 : this._volume;
      this.masterGain.gain.setTargetAtTime(target, now, 0.03);
    }

    return this._isMuted;
  }

  /**
   * Toggles mute state
   * @returns {boolean} New mute state
   */
  toggleMute() {
    return this.setMuted(!this._isMuted);
  }

  /**
   * Sets master volume (0.0 to 1.0)
   * @param {number} vol
   */
  setVolume(vol) {
    this._volume = Math.max(0.0, Math.min(1.0, Number(vol) || 0.7));
    if (this.ctx && this.masterGain && !this._isMuted) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(this._volume, now, 0.03);
    }
  }

  // ==========================================================================
  // 3. SOUND SYNTHESIZERS
  // ==========================================================================

  /**
   * Procedural Relay Click
   * Authentic heavy mechanical contactor/relay clack with armature impact,
   * contact bounce micro-click, and mechanical body resonance.
   */
  playRelayClick() {
    const ctx = this._ensureAudio();
    if (!ctx || this._isMuted) return;

    const now = ctx.currentTime;

    // 1. High-frequency transient burst (armature strike)
    const noiseDuration = 0.012;
    const bufferSize = Math.floor(ctx.sampleRate * noiseDuration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2800, now);
    noiseFilter.Q.setValueAtTime(3.0, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseDuration);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noiseSource.start(now);

    // 2. Heavy low-frequency armature impact thud (360Hz -> 180Hz)
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();

    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime(420, now);
    thudOsc.frequency.exponentialRampToValueAtTime(160, now + 0.045);

    thudGain.gain.setValueAtTime(0.85, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    thudOsc.connect(thudGain);
    thudGain.connect(this.masterGain);

    thudOsc.start(now);
    thudOsc.stop(now + 0.055);

    // 3. Contact bounce secondary micro-click (16ms later)
    const bounceTime = now + 0.016;
    const bounceOsc = ctx.createOscillator();
    const bounceGain = ctx.createGain();

    bounceOsc.type = 'sine';
    bounceOsc.frequency.setValueAtTime(1100, bounceTime);
    bounceOsc.frequency.exponentialRampToValueAtTime(400, bounceTime + 0.018);

    bounceGain.gain.setValueAtTime(0.35, bounceTime);
    bounceGain.gain.exponentialRampToValueAtTime(0.001, bounceTime + 0.02);

    bounceOsc.connect(bounceGain);
    bounceGain.connect(this.masterGain);

    bounceOsc.start(bounceTime);
    bounceOsc.stop(bounceTime + 0.025);
  }

  /**
   * Procedural Breaker Trip
   * High-energy spring-loaded breaker pop with sharp metallic release snap,
   * deep kinetic impact thud, and decaying spring resonance.
   */
  playBreakerTrip() {
    const ctx = this._ensureAudio();
    if (!ctx || this._isMuted) return;

    const now = ctx.currentTime;

    // 1. High-energy spring release snap (High-pass filtered noise)
    const snapDuration = 0.035;
    const bufferSize = Math.floor(ctx.sampleRate * snapDuration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const snapFilter = ctx.createBiquadFilter();
    snapFilter.type = 'highpass';
    snapFilter.frequency.setValueAtTime(950, now);

    const snapGain = ctx.createGain();
    snapGain.gain.setValueAtTime(1.0, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + snapDuration);

    noiseSource.connect(snapFilter);
    snapFilter.connect(snapGain);
    snapGain.connect(this.masterGain);

    noiseSource.start(now);

    // 2. Kinetic Impact Thump (Heavy pitch drop 550Hz -> 45Hz)
    const thumpOsc = ctx.createOscillator();
    const thumpGain = ctx.createGain();

    thumpOsc.type = 'sine';
    thumpOsc.frequency.setValueAtTime(580, now);
    thumpOsc.frequency.exponentialRampToValueAtTime(42, now + 0.07);

    thumpGain.gain.setValueAtTime(0.95, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    thumpOsc.connect(thumpGain);
    thumpGain.connect(this.masterGain);

    thumpOsc.start(now);
    thumpOsc.stop(now + 0.085);

    // 3. Metallic Spring Ringing (1850Hz decaying over 120ms)
    const ringOsc = ctx.createOscillator();
    const ringGain = ctx.createGain();

    ringOsc.type = 'triangle';
    ringOsc.frequency.setValueAtTime(1820, now);
    ringOsc.frequency.exponentialRampToValueAtTime(1400, now + 0.12);

    ringGain.gain.setValueAtTime(0.4, now + 0.005);
    ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    ringOsc.connect(ringGain);
    ringGain.connect(this.masterGain);

    ringOsc.start(now);
    ringOsc.stop(now + 0.13);
  }

  /**
   * Procedural Inverter Hum
   * Subtle high-frequency 16kHz PWM switching tone blended with 50Hz fundamental
   * mains hum and low-frequency magnetostriction harmonics (100Hz, 150Hz).
   * 
   * @param {boolean} active - True to start/maintain, false to stop
   * @param {number} [volume=0.35] - Desired volume level (0.0 to 1.0)
   */
  playInverterHum(active, volume = 0.35) {
    this._humTargetVolume = Math.max(0.0, Math.min(1.0, volume));

    if (!active) {
      if (this._humNodes && this._humActive) {
        const ctx = this.ctx;
        const now = ctx.currentTime;
        this._humNodes.mainGain.gain.cancelScheduledValues(now);
        this._humNodes.mainGain.gain.linearRampToValueAtTime(0.0001, now + 0.35);

        const nodesToClean = this._humNodes;
        this._humNodes = null;
        this._humActive = false;

        setTimeout(() => {
          try {
            nodesToClean.oscillators.forEach(osc => osc.stop());
            nodesToClean.mainGain.disconnect();
          } catch (_) {}
        }, 400);
      }
      return;
    }

    // If active and already playing, smoothly update volume
    if (this._humNodes && this._humActive) {
      const now = this.ctx.currentTime;
      this._humNodes.mainGain.gain.cancelScheduledValues(now);
      this._humNodes.mainGain.gain.setTargetAtTime(this._humTargetVolume, now, 0.1);
      return;
    }

    // Start Inverter Hum
    const ctx = this._ensureAudio();
    if (!ctx) return;

    this._humActive = true;
    const now = ctx.currentTime;

    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(0.0001, now);
    mainGain.gain.linearRampToValueAtTime(this._humTargetVolume, now + 0.45);
    mainGain.connect(this.masterGain);

    const oscillators = [];

    // Osc 1: 50Hz Fundamental Mains Hum
    const osc50 = ctx.createOscillator();
    const gain50 = ctx.createGain();
    osc50.type = 'sine';
    osc50.frequency.setValueAtTime(50.0, now);
    gain50.gain.setValueAtTime(0.45, now);
    osc50.connect(gain50);
    gain50.connect(mainGain);
    osc50.start(now);
    oscillators.push(osc50);

    // Osc 2: 100Hz Even Harmonic (Choke Magnetostriction)
    const osc100 = ctx.createOscillator();
    const gain100 = ctx.createGain();
    osc100.type = 'sine';
    osc100.frequency.setValueAtTime(100.0, now);
    gain100.gain.setValueAtTime(0.22, now);
    osc100.connect(gain100);
    gain100.connect(mainGain);
    osc100.start(now);
    oscillators.push(osc100);

    // Osc 3: 150Hz 3rd Harmonic
    const osc150 = ctx.createOscillator();
    const gain150 = ctx.createGain();
    osc150.type = 'sine';
    osc150.frequency.setValueAtTime(150.0, now);
    gain150.gain.setValueAtTime(0.12, now);
    osc150.connect(gain150);
    gain150.connect(mainGain);
    osc150.start(now);
    oscillators.push(osc150);

    // Osc 4: 16kHz High-Frequency PWM Carrier Switching Whine (kept very gentle)
    const oscPwm = ctx.createOscillator();
    const gainPwm = ctx.createGain();
    oscPwm.type = 'sine';
    oscPwm.frequency.setValueAtTime(16000.0, now);
    gainPwm.gain.setValueAtTime(0.045, now); // Gentle, subtle
    oscPwm.connect(gainPwm);
    gainPwm.connect(mainGain);
    oscPwm.start(now);
    oscillators.push(oscPwm);

    this._humNodes = {
      mainGain,
      oscillators
    };
  }

  /**
   * Procedural Pulsed Alert Alarm
   * Repeating industrial cadence alert beep (880Hz / 1760Hz dual pulse) for critical alarms.
   * 
   * @param {boolean} active - True to start pulsing alarm, false to stop
   */
  playAlarm(active) {
    if (!active) {
      this._alarmActive = false;
      if (this._alarmTimer) {
        clearInterval(this._alarmTimer);
        this._alarmTimer = null;
      }
      return;
    }

    if (this._alarmActive) return; // Already pulsing
    this._alarmActive = true;

    // Pulse immediately, then every 1200ms
    this._playSingleAlarmPulse();
    this._alarmTimer = setInterval(() => {
      if (!this._alarmActive) {
        clearInterval(this._alarmTimer);
        this._alarmTimer = null;
        return;
      }
      this._playSingleAlarmPulse();
    }, 1200);
  }

  /**
   * Single alarm double-beep pattern
   * @private
   */
  _playSingleAlarmPulse() {
    const ctx = this._ensureAudio();
    if (!ctx || this._isMuted || !this._alarmActive) return;

    const now = ctx.currentTime;

    const createBeep = (startTime, freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.4, startTime + 0.015);
      gain.gain.setValueAtTime(0.4, startTime + 0.12);
      gain.gain.linearRampToValueAtTime(0.0001, startTime + 0.14);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.15);
    };

    // First Beep: 880 Hz (A5)
    createBeep(now, 880);
    // Second Beep: 1100 Hz (C#6) at +160ms
    createBeep(now + 0.16, 1100);
  }

  /**
   * Procedural UI Click
   * Crisp, subtle micro-blip interface feedback click.
   */
  playUIClick() {
    const ctx = this._ensureAudio();
    if (!ctx || this._isMuted) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.015);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.02);
  }

  /**
   * 6. SBY MANUAL BYPASS 3-POSITION CHANGEOVER SWITCH (I - 0 - II)
   * Heavy mechanical rotary detent clack + spring contact impact
   */
  playSbySwitch() {
    if (this._isMuted) return;
    const ctx = this.init();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Heavy low-frequency spring contact snap
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(160, now);
    osc1.frequency.exponentialRampToValueAtTime(30, now + 0.08);
    gain1.gain.setValueAtTime(0.45, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.09);

    // 2. Metallic cam latch detent click (offset by 20ms)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(450, now + 0.02);
    osc2.frequency.exponentialRampToValueAtTime(80, now + 0.07);
    gain2.gain.setValueAtTime(0.28, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.02);
    osc2.stop(now + 0.08);

    osc1.onended = () => { osc1.disconnect(); gain1.disconnect(); };
    osc2.onended = () => { osc2.disconnect(); gain2.disconnect(); };
  }
}

// Global Singleton Instance & Universal Browser/Node Support
const soundFX = new SoundEffectsEngine();

if (typeof window !== 'undefined') {
  window.SoundEffectsEngine = SoundEffectsEngine;
  window.soundFX = soundFX;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SoundEffectsEngine, soundFX };
}
