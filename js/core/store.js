// js/core/store.js
// Server-first store: данные (users/news/servers/mods/stats) берём с API и кэшируем локально.
// Локально остаются только токены/настройки/кэш (для оффлайна и быстрого старта).
(() => {
  // STRICT ONLINE MODE:
  // Persist ONLY auth tokens + lightweight settings. Do NOT persist content caches (news/servers/mods/users/stats).
  const STRICT_ONLINE = true;
  const PERSIST_ALLOW = new Set([
    'onlyus_access_token',
    'onlyus_refresh_token',
    'onlyus_api_url',
    'onlyus_ram_gb'
  ]);
  function canPersistKey(key) {
    if (!STRICT_ONLINE) return true;
    if (!key) return false;
    if (PERSIST_ALLOW.has(key)) return true;

    // block all caches and legacy local content stores
    if (key.startsWith('onlyus_stats_cache_')) return false;
    if (key.endsWith('_cache') || key.includes('_cache_')) return false;
    if (key === 'onlyus_users' || key === 'onlyus_news' || key === 'onlyus_servers') return false;

    // default: do not persist
    return false;
  }
  if (STRICT_ONLINE) {
    // purge any previously persisted caches so UI cannot fall back to stale local data
    try {
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k.startsWith('onlyus_') && !canPersistKey(k)) toRemove.push(k);
      }
      toRemove.forEach(k => { try { localStorage.removeItem(k); } catch (_) {} });
    } catch (_) {}
  }




  const KEYS = {
    // legacy (старые ключи; оставляем для миграции)
    USERS_LEGACY: 'onlyus_users',
    NEWS_LEGACY: 'onlyus_news',
    SERVERS_LEGACY: 'onlyus_servers',
    MODS_LEGACY: 'serverMods',

    // caches (новые ключи)
    USERS_CACHE: 'onlyus_users_cache',
    NEWS_CACHE: 'onlyus_news_cache',
    SERVERS_CACHE: 'onlyus_servers_cache',
    MODS_CACHE: 'onlyus_mods_cache',
    STATS_CACHE_PREFIX: 'onlyus_stats_cache_', // + username

    // current user (cache)
    USER: 'onlyus_user',

    // launcher settings
    RAM: 'onlyus_ram_gb',
    SERVER_IMG_VANILLA: 'server_image_vanilla',
    SERVER_IMG_HITECH: 'server_image_hitech',

    // api/auth
    API_URL: 'onlyus_api_url',
    ACCESS: 'onlyus_access_token',
    REFRESH: 'onlyus_refresh_token'
  };

  const hasIPCStorage = !!(window.electronAPI && window.electronAPI.storage);
  const cache = Object.create(null);
  let cacheLoaded = false;

  async function loadCacheOnce() {
    if (!hasIPCStorage || cacheLoaded) return;
    cacheLoaded = true;
    try {
      const res = await window.electronAPI.storage.dump();
      if (res && res.ok && res.data && typeof res.data === 'object') Object.assign(cache, res.data);
    } catch (_) {}
  }

  function getFromCache(key) {
    if (Object.prototype.hasOwnProperty.call(cache, key)) return cache[key];
    return undefined;
  }
  function setToCache(key, value) { cache[key] = value; }

  // стартуем загрузку кэша как можно раньше
  loadCacheOnce();

  function safeGet(key) {
    const c = getFromCache(key);
    if (c !== undefined) return c;
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }
  function safeSet(key, value) {
    setToCache(key, value);
    if (!canPersistKey(key)) return true;
    try { localStorage.setItem(key, value); } catch (_) {}
    if (hasIPCStorage) { try { window.electronAPI.storage.set(key, value); } catch (_) {} }
    return true;
  }
  function safeRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
  function getJson(key, fallback) {
    const raw = safeGet(key);
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch (_) { return fallback; }
  }
  function setJson(key, value) { return safeSet(key, JSON.stringify(value)); }

  // ----------------------------
  // settings / tokens
  // ----------------------------
  function getRam(defaultGb = 4) {
    const n = Number(safeGet(KEYS.RAM));
    return Number.isFinite(n) && n > 0 ? n : defaultGb;
  }
  function setRam(gb) { return safeSet(KEYS.RAM, String(Number(gb))); }

  function getApiUrl(fallback = 'http://localhost:3000') {
    return (safeGet(KEYS.API_URL) || fallback).replace(/\/+$/, '');
  }
  function setApiUrl(url) { return safeSet(KEYS.API_URL, String(url || '').replace(/\/+$/, '')); }

  function getTokens() {
    return { access: safeGet(KEYS.ACCESS), refresh: safeGet(KEYS.REFRESH) };
  }
  function setTokens({ access, refresh }) {
    // access
    if (access === null || access === '' || access === undefined) {
      safeRemove(KEYS.ACCESS);
    } else {
      safeSet(KEYS.ACCESS, String(access));
    }

    // refresh
    if (refresh === null || refresh === '' || refresh === undefined) {
      safeRemove(KEYS.REFRESH);
    } else {
      safeSet(KEYS.REFRESH, String(refresh));
    }
  }
  function clearTokens() {
    safeRemove(KEYS.ACCESS);
    safeRemove(KEYS.REFRESH);
}

  // ----------------------------
  // current user cache
  // ----------------------------
  function getUser() { return getJson(KEYS.USER, null); }
  function setUser(u) { return setJson(KEYS.USER, u); }
  function clearUser() { safeRemove(KEYS.USER); }

  // ----------------------------
  // server-first cached getters (sync)
  // ----------------------------
  function getUsers() {
    const v = getJson(KEYS.USERS_CACHE, null);
    if (Array.isArray(v)) return v;
    // migration fallback
    const legacy = getJson(KEYS.USERS_LEGACY, []);
    if (Array.isArray(legacy) && legacy.length) return legacy;
    return [];
  }
  function setUsers(list) { return setJson(KEYS.USERS_CACHE, Array.isArray(list) ? list : []); }

  function getNews(defaultNews = []) {
    const v = getJson(KEYS.NEWS_CACHE, null);
    if (Array.isArray(v)) return v;
    const legacy = getJson(KEYS.NEWS_LEGACY, null);
    if (Array.isArray(legacy)) return legacy;
    return defaultNews;
  }
  function setNews(news) { return setJson(KEYS.NEWS_CACHE, Array.isArray(news) ? news : []); }

  function getMods(defaultMods = []) {
    const v = getJson(KEYS.MODS_CACHE, null);
    if (Array.isArray(v)) return v;
    const legacy = getJson(KEYS.MODS_LEGACY, null);
    if (Array.isArray(legacy)) return legacy;
    return defaultMods;
  }
  function setMods(mods) { return setJson(KEYS.MODS_CACHE, Array.isArray(mods) ? mods : []); }

  function getServers(defaultServers = {}) {
    // серверы берём из кеша; legacy оставляем как fallback
    let servers = getJson(KEYS.SERVERS_CACHE, null);
    if (!servers || typeof servers !== 'object') servers = getJson(KEYS.SERVERS_LEGACY, defaultServers);

    servers = servers && typeof servers === 'object' ? JSON.parse(JSON.stringify(servers)) : JSON.parse(JSON.stringify(defaultServers || {}));

    // картинки живут отдельно
    const vImg = safeGet(KEYS.SERVER_IMG_VANILLA);
    const hImg = safeGet(KEYS.SERVER_IMG_HITECH);
    if (servers?.vanilla) servers.vanilla.image = vImg || servers.vanilla.image || null;
    if (servers?.hitech)  servers.hitech.image  = hImg || servers.hitech.image  || null;

    return servers;
  }

  function setServers(servers) {
    const copy = JSON.parse(JSON.stringify(servers || {}));
    if (copy?.vanilla?.image) {
      safeSet(KEYS.SERVER_IMG_VANILLA, copy.vanilla.image);
      delete copy.vanilla.image;
    }
    if (copy?.hitech?.image) {
      safeSet(KEYS.SERVER_IMG_HITECH, copy.hitech.image);
      delete copy.hitech.image;
    }
    return setJson(KEYS.SERVERS_CACHE, copy);
  }

  // ----------------------------
  // account settings still local
  // ----------------------------
  function accountSettingsKey(username) { return `account_settings_${String(username || '').trim()}`; }
  function getAccountSettings(username, fallback = null) {
    const key = accountSettingsKey(username);
    if (!key || key === 'account_settings_') return fallback;
    return getJson(key, fallback);
  }
  function setAccountSettings(username, settings) {
    const key = accountSettingsKey(username);
    if (!key || key === 'account_settings_') return false;
    return setJson(key, settings);
  }
  function clearAccountSettings(username) {
    const key = accountSettingsKey(username);
    if (!key || key === 'account_settings_') return;
    safeRemove(key);
  }

  // ----------------------------
  // API helpers (async)
  // ----------------------------
  async function apiFetch(path, opts = {}) {
    const url = getApiUrl('http://localhost:3000').replace(/\/+$/, '') + path;
    const headers = Object.assign({ 'Content-Type': 'application/json' }, (opts.headers || {}));
    const t = getTokens();
    if (t?.access) headers['Authorization'] = `Bearer ${t.access}`;
    const res = await fetch(url, Object.assign({}, opts, { headers }));
    const ct = res.headers.get('content-type') || '';
    const payload = ct.includes('application/json')
      ? await res.json().catch(() => ({}))
      : await res.text().catch(() => '');
    if (!res.ok) {
      const msg = (payload && payload.message) ? payload.message : (typeof payload === 'string' && payload ? payload : `HTTP ${res.status}`);
      const err = new Error(msg);
      err.status = res.status;
      err.payload = payload;
      throw err;
    }
    return payload;
  }

  // ----------------------------
  // Server-first methods (async)
  // ----------------------------
  async function fetchUsers() {
    const list = await apiFetch('/admin/users', { method: 'GET' });
    const users = Array.isArray(list) ? list.map(u => ({
      name: u?.name || u?.username || '',
      email: u?.email || '',
      isAdmin: !!(u?.isAdmin || u?.role === 'admin'),
      avatar: (u?.name || u?.username || 'Г').charAt(0).toUpperCase(),
      avatarImage: u?.avatarImage || null
    })).filter(u => u.name) : [];
    setUsers(users);
    return users;
  }

  async function setUserRole(username, isAdmin) {
    const role = isAdmin ? 'admin' : 'user';
    await apiFetch(`/admin/users/${encodeURIComponent(String(username))}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
    return true;
  }

  async function fetchMyStats(username) {
    const s = await apiFetch('/users/me/stats', { method: 'GET' });
    const stats = {
      totalPlayTime: Number(s?.totalPlayTime ?? s?.total_play_time ?? 0) || 0,
      serversJoined: Number(s?.serversJoined ?? s?.servers_joined ?? 0) || 0,
      lastLogin: s?.lastLogin ?? s?.last_login ?? null,
      registrationDate: s?.registrationDate ?? s?.registration_date ?? null
    };
    if (username) setJson(KEYS.STATS_CACHE_PREFIX + String(username), stats);
    return stats;
  }

  async function saveMyStats(stats) {
    const payload = {
      totalPlayTime: Number(stats?.totalPlayTime ?? 0) || 0,
      serversJoined: Number(stats?.serversJoined ?? 0) || 0,
      lastLogin: stats?.lastLogin ?? null,
      registrationDate: stats?.registrationDate ?? null
    };
    await apiFetch('/users/me/stats', { method: 'PUT', body: JSON.stringify(payload) });
    return true;
  }

  async function fetchNews({ admin = false } = {}) {
    const resp = await apiFetch(admin ? '/admin/news' : '/news', { method: 'GET' });
    const list = Array.isArray(resp?.news) ? resp.news : [];
    const news = list.map(n => ({
      id: String(n?.id ?? ''),
      title: String(n?.title ?? ''),
      content: String(n?.content ?? ''),
      date: n?.date || n?.created_at || new Date().toISOString(),
      author: n?.author || 'Администрация',
      status: n?.status || 'published',
      tags: Array.isArray(n?.tags) ? n.tags : (() => {
        try { return JSON.parse(n?.tags_json || '[]'); } catch { return []; }
      })()
    })).filter(n => n.id);
    setNews(news);
    return news;
  }

  async function upsertNews(item) {
    const payload = {
      title: String(item?.title || '').trim(),
      content: String(item?.content || '').trim(),
      tags: Array.isArray(item?.tags) ? item.tags : [],
      status: item?.status === 'published' ? 'published' : 'draft'
    };

    const id = item?.id ? String(item.id) : '';
    if (id) {
      return apiFetch(`/admin/news/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
    }

    return apiFetch('/admin/news', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async function deleteNews(id) {
    await apiFetch(`/admin/news/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
    return true;
  }

  async function fetchServers() {
    const resp = await apiFetch('/servers', { method: 'GET' });
    const servers = (resp?.servers && typeof resp.servers === 'object') ? resp.servers : {};
    setServers(servers);
    return servers;
  }

  async function saveServersRemote(servers) {
    const payload = servers && typeof servers === 'object' ? servers : {};
    await apiFetch('/admin/servers', {
      method: 'PUT',
      body: JSON.stringify({ servers: payload })
    });
    setServers(payload);
    return true;
  }

  async function fetchMods() {
    const resp = await apiFetch('/mods', { method: 'GET' });
    const list = Array.isArray(resp?.mods) ? resp.mods : [];
    const mods = list.map(m => ({
      id: m?.id ?? Date.now(),
      name: m?.name ?? '',
      version: m?.version ?? '',
      required: !!m?.required,
      servers: Array.isArray(m?.servers) ? m.servers : ['vanilla', 'hitech']
    }));
    setMods(mods);
    return mods;
  }

  async function saveModsRemote(mods) {
    const payload = Array.isArray(mods) ? mods.map(m => ({
      id: String(m?.id ?? Date.now()),
      name: String(m?.name ?? '').trim(),
      version: String(m?.version ?? '').trim(),
      required: !!m?.required,
      servers: Array.isArray(m?.servers) ? m.servers : ['vanilla','hitech']
    })) : [];
    await apiFetch('/admin/mods', {
      method: 'PUT',
      body: JSON.stringify({ mods: payload })
    });
    setMods(payload);
    return true;
  }

  function clearLegacyLocalData() {
    safeRemove(KEYS.USERS_LEGACY);
    safeRemove(KEYS.NEWS_LEGACY);
    safeRemove(KEYS.SERVERS_LEGACY);
    safeRemove(KEYS.MODS_LEGACY);
  }

  window.OnlyUsStore = {
    init: () => loadCacheOnce(),
    KEYS,
    safeGet, safeSet, safeRemove,
    getJson, setJson,

    // settings / auth
    getRam, setRam,
    getApiUrl, setApiUrl,
    getTokens, setTokens, clearTokens,

    // current user cache
    getUser, setUser, clearUser,

    // cached sync getters for UI
    getUsers, setUsers,
    getNews, setNews,
    getServers, setServers,
    getMods, setMods,

    // account settings still local
    getAccountSettings, setAccountSettings, clearAccountSettings,

    // server-first API
    apiFetch,
    fetchUsers, setUserRole,
    fetchMyStats, saveMyStats,
    fetchNews, upsertNews, deleteNews,
    fetchServers, saveServersRemote,
    fetchMods, saveModsRemote,

    clearLegacyLocalData
  };
})();
