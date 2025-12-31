// src/renderer/js/admin.js
// Полный рабочий набор методов админки/редакторов (из твоего оригинального LauncherApp 1:1).
// Этот файл добавляет методы в LauncherApp.prototype, чтобы админка работала без 'is not a function'.

(() => {
  const P = window.LauncherApp && window.LauncherApp.prototype;
  if (!P) { console.error('[admin.js] LauncherApp не найден'); return; }

  // ✅ Делегированный обработчик кликов по табам админки.
  // Админка рендерится динамически (showPage('admin') перерисовывает DOM),
  // поэтому прямые addEventListener на .admin-tab могут «слетать».
  // Делегация на document гарантирует кликабельность вкладок всегда.
  if (!window.__onlyus_admin_tabs_bound) {
    window.__onlyus_admin_tabs_bound = true;
    document.addEventListener('click', (e) => {
      const tabBtn = e.target && e.target.closest ? e.target.closest('.admin-tab') : null;
      if (!tabBtn) return;

      const tabName = tabBtn.dataset && tabBtn.dataset.tab;
      if (!tabName) return;

      // Активируем кнопку
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      tabBtn.classList.add('active');

      // Показываем нужный контент
      document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
      const id = `tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`;
      const panel = document.getElementById(id);
      if (panel) panel.classList.add('active');
    });
  }

  async function syncAdminsToServer(serverId = 'vanilla') {
    // Local-only: отключаем синхронизацию админов на сервер/ops.json
    return;
  }

  if (typeof P.addMod !== 'function') P.addMod = function () {
  
                  const newMod = {
                      id: Date.now(),
                      name: 'Новый мод',
                      version: '1.0.0',
                      required: false,
                      servers: ['vanilla', 'hitech'] // По умолчанию для всех серверов
                  };
                  
                  this.mods.push(newMod);
                  localStorage.setItem('serverMods', JSON.stringify(this.mods));
                  this.showNotification('Мод добавлен. Не забудьте сохранить изменения!', 'success');
                  
                  // Перезагружаем вкладку
                  this.showPage('admin');
                  setTimeout(() => {
                      document.querySelector('[data-tab="mods"]').click();
                  }, 100);
  };

  if (typeof P.archiveNews !== 'function') P.archiveNews = function (newsId) {
  
                  if (confirm('Переместить новость в архив? Она больше не будет отображаться на странице новостей.')) {
                      const news = this.loadNews();
                      const index = news.findIndex(n => n.id === newsId);
                      
                      if (index !== -1) {
                          news[index].status = 'archived';
                          this.saveNews(news);
                          this.showNotification('Новость перемещена в архив', 'success');
                          this.showPage('admin');
                          document.querySelector('[data-tab="news"]').click();
                      }
                  }
  };

  if (typeof P.cancelEditNews !== 'function') P.cancelEditNews = function () {
  
                  this.editingNewsId = null;
                  this.showNotification('Редактирование отменено', 'info');
                  this.showPage('admin');
                  document.querySelector('[data-tab="news"]').click();
  };

  if (typeof P.cancelEditServer !== 'function') P.cancelEditServer = function () {
  
                  this.editingServerId = null;
                  
                  const editor = document.getElementById('serverEditor');
                  if (editor) {
                      editor.innerHTML = `
                          <h3 class="server-editor-title" id="serverEditorTitle">
                              Выберите сервер для редактирования
                          </h3>
                          <div style="text-align: center; padding: 40px 20px;">
                              <p style="color: #6B7280; margin-bottom: 20px;">Выберите сервер из списка ниже для редактирования</p>
                          </div>
                      `;
                  }
                  
                  this.showNotification('Редактирование отменено', 'info');
  };

  if (typeof P.closeDeleteAccountModal !== 'function') P.closeDeleteAccountModal = function () {
  
                  const modal = document.getElementById('deleteAccountModal');
                  if (modal) {
                      modal.style.display = 'none';
                  }
  };

  if (typeof P.closeImageUploadModal !== 'function') P.closeImageUploadModal = function () {
  
                  const modal = document.getElementById('imageUploadModal');
                  if (modal) {
                      modal.style.display = 'none';
                  }
  };

  if (typeof P.confirmDeleteAccount !== 'function') P.confirmDeleteAccount = function () {
  
                  this.showNotification('Удаление аккаунта доступно только через администратора', 'info');
  };

  if (typeof P.deleteMod !== 'function') P.deleteMod = function (modId) {
  
                  if (confirm('Удалить этот мод?')) {
                      this.mods = this.mods.filter(mod => mod.id !== parseInt(modId));
                      localStorage.setItem('serverMods', JSON.stringify(this.mods));
                      this.showNotification('Мод удален', 'success');
          
                      // Перезагружаем вкладку
                      this.showPage('admin');
                      setTimeout(() => {
                          document.querySelector('[data-tab="mods"]').click();
                      }, 100);
                  }
  };

  if (typeof P.deleteNews !== 'function') P.deleteNews = function (newsId) {
  
                  if (confirm('Удалить новость? Это действие нельзя отменить.')) {
                      const news = this.loadNews();
                      const filteredNews = news.filter(n => n.id !== newsId);
                      this.saveNews(filteredNews);
                      this.showNotification('Новость удалена', 'success');
                      this.showPage('admin');
                      document.querySelector('[data-tab="news"]').click();
                  }
  };

  if (typeof P.deleteServerImage !== 'function') P.deleteServerImage = function (serverId) {
  
                  if (confirm('Удалить изображение сервера?')) {
                      const servers = this.loadServers();
                      if (servers[serverId]) {
                          servers[serverId].image = null;
                          this.saveServers(servers);
                          
                          this.showNotification('Изображение удалено', 'success');
                          setTimeout(() => {
                              this.showPage('admin');
                              document.querySelector('[data-tab="images"]').click();
                          }, 300);
                      }
                  }
  };

  if (typeof P.deleteUserAccount !== 'function') P.deleteUserAccount = function (username) {
  
                  if (confirm(`Удалить аккаунт пользователя "${username}"? Это действие необратимо!`)) {
                      // Удаляем пользователя из списка
                      const users = JSON.parse(localStorage.getItem('onlyus_users') || '[]');
                      const filteredUsers = users.filter(u => u.name !== username);
                      localStorage.setItem('onlyus_users', JSON.stringify(filteredUsers));
                      
                      // Удаляем статистику и настройки
                      localStorage.removeItem(`user_stats_${username}`);
                      localStorage.removeItem(`account_settings_${username}`);
                      
                      // Если удаляем текущего пользователя, выходим
                      if (this.currentUser && this.currentUser.name === username) {
                          this.logout();
                      }
                      
                      this.showNotification(`Аккаунт пользователя "${username}" удален`, 'success');
                      this.filterUsers(); // Обновляем список
                  }
  };

  if (typeof P.editNews !== 'function') P.editNews = function (newsId) {
  
                  this.editingNewsId = newsId;
                  this.showPage('admin');
                  
                  setTimeout(() => {
                      document.querySelector('[data-tab="news"]').click();
                      this.initNewsEditor();
                  }, 100);
  };

  if (typeof P.editServer !== 'function') P.editServer = function (serverId) {
  
                  this.editingServerId = serverId;
                  
                  // Перезагружаем форму редактора
                  const editor = document.getElementById('serverEditor');
                  if (editor) {
                      editor.innerHTML = `
                          <h3 class="server-editor-title" id="serverEditorTitle">Редактировать сервер</h3>
                          ${this.getServerEditorForm()}
                      `;
                  }
  };

  if (typeof P.filterUsers !== 'function') P.filterUsers = function () {
  
                  const searchInput = document.getElementById('userSearch');
                  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
                  const usersList = document.getElementById('usersListAdmin');
                  
                  if (!usersList) return;
                  
                  const allUsers = JSON.parse(localStorage.getItem('onlyus_users') || '[]');
                  const filteredUsers = searchTerm ? 
                      allUsers.filter(user => 
                          user.name.toLowerCase().includes(searchTerm) ||
                          (user.email && user.email.toLowerCase().includes(searchTerm))
                      ) : allUsers;
                  
                  let html = '';
                  const currentUserName = this.currentUser?.name;
                  
                  filteredUsers.forEach(user => {
                      html += `
                          <div class="user-list-item">
                              <div class="user-list-info">
                                  <div class="user-list-avatar">
                                      ${user.avatarImage ? 
                                          `<img src="${user.avatarImage}" alt="${user.name}">` : 
                                          user.avatar || user.name.charAt(0).toUpperCase()
                                      }
                                  </div>
                                  <div class="user-list-details">
                                      <h4>${user.name} ${user.name === currentUserName ? '<span class="user-you-badge">Вы</span>' : ''}</h4>
                                      <span style="display: block; margin-bottom: 4px; color: #6B7280; font-size: 13px;">${user.email || 'Нет почты'}</span>
                                      <span class="admin-status ${user.isAdmin ? 'admin' : 'user'}">
                                          ${user.isAdmin ? '👑 Администратор' : '👤 Игрок'}
                                      </span>
                                  </div>
                              </div>
                              <div class="user-list-actions">
                                  ${user.name !== currentUserName ? `
                                      ${user.isAdmin ? 
                                          `<button class="user-action-btn remove-admin" onclick="launcherApp.removeAdminRights('${user.name}')">
                                              Убрать права
                                          </button>` : 
                                          `<button class="user-action-btn make-admin" onclick="launcherApp.grantAdminRights('${user.name}')">
                                              Назначить админом
                                          </button>`
                                      }
                                      <button class="user-action-btn delete-account-btn" onclick="launcherApp.deleteUserAccount('${user.name}')">
                                          Удалить аккаунт
                                      </button>
                                  ` : '<span style="color: #9CA3AF; font-size: 12px; padding: 6px 12px;">Это вы</span>'}
                              </div>
                          </div>
                      `;
                  });
                  
                  usersList.innerHTML = html || '<div style="text-align: center; color: #9CA3AF; padding: 20px;">Пользователей не найдено</div>';
                  
                  // Обновляем счетчики
                  const totalCount = document.getElementById('totalUsersCount');
                  const adminCount = document.getElementById('adminUsersCount');
                  
                  if (totalCount) totalCount.textContent = filteredUsers.length;
                  if (adminCount) adminCount.textContent = filteredUsers.filter(u => u.isAdmin).length;
  };

  if (typeof P.getAdminImagesTab !== 'function') P.getAdminImagesTab = function () {
  
                  const servers = this.loadServers();
                  
                  return `
                      <div class="image-management">
                          <div class="image-upload-section">
                              <div class="upload-card" id="vanillaUploadCardAdmin">
                                  <h3 class="upload-title">Vanilla Server</h3>
                                  <div class="image-preview" id="vanillaPreviewAdmin">
                                      ${servers.vanilla?.image ? 
                                          `<img src="${servers.vanilla.image}" alt="Vanilla Preview">` : 
                                          `<div class="placeholder">Изображение не загружено</div>`
                                      }
                                  </div>
                                  <button class="upload-button" onclick="launcherApp.quickUploadImage('vanilla')">
                                      Загрузить изображение
                                  </button>
                                  <input type="file" id="vanillaFileInputAdmin" class="hidden-file-input" accept="image/*">
                              </div>
                              
                              <div class="upload-card" id="hitechUploadCardAdmin">
                                  <h3 class="upload-title">Hi-Tech Server</h3>
                                  <div class="image-preview" id="hitechPreviewAdmin">
                                      ${servers.hitech?.image ? 
                                          `<img src="${servers.hitech.image}" alt="Hi-Tech Preview">` : 
                                          `<div class="placeholder">Изображение не загружено</div>`
                                      }
                                  </div>
                                  <button class="upload-button" onclick="launcherApp.quickUploadImage('hitech')">
                                      Загрузить изображение
                                  </button>
                                  <input type="file" id="hitechFileInputAdmin" class="hidden-file-input" accept="image/*">
                              </div>
                          </div>
                          
                          <div class="current-images">
                              <div class="current-image-card">
                                  <div class="current-image-title">Текущее изображение Vanilla</div>
                                  <div class="current-image-preview">
                                      ${servers.vanilla?.image ? 
                                          `<img src="${servers.vanilla.image}" alt="Current Vanilla">` : 
                                          `<div style="background: #E5E7EB; height: 100%; display: flex; align-items: center; justify-content: center; color: #9CA3AF;">Нет изображения</div>`
                                      }
                                  </div>
                                  ${servers.vanilla?.image ? 
                                      `<button class="delete-button" onclick="launcherApp.deleteServerImage('vanilla')">Удалить</button>` : 
                                      ''
                                  }
                              </div>
                              
                              <div class="current-image-card">
                                  <div class="current-image-title">Текущее изображение Hi-Tech</div>
                                  <div class="current-image-preview">
                                      ${servers.hitech?.image ? 
                                          `<img src="${servers.hitech.image}" alt="Current Hi-Tech">` : 
                                          `<div style="background: #E5E7EB; height: 100%; display: flex; align-items: center; justify-content: center; color: #9CA3AF;">Нет изображения</div>`
                                      }
                                  </div>
                                  ${servers.hitech?.image ? 
                                      `<button class="delete-button" onclick="launcherApp.deleteServerImage('hitech')">Удалить</button>` : 
                                      ''
                                  }
                              </div>
                          </div>
                      </div>
                  `;
  };

  if (typeof P.getAdminModsTab !== 'function') P.getAdminModsTab = function () {
  
                  const mods = this.loadMods();
                  
                  return `
                      <div class="mods-management">
                          <div class="section-header">
                              <div>
                                  <h3 class="section-title">📦 Управление модами</h3>
                                  <p class="section-description">Добавьте или отредактируйте моды для отображения на карточке сервера</p>
                              </div>
                              <div class="mods-actions">
                                  <button class="btn btn-primary" id="addModBtn">
                                      + Добавить мод
                                  </button>
                                  <button class="btn btn-success" id="saveModsBtn">
                                      💾 Сохранить моды
                                  </button>
                              </div>
                          </div>
                          
                          <div class="mods-table-container">
                              <table class="mods-table">
                                  <thead>
                                      <tr>
                                          <th style="width: 35%;">Название мода</th>
                                          <th style="width: 20%;">Версия</th>
                                          <th style="width: 25%;">Для серверов</th>
                                          <th style="width: 10%;">Обязательный</th>
                                          <th style="width: 10%;">Действия</th>
                                      </tr>
                                  </thead>
                                  <tbody id="modsTableBody">
                                      ${mods.map(mod => this.getModRow(mod)).join('')}
                                  </tbody>
                              </table>
                          </div>
                          
                          <div class="mods-help">
                              <h4>💡 Как это работает:</h4>
                              <ul>
                                  <li>Выберите для каких серверов нужен этот мод (Vanilla, Hi-Tech или оба)</li>
                                  <li>Мод будет отображаться только на выбранных серверах</li>
                                  <li>Обязательные моды будут помечены специальным значком ⚡</li>
                                  <li>Изменения вступят в силу после сохранения</li>
                              </ul>
                          </div>
                      </div>
                  `;
  };

  if (typeof P.getAdminNewsTab !== 'function') P.getAdminNewsTab = function () {
  
                  return `
                      <div class="news-management">
                          <div class="news-editor" id="newsEditor">
                              <h3 class="news-editor-title" id="newsEditorTitle">${this.editingNewsId ? 'Редактировать новость' : 'Создать новость'}</h3>
                              
                              <div class="editor-group">
                                  <label class="editor-label">Заголовок новости</label>
                                  <input type="text" class="editor-input" id="newsTitle" placeholder="Введите заголовок новости" maxlength="100">
                              </div>
                              
                              <div class="editor-group">
                                  <label class="editor-label">Содержание новости</label>
                                  <textarea class="editor-textarea" id="newsContent" placeholder="Введите текст новости..."></textarea>
                              </div>
                              
                              <div class="editor-group">
                                  <label class="editor-label">Теги (через запятую)</label>
                                  <input type="text" class="editor-input" id="newsTags" placeholder="обновление, сервер, новости">
                              </div>
                              
                              <div class="editor-checkbox">
                                  <input type="checkbox" id="newsPublished" ${!this.editingNewsId ? 'checked' : ''}>
                                  <label for="newsPublished" class="editor-checkbox-label">Опубликовать сразу</label>
                              </div>
                              
                              <div class="editor-buttons">
                                  <button class="btn btn-primary" id="saveNewsBtn">
                                      ${this.editingNewsId ? 'Обновить новость' : 'Создать новость'}
                                  </button>
                                  ${this.editingNewsId ? `
                                      <button class="btn btn-secondary" onclick="launcherApp.cancelEditNews()">Отмена</button>
                                  ` : ''}
                              </div>
                          </div>
                          
                          <div class="news-list" id="newsListAdmin">
                              ${this.getNewsListAdmin()}
                          </div>
                      </div>
                  `;
  };

  if (typeof P.getAdminPage !== 'function') P.getAdminPage = function () {
  
                  const allUsers = JSON.parse(localStorage.getItem('onlyus_users') || '[]');
                  const adminUsers = allUsers.filter(u => u.isAdmin);
                  const regularUsers = allUsers.filter(u => !u.isAdmin);
                  
                  return `
                      <div class="page-header">
                          <h1 class="page-title">👑 Панель администратора</h1>
                          <p class="page-subtitle">Управление системой лаунчера</p>
                      </div>
                      
                      <div class="admin-panel">
                          <div class="admin-panel-header">
                              <h2 class="admin-panel-title">Добро пожаловать, администратор!</h2>
                          </div>
                          
                          <div class="stats-grid">
                              <div class="stat-card">
                                  <div class="stat-value">${this.loadNews().length}</div>
                                  <div class="stat-label">Новостей всего</div>
                              </div>
                              <div class="stat-card">
                                  <div class="stat-value">${allUsers.length}</div>
                                  <div class="stat-label">Пользователей</div>
                              </div>
                              <div class="stat-card">
                                  <div class="stat-value">${adminUsers.length}</div>
                                  <div class="stat-label">Администраторов</div>
                              </div>
                              <div class="stat-card">
                                  <div class="stat-value">${regularUsers.length}</div>
                                  <div class="stat-label">Обычных игроков</div>
                              </div>
                          </div>
                          
                          <div class="admin-tabs">
                              <button class="admin-tab active" data-tab="users">Управление пользователями</button>
                              <button class="admin-tab" data-tab="news">Управление новостями</button>
                              <button class="admin-tab" data-tab="servers">Управление серверами</button>
                              <button class="admin-tab" data-tab="mods">Управление модами</button>
                              <button class="admin-tab" data-tab="images">Изображения серверов</button>
                          </div>
                          
                          <!-- Вкладка управления пользователями -->
                          <div class="admin-tab-content active" id="tabUsers">
                              <div class="user-management-section">
                                  <div class="section-header">
                                      <div>
                                          <h3 class="section-title">👥 Управление пользователями</h3>
                                          <p class="section-description">Назначение прав администратора и удаление аккаунтов</p>
                                      </div>
                                  </div>
                                  
                                  <div class="search-box">
                                      <input type="text" class="search-input" id="userSearch" placeholder="Поиск пользователей..." oninput="launcherApp.filterUsers()">
                                  </div>
                                  
                                  <div class="users-list" id="usersListAdmin">
                                      ${this.getUsersList()}
                                  </div>
                                  
                                  <div style="text-align: center; margin-top: 20px; color: #9CA3AF; font-size: 14px;">
                                      Всего пользователей: <span id="totalUsersCount">${allUsers.length}</span>
                                      • Администраторов: <span id="adminUsersCount">${adminUsers.length}</span>
                                  </div>
                              </div>
                          </div>
                          
                          <!-- Вкладка управления новостями -->
                          <div class="admin-tab-content" id="tabNews">
                              ${this.getAdminNewsTab()}
                          </div>
                          
                          <!-- Вкладка управления серверами -->
                          <div class="admin-tab-content" id="tabServers">
                              ${this.getAdminServersTab()}
                          </div>
                          
                          <!-- Вкладка управления модами -->
                          <div class="admin-tab-content" id="tabMods">
                              ${this.getAdminModsTab()}
                          </div>
                          
                          <!-- Вкладка изображений -->
                          <div class="admin-tab-content" id="tabImages">
                              ${this.getAdminImagesTab()}
                          </div>
                      </div>
                  `;
  };

  if (typeof P.getAdminServersTab !== 'function') P.getAdminServersTab = function () {
  
                  const servers = this.loadServers();
                  
                  return `
                      <div class="server-management">
                          <div class="server-editor" id="serverEditor">
                              <h3 class="server-editor-title" id="serverEditorTitle">
                                  ${this.editingServerId ? 'Редактировать сервер' : 'Выберите сервер для редактирования'}
                              </h3>
                              
                              ${this.editingServerId ? this.getServerEditorForm() : `
                                  <div style="text-align: center; padding: 40px 20px;">
                                      <p style="color: #6B7280; margin-bottom: 20px;">Выберите сервер из списка ниже для редактирования</p>
                                  </div>
                              `}
                          </div>
                          
                          <div class="servers-list-admin" id="serversListAdmin">
                              ${this.getServersListAdmin()}
                          </div>
                      </div>
                  `;
  };

  if (typeof P.getModRow !== 'function') P.getModRow = function (mod) {
  
                  const servers = this.loadServers();
                  const serverList = Object.keys(servers);
                  
                  return `
                      <tr data-id="${mod.id}">
                          <td>
                              <input type="text" 
                                     class="form-input mod-name" 
                                     value="${mod.name}" 
                                     data-field="name"
                                     placeholder="Например: OptiFine">
                          </td>
                          <td>
                              <input type="text" 
                                     class="form-input mod-version" 
                                     value="${mod.version}" 
                                     data-field="version"
                                     placeholder="Например: 1.18.2">
                          </td>
                          <td>
                              <div class="mod-servers-selector">
                                  ${serverList.map(serverId => {
                                      const server = servers[serverId];
                                      const isSelected = mod.servers && mod.servers.includes(serverId);
                                      return `
                                          <div class="server-option ${isSelected ? 'selected' : ''}" 
                                               onclick="launcherApp.toggleModServer('${mod.id}', '${serverId}')">
                                              <input type="checkbox" ${isSelected ? 'checked' : ''} style="display: none;">
                                              <span class="server-badge-icon ${serverId}">${serverId === 'vanilla' ? 'V' : 'H'}</span>
                                              ${server.name}
                                          </div>
                                      `;
                                  }).join('')}
                              </div>
                          </td>
                          <td>
                              <select class="form-input mod-required" data-field="required" data-mod-id="${mod.id}">
                                  <option value="true" ${mod.required ? 'selected' : ''}>Да</option>
                                  <option value="false" ${!mod.required ? 'selected' : ''}>Нет</option>
                              </select>
                          </td>
                          <td>
                              <button class="btn btn-danger delete-mod-btn" 
                                      data-id="${mod.id}"
                                      onclick="launcherApp.deleteMod(${mod.id})">
                                  Удалить
                              </button>
                          </td>
                      </tr>
                  `;
  };

  if (typeof P.getNewsListAdmin !== 'function') P.getNewsListAdmin = function () {
  
                  const news = this.loadNews();
                  
                  let html = '';
                  news.forEach(newsItem => {
                      const date = new Date(newsItem.date);
                      const formattedDate = date.toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                      });
                      
                      const statusText = newsItem.status === 'published' ? 'Опубликовано' : 
                                        newsItem.status === 'draft' ? 'Черновик' : 'Архив';
                      const statusClass = newsItem.status === 'published' ? 'published' : 
                                         newsItem.status === 'draft' ? 'draft' : 'archived';
                      
                      html += `
                          <div class="news-list-item">
                              <div class="news-list-content">
                                  <h4 class="news-list-title">${newsItem.title}</h4>
                                  <p class="news-list-text">${newsItem.content.substring(0, 150)}${newsItem.content.length > 150 ? '...' : ''}</p>
                                  <div class="news-list-meta">
                                      <span>${formattedDate}</span>
                                      <span>${newsItem.author}</span>
                                      <span class="status-badge ${statusClass}">${statusText}</span>
                                      ${newsItem.tags && newsItem.tags.length > 0 ? 
                                          `<span>${newsItem.tags.slice(0, 2).map(tag => `#${tag}`).join(', ')}</span>` : 
                                          ''
                                      }
                                  </div>
                              </div>
                              <div class="news-list-actions">
                                  <button class="news-action-btn edit" onclick="launcherApp.editNews('${newsItem.id}')">
                                      Редактировать
                                  </button>
                                  ${newsItem.status === 'published' ? 
                                      `<button class="news-action-btn delete" onclick="launcherApp.archiveNews('${newsItem.id}')">
                                          В архив
                                      </button>` :
                                      `<button class="news-action-btn publish" onclick="launcherApp.publishNews('${newsItem.id}')">
                                          Опубликовать
                                      </button>`
                                  }
                                  <button class="news-action-btn delete" onclick="launcherApp.deleteNews('${newsItem.id}')">
                                      Удалить
                                  </button>
                              </div>
                          </div>
                      `;
                  });
                  
                  return html || '<div style="text-align: center; color: #9CA3AF; padding: 20px;">Новостей нет</div>';
  };

  if (typeof P.getNewsPage !== 'function') P.getNewsPage = function () {
  
                  const news = this.loadNews();
                  const publishedNews = news.filter(n => n.status === 'published');
                  
                  let newsHTML = '';
                  publishedNews.forEach(newsItem => {
                      const date = new Date(newsItem.date);
                      const formattedDate = date.toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                      });
                      
                      newsHTML += `
                          <div class="news-card">
                              <h2 class="news-title">${newsItem.title}</h2>
                              <div class="news-content">
                                  ${newsItem.content.replace(/\n/g, '<br>')}
                              </div>
                              <div class="news-footer">
                                  <span class="news-date">${formattedDate}</span>
                                  <span class="news-author">${newsItem.author}</span>
                              </div>
                          </div>
                      `;
                  });
                  
                  return `
                      <div class="page-header">
                          <h1 class="page-title">Новости</h1>
                          <p class="page-subtitle">Последние обновления и события</p>
                      </div>
                      
                      <div class="news-container">
                          ${newsHTML || '<p style="text-align: center; color: #6B7280;">Новостей пока нет</p>'}
                      </div>
                  `;
  };

  if (typeof P.getServerEditorForm !== 'function') P.getServerEditorForm = function () {
  
                  const servers = this.loadServers();
                  const server = servers[this.editingServerId];
                  
                  if (!server) {
                      return '<p style="color: #EF4444;">Сервер не найден</p>';
                  }
                  
                  const badgeTypes = [
                      { id: 'classic', name: 'Classic', color: 'classic' },
                      { id: 'hitech', name: 'Hi-Tech', color: 'hitech' },
                      { id: 'modded', name: 'Modded', color: 'modded' },
                      { id: 'premium', name: 'Premium', color: 'premium' }
                  ];
                  
                  return `
                      <div class="editor-group">
                          <label class="editor-label">Название сервера</label>
                          <input type="text" class="editor-input" id="serverName" 
                                 value="${server.name || ''}" placeholder="Введите название сервера">
                      </div>
                      
                      <div class="editor-group">
                          <label class="editor-label">Версия Minecraft</label>
                          <input type="text" class="editor-input" id="serverVersion" 
                                 value="${server.version || '1.710'}" placeholder="Например: 1.710">
                      </div>
                      
                      <div class="editor-group">
                          <label class="editor-label">Моды/Сборка</label>
                          <input type="text" class="editor-input" id="serverMods" 
                                 value="${server.mods || ''}" placeholder="Например: Vanilla или Hi-Tech сборка">
                      </div>
                      
                      <div class="editor-group">
                          <label class="editor-label">Бейдж сервера</label>
                          <div class="badge-selector">
                              ${badgeTypes.map(badge => `
                                  <button type="button" class="badge-option ${badge.color} ${server.badgeType === badge.id ? 'selected' : ''}" 
                                          onclick="launcherApp.selectBadgeType('${badge.id}')">
                                      ${badge.name}
                                  </button>
                              `).join('')}
                              <input type="hidden" id="serverBadgeType" value="${server.badgeType || 'classic'}">
                          </div>
                      </div>
                      
                      <div class="editor-group">
                          <label class="editor-label">Текст бейджа</label>
                          <input type="text" class="editor-input" id="serverBadge" 
                                 value="${server.badge || 'Classic'}" placeholder="Например: Classic">
                      </div>
                      
                      <div class="editor-group">
                          <label class="editor-label">Описание сервера</label>
                          <textarea class="editor-textarea" id="serverDescription" 
                                    placeholder="Введите описание сервера..." 
                                    rows="6">${server.description || ''}</textarea>
                      </div>
                      
                      <div class="editor-group">
                          <label class="editor-label">Игроки онлайн</label>
                          <input type="text" class="editor-input" id="serverPlayers" 
                                 value="${server.players || '45/100'}" placeholder="Например: 45/100"
                                 readonly>
                          <div class="editor-hint" style="font-size: 12px; color: #6B7280; margin-top: 4px;">
                              ⚠️ Эта информация будет обновляться автоматически с сервера
                          </div>
                      </div>
                      
                      <div class="editor-group">
                          <label class="editor-label">Пинг (мс)</label>
                          <input type="text" class="editor-input" id="serverPing" 
                                 value="${server.ping || '45 ms'}" placeholder="Например: 45 ms"
                                 readonly>
                          <div class="editor-hint" style="font-size: 12px; color: #6B7280; margin-top: 4px;">
                              ⚠️ Эта информация будет обновляться автоматически с сервера
                          </div>
                      </div>
                      
                      <div class="editor-group">
                          <label class="editor-label">Изображение сервера</label>
                          <div style="border: 2px dashed #D1D5DB; border-radius: 8px; padding: 20px; text-align: center; cursor: pointer;" 
                               onclick="launcherApp.selectServerImage('${this.editingServerId}')">
                              ${server.image ? `
                                  <div style="width: 100%; height: 150px; border-radius: 6px; overflow: hidden; margin-bottom: 12px;">
                                      <img src="${server.image}" alt="${server.name}" style="width: 100%; height: 100%; object-fit: cover;">
                                  </div>
                                  <button type="button" class="btn btn-secondary" onclick="event.stopPropagation(); launcherApp.removeServerImage('${this.editingServerId}')">
                                      Удалить изображение
                                  </button>
                              ` : `
                                  <div style="padding: 40px 20px;">
                                      <div style="font-size: 48px; color: #9CA3AF; margin-bottom: 12px;">🖼️</div>
                                      <div style="color: #6B7280; margin-bottom: 8px;">Нажмите для загрузки изображения</div>
                                      <div style="font-size: 12px; color: #9CA3AF;">Рекомендуется 400x200px</div>
                                  </div>
                              `}
                              <input type="file" id="serverImageInput" class="hidden-file-input" accept="image/*">
                          </div>
                      </div>
                      
                      <div class="editor-buttons">
                          <button class="btn btn-primary" onclick="launcherApp.saveServerChanges()">
                              Сохранить изменения
                          </button>
                          <button class="btn btn-secondary" onclick="launcherApp.cancelEditServer()">
                              Отмена
                          </button>
                      </div>
                  `;
  };

  if (typeof P.getServerModsText !== 'function') P.getServerModsText = function (serverId) {
  
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
  };

  if (typeof P.getServersListAdmin !== 'function') P.getServersListAdmin = function () {
  
                  const servers = this.loadServers();
  
                  let html = '';
  
                  Object.entries(servers).forEach(([serverId, server]) => {
                      html += `
                          <div class="server-list-item-admin">
                              <div class="server-list-content-admin">
                                  <h4 class="server-list-title-admin">${server.name}</h4>
                                  <div class="server-list-details-admin">
                                      <div class="server-detail-admin">
                                          <span class="server-detail-label-admin">Версия:</span>
                                          <span class="server-detail-value-admin">${server.version}</span>
                                      </div>
                                      <div class="server-detail-admin">
                                          <span class="server-detail-label-admin">Моды:</span>
                                          <span class="server-detail-value-admin">${server.mods}</span>
                                      </div>
                                      <div class="server-detail-admin">
                                      <span class="server-detail-label-admin">IP:</span>
                                      <span class="server-detail-value-admin">${server.ip}:${server.port}</span>
                                  </div>
                                  <div class="server-detail-admin">
                                      <span class="server-detail-label-admin">Игроки:</span>
                                      <span class="server-detail-value-admin">${server.players}</span>
                                  </div>
                                      <div class="server-detail-admin">
                                          <span class="server-detail-label-admin">Пинг:</span>
                                          <span class="server-detail-value-admin">${server.ping}</span>
                                      </div>
                                  </div>
                                  <div class="server-detail-admin">
                                      <span class="server-detail-label-admin">Бейдж:</span>
                                      <span class="server-detail-value-admin" style="background: ${server.badgeType === 'classic' ? '#7C3AED' : server.badgeType === 'hitech' ? '#059669' : server.badgeType === 'modded' ? '#D97706' : '#DC2626'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">
                                          ${server.badge}
                                      </span>
                                  </div>
                              </div>
                              <div class="server-list-actions-admin">
                                  <button class="server-action-btn edit" onclick="launcherApp.editServer('${serverId}')">
                                      Редактировать
                                  </button>
                                  <button class="server-action-btn image" onclick="launcherApp.quickUploadImage('${serverId}')">
                                      Изменить изображение
                                  </button>
                              </div>
                          </div>
                      `;
                  });
  
                  return html || '<div style="text-align: center; color: #9CA3AF; padding: 20px;">Серверов нет</div>';
  };

  if (typeof P.getUsersList !== 'function') P.getUsersList = function () {
  
                  const allUsers = JSON.parse(localStorage.getItem('onlyus_users') || '[]');
                  const currentUserName = this.currentUser?.name;
                  
                  let html = '';
                  allUsers.forEach(user => {
                      html += `
                          <div class="user-list-item">
                              <div class="user-list-info">
                                  <div class="user-list-avatar">
                                      ${user.avatarImage ? 
                                          `<img src="${user.avatarImage}" alt="${user.name}">` : 
                                          user.avatar || user.name.charAt(0).toUpperCase()
                                      }
                                  </div>
                                  <div class="user-list-details">
                                      <h4>${user.name} ${user.name === currentUserName ? '<span class="user-you-badge">Вы</span>' : ''}</h4>
                                      <span style="display: block; margin-bottom: 4px; color: #6B7280; font-size: 13px;">${user.email || 'Нет почты'}</span>
                                      <span class="admin-status ${user.isAdmin ? 'admin' : 'user'}">
                                          ${user.isAdmin ? '👑 Администратор' : '👤 Игрок'}
                                      </span>
                                  </div>
                              </div>
                              <div class="user-list-actions">
                                  ${user.name !== currentUserName ? `
                                      ${user.isAdmin ? 
                                          `<button class="user-action-btn remove-admin" onclick="launcherApp.removeAdminRights('${user.name}')">
                                              Убрать права
                                          </button>` : 
                                          `<button class="user-action-btn make-admin" onclick="launcherApp.grantAdminRights('${user.name}')">
                                              Назначить админом
                                          </button>`
                                      }
                                      <button class="user-action-btn delete-account-btn" onclick="launcherApp.deleteUserAccount('${user.name}')">
                                          Удалить аккаунт
                                      </button>
                                  ` : '<span style="color: #9CA3AF; font-size: 12px; padding: 6px 12px;">Это вы</span>'}
                              </div>
                          </div>
                      `;
                  });
                  
                  return html || '<div style="text-align: center; color: #9CA3AF; padding: 20px;">Пользователей нет</div>';
  };

  if (typeof P.grantAdminRights !== 'function') P.grantAdminRights = function (username) {
  
                  if (confirm(`Назначить пользователя "${username}" администратором?`)) {
                      const users = JSON.parse(localStorage.getItem('onlyus_users') || '[]');
                      const userIndex = users.findIndex(u => u.name === username);
                      
                      if (userIndex !== -1) {
                          users[userIndex].isAdmin = true;
                          localStorage.setItem('onlyus_users', JSON.stringify(users));

                          // ✅ синхронизируем админов в ops.json на сервере
                          syncAdminsToServer('vanilla');
                          
                          // Если это текущий пользователь, обновляем его статус
                          if (this.currentUser && this.currentUser.name === username) {
                              this.currentUser.isAdmin = true;
                              this.isAdmin = true;
                              this.saveUserData();
                              this.updateUserProfile();
                          }
                          
                          this.showNotification(`Пользователь "${username}" назначен администратором`, 'success');
                          this.filterUsers(); // Обновляем список
                      }
                  }
  };

  if (typeof P.initAdminPage !== 'function') P.initAdminPage = function () {
  
                  this.initAdminTabs();
                  this.initServerEditor();
                  this.initNewsEditor();
                  this.setupFileUpload('vanilla', 'Admin');
                  this.setupFileUpload('hitech', 'Admin');
  
                  // Удаляем старые обработчики перед добавлением новых
                  document.removeEventListener('click', this.handleModsClick);
                  
                  // Создаем новый обработчик
                  this.handleModsClick = (e) => {
                      if (e.target.matches('#addModBtn')) {
                          this.addMod();
                      }
                      if (e.target.matches('#saveModsBtn')) {
                          this.saveMods();
                      }
                      if (e.target.matches('.delete-mod-btn')) {
                          this.deleteMod(e.target.dataset.id);
                      }
                  };
      
                  // Добавляем обработчик
                  document.addEventListener('click', this.handleModsClick);
  };

  if (typeof P.initAdminTabs !== 'function') P.initAdminTabs = function () {
  
                  document.querySelectorAll('.admin-tab').forEach(tab => {
                      tab.addEventListener('click', (e) => {
                          const tabName = e.currentTarget.dataset.tab;
                          
                          document.querySelectorAll('.admin-tab').forEach(t => {
                              t.classList.remove('active');
                          });
                          e.currentTarget.classList.add('active');
                          
                          document.querySelectorAll('.admin-tab-content').forEach(content => {
                              content.classList.remove('active');
                          });
                          document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('active');
                      });
                  });
  };

  if (typeof P.initNewsEditor !== 'function') P.initNewsEditor = function () {
  
                  const saveBtn = document.getElementById('saveNewsBtn');
                  if (saveBtn) {
                      saveBtn.addEventListener('click', () => {
                          this.saveNewsItem();
                      });
                  }
                  
                  if (this.editingNewsId) {
                      const news = this.loadNews();
                      const newsItem = news.find(n => n.id === this.editingNewsId);
                      if (newsItem) {
                          document.getElementById('newsTitle').value = newsItem.title;
                          document.getElementById('newsContent').value = newsItem.content;
                          document.getElementById('newsTags').value = newsItem.tags ? newsItem.tags.join(', ') : '';
                          document.getElementById('newsPublished').checked = newsItem.status === 'published';
                      }
                  }
  };

  if (typeof P.initServerEditor !== 'function') P.initServerEditor = function () {
  
                  // Инициализация будет при редактировании сервера
  };

  if (typeof P.loadMods !== 'function') P.loadMods = function () {
  
                  if (!localStorage.getItem('serverMods')) {
                      localStorage.setItem('serverMods', JSON.stringify(this.mods));
                  }
                  return JSON.parse(localStorage.getItem('serverMods') || '[]');
  };

  if (typeof P.loadNews !== 'function') P.loadNews = function () {
  
                  if (!localStorage.getItem('onlyus_news')) {
                      const initialNews = [
                          {
                              id: '1',
                              title: 'Играть - Новости - Настройки',
                              content: 'Тут будут новости сервера, могут быть длинными или короткими. Фрейм сам будет подстраиваться под количество текста.\n\n<b>Новые обновления:</b>\n• Исправлены ошибки соединения\n• Добавлены новые скины\n• Улучшена производительность',
                              date: new Date().toISOString(),
                              author: 'Администрация',
                              status: 'published',
                              tags: ['обновление', 'сервер']
                          }
                      ];
                      localStorage.setItem('onlyus_news', JSON.stringify(initialNews));
                  }
                  return JSON.parse(localStorage.getItem('onlyus_news') || '[]');
  };

  if (typeof P.loadServers !== 'function') P.loadServers = function () {
  
                  if (!localStorage.getItem('onlyus_servers')) {
                      localStorage.setItem('onlyus_servers', JSON.stringify(this.defaultServers));
                  }
                  
                  const savedServers = JSON.parse(localStorage.getItem('onlyus_servers') || '{}');
                  
                  const vanillaImage = localStorage.getItem('server_image_vanilla');
                  const hitechImage = localStorage.getItem('server_image_hitech');
                  
                  if (savedServers.vanilla) {
                      savedServers.vanilla.image = vanillaImage;
                  }
                  if (savedServers.hitech) {
                      savedServers.hitech.image = hitechImage;
                  }
                  
                  return savedServers;
  };

  if (typeof P.loadUserData !== 'function') P.loadUserData = function () {
  
                  try {
                      const savedData = localStorage.getItem('onlyus_user');
                      if (savedData) {
                          const userData = JSON.parse(savedData);
                          this.currentUser = userData;
  
  // ✅ автологин только если пользователь включил "Сохранить пароль"
  this.isAuthenticated = userData.rememberPassword === true;

  // isAdmin может приходить как isAdmin или role='admin'
  this.isAdmin = (userData.isAdmin === true) || (userData.role === 'admin');
  // нормализуем имя (сервер может хранить username)
  if (!userData.name && userData.username) userData.name = userData.username;
  this.ramValue = userData.ramValue || 4;
                          
                          // Загружаем статистику
                          if (localStorage.getItem(`user_stats_${userData.name}`)) {
                              this.userStats = JSON.parse(localStorage.getItem(`user_stats_${userData.name}`));
                          }
                          
                          // Загружаем настройки аккаунта
                          if (localStorage.getItem(`account_settings_${userData.name}`)) {
                              this.accountSettings = JSON.parse(localStorage.getItem(`account_settings_${userData.name}`));
                          }
                          
                          this.updateUserProfile();
                      }
                  } catch (error) {
                      console.log('Нет сохраненных данных пользователя');
                  }
  };

  if (typeof P.onModPackChange !== 'function') P.onModPackChange = function (packId) {
  
                  const customModsContainer = document.getElementById('customModsContainer');
                  if (customModsContainer) {
                      customModsContainer.style.display = packId === 'custom' ? 'block' : 'none';
                  }
  };

  if (typeof P.openAvatarUpload !== 'function') P.openAvatarUpload = function () {
  
                  const modal = document.getElementById('imageUploadModal');
                  const content = document.getElementById('imageUploadContent');
                  
                  if (content) {
                      content.innerHTML = `
                          <div style="text-align: center; padding: 20px;">
                              <div style="font-size: 48px; color: #3B82F6; margin-bottom: 16px;">📷</div>
                              <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 12px;">
                                  Изменение аватара
                              </h3>
                              <p style="color: #6B7280; line-height: 1.5; margin-bottom: 24px;">
                                  Выберите изображение для вашего аватара. Рекомендуемый размер: 256×256 px
                              </p>
                              <div style="border: 2px dashed #D1D5DB; border-radius: 12px; padding: 40px 20px; margin-bottom: 24px; cursor: pointer;" 
                                   onclick="document.getElementById('avatarUploadInput').click()">
                                  <div style="font-size: 48px; color: #9CA3AF; margin-bottom: 16px;">⬆️</div>
                                  <div style="color: #6B7280; margin-bottom: 8px;">Нажмите для выбора файла</div>
                                  <div style="font-size: 14px; color: #9CA3AF;">Поддерживаются: JPG, PNG, GIF</div>
                              </div>
                              <input type="file" id="avatarUploadInput" class="hidden-file-input" accept="image/*" onchange="launcherApp.uploadAvatar(event)">
                              
                              ${this.currentUser?.avatarImage ? `
                                  <div style="margin-top: 24px;">
                                      <h4 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px;">Текущий аватар</h4>
                                      <div style="width: 100px; height: 100px; border-radius: 50%; overflow: hidden; margin: 0 auto 16px; border: 3px solid #E5E7EB;">
                                          <img src="${this.currentUser.avatarImage}" alt="Current Avatar" style="width: 100%; height: 100%; object-fit: cover;">
                                      </div>
                                      <button class="btn btn-danger" onclick="launcherApp.removeAvatar()">
                                          Удалить аватар
                                      </button>
                                  </div>
                              ` : ''}
                          </div>
                      `;
                  }
                  
                  if (modal) {
                      modal.style.display = 'flex';
                  }
  };

  if (typeof P.publishNews !== 'function') P.publishNews = function (newsId) {
  
                  const news = this.loadNews();
                  const index = news.findIndex(n => n.id === newsId);
                  
                  if (index !== -1) {
                      news[index].status = 'published';
                      news[index].publishedAt = new Date().toISOString();
                      this.saveNews(news);
                      this.showNotification('Новость опубликована!', 'success');
                      this.showPage('admin');
                      document.querySelector('[data-tab="news"]').click();
                  }
  };

  if (typeof P.quickImageUpload !== 'function') P.quickImageUpload = function (serverId, file) {
  
                  if (!file.type.startsWith('image/')) {
                      this.showNotification('Пожалуйста, выберите файл изображения (PNG, JPG, JPEG)', 'error');
                      return;
                  }
                  
                  if (file.size > 5 * 1024 * 1024) {
                      this.showNotification('Размер файла не должен превышать 5MB', 'error');
                      return;
                  }
                  
                  const reader = new FileReader();
                  
                  reader.onload = (e) => {
                      const imageData = e.target.result;
                      
                      const servers = this.loadServers();
                      if (servers[serverId]) {
                          servers[serverId].image = imageData;
                          this.saveServers(servers);
                          
                          this.showNotification(`Изображение для сервера ${servers[serverId].name} успешно загружено!`, 'success');
                          
                          // Обновляем страницу
                          setTimeout(() => {
                              this.showPage('admin');
                              document.querySelector('[data-tab="images"]').click();
                          }, 300);
                      }
                  };
                  
                  reader.onerror = () => {
                      this.showNotification('Ошибка при чтении файла', 'error');
                  };
                  
                  reader.readAsDataURL(file);
  };

  if (typeof P.quickUploadImage !== 'function') P.quickUploadImage = function (serverId) {
  
                  const fileInput = document.getElementById(`${serverId}FileInputAdmin`);
                  if (fileInput) {
                      fileInput.onchange = (e) => {
                          const file = e.target.files[0];
                          if (file) {
                              this.quickImageUpload(serverId, file);
                          }
                      };
                      fileInput.click();
                  }
  };

  if (typeof P.removeAdminRights !== 'function') P.removeAdminRights = function (username) {
  
                  if (confirm(`Убрать административные права у пользователя "${username}"?`)) {
                      const users = JSON.parse(localStorage.getItem('onlyus_users') || '[]');
                      const userIndex = users.findIndex(u => u.name === username);
                      
                      if (userIndex !== -1) {
                          users[userIndex].isAdmin = false;
                          localStorage.setItem('onlyus_users', JSON.stringify(users));
                          // ✅ синхронизируем админов в ops.json на сервере
                          syncAdminsToServer('vanilla');
                          
                          // Если это текущий пользователь, обновляем его статус
                          if (this.currentUser && this.currentUser.name === username) {
                              this.currentUser.isAdmin = false;
                              this.isAdmin = false;
                              this.saveUserData();
                              this.updateUserProfile();
                              
                              // Если мы на странице админа, переходим на главную
                              if (this.currentPage === 'admin') {
                                  this.showPage('main');
                              }
                          }
                          
                          this.showNotification(`Пользователь "${username}" больше не администратор`, 'success');
                          this.filterUsers(); // Обновляем список
                      }
                  }
  };

  if (typeof P.removeAvatar !== 'function') P.removeAvatar = function () {
  
                  if (confirm('Удалить аватар?')) {
                      delete this.currentUser.avatarImage;
                      this.saveUserData();
                      this.updateUserProfile();
                      this.closeImageUploadModal();
                      this.showNotification('Аватар удален', 'success');
                      
                      if (this.currentPage === 'account') {
                          this.showPage('account');
                      }
                  }
  };

  if (typeof P.removeServerImage !== 'function') P.removeServerImage = function (serverId) {
  
                  if (confirm('Удалить изображение сервера?')) {
                      const servers = this.loadServers();
                      if (servers[serverId]) {
                          servers[serverId].image = null;
                          this.saveServers(servers);
                          
                          this.showNotification('Изображение удалено', 'success');
                          this.editServer(serverId);
                      }
                  }
  };

  if (typeof P.saveMods !== 'function') P.saveMods = function () {
  
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
                  
                  localStorage.setItem('serverMods', JSON.stringify(updatedMods));
                  this.mods = updatedMods;
                  this.showNotification('Моды успешно сохранены!', 'success');
  };

  if (typeof P.saveNews !== 'function') P.saveNews = function (news) {
  
                  localStorage.setItem('onlyus_news', JSON.stringify(news));
  };

  if (typeof P.saveNewsItem !== 'function') P.saveNewsItem = function () {
  
                  const title = document.getElementById('newsTitle')?.value.trim();
                  const content = document.getElementById('newsContent')?.value.trim();
                  const tags = document.getElementById('newsTags')?.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                  const published = document.getElementById('newsPublished')?.checked;
                  
                  if (!title || !content) {
                      this.showNotification('Заполните заголовок и содержание новости', 'error');
                      return;
                  }
                  
                  const news = this.loadNews();
                  
                  if (this.editingNewsId) {
                      const index = news.findIndex(n => n.id === this.editingNewsId);
                      if (index !== -1) {
                          news[index] = {
                              ...news[index],
                              title,
                              content,
                              tags: tags || [],
                              status: published ? 'published' : 'draft',
                              updatedAt: new Date().toISOString()
                          };
                          this.showNotification('Новость обновлена успешно!', 'success');
                      }
                  } else {
                      const newNews = {
                          id: Date.now().toString(),
                          title,
                          content,
                          date: new Date().toISOString(),
                          author: this.currentUser?.name || 'Администрация',
                          status: published ? 'published' : 'draft',
                          tags: tags || [],
                          createdAt: new Date().toISOString()
                      };
                      news.unshift(newNews);
                      this.showNotification('Новость создана успешно!', 'success');
                  }
                  
                  this.saveNews(news);
                  this.showPage('admin');
                  document.querySelector('[data-tab="news"]').click();
  };

  if (typeof P.saveServerChanges !== 'function') P.saveServerChanges = function () {
  
                  const serverId = this.editingServerId;
                  if (!serverId) return;
                  
                  const name = document.getElementById('serverName')?.value.trim();
                  const version = document.getElementById('serverVersion')?.value.trim();
                  const mods = document.getElementById('serverMods')?.value.trim();
                  const badgeType = document.getElementById('serverBadgeType')?.value;
                  const badge = document.getElementById('serverBadge')?.value.trim();
                  const description = document.getElementById('serverDescription')?.value.trim();
                  
                  if (!name || !version) {
                      this.showNotification('Заполните название и версию сервера', 'error');
                      return;
                  }
                  
                  const servers = this.loadServers();
                   if (servers[serverId]) {
                      servers[serverId] = {
                          ...servers[serverId],
                          name,
                          version,
                          mods: mods || servers[serverId].mods,
                          badgeType: badgeType || 'classic',
                          badge: badge || 'Classic',
                          description: description || servers[serverId].description
                      };
          
                      this.saveServers(servers);
                      this.showNotification('Изменения сервера сохранены!', 'success');
          
                      // Обновляем список серверов
                      this.updateServersList();
          
                      // Если мы на главной странице, обновляем её
                      if (this.currentPage === 'main') {
                          setTimeout(() => {
                              this.showPage('main');
                          }, 300);
                       }
                  }
  };

  if (typeof P.saveServers !== 'function') P.saveServers = function (servers) {
  
                  const serversToSave = { ...servers };
                  
                  if (serversToSave.vanilla && serversToSave.vanilla.image) {
                      localStorage.setItem('server_image_vanilla', serversToSave.vanilla.image);
                      delete serversToSave.vanilla.image;
                  }
                  
                  if (serversToSave.hitech && serversToSave.hitech.image) {
                      localStorage.setItem('server_image_hitech', serversToSave.hitech.image);
                      delete serversToSave.hitech.image;
                  }
                  
                  localStorage.setItem('onlyus_servers', JSON.stringify(serversToSave));
  };

  if (typeof P.saveUserData !== 'function') P.saveUserData = function () {
  
                  if (this.currentUser) {
                      this.currentUser.ramValue = this.ramValue;
                      this.currentUser.isAdmin = this.isAdmin;
                      localStorage.setItem('onlyus_user', JSON.stringify(this.currentUser));
                      
                      // Сохраняем статистику
                      localStorage.setItem(`user_stats_${this.currentUser.name}`, JSON.stringify(this.userStats));
                      
                      // Сохраняем настройки аккаунта
                      localStorage.setItem(`account_settings_${this.currentUser.name}`, JSON.stringify(this.accountSettings));
                  
                      // ✅ синхронизируем данные пользователя в базе onlyus_users,
                      // чтобы аватар/ram/rememberPassword сохранялись между сессиями
                      try {
                          const users = JSON.parse(localStorage.getItem('onlyus_users') || '[]');
                          const idx = users.findIndex(u => u.name === this.currentUser.name);
                          if (idx !== -1) {
                              users[idx] = {
                                  ...users[idx],
                                  avatar: this.currentUser.avatar,
                                  avatarImage: this.currentUser.avatarImage,
                                  ramValue: this.currentUser.ramValue,
                                  isAdmin: this.currentUser.isAdmin,
                                  rememberPassword: this.currentUser.rememberPassword === true
                              };
                              localStorage.setItem('onlyus_users', JSON.stringify(users));
                          }
                      } catch (e) {
                          console.warn('Не удалось обновить onlyus_users:', e);
                      }
                  }
  };

  if (typeof P.selectServerImage !== 'function') P.selectServerImage = function (serverId) {
  
                  const fileInput = document.getElementById('serverImageInput');
                  if (fileInput) {
                      fileInput.onchange = (e) => {
                          const file = e.target.files[0];
                          if (file) {
                              this.uploadServerImage(serverId, file);
                          }
                      };
                      fileInput.click();
                  }
  };

  if (typeof P.setupFileUpload !== 'function') P.setupFileUpload = function (serverType, suffix = '') {
  
                  const fileInput = document.getElementById(`${serverType}FileInput${suffix}`);
                  const uploadCard = document.getElementById(`${serverType}UploadCard${suffix}`);
                  
                  if (fileInput) {
                      fileInput.addEventListener('change', (e) => {
                          const file = e.target.files[0];
                          if (file) {
                              this.quickImageUpload(serverType, file);
                          }
                      });
                  }
                  
                  if (uploadCard) {
                      uploadCard.addEventListener('dragover', (e) => {
                          e.preventDefault();
                          uploadCard.classList.add('active');
                      });
                      
                      uploadCard.addEventListener('dragleave', () => {
                          uploadCard.classList.remove('active');
                      });
                      
                      uploadCard.addEventListener('drop', (e) => {
                          e.preventDefault();
                          uploadCard.classList.remove('active');
                          
                          const file = e.dataTransfer.files[0];
                          if (file && file.type.startsWith('image/')) {
                              this.quickImageUpload(serverType, file);
                          } else {
                              alert('Пожалуйста, выберите файл изображения (PNG, JPG, JPEG)');
                          }
                      });
                  }
  };

  if (typeof P.showAdminLogin !== 'function') P.showAdminLogin = function () {
  
                  const username = prompt('Введите логин администратора:');
                  const password = prompt('Введите пароль администратора:');
                  
                  if (username === this.adminCredentials.username && 
                      password === this.adminCredentials.password) {
                      
                      this.isAdmin = true;
                      this.adminMode = true;
                      
                      if (this.currentUser) {
                          this.currentUser.isAdmin = true;
                          this.saveUserData();
                      }
                      
                      this.updateUserProfile();
                      this.showPage('admin');
                      this.showNotification('Успешный вход в админ-панель!', 'success');
                      
                  } else {
                      this.showNotification('Неверный логин или пароль администратора', 'error');
                      this.showPage('main');
                  }
  };

  if (typeof P.showDeleteAccountConfirmation !== 'function') P.showDeleteAccountConfirmation = function () {
  
                  this.showNotification('Удаление аккаунта доступно только через администратора', 'info');
  };

  if (typeof P.toggleModServer !== 'function') P.toggleModServer = function (modId, serverId) {
  
                  const row = document.querySelector(`tr[data-id="${modId}"]`);
                  if (!row) return;
                  
                  const option = row.querySelector(`.server-option .server-badge-icon.${serverId}`).closest('.server-option');
                  const checkbox = option.querySelector('input');
                  
                  checkbox.checked = !checkbox.checked;
                  option.classList.toggle('selected', checkbox.checked);
                  
                  // Показываем уведомление об изменении
                  const serverName = serverId === 'vanilla' ? 'Vanilla' : 'Hi-Tech';
                  const action = checkbox.checked ? 'добавлен' : 'удален';
                  this.showNotification(`Мод будет ${action} для сервера ${serverName}`, 'info');
  };

  if (typeof P.updateServersList !== 'function') P.updateServersList = function () {
  
                  const list = document.getElementById('serversListAdmin');
                  if (list) {
                      list.innerHTML = this.getServersListAdmin();
                  }
  };

  if (typeof P.updateUserProfile !== 'function') P.updateUserProfile = function () {
  
                  if (this.currentUser) {
                      const avatar = document.getElementById('userAvatar');
                      const name = document.getElementById('userName');
                      const role = document.getElementById('userRole');
                      
                      if (avatar) {
                          if (this.currentUser.avatarImage) {
                              avatar.innerHTML = `<img src="${this.currentUser.avatarImage}" alt="${this.currentUser.name}">`;
                          } else {
                              avatar.textContent = this.currentUser.avatar;
                          }
                      }
                      
                      if (name) {
                          name.textContent = (this.currentUser.name || this.currentUser.username || 'Гость');
                      }
                      
                      if (role) {
                          const isAdmin = (this.isAdmin === true) || (this.currentUser && this.currentUser.role === 'admin') || (this.currentUser && this.currentUser.isAdmin === true);
                          role.textContent = isAdmin ? 'Администратор' : (this.currentUser ? 'Игрок' : 'Гость');
                          role.className = 'user-role ' + (this.isAdmin ? 'admin' : '');
                      }
                      
                      const adminBtn = document.getElementById('adminNavBtn');
                      if (adminBtn) {
                          adminBtn.style.display = (((this.isAdmin === true) || (this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.isAdmin === true))) ? 'flex' : 'none');
                      }
                      
                      const adminIndicator = document.getElementById('adminModeIndicator');
                      if (adminIndicator) {
                          adminIndicator.classList.toggle('show', (((this.isAdmin === true) || (this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.isAdmin === true))) && this.adminMode));
                      }
                  }
  };

  if (typeof P.uploadAvatar !== 'function') P.uploadAvatar = function (event) {
  
                  const file = event.target.files[0];
                  if (!file) return;
                  
                  if (!file.type.startsWith('image/')) {
                      this.showNotification('Пожалуйста, выберите файл изображения', 'error');
                      return;
                  }
                  
                  if (file.size > 2 * 1024 * 1024) {
                      this.showNotification('Размер файла не должен превышать 2MB', 'error');
                      return;
                  }
                  
                  const reader = new FileReader();
                  
                  reader.onload = (e) => {
                      const imageData = e.target.result;
                      
                      if (!this.currentUser) {
                          this.currentUser = {
                              name: 'Пользователь',
                              avatar: 'П',
                              email: 'user@example.com'
                          };
                      }
                      
                      this.currentUser.avatarImage = imageData;
                      this.saveUserData();
                      this.updateUserProfile();
                      this.closeImageUploadModal();
                      this.showNotification('Аватар успешно обновлен!', 'success');
                      
                      // Обновляем страницу настроек
                      if (this.currentPage === 'account') {
                          this.showPage('account');
                      }
                  };
                  
                  reader.onerror = () => {
                      this.showNotification('Ошибка при чтении файла', 'error');
                  };
                  
                  reader.readAsDataURL(file);
  };

  if (typeof P.uploadServerImage !== 'function') P.uploadServerImage = function (serverId, file) {
  
                  if (!file.type.startsWith('image/')) {
                      this.showNotification('Пожалуйста, выберите файл изображения (PNG, JPG, JPEG)', 'error');
                      return;
                  }
                  
                  if (file.size > 5 * 1024 * 1024) {
                      this.showNotification('Размер файла не должен превышать 5MB', 'error');
                      return;
                  }
                  
                  const reader = new FileReader();
                  
                  reader.onload = (e) => {
                      const imageData = e.target.result;
                      
                      const servers = this.loadServers();
                      if (servers[serverId]) {
                          servers[serverId].image = imageData;
                          this.saveServers(servers);
                          
                          this.showNotification(`Изображение для сервера ${servers[serverId].name} успешно загружено!`, 'success');
                          
                          // Обновляем форму
                          this.editServer(serverId);
                      }
                  };
                  
                  reader.onerror = () => {
                      this.showNotification('Ошибка при чтении файла', 'error');
                  };
                  
                  reader.readAsDataURL(file);
  };

})();


