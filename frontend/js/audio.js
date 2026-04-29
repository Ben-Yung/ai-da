/* ── Web Audio API — Procedural Beat/Hug Music ── */
class AudioManager {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
    this.musicEnabled = true;
    this.beatInterval = null;
    this._initOnInteraction = this._initOnInteraction.bind(this);
  }

  _init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    document.removeEventListener('click', this._initOnInteraction);
    document.removeEventListener('touchstart', this._initOnInteraction);
  }

  _initOnInteraction() {
    this._init();
  }

  enable() {
    document.addEventListener('click', this._initOnInteraction, { once: true });
    document.addEventListener('touchstart', this._initOnInteraction, { once: true });
  }

  // ── Individual sounds ──

  /** Hit sound — low thump for beat mode */
  playHit(intensity = 0.5) {
    if (!this.soundEnabled || !this.ctx) return;
    this._init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120 - intensity * 40, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(intensity * 0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  /** Hug sound — soft chime for hug mode */
  playHug(intensity = 0.5) {
    if (!this.soundEnabled || !this.ctx) return;
    this._init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    const baseFreq = 600 + intensity * 400;
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(intensity * 0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  /** Miss sound */
  playMiss() {
    if (!this.soundEnabled || !this.ctx) return;
    this._init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  /** Result sound — win fanfare or lose */
  playResult(win) {
    if (!this.soundEnabled || !this.ctx) return;
    this._init();
    if (win) {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.12);
        osc.stop(this.ctx.currentTime + i * 0.12 + 0.4);
      });
    } else {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);
    }
  }

  // ── Background beat rhythm ──

  startBeat(mode = 'beat') {
    if (!this.musicEnabled || !this.ctx) return;
    this._init();
    this.stopBeat();
    const isBeat = mode === 'beat';
    const baseFreq = isBeat ? 80 : 400;
    const interval = isBeat ? 400 : 350;

    this.beatInterval = setInterval(() => {
      if (!this.musicEnabled || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = isBeat ? 'sine' : 'triangle';
      osc.frequency.value = baseFreq + Math.random() * 40;
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    }, interval);
  }

  stopBeat() {
    if (this.beatInterval) {
      clearInterval(this.beatInterval);
      this.beatInterval = null;
    }
  }
}

const audio = new AudioManager();
