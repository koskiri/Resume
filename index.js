const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ВАЖНО: этот файл должен существовать
// src/main/services/MinecraftManager.js
const MinecraftManager = require('./services/MinecraftManager');

let mainWindow;
const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';

// === Пути: safe default game root (LocalAppData -> fallback Public if non-ASCII) ===
function isAsciiOnly(str) {
  return /^[\x00-\x7F]*$/.test(String(str || ''));
}

function getLocalAppDataPath() {
  if (process.platform === 'win32') {
    return process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  }
  return app.getPath('userData');
}

function getSafeDefaultGameBaseDir() {
  // Папка приложения — латиницей, чтобы уменьшить шанс не-ASCII в пути
  const local = path.join(getLocalAppDataPath(), 'OnlyUsLauncher');
  if (process.platform === 'win32' && !isAsciiOnly(local)) {
    return 'C:\\OnlyUsData';
  }
  return local;
}

// === Конфиг серверов Minecraft ===
// Можешь менять версии/пути/память под себя
const MINECRAFT_SERVERS = {
  vanilla: {
    id: 'vanilla',
    name: 'Minecraft Vanilla',
    root: path.join(getSafeDefaultGameBaseDir(), 'minecraft_vanilla'),
    version: {
      number: '1.12.2',
      type: 'custom',
      custom: 'forge-1.12.2-14.23.5.2864'
    },
    memory: { min: '2G', max: '4G' },
    jvmArgs: [
      '-Dfml.ignoreInvalidMinecraftCertificates=true',
      '-Dfml.ignorePatchDiscrepancies=true',
      '-Dsun.net.client.defaultConnectTimeout=600000',
      '-Dsun.net.client.defaultReadTimeout=600000'
    ]
  },

  hitech: {
    id: 'hitech',
    name: 'Minecraft Hi-Tech',
    root: path.join(getSafeDefaultGameBaseDir(), 'minecraft_hitech'),
    version: {
      number: '1.7.10',
      type: 'custom',
      custom: 'forge-1.7.10-10.13.4.1614-1.7.10'
    },
    memory: { min: '2G', max: '6G' },
    jvmArgs: [
      '-Dfml.ignoreInvalidMinecraftCertificates=true',
      '-Dfml.ignorePatchDiscrepancies=true',
      '-Dsun.net.client.defaultConnectTimeout=600000',
      '-Dsun.net.client.defaultReadTimeout=600000'
    ]
  }
};

// === MinecraftManager ===
const minecraftManager = new MinecraftManager({
  onLog: (line) => {
    console.log('[MC]', line);
    mainWindow?.webContents?.send('update-status', String(line));
  },
  onProgress: (p) => {
    mainWindow?.webContents?.send('download-progress', p);
  }
});

// === OnlyUsAuth client mod (копирование в mods перед запуском) ===
// src/main/assets/OnlyUsAuth-1.0.0.jar -> <userData>/minecraft_vanilla/mods/OnlyUsAuth-1.0.0.jar
function resolveOnlyUsAuthJarPath() {
  const candidates = [
    // Dev: src/main/index.js -> src/main/assets
    path.join(__dirname, 'assets', 'OnlyUsAuth-1.0.0.jar'),
    // Packaged: положи assets рядом с resources
    path.join(process.resourcesPath || '', 'assets', 'OnlyUsAuth-1.0.0.jar')
  ].filter(Boolean);

  for (const p of candidates) {
    try {
      if (p && fs.existsSync(p)) return p;
    } catch (_) {}
  }
  return null;
}

function ensureOnlyUsAuthMod(serverId, serverRoot) {
  // По ТЗ/README мод нужен для vanilla
  if (serverId !== 'vanilla') return;

  const src = resolveOnlyUsAuthJarPath();
  if (!src) {
    console.warn('[OnlyUsAuth] Не найден OnlyUsAuth-1.0.0.jar в assets');
    return;
  }

  // Защита от "заглушки" / неверного файла (например 58 байт)
  try {
    const st = fs.statSync(src);
    if (st.size < 10 * 1024) {
      console.warn('[OnlyUsAuth] Файл слишком маленький, похоже это не JAR:', st.size, 'bytes ->', src);
      return;
    }
  } catch (e) {
    console.warn('[OnlyUsAuth] Не удалось прочитать размер файла:', e);
    return;
  }

  const modsDir = path.join(serverRoot, 'mods');
  const dst = path.join(modsDir, 'OnlyUsAuth-1.0.0.jar');

  try {
    if (!fs.existsSync(modsDir)) fs.mkdirSync(modsDir, { recursive: true });

    // ✅ Для подготовки/обновлений — всегда перезаписываем
    fs.copyFileSync(src, dst);
    console.log('[OnlyUsAuth] Обновлён в mods:', dst);
  } catch (e) {
    console.warn('[OnlyUsAuth] Ошибка копирования:', e);
  }
}

