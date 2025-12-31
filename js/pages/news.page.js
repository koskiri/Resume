// src/renderer/js/pages/news.page.js
// Router-based page: News (read-only)
// Не зависит от legacy getNewsPage() из servers.js.

(() => {
  window.OnlyUsPages = window.OnlyUsPages || {};

  const esc = (s) => {
    try {
      return (window.OnlyUsUI && typeof window.OnlyUsUI.escapeHtml === 'function')
        ? window.OnlyUsUI.escapeHtml(String(s ?? ''))
        : String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    } catch (_) {
      return '';
    }
  };

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      if (!Number.isFinite(d.getTime())) return '';
      return d.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (_) {
      return '';
    }
  }

  function normalizeList(list) {
    const arr = Array.isArray(list) ? list : [];
    // published only
    return arr
      .filter(n => (n?.status || 'published') === 'published')
      .sort((a, b) => {
        const ta = new Date(a?.date || 0).getTime() || 0;
        const tb = new Date(b?.date || 0).getTime() || 0;
        return tb - ta;
      });
  }

  function renderNewsItem(n) {
    const title = esc(n?.title || '');
    const author = esc(n?.author || 'Администрация');
    const date = esc(formatDate(n?.date));

    // Контент храним как текст, показываем как текст (без HTML) — безопаснее.
    const content = esc(n?.content || '');

    const tags = Array.isArray(n?.tags) ? n.tags.filter(Boolean).slice(0, 8) : [];
    const tagsHtml = tags.length
      ? `<div class="news-tags">${tags.map(t => `<span class="news-tag">#${esc(t)}</span>`).join('')}</div>`
      : '';

    return `
      <article class="news-card" data-id="${esc(n?.id || '')}">
        <div class="news-head">
          <div class="news-title">${title}</div>
          <div class="news-meta">${date}${date && author ? ' • ' : ''}${author}</div>
        </div>
        <div class="news-content">${content || '<span class="muted">(без текста)</span>'}</div>
        ${tagsHtml}
      </article>
    `;
  }

  function renderPage(app) {
    const listRaw = window.OnlyUsStore?.getNews?.([]) || [];
    const list = normalizeList(listRaw);

    const body = list.length
      ? list.map(renderNewsItem).join('')
      : `<div class="empty-state">
           <div class="empty-title">Новостей пока нет</div>
           <div class="muted">Опубликованные новости появятся здесь автоматически.</div>
         </div>`;

    return `
      <div class="page" style="padding:20px">
        <div class="page-header">
          <div>
            <div class="page-title">Новости</div>
            <div class="muted">Последние обновления проекта и сервера</div>
          </div>
          <button id="newsRefresh" class="btn">Обновить</button>
        </div>
        <div class="news-list">${body}</div>
      </div>
    `;
  }

  async function init(app) {
    // Подтягиваем новости с сервера 1 раз на вход в страницу
    if (!app.__newsFetched) {
      app.__newsFetched = true;
      try { await window.OnlyUsStore?.fetchNews?.({ admin: false }); } catch (_) {}
      try { if (app.currentPage === 'news') app.showPage('news'); } catch (_) {}
    }
  }

  function mount(app) {
    const btn = document.getElementById('newsRefresh');
    if (!btn) return;
    btn.onclick = async () => {
      try {
        btn.disabled = true;
        await window.OnlyUsStore?.fetchNews?.({ admin: false });
        if (app?.currentPage === 'news') app.showPage('news');
        window.OnlyUsUI?.notify?.('Новости обновлены', 'success');
      } catch (e) {
        window.OnlyUsUI?.notify?.(e?.message || 'Не удалось обновить новости', 'error');
      } finally {
        btn.disabled = false;
      }
    };
  }

  // Минимальные стили, если в main.css их нет (не ломаем внешний вид)
  function ensureStyles() {
    if (document.getElementById('onlyus-news-style')) return;
    const style = document.createElement('style');
    style.id = 'onlyus-news-style';
    style.textContent = `
      .page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}
      .page-title{font-size:18px;font-weight:700;margin-bottom:4px}
      .news-list{display:grid;gap:12px}
      .news-card{border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px;background:rgba(0,0,0,.18)}
      .news-title{font-weight:700;margin-bottom:4px}
      .news-meta{font-size:12px;opacity:.75}
      .news-content{margin-top:10px;white-space:pre-wrap;line-height:1.35}
      .news-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
      .news-tag{font-size:12px;opacity:.85;padding:2px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.12)}
      .empty-state{padding:18px;border:1px dashed rgba(255,255,255,.18);border-radius:12px}
      .empty-title{font-weight:700;margin-bottom:4px}
    `;
    document.head.appendChild(style);
  }

  window.OnlyUsPages.news = {
    mount(app) { ensureStyles(); mount(app); },
    render: renderPage,
    init
  };
})();
