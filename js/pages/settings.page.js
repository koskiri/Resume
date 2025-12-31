// src/renderer/js/pages/settings.page.js
// Router pages: settings (RAM) + account

(() => {
  window.OnlyUsPages = window.OnlyUsPages || {};

  const getStore = () => window.OnlyUsStore;

  // ===============================
  // SETTINGS (RAM)
  // ===============================
  function renderSettings(app) {
    const store = getStore();
    const value = (store?.getRam?.(app.ramValue || 4)) ?? (app.ramValue || 4);

    return `
      <div class="page-header">
        <h1 class="page-title">Настройки</h1>
        <p class="page-subtitle">Выделение памяти для Minecraft</p>
      </div>

      <div class="settings-card">
        <div class="ram-slider-container">
          <div class="ram-slider-header">
            <span class="ram-label">RAM</span>
            <span class="ram-value"><span id="ramValue">${value}</span> GB</span>
          </div>

          <input
            type="range"
            min="2"
            max="16"
            step="1"
            value="${value}"
            class="ram-slider"
            id="ramSlider"
          />

          <div class="ram-steps">
            <span class="ram-step">2 GB</span>
            <span class="ram-step">4 GB</span>
            <span class="ram-step">8 GB</span>
            <span class="ram-step">16 GB</span>
          </div>
        </div>
      </div>
    `;
  }

  function initSettings(app) {
    const slider = document.getElementById('ramSlider');
    const valueEl = document.getElementById('ramValue');
    if (!slider || !valueEl) return;

    slider.addEventListener('input', () => {
      const val = Number(slider.value);
      app.ramValue = val;
      valueEl.textContent = String(val);
      getStore()?.setRam?.(val);
      try { app.saveUserData?.(); } catch (e) {}
    });
  }

  // ===============================
  // ACCOUNT
  // ===============================
  const API_URL_FALLBACK = 'http://localhost:3000';

  function apiBase() {
    return (getStore()?.getApiUrl?.(API_URL_FALLBACK) || API_URL_FALLBACK).replace(/\/+$/, '');
  }

  async function apiFetch(path, opts = {}) {
    const url = apiBase() + path;
    const headers = Object.assign({ 'Content-Type': 'application/json' }, (opts.headers || {}));
    const t = getStore()?.getTokens?.();
    if (t?.access) headers['Authorization'] = `Bearer ${t.access}`;

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

  function renderAccount(app) {
    const u = app.currentUser || {};
    const isAuthed = !!app.isAuthenticated;
    const isAdmin = !!(app.isAdmin || u.isAdmin || u.role === 'admin');

    const name = (u.name || u.username || 'Гость');
    const avatarLetter = (u.avatar || name || 'Г').charAt(0).toUpperCase();
    const avatar = u.avatarImage
      ? `<img src="${u.avatarImage}" alt="${name}">`
      : avatarLetter;

    const telegramLinked = !!(app.accountSettings?.socialConnections?.telegram);
    const discordLinked  = !!(app.accountSettings?.socialConnections?.discord);

    return `
      <div class="account-page">
        <div class="page-header">
          <h1 class="page-title">Аккаунт</h1>
          <p class="page-subtitle">Профиль • Безопасность • Привязки</p>
        </div>

        <div class="settings-card">
          <div class="account-profile">
            <div class="avatar account-avatar">${avatar}</div>

            <div class="account-meta">
              <div class="account-name">${name}</div>
              <div class="account-role">
                Роль: <span class="account-role-badge ${isAdmin ? 'is-admin' : ''}">${isAdmin ? 'Администратор' : (isAuthed ? 'Игрок' : 'Гость')}</span>
              </div>
            </div>

            <div class="account-actions">
              <button class="btn btn-secondary" id="accountChangeAvatarBtn">Сменить аватар</button>
            </div>
          </div>
        </div>

        <div class="settings-card">
          <div class="account-section-header">
            <div class="account-section-icon">🔒</div>
            <div class="account-section-titles">
              <div class="account-section-title">Смена пароля</div>
              <div class="account-section-subtitle">Обновите пароль для защиты аккаунта</div>
            </div>
          </div>

          <div class="auth-form" style="margin-bottom:0;">
            <div class="form-group">
              <label class="form-label">Текущий пароль</label>
              <input type="password" class="form-input account-input" id="cpOld" placeholder="Текущий пароль" autocomplete="current-password">
            </div>

            <div class="form-group">
              <label class="form-label">Новый пароль</label>
              <input type="password" class="form-input account-input" id="cpNew" placeholder="Введите новый пароль" autocomplete="new-password">
            </div>

            <div class="form-group">
              <label class="form-label">Повторите новый пароль</label>
              <input type="password" class="form-input account-input" id="cpNew2" placeholder="Повторите новый пароль" autocomplete="new-password">
            </div>
          </div>

          <div style="margin-top: 12px;">
            <button class="btn btn-primary" id="changePasswordBtn">Сменить пароль</button>
          </div>
        </div>

        <div class="settings-card">
          <div class="account-section-header">
            <div class="account-section-icon">🔗</div>
            <div class="account-section-titles">
              <div class="account-section-title">Привязки</div>
              <div class="account-section-subtitle">Пока работает как “витрина” — подключим позже</div>
            </div>
          </div>

          <div class="social-connections">
            <div class="social-connection">
              <div class="social-info">
                <div class="social-icon telegram">✈️</div>
                <div class="social-details">
                  <h4>Telegram</h4>
                  <p>Статус: <b style="color:#111827;">${telegramLinked ? 'подключён' : 'не подключён'}</b></p>
                </div>
              </div>
              <div class="social-action">
                <button class="btn btn-secondary" id="tgLinkBtn" disabled>${telegramLinked ? 'Отключить' : 'Подключить'}</button>
              </div>
            </div>

            <div class="social-connection">
              <div class="social-info">
                <div class="social-icon discord">🎮</div>
                <div class="social-details">
                  <h4>Discord</h4>
                  <p>Статус: <b style="color:#111827;">${discordLinked ? 'подключён' : 'не подключён'}</b></p>
                </div>
              </div>
              <div class="social-action">
                <button class="btn btn-secondary" id="dcLinkBtn" disabled>${discordLinked ? 'Отключить' : 'Подключить'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function initAccount(app) {
    if (!app.isAuthenticated) {
      app.showNotification?.('Сначала войдите в аккаунт', 'info');
      app.showPage('login');
      return;
    }

    document.getElementById('accountChangeAvatarBtn')?.addEventListener('click', () => {
      if (typeof app.openAvatarUpload === 'function') app.openAvatarUpload();
      else app.showNotification?.('Загрузка аватара не подключена', 'error');
    });

    document.getElementById('changePasswordBtn')?.addEventListener('click', async () => {
      const oldPassword = String(document.getElementById('cpOld')?.value || '');
      const newPassword = String(document.getElementById('cpNew')?.value || '');
      const newPassword2 = String(document.getElementById('cpNew2')?.value || '');

      if (!oldPassword || !newPassword || !newPassword2) {
        app.showNotification?.('Заполните все поля', 'error');
        return;
      }
      if (newPassword !== newPassword2) {
        app.showNotification?.('Пароли не совпадают', 'error');
        return;
      }
      const btn = document.getElementById('changePasswordBtn');
      const prev = btn?.textContent;
      if (btn) { btn.disabled = true; btn.textContent = 'Смена пароля...'; }

      try {
        await apiFetch('/auth/change-password', {
          method: 'POST',
          body: JSON.stringify({ oldPassword, newPassword })
        });
        app.showNotification?.('Пароль успешно изменён', 'success');
        document.getElementById('cpOld').value = '';
        document.getElementById('cpNew').value = '';
        document.getElementById('cpNew2').value = '';
      } catch (e) {
        app.showNotification?.(e.message || 'Не удалось сменить пароль', 'error');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = prev || 'Сменить пароль'; }
      }
    });

    // Привязки пока не активны
    const hint = () => app.showNotification?.('Привязка будет подключена позже (пока только UI)', 'info');
    document.getElementById('tgLinkBtn')?.addEventListener('click', hint);
    document.getElementById('dcLinkBtn')?.addEventListener('click', hint);
  }

  // register pages
  window.OnlyUsPages.settings = {
    render: renderSettings,
    init: initSettings,
  };

  window.OnlyUsPages.account = {
    render: renderAccount,
    init: initAccount,
  };
})();
