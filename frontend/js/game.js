/* ── Canvas Game Engine ── */
class GameEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.running = false;
    this.mode = 'beat';    // 'beat' or 'hug'
    this.dollName = '小人';
    this.tool = 'slipper';
    this.difficulty = 'easy';
    this.timeLeft = 30;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.totalHits = 0;
    this.totalMisses = 0;
    this.rhymeIndex = 0;

    this.doll = null;
    this.particles = [];
    this.screenShake = 0;
    this.paused = false;
    this.startTime = 0;
    this.lastHitTime = 0;
    this.comboWindow = 800; // ms for combo chain
    this.dollSize = 36;

    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.w = this.canvas.width;
    this.h = this.canvas.height;
  }

  start(mode, dollName, tool, difficulty) {
    this.mode = mode;
    this.dollName = dollName;
    this.tool = tool;
    this.difficulty = difficulty;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.totalHits = 0;
    this.totalMisses = 0;
    this.rhymeIndex = 0;
    this.timeLeft = 30;
    this.particles = [];
    this.screenShake = 0;
    this.paused = false;
    this.running = true;
    this.startTime = performance.now();
    this.lastHitTime = 0;

    // Set difficulty params
    const diffMap = {
      easy: { speed: 1.2, size: 1.2, spawnInterval: 2000 },
      medium: { speed: 1.8, size: 1.0, spawnInterval: 1400 },
      hard: { speed: 2.8, size: 0.8, spawnInterval: 900 },
    };
    this.params = diffMap[difficulty] || diffMap.easy;

    // Get tool info
    const toolList = mode === 'beat' ? TOOLS.beat : TOOLS.hug;
    this.toolInfo = toolList.find(t => t.id === tool) || toolList[0];

    // Spawn first doll
    this._spawnDoll();

    // Set theme class
    this.canvas.parentElement.classList.remove('beat-mode', 'hug-mode');
    this.canvas.parentElement.classList.add(mode + '-mode');

    // Show first rhyme
    this._showRhyme();

    // Start music beat
    audio.startBeat(mode);

    // Attach input events
    this._onPointerDown = (e) => this._handlePointer(e);
    this.canvas.addEventListener('mousedown', this._onPointerDown);
    this.canvas.addEventListener('touchstart', this._onPointerDown, { passive: true });

    this._loop();
  }

  stop() {
    this.running = false;
    audio.stopBeat();
    this.canvas.removeEventListener('mousedown', this._onPointerDown);
    this.canvas.removeEventListener('touchstart', this._onPointerDown);
  }

  togglePause() {
    this.paused = !this.paused;
  }

  // ── Core loop ──
  _loop() {
    if (!this.running) return;

    if (!this.paused) {
      const now = performance.now();
      const elapsed = (now - this.startTime) / 1000;
      this.timeLeft = Math.max(0, 30 - elapsed);

      // Update doll
      if (this.doll) {
        this.doll.x += this.doll.vx * this.params.speed;
        this.doll.y += this.doll.vy * this.params.speed;

        // Bounce off walls
        const r = this.dollSize * this.params.size;
        if (this.doll.x < r) { this.doll.x = r; this.doll.vx *= -1; }
        if (this.doll.x > this.w - r) { this.doll.x = this.w - r; this.doll.vx *= -1; }
        if (this.doll.y < r) { this.doll.y = r; this.doll.vy *= -1; }
        if (this.doll.y > this.h - r) { this.doll.y = this.h - r; this.doll.vy *= -1; }

        // Random movement changes
        if (Math.random() < 0.01 * this.params.speed) {
          const angle = Math.random() * Math.PI * 2;
          this.doll.vx = Math.cos(angle);
          this.doll.vy = Math.sin(angle);
        }

        // Doll pulse animation
        this.doll.pulse = (Math.sin(now / 300) * 0.1 + 0.9);
      }

      // Update particles
      this.particles = this.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.life -= p.decay;
        return p.life > 0;
      });

      // Screen shake decay
      if (this.screenShake > 0) this.screenShake *= 0.85;
      if (this.screenShake < 0.5) this.screenShake = 0;

      // Check game over
      if (this.timeLeft <= 0) {
        this._gameOver();
        return;
      }
    }

    this._render();
    requestAnimationFrame(() => this._loop());
  }

  _render() {
    const ctx = this.ctx;
    ctx.save();

    // Screen shake
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    // Background
    const bgGrad = ctx.createRadialGradient(this.w/2, this.h/2, 0, this.w/2, this.h/2, this.w/2);
    if (this.mode === 'beat') {
      bgGrad.addColorStop(0, '#1a0a0a');
      bgGrad.addColorStop(1, '#0d0d1a');
    } else {
      bgGrad.addColorStop(0, '#1a0a1a');
      bgGrad.addColorStop(1, '#0d0d1a');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.w, this.h);

    // Decorative background elements
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(this.w * Math.random(), this.h * Math.random(), 50 + Math.random() * 100, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Particles
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      if (p.type === 'hit') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'spark') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 10, p.y - p.vy * 10);
        ctx.stroke();
      } else if (p.type === 'hug') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 15;
        ctx.font = `${p.size * p.life * 1.5}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('💕', p.x, p.y);
      }
      ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1;

    // Draw doll
    if (this.doll) {
      this._drawDoll(ctx, this.doll);
    }

    ctx.restore();

    // Update HUD
    document.getElementById('hud-score').textContent = this.score;
    document.getElementById('hud-timer').textContent = Math.ceil(this.timeLeft);
    const comboEl = document.getElementById('hud-combo');
    comboEl.textContent = this.combo >= 2 ? `${this.combo}x` : '';
    if (this.combo >= 2) {
      comboEl.classList.add('active');
    } else {
      comboEl.classList.remove('active');
    }
  }

  _drawDoll(ctx, doll) {
    const s = this.dollSize * this.params.size * (doll.pulse || 1);
    const x = doll.x, y = doll.y;
    const color = doll.color || '#FF4444';

    ctx.save();
    ctx.translate(x, y);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.7, s * 0.7, s * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;

    // Body
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 2;

    // Head
    ctx.beginPath();
    ctx.arc(0, -s * 0.4, s * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#333';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(-s * 0.12, -s * 0.45, s * 0.06, 0, Math.PI * 2);
    ctx.arc(s * 0.12, -s * 0.45, s * 0.06, 0, Math.PI * 2);
    ctx.fill();

    // Mouth (reaction based on last hit)
    if (doll.hitReaction > 0) {
      // Hurt face
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -s * 0.3, s * 0.12, 0, Math.PI);
      ctx.stroke();
    } else if (doll.hugReaction > 0) {
      // Happy face
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -s * 0.3, s * 0.12, 0, -Math.PI);
      ctx.stroke();
    } else {
      // Neutral face
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-s * 0.1, -s * 0.32);
      ctx.lineTo(s * 0.1, -s * 0.32);
      ctx.stroke();
    }

    // Body
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = color;
    ctx.fillRect(-s * 0.2, -s * 0.05, s * 0.4, s * 0.5);

    // Arms
    ctx.fillRect(-s * 0.6, -0, s * 0.4, s * 0.1);
    ctx.fillRect(s * 0.2, 0, s * 0.4, s * 0.1);

    // Legs
    ctx.fillRect(-s * 0.18, s * 0.5, s * 0.16, s * 0.3);
    ctx.fillRect(s * 0.02, s * 0.5, s * 0.16, s * 0.3);

    ctx.shadowBlur = 0;
    ctx.restore();

    // Name tag
    if (this.dollName) {
      ctx.font = '12px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.textAlign = 'center';
      ctx.fillText(this.dollName, x, y + s + 16);
    }

    // Decay hit reaction
    if (doll.hitReaction > 0) doll.hitReaction -= 0.03;
    if (doll.hugReaction > 0) doll.hugReaction -= 0.03;
  }

  // ── Input handling ──
  _handlePointer(e) {
    if (!this.running || this.paused) return;
    const rect = this.canvas.getBoundingClientRect();
    let px, py;
    if (e.touches) {
      px = e.touches[0].clientX - rect.left;
      py = e.touches[0].clientY - rect.top;
      e.preventDefault();
    } else {
      px = e.clientX - rect.left;
      py = e.clientY - rect.top;
    }

    // Scale to canvas
    px *= (this.canvas.width / rect.width);
    py *= (this.canvas.height / rect.height);

    this._checkHit(px, py);
  }

  _checkHit(px, py) {
    if (!this.doll) return;
    const r = this.dollSize * this.params.size;
    const dx = px - this.doll.x;
    const dy = py - this.doll.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const hitRadius = r + this.toolInfo.rangeVal * 5;

    if (dist < hitRadius) {
      // HIT!
      this.totalHits++;
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;

      const now = performance.now();
      const comboBonus = Math.floor(this.combo * 1.5);
      const baseScore = this.mode === 'beat' ? 10 : 8;
      this.score += baseScore + comboBonus;

      // Screen shake
      this.screenShake = 8 + Math.min(this.combo, 10);

      // Sound
      if (this.mode === 'beat') {
        audio.playHit(0.3 + this.combo * 0.05);
      } else {
        audio.playHug(0.3 + this.combo * 0.05);
      }

      // Vibrate if supported
      if (navigator.vibrate) {
        navigator.vibrate(30 + Math.min(this.combo * 5, 50));
      }

      // Particles
      this._spawnHitParticles(px, py);

      // Doll reaction
      if (this.mode === 'beat') {
        this.doll.hitReaction = 1;
      } else {
        this.doll.hugReaction = 1;
      }

      // Show next rhyme
      this._showRhyme();

      // Respawn doll after hit
      this._spawnDoll();

      this.lastHitTime = now;
    } else {
      // MISS
      this.totalMisses++;
      this.combo = 0;
      audio.playMiss();
      if (navigator.vibrate) {
        navigator.vibrate(20);
      }
    }
  }

  _spawnHitParticles(x, y) {
    const count = 8 + Math.min(this.combo * 2, 20);
    const color = this.mode === 'beat' ? '#ff4444' : '#ff69b4';
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        decay: 0.02 + Math.random() * 0.03,
        color: i % 3 === 0 ? '#ffcc00' : color,
        size: 3 + Math.random() * 5,
        type: Math.random() > 0.5 ? 'hit' : 'spark',
      });
    }

    // Hug mode: hearts
    if (this.mode === 'hug') {
      for (let i = 0; i < 3; i++) {
        this.particles.push({
          x: x + (Math.random() - 0.5) * 20,
          y: y + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 2,
          vy: -2 - Math.random() * 2,
          life: 1,
          decay: 0.015,
          color: '#ff69b4',
          size: 12 + Math.random() * 10,
          type: 'hug',
        });
      }
    }
  }

  _spawnDoll() {
    const margin = this.dollSize * this.params.size + 20;
    const x = margin + Math.random() * (this.w - margin * 2);
    const y = margin + Math.random() * (this.h - margin * 2 - 60);

    const angle = Math.random() * Math.PI * 2;
    const speed = 0.4 + Math.random() * 0.6;

    // Pick a random doll color
    const doll = DOLLS[Math.floor(Math.random() * DOLLS.length)];

    this.doll = {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: doll.color,
      pulse: 1,
      hitReaction: 0,
      hugReaction: 0,
    };
  }

  _showRhyme() {
    const rhymes = this.mode === 'beat' ? BEAT_RHYMES : HUG_RHYMES;
    const rhyme = rhymes[this.rhymeIndex % rhymes.length];
    const el = document.getElementById('hud-rhyme');
    el.textContent = rhyme.replace(/\{name\}/g, this.dollName);
    // Re-trigger animation
    el.style.animation = 'none';
    el.offsetHeight; // force reflow
    el.style.animation = '';
    this.rhymeIndex++;
  }

  _gameOver() {
    this.running = false;
    audio.stopBeat();

    const win = this.score > 0;
    const resultIcon = document.getElementById('result-icon');
    const resultTitle = document.getElementById('result-title');

    // Play result sound
    audio.playResult(win);

    if (this.mode === 'beat') {
      if (win) {
        resultIcon.textContent = '🎉';
        resultTitle.textContent = '打得好！';
      } else {
        resultIcon.textContent = '😤';
        resultTitle.textContent = '唔夠力⋯';
      }
    } else {
      if (win) {
        resultIcon.textContent = '💕';
        resultTitle.textContent = '抱得好！';
      } else {
        resultIcon.textContent = '😢';
        resultTitle.textContent = '要再抱多啲⋯';
      }
    }

    document.getElementById('result-score').textContent = this.score;
    document.getElementById('result-combo').textContent = this.maxCombo;

    // Show result
    document.getElementById('game-result').classList.remove('hidden');

    // Save session to backend
    this._saveSession(win ? 'win' : 'lose');
  }

  async _saveSession(result) {
    try {
      await auth.fetch('/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: this.mode,
          tool: this.tool,
          difficulty: this.difficulty,
          score: this.score,
          combo: this.maxCombo,
          result,
        }),
      });
    } catch (e) {
      console.warn('Failed to save session:', e);
    }
  }
}
