// src/renderer/js/app.js
// FIX: восстанавливаем полный state (userStats и т.д.), чтобы auth.js не падал,
// но оставляем "тонкое ядро" без дублей логики страниц.


class LauncherApp {
  constructor() {
    
    this.ui = window.OnlyUsUI;
    this.store = window.OnlyUsStore;
this.currentPage = 'loading';
                this.currentUser = null;
                this.isAuthenticated = false;
                this.isAdmin = false;
                this.profileMenuOpen = false;
                this.ramValue = 4;
                this.adminMode = false;
                this.editingNewsId = null;
                this.editingServerId = null;
                
                // Данные для пользователей
                this.users = this.store?.getUsers?.() || [];
                this.currentUserData = this.store?.getUser?.() || null;
                
                // Данные для модов с привязкой к серверам
                this.mods = (this.store?.getMods?.() || null) || [
                    { 
                        id: 1, 
                        name: 'OptiFine', 
                        version: '1.18.2', 
                        required: true,
                        servers: ['vanilla', 'hitech'] // Для каких серверов мод нужен
                    },
                    { 
                        id: 2, 
                        name: 'JourneyMap', 
                        version: '5.8.5', 
                        required: false,
                        servers: ['vanilla'] // Только для ванильного сервера
                    },
                    { 
                        id: 3, 
                        name: 'Industrial Craft', 
                        version: '2.8.221', 
                        required: true,
                        servers: ['hitech'] // Только для hi-tech сервера
                    },
                    { 
                        id: 4, 
                        name: 'BuildCraft', 
                        version: '8.0.2', 
                        required: true,
                        servers: ['hitech'] // Только для hi-tech сервера
                    },
                    { 
                        id: 5, 
                        name: 'Applied Energistics', 
                        version: '10.0.0', 
                        required: false,
                        servers: ['hitech'] // Только для hi-tech сервера
                    }
                ];
                
                // Статистика пользователя
                this.userStats = {
                    totalPlayTime: 0,
                    serversJoined: 0,
                    lastLogin: null,
                    registrationDate: null
                };
                
                // Настройки аккаунта
                this.accountSettings = {
                    socialConnections: {
                        discord: false,
                        telegram: false
                    }
                };
                
                this.adminCredentials = {
                    username: 'admin',
                    password: 'admin123'
                };
                
                // Данные серверов по умолчанию
                this.defaultServers = {
                    vanilla: {
                        id: 'vanilla',
                        name: 'Minecraft Vanilla',
                        version: '1.710',
                        description: 'Классический Minecraft без модов. Тут текст будет очень длинный и подробный и так далее. Идеальный выбор для тех, кто хочет испытать ванильный опыт игры в Minecraft.',
                        modPack: 'vanilla',
                        customMods: '',
                        mods: 'Vanilla',
                        badge: 'Classic',
                        badgeType: 'classic',
                        players: '45/100',
                        ping: '45 ms',
                        ip: 'mc.onlyus-server.ru',
                        port: 25565,
                        // Launcher-only: сервер рассчитан на вход только через наш лаунчер (когда появится серверный плагин)
                        launcherOnly: true,
                        image: null
                    },
                    hitech: {
                        id: 'hitech',
                        name: 'Minecraft Hi-Tech',
                        version: '1.710',
                        description: 'Minecraft с модами: Industrial Craft, BuildCraft, Applied Energistics и многие другие. Погрузитесь в мир технологий и автоматизации.',
                        modPack: 'hitech',
                        customMods: '',
                        mods: 'Hi-Tech сборка (Industrial Craft, BuildCraft, Applied Energistics)',
                        badge: 'Hi-Tech',
                        badgeType: 'hitech',
                        players: '87/100',
                        ping: '38 ms',
                        ip: 'mc.onlyus-server.ru',
                        port: 25566,
                        launcherOnly: true,
                        image: null
                    }
                };
                
                
                // Запускаем обновление статуса сервера каждые 30 секунд
    // если вдруг в оригинале не было — на всякий случай:
    if (!this.adminCredentials) this.adminCredentials = { username: 'admin', password: 'admin123' };
    if (!this.userStats) this.userStats = { totalPlayTime: 0, serversJoined: 0, lastLogin: null, registrationDate: null };
    if (!this.accountSettings) this.accountSettings = { socialConnections: { discord: false, telegram: false } };
    // init() is called from boot.js after auth pages are mounted (so loadUserData comes from auth.page.js)
  }
  async init() {
    // Шаг 2: RAM из центрального store (settings.js больше не патчит init)
    try { this.ramValue = this.store?.getRam?.(this.ramValue || 4) ?? (this.ramValue || 4); } catch (_) {}
    // попытка подхватить сохранённые данные, если методы существуют
    try { const r = this.loadUserData?.(); if (r && typeof r.then==='function') { await r; } } catch (e) { console.warn('loadUserData failed', e); }
    // If auth.page.js has not mounted yet, loadUserData may be undefined.
    // boot.js mounts auth pages before calling init(), so normally this is not needed.


    this.initWindowControls();
    try { this.initNavigation(); } catch (e) { console.warn('initNavigation failed', e); }

    // меню профиля (клик по нику/аватару внизу)
    this.initProfileMenu?.();

    // стартовая страница
    // ✅ автологин только если пользователь включил "Сохранить пароль"
    this.showPage(this.isAuthenticated ? 'main' : 'login');
  }

