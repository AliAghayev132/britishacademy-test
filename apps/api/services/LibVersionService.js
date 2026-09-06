// Node
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
// Services
import { waLog } from "./WhatsAppLogService.js";

/**
 * `whatsapp-web.js` üçün versiya nəzarəti.
 *
 * NİYƏ LAZIMDIR: WhatsApp Web protokolu tez-tez dəyişir və kitabxana geri
 * qalanda bağlantı SƏBƏBSİZ görünən şəkildə sınır — QR skan olunur, sonra
 * «Qoşulma gecikdi» yazır. Həlli demək olar həmişə paket yeniləməsidir, amma
 * bunu bilmək üçün npm-ə əl ilə baxmaq lazım gəlirdi.
 *
 * İndi server açılanda (və gündə bir dəfə) npm reyestrindən son versiya
 * soruşulur və yenisi varsa panelə bildiriş çıxır.
 *
 * ŞƏBƏKƏ ƏLÇATMAZ OLA BİLƏR: yoxlama tamamilə fakultativdir — uğursuzluq
 * yalnız qeyd olunur, heç nəyi bloklamır.
 */

const PKG = "whatsapp-web.js";
const REGISTRY = `https://registry.npmjs.org/${PKG}/latest`;
/** Yoxlama aralığı — gündə bir dəfə kifayətdir. */
const CHECK_INTERVAL = 24 * 60 * 60 * 1000;
/** Şəbəkə gözləmə həddi — server açılışını gecikdirməsin. */
const FETCH_TIMEOUT = 8000;

/** "1.34.7" → [1, 34, 7]; ön-buraxılış hissəsi (-beta.2) atılır. */
const parse = (v) =>
  String(v || "")
    .trim()
    .replace(/^v/, "")
    .split("-")[0]
    .split(".")
    .map((x) => Number.parseInt(x, 10) || 0);

/**
 * `a` `b`-dən yenidirmi?
 * Sadə semver müqayisəsi — asılılıq əlavə etməmək üçün.
 */
export function isNewer(a, b) {
  const x = parse(a);
  const y = parse(b);
  for (let i = 0; i < Math.max(x.length, y.length); i += 1) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d !== 0) return d > 0;
  }
  return false;
}

/**
 * Quraşdırılmış versiya.
 *
 * `package.json`-dan oxunur, kitabxananın öz ixracından deyil: paket bəzi
 * buraxılışlarda `version` ixrac etmir və o zaman panel «v?» göstərirdi.
 */
export function installedVersion() {
  try {
    const require = createRequire(import.meta.url);
    const entry = require.resolve(`${PKG}/package.json`);
    return JSON.parse(fs.readFileSync(entry, "utf8")).version || null;
  } catch {
    // Paket quraşdırılmayıb və ya `exports` package.json-u gizlədir.
    try {
      const p = path.join(process.cwd(), "node_modules", PKG, "package.json");
      return JSON.parse(fs.readFileSync(p, "utf8")).version || null;
    } catch {
      return null;
    }
  }
}

export class LibVersion {
  static installed = null;
  static latest = null;
  static checkedAt = null;
  static error = null;
  static _timer = null;

  /** Panelin oxuduğu vəziyyət. */
  static getState() {
    const installed = this.installed ?? installedVersion();
    return {
      package: PKG,
      installed,
      latest: this.latest,
      checkedAt: this.checkedAt,
      error: this.error,
      // Yalnız hər ikisi məlum olanda müqayisə edilir.
      outdated: Boolean(installed && this.latest && isNewer(this.latest, installed)),
      // Serverdə işlədiləcək əmr — admin onu kopyalayıb göndərə bilsin.
      command: `cd apps/api && npm i ${PKG}@latest`,
    };
  }

  /**
   * npm reyestrindən son versiyanı soruş.
   * @param {boolean} [force] son yoxlamadan az keçsə də yoxla
   */
  static async check({ force = false } = {}) {
    this.installed = installedVersion();
    if (!this.installed) {
      this.error = "Paket quraşdırılmayıb";
      return this.getState();
    }
    if (!force && this.checkedAt && Date.now() - this.checkedAt.getTime() < CHECK_INTERVAL) {
      return this.getState();
    }

    const before = this.latest;
    try {
      const ctl = AbortSignal.timeout(FETCH_TIMEOUT);
      const res = await fetch(REGISTRY, { signal: ctl, headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`registry ${res.status}`);
      const json = await res.json();
      this.latest = json?.version || null;
      this.error = null;
      this.checkedAt = new Date();
    } catch (err) {
      // Şəbəkə yoxdursa köhnə nəticə saxlanılır — panel boş qalmasın.
      this.error = `Versiya yoxlanmadı: ${err.message}`;
      this.checkedAt = new Date();
      return this.getState();
    }

    const state = this.getState();
    // Jurnala YALNIZ nəticə dəyişəndə yazılır — gündəlik yoxlama jurnalı
    // doldurmasın.
    if (state.outdated && this.latest !== before) {
      waLog("version", `Kitabxananın yeni versiyası var: ${this.latest} (quraşdırılıb ${this.installed})`, {
        level: "warn",
        meta: { installed: this.installed, latest: this.latest, command: state.command },
      });
    }
    return state;
  }

  /** Server açılanda: dərhal bir dəfə, sonra gündə bir. */
  static start() {
    if (this._timer) return;
    // Açılışı gecikdirməmək üçün arxa fonda.
    this.check().catch(() => {});
    this._timer = setInterval(() => this.check().catch(() => {}), CHECK_INTERVAL);
    this._timer.unref?.();
  }

  static stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }
}
