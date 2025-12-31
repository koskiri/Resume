// Router-based page: main (servers/play)
// No prototype patching. All logic lives in this module.

(() => {
  window.OnlyUsPages = window.OnlyUsPages || {};

  function getStore(app) {
    return app?.store || window.OnlyUsStore || null;
  }

  function getServers(app) {
    const S = getStore(app);
    try {
      const s = S?.getServers?.();
      return (s && typeof s === 'object') ? s : {};
    } catch (e) {
      return {};
    }
  }

  function getMods(app) {
    const S = getStore(app);
    try {
      const m = S?.getMods?.();
      return Array.isArray(m) ? m : [];
    } catch (e) {
      return [];
    }
  }

  function getServerModsText(app, serverId) {
    const mods = getMods(app);
    const serverMods = mods.filter(mod => mod?.servers && Array.isArray(mod.servers) && mod.servers.includes(serverId));
    if (serverMods.length > 0) {
      return serverMods.map(mod => `${mod.name || ''} ${mod.required ? '⚡' : ''}`.trim()).filter(Boolean).join(', ');
    }
    return serverId === 'hitech' ? 'Hi-Tech сборка' : 'Нет модов';
  }

  function render(app) {
    const servers = getServers(app);

    return `
      <div class="page-header">
        <h1 class="page-title">Выберите сервер</h1>
        <p class="page-subtitle">Подключитесь к любимому серверу</p>
      </div>

      <div class="servers-grid">
        <!-- Сервер Vanilla -->
        <div class="server-card">
          <div class="server-image-container">
            ${servers.vanilla?.image
              ? `<img src="${servers.vanilla.image}" alt="${servers.vanilla.name || ''}" class="server-image" id="vanillaImage">`
              : `<div class="server-image-fallback vanilla">${servers.vanilla?.badge || 'VANILLA'}</div>`
            }
            <div class="server-badge">${servers.vanilla?.badge || 'Classic'}</div>
            ${servers.vanilla?.launcherOnly ? '<div class="launcher-only-badge">🔒 OnlyUs</div>' : ''}
          </div>

          <div class="server-content">
            <div class="server-header">
              <h2 class="server-title">${servers.vanilla?.name || 'Minecraft Vanilla'}</h2>
              <div class="server-stats">
                <div class="stat-item">
                  <span class="stat-value" id="vanillaPlayers">${servers.vanilla?.players || '—'}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value" id="vanillaPing" style="color:#10B981;">${servers.vanilla?.ping || '—'}</span>
                </div>
              </div>
            </div>

            <div class="server-info">
              <div class="info-row">
                <span class="info-label">Версия игры:</span>
                <span class="info-value">${servers.vanilla?.version || '1.7.10'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Моды:</span>
                <span class="info-value" style="font-size:13px; line-height:1.4;">
                  ${getServerModsText(app, 'vanilla')}
                </span>
              </div>
            </div>

            <p class="server-description">
              ${servers.vanilla?.description || 'Классический Minecraft без модов.'}
            </p>

            <div class="server-footer">
              <div class="version-badge">${servers.vanilla?.version || '1.7.10'}</div>
              <button class="play-btn" data-server="vanilla">
                <span>▶</span>
                Играть
              </button>
            </div>
          </div>
        </div>

        <!-- Сервер Hi-Tech -->
        <div class="server-card">
          <div class="server-image-container">
            ${servers.hitech?.image
              ? `<img src="${servers.hitech.image}" alt="${servers.hitech.name || ''}" class="server-image" id="hitechImage">`
              : `<div class="server-image-fallback hitech">${servers.hitech?.badge || 'HI-TECH'}</div>`
            }
            <div class="server-badge">${servers.hitech?.badge || 'Hi-Tech'}</div>
            ${servers.hitech?.launcherOnly ? '<div class="launcher-only-badge">🔒 OnlyUs</div>' : ''}
          </div>

          <div class="server-content">
            <div class="server-header">
              <h2 class="server-title">${servers.hitech?.name || 'Minecraft Hi-Tech'}</h2>
              <div class="server-stats">
                <div class="stat-item">
                  <span class="stat-value" id="hitechPlayers">${servers.hitech?.players || '—'}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value" id="hitechPing" style="color:#10B981;">${servers.hitech?.ping || '—'}</span>
                </div>
              </div>
            </div>

            <div class="server-info">
              <div class="info-row">
                <span class="info-label">Версия игры:</span>
                <span class="info-value">${servers.hitech?.version || '1.7.10'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Моды:</span>
                <span class="info-value" style="font-size:13px; line-height:1.4;">
                  ${getServerModsText(app, 'hitech')}
                </span>
              </div>
            </div>

            <p class="server-description">
              ${servers.hitech?.description || 'Minecraft с модами: Industrial Craft, BuildCraft, Applied Energistics и другие.'}
            </p>

            <div class="server-footer">
              <div class="version-badge">${servers.hitech?.version || '1.7.10'} + моды</div>
              <button class="play-btn" data-server="hitech">
                <span>▶</span>
                Играть
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function init(app) {
    // подтягиваем server-first данные один раз
    if (!app.__mainDataFetched) {
      app.__mainDataFetched = true;
      try { await (window.OnlyUsStore?.fetchServers?.()); } catch (e) {}
      try { await (window.OnlyUsStore?.fetchMods?.()); } catch (e) {}
      // перерисуем, если пользователь всё ещё на главной
      try { if (app.currentPage === 'main') app.showPage('main'); } catch (e) {}
    }

    // подписки на прогресс/статусы ставим один раз
    if (!app._mcListenersReady) {
      app._mcListenersReady = true;

      app._mc = {
        activeBtn: null,
        originalHtml: null,
        dotsTimer: null,
        dots: 0
      };

      const stopDots = () => {
        if (app._mc.dotsTimer) {
          clearInterval(app._mc.dotsTimer);
          app._mc.dotsTimer = null;
        }
      };

      // status log (optional)
      window.electronAPI?.on?.updateStatus?.((line) => {
        console.log('[STATUS]', line);
      });

      // download progress
      window.electronAPI?.on?.downloadProgress?.((p) => {
        const btn = app._mc.activeBtn;
        if (!btn) return;

        const file = (p?.file || '').split(/[\\/]/).pop();
        const percent = (typeof p?.percent === 'number' && !Number.isNaN(p.percent)) ? p.percent : null;

        if (percent !== null) {
          stopDots();
          const safe = Math.max(0, Math.min(100, Math.floor(percent)));
          btn.innerHTML = `<div class="loading-spinner small"></div> Скачивание... ${safe}%`;
          return;
        }

        if (!app._mc.dotsTimer) {
          app._mc.dots = 0;
          app._mc.dotsTimer = setInterval(() => {
            const b = app._mc.activeBtn;
            if (!b) return;
            app._mc.dots = (app._mc.dots + 1) % 4;
            const dotsStr = '.'.repeat(app._mc.dots);
            const filePart = file ? ` (${file})` : '';
            b.innerHTML = `<div class="loading-spinner small"></div> Скачивание${dotsStr}${filePart}`;
          }, 350);
        }
      });

      app._mcStopDots = stopDots;
    }

    // bind play buttons
    document.querySelectorAll('.play-btn').forEach((btn) => {
      // avoid double-binding on re-render
      if (btn.__onlyusBound) return;
      btn.__onlyusBound = true;

      btn.addEventListener('click', async (e) => {
        const serverId = e.currentTarget?.dataset?.server;
        const servers = getServers(app);
        const serverName = servers?.[serverId]?.name || (serverId === 'vanilla' ? 'Vanilla' : 'Hi-Tech');

        app._mc.activeBtn = btn;
        app._mc.originalHtml = btn.innerHTML;
        app._mcStopDots?.();

        btn.innerHTML = `<div class="loading-spinner small"></div> Проверка Java...`;
        btn.disabled = true;

        try {
          const java = await window.electronAPI?.minecraft?.checkJava?.();
          if (java && java.installed === false) {
            (app.ui?.notify || alert)(java.error || 'Java не найдена', 'error');
            return;
          }

          const username = app.currentUser?.name || 'Player';

          btn.innerHTML = `<div class="loading-spinner small"></div> Запуск ${serverName}...`;
          const res = await window.electronAPI?.minecraft?.launch?.({
            serverId,
            username,
            ramGb: app.ramValue,
            isAdmin: !!app.currentUser?.isAdmin
          });

          if (!res || res.success !== true) {
            (app.ui?.notify || alert)(res?.error || 'Ошибка запуска Minecraft', 'error');
          }
        } catch (err) {
          (app.ui?.notify || alert)(err?.message || String(err), 'error');
        } finally {
          app._mcStopDots?.();
          btn.innerHTML = app._mc.originalHtml || 'Играть';
          btn.disabled = false;

          app._mc.activeBtn = null;
          app._mc.originalHtml = null;
        }
      });
    });

    // --- Server status (online/players/ms) from auth-server (/servers/status) ---
    if (!app._statusPollStarted) {
      app._statusPollStarted = true;

      const updateStatusUI = (serverId, st) => {
        const playersEl = document.getElementById(`${serverId}Players`);
        const pingEl = document.getElementById(`${serverId}Ping`);
        if (!playersEl || !pingEl) return;

        if (!st || st.online !== true) {
          playersEl.textContent = 'OFFLINE';
          pingEl.textContent = '—';
          pingEl.style.color = '#EF4444';
          return;
        }

        const on = st.players?.online ?? 0;
        const mx = st.players?.max ?? 0;
        playersEl.textContent = `${on}/${mx}`;
        pingEl.textContent = (st.ms != null) ? `${st.ms} ms` : '—';
        pingEl.style.color = '#10B981';
      };

      const fetchStatus = async () => {
        try {
          const S = getStore(app);
          const base = S?.getApiUrl?.('http://localhost:3000') || 'http://localhost:3000';
          const res = await fetch(base + '/servers/status');
          const data = await res.json();
          const st = data?.status || {};
          updateStatusUI('vanilla', st.vanilla);
          updateStatusUI('hitech', st.hitech);
        } catch (e) {
          // silent
        }
      };

      fetchStatus();
      app._statusTimer = setInterval(fetchStatus, 30000);
    }
  }

  window.OnlyUsPages.main = {
    render,
    init
  };
})();