// === Runtime-pack Forge (versions only!) ===
// assets/runtime/vanilla-forge-1.12.2/versions -> <gameRoot>/versions
// ВАЖНО: НЕ копируем libraries из TLauncher/runtime — это часто ломает Forge 1.12.2.
function resolveRuntimeDirVanillaForge() {
  const candidates = [
    path.join(__dirname, 'assets', 'runtime', 'vanilla-forge-1.12.2'),
    path.join(process.resourcesPath || '', 'assets', 'runtime', 'vanilla-forge-1.12.2')
  ].filter(Boolean);

  for (const p of candidates) {
    try {
      if (p && fs.existsSync(p)) return p;
    } catch (_) {}
  }
  return null;
}

function copyDirRecursive(srcDir, dstDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(dstDir, { recursive: true });

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(srcDir, e.name);
    const d = path.join(dstDir, e.name);
    if (e.isDirectory()) copyDirRecursive(s, d);
    else if (e.isFile()) fs.copyFileSync(s, d);
  }
}

function ensureVanillaForgeRuntimeInstalled(serverRoot, forgeId) {
  const runtimeDir = resolveRuntimeDirVanillaForge();
  if (!runtimeDir) {
    console.warn('[Runtime] runtime-пак не найден: assets/runtime/vanilla-forge-1.12.2');
    return;
  }

  // В runtime-паке лежат:
  // - versions (обязательно)
  // - libraries (для Forge)
  // - natives (dll из LWJGL)
  // - indexes (asset index json)
  const forgeDir  = path.join(serverRoot, 'versions', forgeId);
  const forgeJson = path.join(forgeDir, `${forgeId}.json`);
  const forgeJar  = path.join(forgeDir, `${forgeId}.jar`);

  // Уже установлено?
  if (fs.existsSync(forgeJson) && fs.existsSync(forgeJar)) {
    console.log('[Runtime] Forge runtime уже установлен:', forgeId);
    return;
  }

  console.log('[Runtime] Устанавливаю Forge runtime из:', runtimeDir);
  console.log('[Runtime] -> serverRoot:', serverRoot);

  // Базовые папки
  fs.mkdirSync(serverRoot, { recursive: true });
  fs.mkdirSync(path.join(serverRoot, 'versions'), { recursive: true });
  fs.mkdirSync(path.join(serverRoot, 'libraries'), { recursive: true });
  fs.mkdirSync(path.join(serverRoot, 'natives'), { recursive: true });
  fs.mkdirSync(path.join(serverRoot, 'assets', 'indexes'), { recursive: true });

  // ✅ Копируем runtime составляющие (идемпотентно: поверх, без удаления пользовательских файлов)
  copyDirRecursive(path.join(runtimeDir, 'versions'),  path.join(serverRoot, 'versions'));
  copyDirRecursive(path.join(runtimeDir, 'libraries'), path.join(serverRoot, 'libraries'));
  copyDirRecursive(path.join(runtimeDir, 'natives'),   path.join(serverRoot, 'natives'));

  // indexes -> assets/indexes (Minecraft ожидает именно так)
  copyDirRecursive(path.join(runtimeDir, 'indexes'), path.join(serverRoot, 'assets', 'indexes'));

  console.log('[Runtime] Готово. json=', fs.existsSync(forgeJson), forgeJson);
  console.log('[Runtime] Готово. jar =', fs.existsSync(forgeJar), forgeJar);

  if (!fs.existsSync(forgeJson) || !fs.existsSync(forgeJar)) {
    throw new Error('[Runtime] Runtime скопирован, но forge jar/json не найдены — проверь содержимое runtime/versions');
  }
}


// === Меню приложения ===
function createMenu() {
  if (isDev || process.platform === 'darwin') {
    const template = [
      ...(process.platform === 'darwin'
        ? [
            {
              label: app.name,
              submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
              ]
            }
          ]
        : []),
      {
        label: 'Файл',
        submenu: [
          ...(isDev
            ? [
                {
                  label: 'Перезагрузить',
                  accelerator: 'CmdOrCtrl+R',
                  click: () => mainWindow?.webContents?.reload()
                },
                {
                  label: 'DevTools',
                  accelerator: 'F12',
                  click: () => mainWindow?.webContents?.toggleDevTools()
                },
                { type: 'separator' }
              ]
            : []),
          { role: 'quit', label: 'Выход' }
        ]
      }
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  } else {
    Menu.setApplicationMenu(null);
  }
}

