// src/main/services/MinecraftManager.js
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { Client, Authenticator } = require('minecraft-launcher-core');

function exists(p) {
  try { return fs.existsSync(p); } catch { return false; }
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyDir(src, dst) {
  // Node 16+ обычно умеет fs.cpSync
  if (fs.cpSync) {
    fs.cpSync(src, dst, { recursive: true, force: true });
    return;
  }
  // fallback на ручное копирование
  ensureDir(dst);
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dst, name);
    const st = fs.statSync(s);
    if (st.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function extractDllsFromJar(jarPath, outDir) {
  let AdmZip;
  try {
    AdmZip = require('adm-zip');
  } catch (e) {
    throw new Error("Не найден пакет 'adm-zip'. Выполни: npm i adm-zip");
  }

  const zip = new AdmZip(jarPath);
  const entries = zip.getEntries();
  let extracted = 0;

  for (const e of entries) {
    if (e.isDirectory) continue;
    const base = path.basename(e.entryName);
    if (!base.toLowerCase().endsWith('.dll')) continue;

    const outPath = path.join(outDir, base);
    fs.writeFileSync(outPath, e.getData());
    extracted++;
  }
  return extracted;
}

class MinecraftManager {
  constructor({ onLog, onProgress } = {}) {
    this.launcher = new Client();
    this.onLog = typeof onLog === 'function' ? onLog : () => {};
    this.onProgress = typeof onProgress === 'function' ? onProgress : () => {};

    this.launcher.on('debug', (m) => this.onLog(String(m)));
    this.launcher.on('data', (m) => this.onLog(String(m)));

    this.launcher.on('progress', (p) => {
      let percent = null;
      if (typeof p?.percentage === 'number') percent = p.percentage;
      else if (typeof p?.percent === 'number') percent = p.percent;
      else if (typeof p?.progress === 'number') percent = Math.round(p.progress * 100);

      const current = Number(p?.current ?? p?.done ?? 0);
      const total = Number(p?.total ?? 0);
      if (percent === null && total > 0) {
        percent = Math.floor((current / total) * 100);
      }

      this.onProgress({
        type: p?.type || 'download',
        task: p?.task || p?.type || 'download',
        percent,
        current,
        total,
        file: p?.file || p?.name || p?.path || ''
      });
    });
  }

  // путь к runtime, который ты положил в проект
  getBundledRuntimePath() {
    // В dev: __dirname = .../src/main/services
    // runtime лежит: src/main/assets/runtime/vanilla-forge-1.12.2
    const devPath = path.resolve(__dirname, '..', 'assets', 'runtime', 'vanilla-forge-1.12.2');
    if (exists(devPath)) return devPath;

    // В production (electron build) файлы могут лежать в resourcesPath
    const prodPath = path.resolve(process.resourcesPath || '', 'assets', 'runtime', 'vanilla-forge-1.12.2');
    return prodPath;
  }

  ensureForgeRuntimeInstalled(root) {
    const forgeId = 'forge-1.12.2-14.23.5.2864';

    // Минимальный набор, без которого Forge точно не стартанёт
    const mustHave = [
      path.join(root, 'versions', '1.12.2', '1.12.2.json'),
      path.join(root, 'versions', '1.12.2', '1.12.2.jar'),
      path.join(root, 'versions', forgeId, `${forgeId}.json`),
      path.join(root, 'versions', forgeId, `${forgeId}.jar`),
      path.join(root, 'libraries')
    ];

    const ok = mustHave.every(exists);
    if (ok) {
      this.onLog(`[Runtime] Forge runtime уже установлен: ${forgeId}`);
      return;
    }

    const runtimePath = this.getBundledRuntimePath(); // .../assets/runtime/vanilla-forge-1.12.2
    if (!exists(runtimePath)) {
      throw new Error(`[Runtime] Не найден встроенный runtime по пути: ${runtimePath}`);
    }

    this.onLog(`[Runtime] Устанавливаю Forge runtime из: ${runtimePath}`);
    this.onLog(`[Runtime] -> serverRoot: ${root}`);

    ensureDir(root);

    // Копируем то, что положили в runtime. assets/natives опциональны, но если есть — копируем.
    const parts = ['versions', 'libraries', 'assets', 'natives'];

    for (const p of parts) {
      const src = path.join(runtimePath, p);
      if (!exists(src)) continue;

      const dst = path.join(root, p);
      this.onLog(`[Runtime] -> copy ${p}`);
      copyDir(src, dst);
    }

    // Финальная проверка (чтобы сразу увидеть, если runtime неполный)
    const forgeJson = path.join(root, 'versions', forgeId, `${forgeId}.json`);
    const forgeJar  = path.join(root, 'versions', forgeId, `${forgeId}.jar`);

    this.onLog(`[Runtime] Готово. json= ${exists(forgeJson)} ${forgeJson}`);
    this.onLog(`[Runtime] Готово. jar = ${exists(forgeJar)} ${forgeJar}`);

    if (!exists(forgeJson) || !exists(forgeJar)) {
      throw new Error('[Runtime] Runtime скопирован, но forge jar/json не найдены — проверь содержимое runtime/versions');
    }
  }


  ensureNatives1122(root) {
    const nativesDir = path.join(root, 'natives', '1.12.2');
    ensureDir(nativesDir);

    const lwjglDll = path.join(nativesDir, 'lwjgl.dll');
    if (exists(lwjglDll)) {
      this.onLog(`[Natives] Уже есть lwjgl.dll в ${nativesDir}`);
      return;
    }

    const lwjglBase = path.join(root, 'libraries', 'org', 'lwjgl', 'lwjgl', '2.9.4-nightly-20150209');

    const jars = [
      path.join(lwjglBase, 'lwjgl-2.9.4-nightly-20150209-natives-windows.jar'),
      path.join(lwjglBase, 'lwjgl_util-2.9.4-nightly-20150209-natives-windows.jar'),
    ];

    this.onLog(`[Natives] Готовлю natives в ${nativesDir}`);

    let total = 0;
    for (const j of jars) {
      if (!exists(j)) {
        this.onLog(`[Natives] Не найден файл: ${j}`);
        continue;
      }
      total += extractDllsFromJar(j, nativesDir);
    }

    if (!exists(lwjglDll)) {
      throw new Error(`[Natives] Не удалось подготовить natives: lwjgl.dll не найден. Извлечено dll: ${total}`);
    }

    // подчистим мусор, если кто-то распаковал jar целиком раньше
    for (const junk of ['META-INF', 'org']) {
      const p = path.join(nativesDir, junk);
      if (exists(p)) fs.rmSync(p, { recursive: true, force: true });
    }

    this.onLog(`[Natives] Готово. Извлечено dll: ${total}`);
  }

  async checkJava() {
    return new Promise((resolve) => {
      const proc = spawn('java', ['-version'], {
        shell: process.platform === 'win32'
      });

      let stderr = '';
      proc.stderr.on('data', (d) => (stderr += d.toString()));

      proc.on('error', (err) => {
        resolve({
          installed: false,
          error:
            'Java не найдена в PATH. Установи Java (для Forge 1.12.2 нужна Java 8) или укажи java в PATH.\n' +
            `Детали: ${err.message}`
        });
      });

      proc.on('close', (code) => {
        if (code === 0 || /version/i.test(stderr)) {
          resolve({ installed: true, raw: stderr.trim() });
        } else {
          resolve({ installed: false, error: `java -version вернул код ${code}. stderr: ${stderr}` });
        }
      });
    });
  }

  async launch({ username, root, version, memory, jvmArgs, server }) {
    if (!username) throw new Error('username пустой');
    if (!root) throw new Error('root пустой');
    if (!version || !version.number) throw new Error('version.number пустой');

    if (!exists(root)) ensureDir(root);

    // ✅ авто-runtime и авто-natives только для нужного Forge 1.12.2
    if (version?.type === 'custom' && version?.custom === 'forge-1.12.2-14.23.5.2864') {
      this.ensureForgeRuntimeInstalled(root);
      this.ensureNatives1122(root);
    }

    const javaArgs = Array.isArray(jvmArgs)
      ? jvmArgs
      : String(jvmArgs || '')
          .split(/\s+/)
          .map((s) => s.trim())
          .filter(Boolean);

    const timeoutArgs = [
      '-Dsun.net.client.defaultConnectTimeout=600000',
      '-Dsun.net.client.defaultReadTimeout=600000'
    ];
    for (const a of timeoutArgs) {
      if (!javaArgs.includes(a)) javaArgs.unshift(a);
    }

    const options = {
      authorization: Authenticator.getAuth(username),
      root,
      version,
      memory: memory || { min: '2G', max: '4G' },
      javaArgs
    };

    if (server && server.host) {
      options.server = server;
    }

    this.onLog(`Launching Minecraft: ${version.number} (${version.type}${version.custom ? `, ${version.custom}` : ''})`);
    await this.launcher.launch(options);
  }
}

module.exports = MinecraftManager;