  showPage(page) {
    return window.OnlyUsRouter?.go(this, page);
  }
  async legacyLoadUserData() {
    
                    try {
                        const savedDataObj = this.store?.getUser?.();
                        const savedData = savedDataObj ? JSON.stringify(savedDataObj) : null;
                        if (savedData) {
                            const userData = JSON.parse(savedData);
                            this.currentUser = userData;
    
    // ✅ автологин только если пользователь включил "Сохранить пароль"
    this.isAuthenticated = userData.rememberPassword === true;
    
    this.isAdmin = false;
    this.ramValue = userData.ramValue || 4;
                            
                            // Загружаем статистику/настройки аккаунта (через store)
                            const st = null
                            if (st) this.userStats = st;

                            const as = this.store?.getAccountSettings?.(userData.name, null);
                            if (as) this.accountSettings = as;
                            
                            this.updateUserProfile();
                        }
                    } catch (error) {
                        console.log('Нет сохраненных данных пользователя');
                    }
  }

  saveUserData() {
                    if (this.currentUser) {
                        this.currentUser.ramValue = this.ramValue;
                        // isAdmin приходит с сервера, не форсим его здесь
                        this.store?.setUser?.(this.currentUser);

                        // accountSettings (привязки) остаются локально
                        this.store?.setAccountSettings?.(this.currentUser.name, this.accountSettings);

                        // stats — на сервер
                        try {
                            if (this.isAuthenticated) {
                                window.OnlyUsStore?.saveMyStats?.(this.userStats || {});
                            }
                        } catch (e) {}

                        // NOTE: users/news/servers/mods больше не синхронизируем в localStorage — они на сервере.
                    }
  }
  updateUserProfile() {
    
                    if (this.currentUser) {
                        const avatar = document.getElementById('userAvatar');
                        const name = document.getElementById('userName');
                        const role = document.getElementById('userRole');
                        
                        if (avatar) {
                            if (this.currentUser.avatarImage) {
                                // XSS-safe avatar rendering (no innerHTML)
                        const imgSrc = String(this.currentUser.avatarImage || '');
                        const altText = String(this.currentUser.name || '');
                        const isAllowed = /^data:image\//i.test(imgSrc) || /^https?:\/\//i.test(imgSrc);
                        if (isAllowed) {
                            const img = document.createElement('img');
                            img.src = imgSrc;
                            img.alt = altText;
                            img.referrerPolicy = 'no-referrer';
                            avatar.replaceChildren(img);
                        } else {
                            avatar.textContent = this.currentUser.avatar;
                        }
                            } else {
                                avatar.textContent = this.currentUser.avatar;
                            }
                        }
                        
                        if (name) {
                            name.textContent = this.currentUser.name;
                        }
                        
                        if (role) {
                            role.textContent = this.isAdmin ? 'Администратор' : 'Игрок';
                            role.className = 'user-role ' + (this.isAdmin ? 'admin' : '');
                        }
                        
                        const adminBtn = document.getElementById('adminNavBtn');
                        if (adminBtn) {
                            adminBtn.style.display = this.isAdmin ? 'flex' : 'none';
                        }
                        
                        const adminIndicator = document.getElementById('adminModeIndicator');
                        if (adminIndicator) {
                            adminIndicator.classList.toggle('show', this.isAdmin && this.adminMode);
                        }
                    } else {
                        const avatar = document.getElementById('userAvatar');
                        const name = document.getElementById('userName');
                        const role = document.getElementById('userRole');
                        if (avatar) { avatar.replaceChildren(); avatar.textContent = 'Г'; }
                        if (name) name.textContent = 'Гость';
                        if (role) { role.textContent = 'Игрок'; role.className = 'user-role'; }
                        const adminBtn = document.getElementById('adminNavBtn');
                        if (adminBtn) adminBtn.style.display = 'none';
                        const adminIndicator = document.getElementById('adminModeIndicator');
                        if (adminIndicator) adminIndicator.classList.remove('show');
                    }
  }