// === Окно ===
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    show: false,
    backgroundColor: '#0b0f14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    },
    ...(process.platform === 'darwin'
      ? {
          titleBarStyle: 'hiddenInset',
          trafficLightPosition: { x: 15, y: 10 }
        }
      : {})
  });

  // Загружаем renderer/index.html
  // Структура: src/main/index.js -> src/renderer/index.html
  mainWindow
    .loadFile(path.join(__dirname, '../renderer/index.html'))
    .catch((err) => console.error('Failed to load index.html:', err));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Блокируем открытие внешних окон
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Авто-инфо о приложении в renderer
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('app-info-response', {
      version: app.getVersion(),
      platform: process.platform,
      isDev,
      appName: app.getName(),
      appPath: app.getAppPath()
    });
  });

  // Состояние окна (если захочешь использовать в UI)
  mainWindow.on('maximize', () => {
    mainWindow?.webContents?.send('window-state-changed', 'maximized');
  });
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents?.send('window-state-changed', 'unmaximized');
  });
}

// === Single instance ===
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    createMenu();
    createWindow();

    // protocol (опционально)
    if (process.defaultApp) {
      if (process.argv.length >= 2) app.setAsDefaultProtocolClient('onlyus-launcher');
    } else {
      app.setAsDefaultProtocolClient('onlyus-launcher');
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// === IPC: кнопки окна ===
ipcMain.on('window-minimize', (event) => {
  if (mainWindow && event.sender === mainWindow.webContents) {
    mainWindow.minimize();
  }
});

ipcMain.on('window-maximize', (event) => {
  if (mainWindow && event.sender === mainWindow.webContents) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});

ipcMain.on('window-close', (event) => {
  if (mainWindow && event.sender === mainWindow.webContents) {
    mainWindow.close();
  }
});

ipcMain.on('get-app-info', (event) => {
  if (mainWindow && event.sender === mainWindow.webContents) {
    event.reply('app-info-response', {
      version: app.getVersion(),
      platform: process.platform,
      isDev,
      appName: app.getName()
    });
  }
});

// === IPC: Minecraft ===
ipcMain.handle('check-java', async () => {
  try {
    return await minecraftManager.checkJava();
  } catch (e) {
    return { installed: false, error: e?.message || String(e) };
  }
});

ipcMain.handle('launch-minecraft', async (event, payload) => {
  try {
    const { serverId, username } = payload || {};
    const cfg = MINECRAFT_SERVERS[serverId];

    if (!cfg) throw new Error('Неизвестный serverId');
    if (!username) throw new Error('Не передан username');

    // --- RAM из UI (в гигабайтах) ---
    let ramGb = Number(payload?.ramGb);

    // дефолт, если не пришло
    if (!Number.isFinite(ramGb)) ramGb = null;

    // ограничения (чтобы не ставили 999)
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    // минимумы можно сделать разными по серверам
    const minGb = 2;
    const maxGbHard = 16;

    if (ramGb !== null) ramGb = clamp(Math.round(ramGb), minGb, maxGbHard);

    // копируем memory из cfg и переопределяем max
    const memory = { ...(cfg.memory || { min: '2G', max: '4G' }) };

    // если пришёл ramGb — применяем как Xmx
    if (ramGb !== null) {
      memory.max = `${ramGb}G`;

      // на всякий случай: min не должен быть больше max
      const minNum = parseInt(String(memory.min).replace(/[^0-9]/g, ''), 10);
      if (Number.isFinite(minNum) && minNum > ramGb) {
        memory.min = `${Math.max(1, ramGb - 1)}G`;
      }
    }

    // можно отправить статус в UI
    mainWindow?.webContents?.send('update-status', `Подготовка запуска: ${cfg.name}`);

    // Путь игры (для диагностики)
    console.log('[GAME ROOT]', { base: getSafeDefaultGameBaseDir(), root: cfg.root });

    // Runtime-pack: ставим Forge VERSION (только versions) из assets, чтобы пользователям не нужен был installer
    if (serverId === 'vanilla' && cfg?.version?.custom) {
      mainWindow?.webContents?.send('update-status', 'Проверяю/устанавливаю Forge и зависимости…');
      ensureVanillaForgeRuntimeInstalled(cfg.root, cfg.version.custom);
      mainWindow?.webContents?.send('update-status', 'Forge готов. Подготавливаю моды…');
    }

    // OnlyUsAuth: автокопирование client-мода в mods для vanilla
    ensureOnlyUsAuthMod(serverId, cfg.root);

    // === Подготовка к передаче роли (на будущее) ===
    // Renderer может передать payload.isAdmin, тогда роль попадёт в JVM property.
    // Потом клиент-мод сможет прочитать System.getProperty("onlyus.role")
    const token = payload?.token || payload?.accessToken || '';
    const jvmArgs = [
      ...(cfg.jvmArgs || []),
      `-Donlyus.user=${username}`,
      `-Donlyus.token=${token}`,
    ];

    await minecraftManager.launch({
      username,
      root: cfg.root,
      version: cfg.version,
      memory,
      jvmArgs,
      server: cfg.server || null
    });

    return { success: true };
  } catch (error) {
    console.error('Ошибка запуска Minecraft:', error);
    mainWindow?.webContents?.send('update-status', `Ошибка запуска: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// === Глобальные ошибки ===
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

// Экспорт (если нужно)
module.exports = { mainWindow };


// === Step 7: file storage in app.getPath('userData') ===
const STORAGE_FILE = path.join(app.getPath('userData'), 'onlyus.storage.v1.json');

function readStorageFile() {
  try {
    if (!fs.existsSync(STORAGE_FILE)) {
      return { schemaVersion: 1, updatedAt: null, data: {} };
    }
    const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { schemaVersion: 1, updatedAt: null, data: {} };
    if (!parsed.data || typeof parsed.data !== 'object') parsed.data = {};
    if (parsed.schemaVersion !== 1) parsed.schemaVersion = 1; // пока без миграций
    return parsed;
  } catch (e) {
    console.warn('[storage] read failed:', e);
    return { schemaVersion: 1, updatedAt: null, data: {} };
  }
}

function writeStorageFile(obj) {
  try {
    const dir = path.dirname(STORAGE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const out = {
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      data: obj?.data && typeof obj.data === 'object' ? obj.data : {}
    };
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(out, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.warn('[storage] write failed:', e);
    return false;
  }
}

// Ограничим ключи, чтобы renderer не мог писать произвольные файлы
const STORAGE_ALLOWED_KEYS = new Set([
  'onlyus_users',
  'onlyus_user',
  'onlyus_servers',
  'onlyus_news',
  'serverMods',
  'onlyus_ram_gb',
  'server_image_vanilla',
  'server_image_hitech',
  'onlyus_api_url',
  'onlyus_access_token',
  'onlyus_refresh_token',
  'onlyus_users_cache'
]);

ipcMain.handle('storage:get:v1', async (event, payload) => {
  try {
    const key = String(payload?.key ?? '');
    const def = payload?.defaultValue ?? null;
    if (!STORAGE_ALLOWED_KEYS.has(key)) return { ok: false, error: 'Key not allowed' };
    const st = readStorageFile();
    const val = Object.prototype.hasOwnProperty.call(st.data, key) ? st.data[key] : def;
    return { ok: true, data: val };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
});

ipcMain.handle('storage:set:v1', async (event, payload) => {
  try {
    const key = String(payload?.key ?? '');
    if (!STORAGE_ALLOWED_KEYS.has(key)) return { ok: false, error: 'Key not allowed' };
    const st = readStorageFile();
    st.data[key] = payload?.value ?? null;
    const okWrite = writeStorageFile(st);
    if (!okWrite) return { ok: false, error: 'Write failed' };
    return { ok: true, data: true };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
});

ipcMain.handle('storage:dump:v1', async () => {
  try {
    const st = readStorageFile();
    return { ok: true, data: st.data || {} };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
});


// --- optional: sync admin list for Minecraft server tooling ---
// Renderer calls window.electronAPI.invoke('set-server-admins', admins)
ipcMain.handle('set-server-admins', async (_event, serverId, admins) => {
  try {
    const adminsPath = 'C:\\OnlyUsData\\services\\auth-server\\data\\admins.json';
    const dir = path.dirname(adminsPath);

    await fs.promises.mkdir(dir, { recursive: true });

    const safeAdmins = Array.isArray(admins) ? admins.map(a => String(a).trim()).filter(Boolean) : [];
    const payload = { [String(serverId || 'default')]: safeAdmins };

    // если файл уже есть — аккуратно сольём
    let existing = {};
    try {
      const raw = await fs.promises.readFile(adminsPath, 'utf8');
      existing = JSON.parse(raw || '{}');
    } catch (_) {}

    const merged = { ...existing, ...payload };
    await fs.promises.writeFile(adminsPath, JSON.stringify(merged, null, 2), 'utf8');

    return { ok: true, path: adminsPath };
  } catch (e) {
    console.error('Failed to set server admins:', e);
    return { ok: false, error: String(e?.message || e) };
  }
});



