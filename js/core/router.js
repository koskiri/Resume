// src/renderer/js/core/router.js
// Шаг 3: Router (routes-map) без switch-case и без prototype patching.
// Страницы регистрируются в window.OnlyUsPages.<page> = { mount?, render(app), init?(app) }.

(() => {
  const ROUTES = {
    login:    { page: 'login',    sidebar: false },
    register: { page: 'register', sidebar: false },
    main:     { page: 'main',     sidebar: true  },
    news:     { page: 'news',     sidebar: true  },
    settings: { page: 'settings', sidebar: true  },
    account:  { page: 'account',  sidebar: true  },
    admin:    { page: 'admin',    sidebar: true  }
  };

  function setActiveNav(page) {
    document.querySelectorAll('.nav-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.page === page);
    });
  }

  function getModule(pageKey) {
    return window.OnlyUsPages && window.OnlyUsPages[pageKey];
  }

  function ensureMounted(app, mod, pageKey) {
    app.__mountedPages = app.__mountedPages || new Set();
    if (app.__mountedPages.has(pageKey)) return;
    try { mod?.mount?.(app); } catch (e) { console.warn('[mount]', pageKey, e); }
    app.__mountedPages.add(pageKey);
  }

  window.OnlyUsRouter = {
    routes: ROUTES,

    go(app, page) {
      const def = ROUTES[page] || ROUTES.login;
      const pageKey = def.page;
      const mod = getModule(pageKey);

      const content = document.getElementById('content');
      const sidebar = document.getElementById('sidebar');
      if (!content || !sidebar) return;

      // Guards
      if (pageKey === 'admin' && !app.isAdmin) {
        try { app.ui?.notify?.('Недостаточно прав', 'error'); } catch (e) {}
        return this.go(app, 'main');
      }
      if ((pageKey === 'account' || pageKey === 'settings') && !app.isAuthenticated) {
        try { app.ui?.notify?.('Сначала войдите в аккаунт', 'info'); } catch (e) {}
        return this.go(app, 'login');
      }

      sidebar.style.display = def.sidebar ? 'flex' : 'none';
      setActiveNav(page);

      if (!mod || typeof mod.render !== 'function') {
        const nf = document.createElement('div');
nf.style.padding = '20px';
nf.textContent = `Страница "${page}" не найдена`;
content.replaceChildren(nf);
        app.currentPage = page;
        return;
      }

      ensureMounted(app, mod, pageKey);

      // Render
      try {
        content.innerHTML = mod.render(app);
      } catch (e) {
        console.error('[render error]', pageKey, e);
        content.innerHTML = `
          <div style="padding:20px">
            <div style="font-weight:700;margin-bottom:8px">Ошибка</div>
            <div style="color:#6B7280;margin-bottom:12px">${(window.OnlyUsUI?.escapeHtml || (x=>String(x??"")))(String(e.message || e))}</div>
            <button id="backToMainBtn" style="padding:10px 16px;border-radius:8px;border:1px solid #E5E7EB;background:#fff;cursor:pointer">На главную</button>
          </div>
        `;
        document.getElementById('backToMainBtn')?.addEventListener('click', () => this.go(app, 'main'));
        app.currentPage = page;
        return;
      }

      // Init
      try { mod.init?.(app); } catch (e) { console.warn('[init]', pageKey, e); }

      // Common refresh
      try { app.updateUserProfile?.(); } catch (e) {}

      app.currentPage = page;
    }
  };
})();
