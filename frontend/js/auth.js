/* ── Auth Module ── */
const TOKEN_KEY = 'aida_token';
const USER_KEY = 'aida_user';

const auth = {
  _token: null,
  _user: null,

  init() {
    this._token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try { this._user = JSON.parse(userStr); } catch (e) { this._user = null; }
    }
  },

  get token() { return this._token; },
  get user() { return this._user; },
  get isLoggedIn() { return !!this._token; },

  async register(username, password) {
    const res = await fetch(API_BASE + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || '註冊失敗');
    }
    const data = await res.json();
    this._save(data);
    return data;
  },

  async login(username, password) {
    const res = await fetch(API_BASE + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || '登入失敗');
    }
    const data = await res.json();
    this._save(data);
    return data;
  },

  logout() {
    this._token = null;
    this._user = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  _save(data) {
    this._token = data.access_token;
    this._user = { id: data.user_id, username: data.username };
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(this._user));
  },

  /** Fetch with auth header */
  async fetch(path, options = {}) {
    const headers = options.headers || {};
    if (this._token) {
      headers['Authorization'] = `Bearer ${this._token}`;
    }
    const res = await fetch(API_BASE + path, { ...options, headers });
    if (res.status === 401) {
      this.logout();
      app.showScreen('auth');
      throw new Error('Session expired');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Request failed');
    }
    return res.json();
  },
};