  loadServers() {
                    // Шаг 2: через central store
                    return this.store?.getServers?.(this.defaultServers) || this.defaultServers;
  }

  saveServers(servers) {
                    // Шаг 2: через central store
                    this.store?.setServers?.(servers);
  }

  getServerModsText(serverId) {
    
                    const mods = this.loadMods();
                    
                    // Фильтруем моды для конкретного сервера
                    const serverMods = mods.filter(mod => 
                        mod.servers && mod.servers.includes(serverId)
                    );
                    
                    if (serverMods.length > 0) {
                        return serverMods.map(mod => 
                            `${mod.name} ${mod.required ? '⚡' : ''}`
                        ).join(', ');
                    }
                    
                    return serverId === 'hitech' ? 'Hi-Tech сборка' : 'Нет модов';
  }

  updateServerStatus() {
  }


  loadMods() {
                    return this.store?.getMods?.(this.mods) || [];
  }

  saveMods(mods) {
    
                    // Собираем данные из таблицы
                    const modRows = document.querySelectorAll('#modsTableBody tr');
                    const updatedMods = [];
                    
                    modRows.forEach(row => {
                        const id = parseInt(row.dataset.id);
                        const name = row.querySelector('.mod-name').value.trim();
                        const version = row.querySelector('.mod-version').value.trim();
                        const required = row.querySelector('.mod-required').value === 'true';
                        
                        // Собираем выбранные серверы
                        const servers = [];
                        const serverOptions = row.querySelectorAll('.server-option');
                        serverOptions.forEach(option => {
                            if (option.querySelector('input').checked) {
                                servers.push(option.querySelector('.server-badge-icon').className.includes('vanilla') ? 'vanilla' : 'hitech');
                            }
                        });
                        
                        if (name && version) {
                            updatedMods.push({
                                id: id || Date.now(),
                                name,
                                version,
                                required,
                                servers: servers.length > 0 ? servers : ['vanilla', 'hitech'] // По умолчанию для всех
                            });
                        }
                    });
                    
                    this.store?.setMods?.(updatedMods);
                    this.mods = updatedMods;
                    this.showNotification('Моды успешно сохранены!', 'success');
  }

