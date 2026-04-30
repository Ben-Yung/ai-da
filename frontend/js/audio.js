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
    // 重低實：80-120Hz, gain 0.4-0.6, duration 0.2s
    osc.frequency.setValueAtTime(80 + intensity * 40, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.4 + intensity * 0.2, this.ctx.currentTime);
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
    // 溫柔：600-900Hz, gain 0.15-0.25, duration 0.35s
    osc.frequency.setValueAtTime(600 + intensity * 300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900 + intensity * 200, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15 + intensity * 0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
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

  /** Speak a rhyme using Web Speech API */
  speak(text) {
    if (!this.soundEnabled) return;
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-HK';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.7;
    speechSynthesis.speak(utterance);
  }

  stopBeat() {
    if (this.beatInterval) {
      clearInterval(this.beatInterval);
      this.beatInterval = null;
    }
  }
}

const audio = new AudioManager();
