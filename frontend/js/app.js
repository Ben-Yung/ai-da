/* ── Main App Controller ── */
const app = {
  currentScreen: null,
  gameMode: 'beat',
  gameEngine: null,
  splash: null,
  audioEnabled: true,
  musicEnabled: true,

  init() {
    auth.init();
    audio.enable();

    this.gameEngine = new GameEngine('game-canvas');
    this.splash = new SplashAnimation('splash-canvas');

    // Bind navigation
    document.querySelectorAll('.btn-back').forEach(el => {
      el.addEventListener('click', () => {
        this.showScreen(el.dataset.back);
      });
    });

    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(el => {
      el.addEventListener('click', () => this._switchAuthTab(el.dataset.tab));
    });

    // Login form
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this._handleLogin();
    });

    // Register form
    document.getElementById('register-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this._handleRegister();
    });

    // Home card clicks
    document.querySelectorAll('.home-card').forEach(el => {
      el.addEventListener('click', () => {
        const page = el.dataset.page;
        if (page === 'beat' || page === 'hug') {
          this._startPreScreen(page);
        } else if (page === 'history') {
          this.showScreen('history');
        } else if (page === 'records') {
          this.showScreen('records');
          this._loadRecords();
        } else if (page === 'settings') {
          this.showScreen('settings');
        }
      });
    });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', () => this._logout());
    document.getElementById('btn-settings-logout').addEventListener('click', () => this._logout());

    // Start game button
    document.getElementById('btn-start-game').addEventListener('click', () => this._startGame());

    // Game result buttons
    document.getElementById('result-replay').addEventListener('click', () => {
      document.getElementById('game-result').classList.add('hidden');
      document.getElementById('game-prescreen').classList.remove('hidden');
      this.showScreen('game-prescreen');
    });
    document.getElementById('result-home').addEventListener('click', () => {
      this.showScreen('home');
    });

    // Pause button
    document.getElementById('btn-pause').addEventListener('click', () => {
      if (this.gameEngine) {
        this.gameEngine.togglePause();
      }
    });

    // Settings
    document.getElementById('setting-sound').addEventListener('change', (e) => {
      audio.soundEnabled = e.target.checked;
    });
    document.getElementById('setting-music').addEventListener('change', (e) => {
      audio.musicEnabled = e.target.checked;
    });

    // Record tabs
    document.querySelectorAll('.record-tab').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.record-tab').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
        this._loadRecords();
      });
    });

    // Decide entry point
    if (auth.isLoggedIn) {
      this._enterFromSplash('home');
    } else {
      this._enterFromSplash('auth');
    }
  },

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const el = document.getElementById(screenId + '-screen');
    if (el) el.classList.remove('hidden');
    this.currentScreen = screenId;
  },

  _enterFromSplash(targetScreen) {
    const splashSeen = sessionStorage.getItem('splash_seen');
    if (splashSeen) {
      this.showScreen(targetScreen);
      return;
    }

    document.getElementById('splash-screen').classList.remove('hidden');
    document.querySelectorAll('.screen').forEach(s => {
      if (s.id !== 'splash-screen') s.classList.add('hidden');
    });

    this.splash.start(() => {
      sessionStorage.setItem('splash_seen', 'true');
      document.getElementById('splash-screen').classList.add('hidden');
      this.showScreen(targetScreen);
    });
  },

  _switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');
    document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
    document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
  },

  async _handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    errEl.textContent = '';

    try {
      await auth.login(username, password);
      this._enterFromSplash('home');
    } catch (e) {
      errEl.textContent = e.message;
    }
  },

  async _handleRegister() {
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const errEl = document.getElementById('register-error');
    errEl.textContent = '';

    if (password.length < 4) {
      errEl.textContent = '密碼最少 4 位';
      return;
    }

    try {
      await auth.register(username, password);
      this._enterFromSplash('home');
    } catch (e) {
      errEl.textContent = e.message;
    }
  },

  _logout() {
    auth.logout();
    this.showScreen('auth');
  },

  _startPreScreen(mode) {
    this.gameMode = mode;
    this.showScreen('game-prescreen');

    // Set title
    document.getElementById('prescreen-title').textContent =
      mode === 'beat' ? '👊 打小人' : '💕 愛的抱抱';

    // Populate dolls
    const dollGrid = document.getElementById('doll-select');
    dollGrid.innerHTML = '';
    DOLLS.forEach((doll, i) => {
      const el = document.createElement('div');
      el.className = 'doll-option' + (i === 0 ? ' selected' : '');
      el.innerHTML = `<span class="doll-color" style="background:${doll.color}"></span><br>${doll.name}`;
      el.dataset.dollId = doll.id;
      el.addEventListener('click', () => {
        dollGrid.querySelectorAll('.doll-option').forEach(d => d.classList.remove('selected'));
        el.classList.add('selected');
      });
      dollGrid.appendChild(el);
    });

    // Populate tools
    const toolGrid = document.getElementById('tool-select');
    toolGrid.innerHTML = '';
    const tools = mode === 'beat' ? TOOLS.beat : TOOLS.hug;
    tools.forEach((tool, i) => {
      const el = document.createElement('div');
      el.className = 'tool-option' + (i === 0 ? ' selected' : '');
      el.textContent = tool.icon + ' ' + tool.name;
      el.dataset.toolId = tool.id;
      el.addEventListener('click', () => {
        toolGrid.querySelectorAll('.tool-option').forEach(t => t.classList.remove('selected'));
        el.classList.add('selected');

        if (mode === 'beat' && tool.id === 'pliers') {
          // High power indicator
        }
      });
      toolGrid.appendChild(el);
    });

    // Difficulty buttons
    document.querySelectorAll('.diff-btn').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(d => d.classList.remove('active'));
        el.classList.add('active');
      });
    });

    // Set default doll name
    const defaultName = mode === 'beat' ? '小人' : '寶貝';
    document.getElementById('doll-name-input').value = defaultName;
  },

  _startGame() {
    const selectedDoll = document.querySelector('.doll-option.selected');
    const selectedTool = document.querySelector('.tool-option.selected');
    const selectedDiff = document.querySelector('.diff-btn.active');

    const dollName = document.getElementById('doll-name-input').value.trim() || '小人';

    // Save doll name to backend
    if (auth.isLoggedIn && selectedDoll) {
      auth.fetch('/doll-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doll_id: selectedDoll.dataset.dollId,
          custom_name: dollName,
        }),
      }).catch(() => {});
    }

    // Hide game result if visible
    document.getElementById('game-result').classList.add('hidden');

    // Start the engine
    this.showScreen('game');
    this.gameEngine.start(
      this.gameMode,
      dollName,
      selectedTool ? selectedTool.dataset.toolId : 'slipper',
      selectedDiff ? selectedDiff.dataset.diff : 'easy',
    );
  },

  async _loadRecords() {
    const activeTab = document.querySelector('.record-tab.active');
    const mode = activeTab ? activeTab.dataset.tab : 'beat';

    // Leaderboard
    const lbEl = document.getElementById('leaderboard-list');
    lbEl.innerHTML = '載入中...';

    try {
      const lb = await auth.fetch(`/sessions/top?mode=${mode}&limit=10`);
      if (lb.length === 0) {
        lbEl.innerHTML = '<p style="color:#888">暫無記錄</p>';
      } else {
        lbEl.innerHTML = '<div class="sessions-list">' +
          lb.map(r => `
            <div class="session-row">
              <span class="rank">#${r.rank}</span>
              <span class="name">${r.username}</span>
              <span class="score">${r.score}分</span>
              <span class="combo">${r.combo}x</span>
            </div>
          `).join('') + '</div>';
      }
    } catch (e) {
      lbEl.innerHTML = '<p style="color:#ff4444">載入失敗</p>';
    }

    // My sessions
    const myEl = document.getElementById('my-sessions-list');
    myEl.innerHTML = '載入中...';

    try {
      const sessions = await auth.fetch('/sessions?limit=20');
      if (sessions.length === 0) {
        myEl.innerHTML = '<p style="color:#888">未有記錄，去玩一場啦！</p>';
      } else {
        const filtered = sessions.filter(s => s.mode === mode);
        if (filtered.length === 0) {
          myEl.innerHTML = `<p style="color:#888">未有${mode === 'beat' ? '打小人' : '抱抱'}記錄</p>`;
        } else {
          myEl.innerHTML = '<div class="sessions-list">' +
            filtered.map(s => `
              <div class="session-row">
                <span class="score">${s.score}分</span>
                <span class="combo">${s.combo}x</span>
                <span class="date">${new Date(s.played_at).toLocaleDateString('zh-HK')}</span>
              </div>
            `).join('') + '</div>';
        }
      }
    } catch (e) {
      myEl.innerHTML = '<p style="color:#ff4444">載入失敗</p>';
    }
  },
};

// ── Bootstrap ──
document.addEventListener('DOMContentLoaded', () => app.init());