  // ===== Профильное меню (внизу слева) =====
  initProfileMenu() {
    const profile = document.querySelector('.user-profile');
    const menu = document.querySelector('.profile-menu');
    if (!profile || !menu) return;

    // по умолчанию прячем (CSS может делать это, но пусть будет устойчиво)
    if (!this.profileMenuOpen) menu.style.display = 'none';

    // не навешиваем повторно
    if (this._profileMenuBound) return;
    this._profileMenuBound = true;

    profile.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleProfileMenu();
    });

    // клик вне меню — закрыть
    document.addEventListener('click', (e) => {
      if (!this.profileMenuOpen) return;
      const t = e.target;
      if (t && (t.closest?.('.profile-menu') || t.closest?.('.user-profile'))) return;
      this.closeProfileMenu();
    });

    // ESC — закрыть
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeProfileMenu();
    });
  }

  openProfileMenu() {
    const menu = document.querySelector('.profile-menu');
    if (!menu) return;
    this.profileMenuOpen = true;
    menu.style.display = 'block';
  }

  closeProfileMenu() {
    const menu = document.querySelector('.profile-menu');
    if (!menu) return;
    this.profileMenuOpen = false;
    menu.style.display = 'none';
  }

  toggleProfileMenu() {
    if (this.profileMenuOpen) this.closeProfileMenu();
    else this.openProfileMenu();
  }


  initNavigation() {
    document.addEventListener('click', (e) => {
      const navItem = e.target.closest('.nav-item');
      if (!navItem) return;
      const page = navItem.dataset.page;
      if (!page) return;

      if (page === 'admin' && !this.isAdmin) {
        if (typeof this.showAdminLogin === 'function') this.showAdminLogin();
        return;
      }

      this.showPage(page);
      if (typeof this.closeProfileMenu === 'function') this.closeProfileMenu();
    });
  }

  initWindowControls() {
    const api = window.electronAPI?.window;
    if (!api) return;
    document.getElementById('minimizeBtn')?.addEventListener('click', () => api.minimize());
    document.getElementById('maximizeBtn')?.addEventListener('click', () => api.maximize());
    document.getElementById('closeBtn')?.addEventListener('click', () => api.close());
  }

  // Совместимость: если уведомления использовались из auth/admin
  showNotification(message, type = 'info') {
    // 1) Лог в консоль (полезно для отладки)
    console.log(`[${type}]`, message);

    // 2) UI-тост внутри клиента
    try {
      const doc = document;
      if (!doc?.body) return;

      let wrap = doc.getElementById('toastContainer');
      if (!wrap) {
        wrap = doc.createElement('div');
        wrap.id = 'toastContainer';
        wrap.style.position = 'fixed';
        wrap.style.top = '14px';
        wrap.style.right = '14px';
        wrap.style.zIndex = '999999';
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.style.gap = '10px';
        wrap.style.pointerEvents = 'none';
        doc.body.appendChild(wrap);
      }

      const toast = doc.createElement('div');
      toast.style.pointerEvents = 'auto';
      toast.style.minWidth = '240px';
      toast.style.maxWidth = '360px';
      toast.style.padding = '12px 14px';
      toast.style.borderRadius = '12px';
      toast.style.border = '1px solid rgba(255,255,255,0.12)';
      toast.style.boxShadow = '0 12px 30px rgba(0,0,0,0.35)';
      toast.style.backdropFilter = 'blur(6px)';
      toast.style.display = 'flex';
      toast.style.alignItems = 'flex-start';
      toast.style.gap = '10px';
      toast.style.fontFamily = 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
      toast.style.fontSize = '13px';
      toast.style.lineHeight = '1.35';

      // Цвет/иконка по типу
      const t = String(type || 'info').toLowerCase();
      const meta = {
        success: { icon: '✅', bg: 'rgba(16, 185, 129, 0.16)' },
        error: { icon: '⛔', bg: 'rgba(239, 68, 68, 0.16)' },
        warning: { icon: '⚠️', bg: 'rgba(245, 158, 11, 0.16)' },
        info: { icon: 'ℹ️', bg: 'rgba(59, 130, 246, 0.16)' },
      };
      const cfg = meta[t] || meta.info;
      toast.style.background = cfg.bg;
      toast.style.color = '#000000';

      const icon = doc.createElement('div');
      icon.textContent = cfg.icon;
      icon.style.marginTop = '1px';
      icon.style.flex = '0 0 auto';

      const text = doc.createElement('div');
      text.textContent = String(message ?? '');
      text.style.flex = '1 1 auto';
      text.style.wordBreak = 'break-word';

      const close = doc.createElement('button');
      close.textContent = '✕';
      close.setAttribute('aria-label', 'Закрыть');
      close.style.flex = '0 0 auto';
      close.style.marginLeft = '6px';
      close.style.border = '0';
      close.style.background = 'transparent';
      close.style.color = 'rgba(0, 0, 0, 0.8)';
      close.style.cursor = 'pointer';
      close.style.padding = '0';
      close.style.lineHeight = '1';
      close.style.fontSize = '14px';

      const removeToast = () => {
        // маленькая анимация исчезновения
        toast.style.transition = 'opacity 180ms ease, transform 180ms ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-6px)';
        setTimeout(() => toast.remove(), 200);
      };

      close.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeToast();
      });

      toast.appendChild(icon);
      toast.appendChild(text);
      toast.appendChild(close);

      // плавное появление
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-6px)';
      toast.style.transition = 'opacity 180ms ease, transform 180ms ease';
      wrap.appendChild(toast);
      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
      });

      // авто-скрытие
      const ttl = t === 'error' ? 5200 : 3200;
      setTimeout(removeToast, ttl);
    } catch (e) {
      // Если UI-тост не отрисовался — хотя бы не ломаем приложение
      console.warn('showNotification UI failed:', e);
    }
  }

}

window.LauncherApp = LauncherApp;
