// src/renderer/js/core/ui.js
// Шаг 4: общие UI-хелперы (escape/safe query/bindOnce/notify/modal)

(() => {
  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (m) => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }

  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  // Avoid duplicate listeners on re-rendered pages
  function bindOnce(el, event, handler, key) {
    if (!el) return;
    const k = key || `${event}:${handler && handler.name ? handler.name : 'anon'}`;
    el.__onlyus_bound = el.__onlyus_bound || new Set();
    if (el.__onlyus_bound.has(k)) return;
    el.__onlyus_bound.add(k);
    el.addEventListener(event, handler);
  }

  // Minimal notify (uses existing showNotification if present on app)
  function notify(text, type = 'info') {
    try {
      // If a toast system exists, it can hook into this later
      console.log(`[${type}]`, text);
      // keep alerts only for errors by default
      if (type === 'error') alert(text);
    } catch (e) {}
  }

  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'block';
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }

  window.OnlyUsUI = { escapeHtml, qs, qsa, bindOnce, notify, openModal, closeModal };
})();
