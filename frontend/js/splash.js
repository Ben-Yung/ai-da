/* ── Splash Animation (~12 sec Canvas animation) ── */
class SplashAnimation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.startTime = 0;
    this.duration = 12000; // 12 seconds
    this.running = false;
    this.onComplete = null;
    this.skipped = false;

    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.w = this.canvas.width;
    this.h = this.canvas.height;
  }

  start(onComplete) {
    this.onComplete = onComplete;
    this.running = true;
    this.startTime = performance.now();
    this.skipped = false;
    this.canvas.addEventListener('click', () => this.skip());
    this.canvas.addEventListener('touchstart', () => this.skip());
    this._loop();
  }

  skip() {
    if (!this.running || this.skipped) return;
    this.skipped = true;
    this.running = false;
    this._cleanup();
    if (this.onComplete) this.onComplete();
  }

  _cleanup() {
    this.canvas.removeEventListener('click', () => this.skip());
    this.canvas.removeEventListener('touchstart', () => this.skip());
  }

  _loop() {
    if (!this.running) return;
    const elapsed = performance.now() - this.startTime;
    const t = Math.min(elapsed / this.duration, 1);

    this.ctx.clearRect(0, 0, this.w, this.h);

    // Scene 1 (0-20%): ⚡ Lightning flash
    if (t < 0.20) {
      const st = t / 0.20; // 0→1 within first 20%
      this._sceneLightning(st);
    }
    // Scene 2 (20-40%): Logo appears
    else if (t < 0.40) {
      const st = (t - 0.20) / 0.20;
      this._sceneLogo(st);
    }
    // Scene 3 (40-60%): Paper doll
    else if (t < 0.60) {
      const st = (t - 0.40) / 0.20;
      this._sceneDoll(st);
    }
    // Scene 4 (60-80%): Rhyme text
    else if (t < 0.80) {
      const st = (t - 0.60) / 0.20;
      this._sceneRhyme(st);
    }
    // Scene 5 (80-100%): About + fade
    else {
      const st = (t - 0.80) / 0.20;
      this._sceneAbout(st);
    }

    if (t >= 1) {
      this.running = false;
      this._cleanup();
      if (this.onComplete) this.onComplete();
    } else {
      requestAnimationFrame(() => this._loop());
    }
  }

  _drawLightning(x, y, len, angle, thickness) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = thickness;
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    let cx = 0, cy = 0;
    const segments = 8;
    for (let i = 0; i < segments; i++) {
      cx += len / segments + (Math.random() - 0.5) * len * 0.15;
      cy += len / segments;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    ctx.restore();
  }

  _sceneLightning(t) {
    const ctx = this.ctx;
    const cx = this.w / 2, cy = this.h / 2;

    // Dark background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, this.w, this.h);

    // Flash at beginning
    if (t < 0.15) {
      ctx.fillStyle = `rgba(255,255,255,${(0.15 - t) / 0.15 * 0.6})`;
      ctx.fillRect(0, 0, this.w, this.h);
    }

    // Draw lightning bolts
    this._drawLightning(cx - 60, cy - 80, 120, -0.2, 4);
    this._drawLightning(cx + 40, cy - 100, 110, 0.15, 3);

    // "⚡" text
    ctx.font = '48px sans-serif';
    ctx.fillStyle = '#ffcc00';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 30;
    ctx.fillText('⚡', cx, cy + 40);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#8888aa';
    ctx.fillText('閃電一擊', cx, cy + 90);
  }

  _sceneLogo(t) {
    const ctx = this.ctx;
    const cx = this.w / 2, cy = this.h / 2;
    const scale = Math.min(t * 2, 1);

    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Logo
    ctx.font = '100px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👺', 0, -20);

    // Title
    ctx.font = 'bold 42px sans-serif';
    const grad = ctx.createLinearGradient(-80, 0, 80, 0);
    grad.addColorStop(0, '#ff4444');
    grad.addColorStop(1, '#ff9900');
    ctx.fillStyle = grad;
    ctx.fillText('愛 打', 0, 60);

    ctx.restore();

    // Tagline
    if (t > 0.5) {
      const alpha = (t - 0.5) / 0.5;
      ctx.font = '16px sans-serif';
      ctx.fillStyle = `rgba(136,136,170,${alpha})`;
      ctx.textAlign = 'center';
      ctx.fillText('打者愛也 — 有打有愛', cx, cy + 120);
    }
  }

  _sceneDoll(t) {
    const ctx = this.ctx;
    const cx = this.w / 2, cy = this.h / 2;

    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, this.w, this.h);

    // Paper doll with floating effect
    const bobY = Math.sin(t * Math.PI * 4) * 10;
    const scale = Math.min(t * 2, 1);

    ctx.save();
    ctx.translate(cx, cy + bobY);
    ctx.scale(scale, scale);

    // Draw a simple paper doll
    const s = 30;
    ctx.fillStyle = '#FF4444';
    ctx.shadowColor = '#FF4444';
    ctx.shadowBlur = 15;

    // Head
    ctx.beginPath();
    ctx.arc(0, -s * 1.5, s * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillRect(-s * 0.4, -s * 0.8, s * 0.8, s * 1.2);

    // Arms
    ctx.fillRect(-s * 1.2, -s * 0.5, s * 0.8, s * 0.2);
    ctx.fillRect(s * 0.4, -s * 0.5, s * 0.8, s * 0.2);

    // Legs
    ctx.fillRect(-s * 0.35, s * 0.5, s * 0.3, s * 0.7);
    ctx.fillRect(s * 0.05, s * 0.5, s * 0.3, s * 0.7);

    ctx.shadowBlur = 0;
    ctx.restore();

    // Label
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#aaaacc';
    ctx.textAlign = 'center';
    ctx.fillText('傳統紙人', cx, cy + 80);
  }

  _sceneRhyme(t) {
    const ctx = this.ctx;
    const cx = this.w / 2, cy = this.h / 2;

    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, this.w, this.h);

    const alpha = Math.min(t * 2, 1);
    ctx.globalAlpha = alpha;

    const rhyme = '打你個小人頭，等你一世唔出頭';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#ff6666';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 10;

    // Display character by character
    const chars = Math.floor(t * rhyme.length);
    ctx.fillText(rhyme.substring(0, chars), cx, cy - 10);

    ctx.shadowBlur = 0;

    // Animated hands
    if (t > 0.3) {
      const handY = Math.sin(t * 8) * 5;
      ctx.font = '36px sans-serif';
      ctx.fillText('👊', cx - 50, cy + 50 + handY);
      ctx.fillText('👊', cx + 50, cy + 50 - handY);
    }

    ctx.globalAlpha = 1;
  }

  _sceneAbout(t) {
    const ctx = this.ctx;
    const cx = this.w / 2, cy = this.h / 2;

    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, this.w, this.h);

    const alpha = Math.min(t / 0.3, 1);
    ctx.globalAlpha = alpha;

    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = '#e8e8f0';
    ctx.textAlign = 'center';
    ctx.fillText('👺 愛打', cx, cy - 50);

    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#8888aa';
    ctx.fillText('香港傳統「打小人」社交娛樂平台', cx, cy);

    ctx.fillText('⚡ 閃電 × 快閃軟件客', cx, cy + 40);

    if (t > 0.6) {
      const ct = (t - 0.6) / 0.4;
      ctx.globalAlpha = Math.min(ct, 1);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#666688';
      ctx.fillText('點擊跳過 →', cx, cy + 90);
    }

    ctx.globalAlpha = 1;
  }
}