// ===== FIX: prompt() не поддерживается в Electron — заменяем на модалку =====
(() => {
  const P = window.LauncherApp && window.LauncherApp.prototype;
  if (!P) return;

  P.showAdminLogin = function () {
    if (document.getElementById('adminLoginModal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'adminLoginModal';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.55)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '99999';

    const card = document.createElement('div');
    card.style.width = '380px';
    card.style.maxWidth = '92vw';
    card.style.background = '#0b1220';
    card.style.border = '1px solid rgba(255,255,255,0.10)';
    card.style.borderRadius = '14px';
    card.style.padding = '18px';
    card.style.color = '#fff';

    card.innerHTML = `
      <div style="font-weight:700;font-size:16px;margin-bottom:10px;">Вход в админку</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <input id="admLogin" placeholder="Логин" style="padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.14);background:#07101d;color:#fff;outline:none;">
        <input id="admPass" type="password" placeholder="Пароль" style="padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.14);background:#07101d;color:#fff;outline:none;">
        <div id="admErr" style="color:#ff7b7b;min-height:18px;font-size:12px;"></div>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button id="admCancel" style="padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.16);background:transparent;color:#fff;cursor:pointer;">Отмена</button>
          <button id="admOk" style="padding:10px 12px;border-radius:10px;border:0;background:#2563eb;color:#fff;cursor:pointer;">Войти</button>
        </div>
      </div>
    `;
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    card.querySelector('#admCancel').addEventListener('click', close);

    card.querySelector('#admOk').addEventListener('click', () => {
      const u = card.querySelector('#admLogin').value.trim();
      const p = card.querySelector('#admPass').value.trim();
      const err = card.querySelector('#admErr');
      if (!u || !p) { err.textContent = 'Введите логин и пароль'; return; }

      const creds = this.adminCredentials || { username: 'admin', password: 'admin123' };
      if (u === creds.username && p === creds.password) {
        this.isAdmin = true;
        this.adminMode = true;
        // гарантируем currentUser, иначе внизу будет показываться "Гость"
        if (!this.currentUser) {
          this.currentUser = {
            name: u,
            username: u,
            avatar: (u || 'A').charAt(0).toUpperCase(),
            email: ''
          };
        }
        if (!this.currentUser.name && this.currentUser.username) this.currentUser.name = this.currentUser.username;
        this.currentUser.role = 'admin';
        this.currentUser.isAdmin = true;
        try { this.saveUserData?.(); } catch (e) {}
        try { this.updateUserProfile?.(); } catch (e) {}
        try { this.showNotification?.('Успешный вход в админ-панель!', 'success'); } catch (e) {}
        close();
        this.showPage('admin');
      } else {
        err.textContent = 'Неверные данные';
      }
    });
  };
})();

// ---
// Local-only build:
// Этот файл намеренно НЕ содержит кода работы с API/сервером.
// Все сущности (users/news/servers/mods/images) хранятся в localStorage.
// ---
