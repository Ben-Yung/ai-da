/* ── Canvas Game Engine ── */
class GameEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.running = false;
    this.mode = 'beat';
    this.dollName = '小人';
    this.tool = 'slipper';
    this.difficulty = 'easy';
    this.timeLeft = 30;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.totalHits = 0;
    this.gameTip = '';
    this.gameTipAlpha = 0;
    this.totalMisses = 0;
    this.rhymeIndex = 0;

    this.doll = null;
    this.particles = [];
    this.screenShake = 0;
    this.paused = false;
    this.startTime = 0;
    this.lastHitTime = 0;
    this.comboWindow = 800; // ms for combo chain
    this.dollSize = 80;

    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.w = this.canvas.width;
    this.h = this.canvas.height;
  }

  start(mode, dollName, dollId, tool, difficulty) {
    this.mode = mode;
    this.dollName = dollName;
    this.dollId = dollId || 'traditional';
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
    this.pointerX = this.w / 2;
    this.pointerY = this.h / 2;

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
    this.gameTip = this.mode === 'beat' ? '👆 點擊紙人！' : '💕 點擊紙人送暖！';
    this.gameTipAlpha = 1;

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

        // Dying animation: shrink + fade
        if (this.dollState === 'dying') {
          this.dollDeathTimer += 16; // ~60fps
          const deathDuration = 400; // ms
          const progress = Math.min(this.dollDeathTimer / deathDuration, 1);
          const easeOut = 1 - Math.pow(1 - progress, 3);
          this.doll.dyingScale = 1 - easeOut * 0.9;
          this.doll.dyingAlpha = 1 - easeOut;
          if (progress >= 1) {
            this.dollState = 'dead';
            this._spawnDoll();
          }
        }
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
      bgGrad.addColorStop(0, '#2a1515');
      bgGrad.addColorStop(1, '#1a1a2e');
    } else {
      bgGrad.addColorStop(0, '#2a1525');
      bgGrad.addColorStop(1, '#1a1a2e');
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
    if (this.doll && this.dollState !== 'dead') {
      this._drawDoll(ctx, this.doll);
    }

    // Draw tool icon near pointer
    if (this.toolInfo && this.toolInfo.icon) {
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 8;
      ctx.fillText(this.toolInfo.icon, this.pointerX, this.pointerY - 36);
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    // Game tip overlay
    if (this.gameTip && this.gameTipAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = this.gameTipAlpha;
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 10;
      ctx.fillText(this.gameTip, this.w / 2, 120);
      ctx.restore();
      // fade out after 3s
      if (performance.now() - this.startTime > 3000) {
        this.gameTipAlpha -= 0.02;
      }
    }

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
    const baseSize = this.dollSize * this.params.size;
    const pulse = doll.pulse || 1;
    // Apply dying shrink
    const deathScale = doll.dyingScale !== undefined ? doll.dyingScale : 1;
    const deathAlpha = doll.dyingAlpha !== undefined ? doll.dyingAlpha : 1;

    const s = baseSize * pulse * deathScale;
    const x = doll.x, y = doll.y;
    const color = doll.color || '#FF4444';

    ctx.save();
    ctx.globalAlpha = deathAlpha;
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

    // Name on body (Fix 6)
    if (this.dollName) {
      ctx.font = `bold ${Math.max(10, s * 0.14)}px sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 4;
      ctx.fillText(this.dollName, 0, s * 0.25);
      ctx.shadowBlur = 0;
    }

    ctx.restore();

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

    this.pointerX = px;
    this.pointerY = py;

    this._checkHit(px, py);
  }

  _checkHit(px, py) {
    if (!this.doll) return;
    const r = this.dollSize * this.params.size;
    const dx = px - this.doll.x;
    const dy = py - this.doll.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const hitRadius = r + this.toolInfo.rangeVal * 10;

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
      this._toolHitEffect(px, py, this.tool);

      // Doll reaction
      if (this.mode === 'beat') {
        this.doll.hitReaction = 1;
      } else {
        this.doll.hugReaction = 1;
      }

      // Show next rhyme
      this._showRhyme();

      // Start dying animation instead of immediate respawn
      this.dollState = 'dying';
      this.dollDeathTimer = 0;

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

  _toolHitEffect(x, y, toolId) {
    const count = 12;
    switch (toolId) {
      case 'slipper':
        // 半圓扇形粒子（範圍大，多但分散）
        for (let i = 0; i < count * 2; i++) {
          const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
          const speed = 1 + Math.random() * 4;
          this.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1, decay: 0.025 + Math.random() * 0.03,
            color: ['#ffcc00','#ff8800','#ff4444'][i % 3],
            size: 3 + Math.random() * 6,
            type: 'hit',
          });
        }
        break;
      case 'stick':
        // 直線揮擊 spark（集中一條線）
        for (let i = 0; i < count + 4; i++) {
          const t = (i / count) * 2 - 1;
          const spread = 0.15;
          const vx = t * 5;
          const vy = (Math.random() - 0.5) * spread * 4;
          this.particles.push({
            x, y,
            vx, vy,
            life: 1, decay: 0.035,
            color: ['#ffffff','#ffffcc','#ffcc00'][i % 3],
            size: 2 + Math.random() * 3,
            type: 'spark',
          });
        }
        break;
      case 'pliers':
        // 精準 spark（集中細點，火花細密）
        for (let i = 0; i < count * 1.5; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.5 + Math.random() * 1.5;
          this.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1, decay: 0.04 + Math.random() * 0.04,
            color: ['#ff4444','#ff6600','#ffffff'][i % 3],
            size: 1.5 + Math.random() * 2.5,
            type: 'spark',
          });
        }
        break;
      case 'incense':
        // 圓形擴散火焰粒子（橙色/紅色，向外擴散）
        for (let i = 0; i < count + 8; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1 + Math.random() * 3.5;
          this.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            life: 1, decay: 0.02 + Math.random() * 0.025,
            color: ['#ff4400','#ff6600','#ffaa00','#ffcc33'][i % 4],
            size: 4 + Math.random() * 6,
            type: 'hit',
          });
        }
        // 煙霧效果
        for (let i = 0; i < 5; i++) {
          this.particles.push({
            x: x + (Math.random() - 0.5) * 10,
            y: y + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -1 - Math.random() * 0.5,
            life: 1, decay: 0.012,
            color: 'rgba(255,200,100,0.4)',
            size: 8 + Math.random() * 12,
            type: 'hit',
          });
        }
        break;
      case 'feather':
        // 輕柔羽毛飄散（慢速，粉紅色）
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.3 + Math.random() * 1.0;
          this.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.5,
            life: 1, decay: 0.015 + Math.random() * 0.015,
            color: ['#ffb6c1','#ff69b4','#ffc0cb','#fff0f5'][i % 4],
            size: 2 + Math.random() * 4,
            type: 'hit',
          });
        }
        break;
      case 'lipstick':
        // 心形擴散（紅色心 particles）
        for (let i = 0; i < count + 4; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1 + Math.random() * 2.5;
          this.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            life: 1, decay: 0.02 + Math.random() * 0.025,
            color: ['#ff1744','#d50000','#ff5252','#ff8a80'][i % 4],
            size: 4 + Math.random() * 5,
            type: 'hug',
          });
        }
        break;
      case 'rose':
        // 花瓣飄落（慢速旋轉 particle）
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.4 + Math.random() * 1.2;
          this.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.8,
            life: 1, decay: 0.012 + Math.random() * 0.012,
            color: ['#e91e63','#c2185b','#f06292','#ff80ab','#880e4f'][i % 5],
            size: 3 + Math.random() * 5,
            type: 'hit',
          });
        }
        break;
      default:
        // Fallback: generic particles
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1 + Math.random() * 3;
          this.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            life: 1, decay: 0.025,
            color: '#ffcc00',
            size: 3 + Math.random() * 4,
            type: 'hit',
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

    // Use the selected doll config
    const dollConfig = DOLLS.find(d => d.id === this.dollId) || DOLLS[0];

    this.doll = {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: dollConfig.color,
      pulse: 1,
      hitReaction: 0,
      hugReaction: 0,
    };
    this.dollState = 'alive'; // 'alive' | 'dying' | 'dead'
    this.dollDeathTimer = 0;
  }

  _showRhyme() {
    const rhymes = this.mode === 'beat' ? BEAT_RHYMES : HUG_RHYMES;
    const rhyme = rhymes[this.rhymeIndex % rhymes.length];
    const text = rhyme.replace(/\{name\}/g, this.dollName);
    const el = document.getElementById('hud-rhyme');
    el.textContent = text;
    // Re-trigger animation
    el.style.animation = 'none';
    el.offsetHeight; // force reflow
    el.style.animation = '';
    this.rhymeIndex++;

    // Speak the rhyme using TTS
    audio.speak(text);
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
