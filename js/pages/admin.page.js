// js/pages/admin.page.js (bridge for legacy admin.js)
// This file makes the legacy prototype-based admin.js work with the new page router (OnlyUsPages).
// Requirements:
// - js/app.js defines window.LauncherApp
// - js/admin.js patches LauncherApp.prototype (getAdminPage, initAdminTabs, initNewsEditor, initServerEditor, ...)
// Usage:
// - Keep this file included
// - Include js/admin.js after js/app.js and before js/boot.js
// - Remove modern conflicting admin.actions.js and admin.mousedown.fix.js to avoid double-control

(() => {
  window.OnlyUsPages = window.OnlyUsPages || {};

  window.OnlyUsPages.admin = {
    render(app) {
      if (!app || typeof app.getAdminPage !== 'function') {
        return `
          <div class="page-container">
            <h1 class="page-title">Админка</h1>
            <div class="card">
              <div style="color:#DC2626;">admin.js не подключён или методы админки не смонтированы.</div>
              <div style="margin-top:8px;color:#6B7280;font-size:13px;">
                Проверь порядок скриптов: app.js → admin.js → остальные страницы → boot.js
              </div>
            </div>
          </div>
        `;
      }
      return app.getAdminPage();
    },
    mount(app) {
      // Initialize legacy admin behaviors after HTML is in DOM
      try { app.initAdminTabs?.(); } catch (e) {}
      try { app.initNewsEditor?.(); } catch (e) {}
      try { app.initServerEditor?.(); } catch (e) {}
      try { app.updateUsersList?.(); } catch (e) {}
      try { app.updateNewsList?.(); } catch (e) {}
      try { app.updateServersList?.(); } catch (e) {}
      try { app.updateModsList?.(); } catch (e) {}
    }
  };
})();
