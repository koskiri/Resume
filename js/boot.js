// src/renderer/js/boot.js
document.addEventListener('DOMContentLoaded', () => {
  window.launcherApp = new window.LauncherApp();

  // ✅ Гарантируем, что auth-методы (в т.ч. logout) смонтированы всегда,
  // даже если автологин сразу отправляет на main и login/register не открывались.
  try {
    window.OnlyUsPages?.login?.mount?.(window.launcherApp);
    window.OnlyUsPages?.register?.mount?.(window.launcherApp);
  } catch (e) {
    console.warn('[boot] auth mount failed:', e);
  }

  // Now that auth methods are mounted (including loadUserData/fetchMe), initialize the app.
  try {
    const r = window.launcherApp.init?.();
    if (r && typeof r.then === 'function') r.catch(err => console.warn('[boot] init failed:', err));
  } catch (e) {
    console.warn('[boot] init failed:', e);
  }
});
