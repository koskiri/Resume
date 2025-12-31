// src/renderer/js/pages/auth.page.js
// Router-based pages: login + register (no prototype patching)

(() => {
  window.OnlyUsPages = window.OnlyUsPages || {};

  function ensureAuthMethods(app) {
  const P = app;
const S = window.OnlyUsStore;

  function apiBase() {
    return (S?.getApiUrl?.('http://localhost:3000') || 'http://localhost:3000').replace(/\/+$/, '');
  }

  async function apiFetch(path, opts = {}) {
    const url = apiBase() + path;
    const headers = Object.assign({ 'Content-Type': 'application/json' }, (opts.headers || {}));
    const access = S?.getTokens?.()?.access || null;
    if (access) headers['Authorization'] = `Bearer ${access}`;

    const res = await fetch(url, Object.assign({}, opts, { headers }));
    const ct = res.headers.get('content-type') || '';
    const payload = ct.includes('application/json')
      ? await res.json().catch(() => ({}))
      : await res.text().catch(() => '');

    if (!res.ok) {
      const msg = (payload && payload.message)
        ? payload.message
        : (typeof payload === 'string' && payload ? payload : `HTTP ${res.status}`);
      const err = new Error(msg);
      err.status = res.status;
      err.payload = payload;
      throw err;
    }
    return payload;
  }

  async function refreshIfNeeded() {
    const refresh = S?.getTokens?.()?.refresh || null;
    if (!refresh) return false;
    try {
      const data = await apiFetch('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: refresh })
      });
      if (data?.accessToken || data?.refreshToken) {
        S?.setTokens?.({ access: data?.accessToken, refresh: data?.refreshToken });
      }
      return !!data?.accessToken;
    } catch (e) {
      // refresh invalid -> wipe
      S?.clearTokens?.();
      S?.clearUser?.();
      return false;
    }
  }

  function normalizeMeToUser(me) {
    const username = me?.username || me?.name || '';
    const role = me?.role || 'user';
    const isAdmin = role === 'admin' || role === 'superadmin' || role === 'owner';

    return {
      name: username,
      email: me?.email || '',
      isAdmin,
      rememberPassword: !!(S?.getTokens?.()?.refresh),
      ramValue: (typeof P.ramValue === 'number' ? P.ramValue : 4),
      avatar: (username || 'Г').charAt(0).toUpperCase(),
      avatarImage: me?.avatarImage || null
    };
  }

  // ======================
  // UI pages
  // ======================
  P.getLoginPage = function () {
    return `
      <div class="auth-page">
        <div class="auth-wrapper">
          <div class="auth-box">
            <div class="auth-header">
              <h1 class="auth-main-title">Авторизация</h1>
            </div>

            <div class="auth-content">
              <div class="auth-form">
                <div class="form-group">
                  <label class="form-label">Логин</label>
                  <input type="text" class="form-input" id="loginUsername" placeholder="Введите логин">
                </div>

                <div class="form-group">
                  <label class="form-label">Пароль</label>
                  <input type="password" class="form-input" id="loginPassword" placeholder="Введите пароль">
                </div>

                <div class="auth-checkbox">
                  <input type="checkbox" id="rememberPassword">
                  <label for="rememberPassword" class="auth-checkbox-label">Сохранить пароль</label>
                </div>

                <button class="auth-button" id="loginBtn">Войти</button>
              </div>
            </div>

            <div class="auth-footer">
              <p class="auth-footer-text">
                Нет аккаунта?
                <a class="auth-link" id="goToRegister">Регистрация</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  P.initLoginPage = function () {
    const loginBtn = document.getElementById('loginBtn');
    const goToRegister = document.getElementById('goToRegister');
    const u = document.getElementById('loginUsername');
    const p = document.getElementById('loginPassword');
    const r = document.getElementById('rememberPassword');

    if (u) { u.disabled = false; u.readOnly = false; }
    if (p) { p.disabled = false; p.readOnly = false; p.value = ''; }
    if (loginBtn) { loginBtn.disabled = false; loginBtn.textContent = 'Войти'; }

    // Подставляем только логин (пароль не храним)
    try {
      const saved = S?.getUser?.() || null;
      if (saved?.name && u) u.value = saved.name;
    } catch (e) {}

    // Галочка = есть refreshToken
    if (r) r.checked = !!(S?.getTokens?.()?.refresh);

    loginBtn?.addEventListener('click', () => this.handleLogin());
    goToRegister?.addEventListener('click', () => this.showPage('register'));

    u?.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.handleLogin(); });
    p?.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.handleLogin(); });
  };

  P.getRegisterPage = function () {
    return `
      <div class="auth-page">
        <div class="auth-wrapper">
          <div class="auth-box register-box">
            <div class="auth-header">
              <h1 class="auth-main-title">Создать аккаунт</h1>
            </div>

            <div class="auth-content">
              <div class="auth-form">
                <div class="form-group">
                  <label class="form-label">Логин</label>
                  <input type="text" class="form-input" id="registerUsername" placeholder="Придумайте логин">
                </div>

                <div class="form-group">
                  <label class="form-label">Пароль</label>
                  <input type="password" class="form-input" id="registerPassword" placeholder="Придумайте пароль">
                </div>

                <div class="form-group">
                  <label class="form-label">Повторите пароль</label>
                  <input type="password" class="form-input" id="registerConfirmPassword" placeholder="Повторите пароль">
                </div>

                <div class="auth-divider"></div>

                <button class="auth-button" id="registerBtn">Регистрация</button>
              </div>
            </div>

            <div class="auth-footer">
              <p class="auth-footer-text">
                Уже есть аккаунт?
                <a class="auth-link" id="goToLogin">Войти</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  P.initRegisterPage = function () {
    const registerBtn = document.getElementById('registerBtn');
    const goToLogin = document.getElementById('goToLogin');

    registerBtn?.addEventListener('click', () => this.handleRegister());
    goToLogin?.addEventListener('click', () => this.showPage('login'));

    document.getElementById('registerConfirmPassword')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleRegister();
    });
  };

  // ======================
  // Server auth core
  // ======================
  P.fetchMe = async function () {
    try {
      const me = await apiFetch('/users/me', { method: 'GET' });
      const user = normalizeMeToUser(me);

      this.currentUser = user;
      this.isAuthenticated = true;
      this.isAdmin = !!user.isAdmin;

      try { S?.setUser?.(user); } catch (e) {}
      try { this.updateUserProfile?.(); } catch (e) {}
      return me;
    } catch (e) {
      if (e?.status === 401) {
        const ok = await refreshIfNeeded();
        if (ok) return this.fetchMe();
      }
      this.currentUser = null;
      this.isAuthenticated = false;
      this.isAdmin = false;
      try { S?.clearUser?.(); } catch (e2) {}
      try { this.updateUserProfile?.(); } catch (e2) {}
      return null;
    }
  };

  // Автологин только если есть refresh (то есть пользователь включал "Сохранить пароль")
  P.loadUserData = async function () {
    const refresh = S?.getTokens?.()?.refresh || null;

    if (!refresh) {
      // НЕТ "remember" — значит после перезапуска всегда на логин
      S?.clearTokens?.();
      S?.clearUser?.();
      this.currentUser = null;
      this.isAuthenticated = false;
      this.isAdmin = false;
      try { this.updateUserProfile?.(); } catch (e) {}
      return;
    }

    // refresh есть → восстановим access если нужно и подтянем /me
    if (!(S?.getTokens?.()?.access)) {
      await refreshIfNeeded();
    }
    if (S?.getTokens?.()?.access) {
      await this.fetchMe();
    } else {
      this.currentUser = null;
      this.isAuthenticated = false;
      this.isAdmin = false;
      try { this.updateUserProfile?.(); } catch (e) {}
    }
  };

  P.handleLogin = async function () {
    const username = (document.getElementById('loginUsername')?.value || '').trim();
    const password = (document.getElementById('loginPassword')?.value || '').trim();
    const remember = document.getElementById('rememberPassword')?.checked === true;

    if (!username || !password) {
      this.showNotification?.('Введите логин и пароль', 'error');
      return;
    }

    const btn = document.getElementById('loginBtn') || document.querySelector('.auth-button');
    const prev = btn?.textContent;

    try {
      if (btn) { btn.disabled = true; btn.textContent = 'Вход...'; }

      // ✅ ВАЖНО: login, а не register
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password, remember, rememberMe: remember })
      });

      // access/refresh → в store
      if (data?.accessToken || data?.refreshToken) {
        S?.setTokens?.({ access: data?.accessToken || null, refresh: remember ? (data?.refreshToken || null) : null });
      }
      if (!remember) {
        // без remember чистим refresh
        const cur = S?.getTokens?.() || {};
        S?.setTokens?.({ access: cur.access || null, refresh: null });
      }

      if (remember && !data?.refreshToken) {
        this.showNotification?.('Сервер не вернул refreshToken — автологин не будет работать', 'info');
      }

      await this.fetchMe();

      this.showNotification?.('Успешный вход', 'success');
      this.showPage('main');
    } catch (e) {
      this.showNotification?.(e.message || 'Ошибка входа', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = prev || 'Войти'; }
      const p = document.getElementById('loginPassword'); if (p) p.value = '';
    }
  };

  P.handleRegister = async function () {
    const username = (document.getElementById('registerUsername')?.value || '').trim();
    const password = (document.getElementById('registerPassword')?.value || '').trim();
    const confirm  = (document.getElementById('registerConfirmPassword')?.value || '').trim();

    if (!username || !password || !confirm) {
      this.showNotification?.('Заполните все поля', 'error');
      return;
    }
    if (username.length < 3) {
      this.showNotification?.('Логин должен быть минимум 3 символа', 'error');
      return;
    }
    if (password.length < 6) {
      this.showNotification?.('Пароль должен быть минимум 6 символов', 'error');
      return;
    }
    if (password !== confirm) {
      this.showNotification?.('Пароли не совпадают', 'error');
      return;
    }

    const btn = document.getElementById('registerBtn') || document.querySelector('.auth-button');
    const prev = btn?.textContent;

    try {
      if (btn) { btn.disabled = true; btn.textContent = 'Создание...'; }

      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      this.showNotification?.('Аккаунт создан! Теперь войдите под своими данными.', 'success');
      this.showPage('login');

      setTimeout(() => {
        const u = document.getElementById('loginUsername');
        if (u) u.value = username;
        document.getElementById('loginPassword')?.focus();
      }, 50);
    } catch (e) {
      this.showNotification?.(e.message || 'Ошибка регистрации', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = prev || 'Регистрация'; }
      const p = document.getElementById('registerPassword'); if (p) p.value = '';
      const c = document.getElementById('registerConfirmPassword'); if (c) c.value = '';
    }
  };

  P.logout = async function () {
    const refresh = S?.getTokens?.()?.refresh || null;
    try {
      if (refresh) {
        await apiFetch('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: refresh })
        });
      }
    } catch (e) {
      // ignore
    }

    S?.clearTokens?.();
    S?.clearUser?.();

    this.currentUser = null;
    this.isAuthenticated = false;
    this.isAdmin = false;

    try { this.updateUserProfile?.(); } catch (e) {}
    this.showPage?.('login');
  };

}


  function mount(app) {
    if (app.__authMounted) return;
    ensureAuthMethods(app);
    app.__authMounted = true;
  }

  window.OnlyUsPages.login = {
    mount,
    render(app) { mount(app); return app.getLoginPage(); },
    init(app) { mount(app); app.initLoginPage?.(); }
  };

  window.OnlyUsPages.register = {
    mount,
    render(app) { mount(app); return app.getRegisterPage(); },
    init(app) { mount(app); app.initRegisterPage?.(); }
  };
})();
