// Node
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

// Models
import { WhatsAppMessage } from "#models";
// Services
import { waLog } from "./WhatsAppLogService.js";
import { installedVersion } from "./LibVersionService.js";

/**
 * WhatsApp (whatsapp-web.js 1.34.x) — admin panelindən qoşulma və mesaj göndərmə.
 *
 * Kitabxana OPSİONALDIR: quraşdırılmayıbsa servis `installed: false` qaytarır və
 * API çökmür (`import()` yalnız lazım olanda çağırılır).
 *
 * Əsas qabiliyyətlər:
 *  - QR **və ya** pairing-kod ilə qoşulma (`pairWithPhoneNumber`)
 *  - server restartından sonra saxlanmış sessiya ilə **avtomatik bərpa** (QR-siz)
 *  - `getState()` üzərindən dövri **health-check** və avto-yenidənqoşulma
 *  - `message_ack` ilə **çatdırılma/oxunma** statusunun bazada yenilənməsi
 *  - asma/orphan-Chrome qorunması: timeout-lar, watchdog, brauzer SIGKILL
 *
 * Sessiya siyasəti (vacib):
 *  - `authenticated` → `ready` gəlməsə: brauzer öldürülür, SESSİYA SAXLANILIR
 *    (yavaş resume-da etibarlı sessiya itməsin — health-check bərpa edir)
 *  - sessiya YALNIZ `auth_failure`-da və ya istifadəçi «çıxış» edəndə silinir
 */

// ── Vaxt limitləri ──
const MSG_TIMEOUT = 30_000;
const INIT_TIMEOUT = 120_000;
const READY_TIMEOUT = 180_000;   // authenticated → ready watchdog
const HEALTH_INTERVAL = 60_000;  // dövri vəziyyət yoxlaması

// İstehsalatda WhatsApp Web versiyasını pin etmək üçün (opsional).
const WA_WEB_VERSION_URL = process.env.WA_WEB_VERSION_URL || null;
// Sessiya qovluğu — deploy-da persistent volume-a yönəldilə bilər.
const SESSION_DIR = process.env.WA_SESSION_DIR || path.resolve(".wwebjs_auth");
const CLIENT_ID = "british-academy";

/** Puppeteer-in öz Chrome-u yoxdursa sistem Chrome-unu tap. */
function findSystemChrome() {
  if (process.env.WHATSAPP_CHROME_PATH) return process.env.WHATSAPP_CHROME_PATH;
  const platform = os.platform();
  const candidates =
    platform === "win32"
      ? [
          path.join(process.env.PROGRAMFILES || "", "Google/Chrome/Application/chrome.exe"),
          path.join(process.env["PROGRAMFILES(X86)"] || "", "Google/Chrome/Application/chrome.exe"),
          path.join(process.env.LOCALAPPDATA || "", "Google/Chrome/Application/chrome.exe"),
        ]
      : platform === "darwin"
        ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
        : [
            "/usr/bin/google-chrome",
            "/usr/bin/google-chrome-stable",
            "/usr/bin/chromium-browser",
            "/usr/bin/chromium",
          ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * Puppeteer-in xam «Could not find Chrome (ver. …)» mesajı səbəbi izah etmir —
 * istifadəçi admin paneldə yalnız bu sətri görür və nə edəcəyini bilmir.
 * Brauzer ümumiyyətlə tapılmadıqda mesajı həlli göstərən mətnlə əvəz edirik.
 */
function explainChromeError(message) {
  if (!/Could not find Chrome|Could not find (Chromium|browser)|Failed to launch the browser/i.test(message)) {
    return message;
  }
  return (
    "Serverdə Chrome tapılmadı — WhatsApp Web brauzer olmadan işləmir. " +
    "Həlli: sistemə Google Chrome quraşdırın (Debian/Ubuntu: " +
    "apt-get install -y google-chrome-stable), sonra serveri yenidən başladın. " +
    "Fərqli yerdədirsə WHATSAPP_CHROME_PATH dəyişənində tam yolu göstərin. " +
    "Orijinal xəta: " + message
  );
}

export class WhatsAppService {
  static client = null;
  static isReady = false;
  static isInitializing = false;
  static qrCode = null;       // xam QR mətni
  static qrDataUrl = null;    // serverdə generasiya olunmuş PNG (kənar servisə göndərmirik)
  static pairingCode = null;  // QR əvəzinə telefonla qoşulma kodu
  static lastError = null;
  static info = null;
  static state = null;        // WAState (CONNECTED / OPENING / ...)
  static readyAt = null;
  static _authOk = false;
  static _readyTimer = null;
  static _healthTimer = null;
  static _lib = null;
  static _pairPhone = null;   // pairing-kod istənilibsə hədəf nömrə

  // ── Kitabxana yüklənməsi (opsional asılılıq) ──

  /** Kitabxananı lazım olanda yüklə; yoxdursa `false` saxlanılır. */
  static async _load() {
    if (this._lib !== null) return this._lib;
    try {
      const pkg = await import("whatsapp-web.js");
      const mod = pkg.default || pkg;
      this._lib = {
        Client: mod.Client,
        LocalAuth: mod.LocalAuth,
        MessageMedia: mod.MessageMedia,
        Events: mod.Events,
        WAState: mod.WAState,
        MessageAck: mod.MessageAck,
        version: mod.version,
      };
    } catch {
      this._lib = false;
    }
    return this._lib;
  }

  static get isInstalled() {
    return this._lib !== false;
  }

  /** Diskdə saxlanmış sessiya varmı? (varsa QR-siz bərpa mümkündür) */
  static get hasSession() {
    try {
      return fs.existsSync(path.join(SESSION_DIR, `session-${CLIENT_ID}`));
    } catch {
      return false;
    }
  }

  /** QR mətnini lokal PNG data URL-ə çevir (`qrcode` yoxdursa null). */
  static async _makeQrDataUrl(text) {
    try {
      const { default: QRCode } = await import("qrcode");
      return await QRCode.toDataURL(text, { width: 320, margin: 1 });
    } catch {
      return null;
    }
  }

  // ── Daxili köməkçilər ──

  static _clearTimers() {
    if (this._readyTimer) { clearTimeout(this._readyTimer); this._readyTimer = null; }
  }

  /** Klienti tam öldür — brauzer prosesini də SIGKILL et (orphan Chrome qalmasın). */
  static async _destroyClient() {
    const client = this.client;
    if (!client) return;
    this.client = null; // dərhal təmizlə — paralel çağırış iki dəfə öldürməsin
    try { client.removeAllListeners(); } catch { /* ignore */ }
    try {
      const browser = client.pupBrowser || client?.pupPage?.browser?.();
      await client.destroy();
      if (browser) {
        try { await browser.close(); } catch { /* ignore */ }
        try { browser.process()?.kill("SIGKILL"); } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
  }

  /** `message_ack` → bazadakı mesajın çatdırılma statusunu yenilə. */
  static async _onAck(msg, ack) {
    try {
      if (!msg?.fromMe || !msg?.to) return;
      const phone = String(msg.to).split("@")[0];
      // 1 = serverə çatdı, 2 = cihaza çatdı, 3 = oxundu, 4 = səsli mesaj dinlənildi
      const status = ack >= 3 ? "read" : ack === 2 ? "delivered" : ack === 1 ? "sent" : null;
      if (!status) return;
      await WhatsAppMessage.findOneAndUpdate(
        { phone, status: { $in: ["sent", "delivered"] } },
        { $set: { status } },
        { sort: { createdAt: -1 } },
      );
    } catch { /* ack izləmə kritik deyil */ }
  }

  // ── Qoşulma ──

  /**
   * @param {{ pairPhone?: string }} [opts] — verilsə QR əvəzinə telefon nömrəsi
   *   üçün 8 rəqəmli qoşulma kodu istənilir.
   */
  static async init({ pairPhone } = {}) {
    const lib = await this._load();
    if (!lib) {
      this.lastError = "whatsapp-web.js quraşdırılmayıb (npm i whatsapp-web.js qrcode)";
      return;
    }
    if (this.client && this.isReady) return;
    if (this.isInitializing) return;

    waLog("init", pairPhone ? `Qoşulma başladıldı — telefon kodu (${pairPhone})` : "Qoşulma başladıldı — QR", {
      meta: { pairPhone: pairPhone || null, hasSession: this.hasSession },
    });
    this.isInitializing = true;
    this.lastError = null;
    this._authOk = false;
    this.qrCode = null;
    this.qrDataUrl = null;
    this.pairingCode = null;
    this._pairPhone = pairPhone ? this.normalizePhone(pairPhone) : null;
    this._clearTimers(); // köhnə watchdog yeni klienti öldürməsin

    try {
      await this._destroyClient();

      const puppeteer = {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--disable-extensions",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--js-flags=--max-old-space-size=256",
        ],
      };
      const chrome = findSystemChrome();
      if (chrome) puppeteer.executablePath = chrome;

      this.client = new lib.Client({
        authStrategy: new lib.LocalAuth({ clientId: CLIENT_ID, dataPath: SESSION_DIR }),
        puppeteer,
        // Başqa yerdə WhatsApp Web açılsa sessiyanı geri al (yoxsa bizim klient düşür).
        takeoverOnConflict: true,
        takeoverTimeoutMs: 10_000,
        qrMaxRetries: 5,
        authTimeoutMs: 60_000,
        // Telefon nömrəsi verilibsə QR əvəzinə qoşulma kodu ilə pair et.
        ...(this._pairPhone ? { pairWithPhoneNumber: { phoneNumber: this._pairPhone, showNotification: true } } : {}),
        webVersionCache: WA_WEB_VERSION_URL
          ? { type: "remote", remotePath: WA_WEB_VERSION_URL }
          : { type: "none" },
      });

      const E = lib.Events;

      this.client.on(E.QR_RECEIVED, async (qr) => {
        this.qrCode = qr;
        this.qrDataUrl = await this._makeQrDataUrl(qr);
        this._qrCount = (this._qrCount || 0) + 1;
        waLog("qr", `QR kodu yaradıldı (#${this._qrCount})`, { meta: { attempt: this._qrCount } });
      });

      // pairWithPhoneNumber rejimində QR yerinə 8 rəqəmli kod gəlir.
      this.client.on(E.CODE_RECEIVED, (code) => {
        this.pairingCode = code;
        waLog("qr", `Telefon qoşulma kodu hazırdır: ${code}`, { meta: { code } });
      });

      this.client.on(E.LOADING_SCREEN, (pct, msg) => {
        console.log(`⏳ WhatsApp yüklənir: ${pct}% — ${msg}`);
        // Yalnız mərhələlər jurnala düşür — hər faiz sətir yaratmasın.
        if (pct === 0 || pct === 100) waLog("init", `Yüklənir: ${pct}% — ${msg}`, { meta: { pct } });
      });

      // authenticated gəldi, amma ready gəlmirsə: brauzeri bağla, SESSİYANI SAXLA.
      this.client.on(E.AUTHENTICATED, () => {
        if (this._authOk) return;
        this._authOk = true;
        this.qrCode = null;
        this.qrDataUrl = null;
        this.pairingCode = null;
        waLog("auth", "Autentifikasiya uğurlu — hazır siqnalı gözlənilir");
        this._readyTimer = setTimeout(async () => {
          if (!this.isReady) {
            waLog("error", "Hazır siqnalı gəlmədi — klient bağlanır, sessiya saxlanılır", {
              level: "error",
              meta: { timeoutMs: READY_TIMEOUT, hint: "Adətən kitabxana köhnə qalanda olur — versiya bildirişinə bax" },
            });
            this.lastError = "Qoşulma gecikdi — avtomatik yenidən cəhd ediləcək.";
            this.isInitializing = false;
            this._authOk = false;
            await this._destroyClient(); // sessiya silinmir
          }
        }, READY_TIMEOUT);
      });

      this.client.on(E.READY, async () => {
        this._clearTimers();
        this.isReady = true;
        this.isInitializing = false;
        this.qrCode = null;
        this.qrDataUrl = null;
        this.pairingCode = null;
        this.lastError = null;
        this.readyAt = new Date();
        this.info = this.client?.info || null;
        this.state = lib.WAState.CONNECTED;
        waLog("ready", `Hazırdır: ${this.info?.pushname || "?"} (+${this.info?.wid?.user || "?"})`, {
          meta: { pushname: this.info?.pushname, phone: this.info?.wid?.user, platform: this.info?.platform },
        });
        this.startHealthWatch();
      });

      this.client.on(E.AUTHENTICATION_FAILURE, async (msg) => {
        waLog("auth", `Autentifikasiya alınmadı: ${msg}`, { level: "error", meta: { reason: String(msg) } });
        this.isReady = false;
        this.isInitializing = false;
        this._authOk = false;
        this.lastError = "Auth failure: " + msg;
        // Saxlanmış kimlik həqiqətən etibarsızdır — YALNIZ burada avtomatik sil.
        await this.clearSession();
        waLog("session", "Etibarsız sessiya avtomatik silindi — yenidən QR lazımdır", { level: "warn" });
      });

      this.client.on(E.DISCONNECTED, (reason) => {
        waLog("disconnect", `Bağlantı kəsildi: ${reason}`, {
          level: "warn",
          meta: { reason: String(reason), uptimeMin: this.readyAt ? Math.round((Date.now() - this.readyAt) / 60000) : null },
        });
        this.isReady = false;
        this.isInitializing = false;
        this._authOk = false;
        this.info = null;
        this.state = null;
        this.readyAt = null;
        this.lastError = "Bağlantı kəsildi: " + reason;
        this._clearTimers();
        this._destroyClient().catch(() => {});
      });

      this.client.on(E.STATE_CHANGED, (s) => {
        const prev = this.state;
        this.state = s;
        // Eyni vəziyyət təkrarlanırsa jurnal doldurulmur.
        if (prev !== s) {
          waLog("state", `Vəziyyət: ${prev || "—"} → ${s}`, {
            level: s === "CONNECTED" ? "info" : "warn",
            meta: { from: prev, to: s },
          });
        }
      });

      // Göndərilən mesajların çatdırılma/oxunma statusu.
      this.client.on(E.MESSAGE_ACK, (msg, ack) => this._onAck(msg, ack));

      let timeoutId;
      const timeout = new Promise((_, rej) => {
        timeoutId = setTimeout(() => rej(new Error("WhatsApp init timeout (2 dəq)")), INIT_TIMEOUT);
      });
      try {
        await Promise.race([this.client.initialize(), timeout]);
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      this.lastError = explainChromeError(error.message);
      this.isInitializing = false;
      this._authOk = false;
      waLog("error", this.lastError, { level: "error", meta: { raw: error.message } });
      await this._destroyClient();
    }
  }

  /**
   * Server açılanda: saxlanmış sessiya varsa QR-siz avtomatik qoşul.
   * Sessiya yoxdursa heç nə etmir (Chromium boş yerə açılmasın).
   */
  static async resumeIfSession() {
    const lib = await this._load();
    if (!lib || !this.hasSession || this.client || this.isInitializing) return;
    waLog("session", "Saxlanmış sessiya tapıldı — avtomatik bərpa edilir");
    this.init().catch(() => {});
    this.startHealthWatch();
  }

  /**
   * Dövri sağlamlıq yoxlaması: `getState()` CONNECTED deyilsə klienti bağlayıb
   * saxlanmış sessiya ilə yenidən qoşulur (QR tələb olunmur).
   */
  static startHealthWatch() {
    if (this._healthTimer) return;
    this._healthTimer = setInterval(async () => {
      try {
        if (this.isInitializing) return;
        // Klient yoxdur, amma sessiya var → bərpa et.
        if (!this.client) {
          if (this.hasSession) await this.resumeIfSession();
          return;
        }
        const state = await this.client.getState().catch(() => null);
        this.state = state;
        if (state && state !== "CONNECTED") {
          waLog("health", `Sağlamlıq yoxlaması: vəziyyət ${state} — yenidən qoşulur`, {
            level: "warn", meta: { state },
          });
          this.isReady = false;
          await this._destroyClient();
          await this.init();
        }
      } catch { /* növbəti dövrədə yenidən yoxlanılacaq */ }
    }, HEALTH_INTERVAL);
    // Node prosesinin bağlanmasına mane olmasın.
    this._healthTimer.unref?.();
  }

  static stopHealthWatch() {
    if (this._healthTimer) {
      clearInterval(this._healthTimer);
      this._healthTimer = null;
    }
  }

  // ── Nömrə / göndərmə ──

  /** "0501234567" / "+994 50 123 45 67" → "994501234567" */
  static normalizePhone(phone) {
    const cleaned = String(phone || "").replace(/[^0-9]/g, "");
    if (cleaned.startsWith("994")) return cleaned;
    if (cleaned.startsWith("0") && cleaned.length === 10) return `994${cleaned.slice(1)}`;
    if (cleaned.length === 9) return `994${cleaned}`;
    return cleaned;
  }

  /**
   * Nömrəni WhatsApp ID-sinə çevir. `getNumberId` alternativ formatları da
   * (məs. köhnə 13 rəqəmli LATAM nömrələri) düzgün həll edir və qeydiyyatdan
   * keçməmiş nömrə üçün null qaytarır.
   */
  static async _resolveChatId(phone) {
    if (!this.isReady || !this.client) {
      throw new Error("WhatsApp hazır deyil — əvvəlcə qoşulun.");
    }
    const normalized = this.normalizePhone(phone);
    if (normalized.length < 10 || normalized.length > 15) {
      throw new Error("Telefon nömrəsi düzgün deyil");
    }
    const wid = await this.client.getNumberId(normalized);
    if (!wid) {
      throw new Error(`Bu nömrə (${normalized}) WhatsApp-da qeydiyyatdan keçməyib`);
    }
    return wid._serialized;
  }

  /** Nömrənin WhatsApp-da olub-olmadığını yoxla (göndərmədən). */
  static async checkNumber(phone) {
    const normalized = this.normalizePhone(phone);
    if (!this.isReady || !this.client) throw new Error("WhatsApp hazır deyil");
    const wid = await this.client.getNumberId(normalized).catch(() => null);
    return { phone: normalized, registered: Boolean(wid) };
  }

  static async sendMessage(phone, message) {
    if (!phone || !message) throw new Error("Telefon nömrəsi və mesaj məcburidir");
    const chatId = await this._resolveChatId(phone);
    try {
      await Promise.race([
        this.client.sendMessage(chatId, message),
        new Promise((_, rej) => setTimeout(() => rej(new Error("Göndərmə vaxtı bitdi")), MSG_TIMEOUT)),
      ]);
      waLog("send", `Mesaj göndərildi: ${chatId}`, { meta: { chatId, length: String(message).length } });
    } catch (error) {
      waLog("send", `Mesaj alınmadı (${chatId}): ${error.message}`, {
        level: "error", meta: { chatId, error: error.message },
      });
      throw new Error(error.message || "Mesaj göndərilərkən xəta baş verdi");
    }
  }

  /** Media (PDF/şəkil) + caption göndər. */
  static async sendMedia({ phone, base64, mimetype = "application/pdf", filename = "sened.pdf", caption = "" }) {
    if (!phone || !base64) throw new Error("Telefon nömrəsi və fayl məcburidir");
    const lib = await this._load();
    if (!lib) throw new Error("whatsapp-web.js quraşdırılmayıb");
    const chatId = await this._resolveChatId(phone);
    const media = new lib.MessageMedia(mimetype, base64, filename);
    try {
      await Promise.race([
        this.client.sendMessage(chatId, media, caption ? { caption } : {}),
        new Promise((_, rej) => setTimeout(() => rej(new Error("Göndərmə vaxtı bitdi")), MSG_TIMEOUT)),
      ]);
      waLog("send", `Fayl göndərildi: ${filename} → ${chatId}`, { meta: { chatId, filename, mimetype } });
    } catch (error) {
      waLog("send", `Fayl alınmadı (${chatId}): ${error.message}`, {
        level: "error", meta: { chatId, filename, error: error.message },
      });
      throw new Error(error.message || "Fayl göndərilərkən xəta baş verdi");
    }
  }

  // ── Status / bağlanma ──

  static getStatus() {
    return {
      installed: this.isInstalled,
      libVersion: installedVersion() || this._lib?.version || null,
      isReady: this.isReady,
      isInitializing: this.isInitializing,
      initialized: Boolean(this.client),
      hasSession: this.hasSession,
      needsQR: Boolean(this.qrCode) && !this.isReady,
      qrDataUrl: this.qrDataUrl,
      pairingCode: this.pairingCode,
      state: this.state,
      connectedAs: this.info?.pushname || null,
      phoneNumber: this.info?.wid?.user || null,
      readyAt: this.readyAt,
      lastError: this.lastError,

      // ── Diaqnostika ──
      // Bağlantı kəsiləndə ilk verilən suallar: nə qədərdir açıqdır, hansı
      // cihazdır, Chrome haradadır, sessiya faylı yerindədirmi.
      uptimeSec: this.readyAt ? Math.round((Date.now() - this.readyAt.getTime()) / 1000) : 0,
      platform: this.info?.platform || null,
      deviceManufacturer: this.info?.phone?.device_manufacturer || null,
      waVersion: this.info?.phone?.wa_version || null,
      chromePath: findSystemChrome() || null,
      sessionDir: SESSION_DIR,
      qrCount: this._qrCount || 0,
      healthWatch: Boolean(this._healthTimer),
      serverUptimeSec: Math.round(process.uptime()),
    };
  }

  /** Bağla, amma sessiyanı saxla (yenidən QR lazım olmur). */
  static async disconnect() {
    if (this.client || this.isReady) waLog("disconnect", "Bağlantı əl ilə bağlandı (sessiya saxlanılır)");
    this._clearTimers();
    this.stopHealthWatch();
    await this._destroyClient();
    this.isReady = false;
    this.isInitializing = false;
    this._authOk = false;
    this.qrCode = null;
    this.qrDataUrl = null;
    this.pairingCode = null;
    this.info = null;
    this.state = null;
    this.readyAt = null;
  }

  /**
   * Tam çıxış: mümkünsə telefondan da cihazı ayır (`client.logout()`), sonra
   * saxlanmış sessiyanı diskdən sil. Növbəti qoşulmada QR tələb olunur.
   */
  static async clearSession() {
    waLog("session", "Sessiya silinir — növbəti qoşulmada QR lazım olacaq", { level: "warn" });
    try {
      if (this.client && this.isReady) await this.client.logout();
    } catch { /* logout alınmasa da sessiya faylları silinəcək */ }
    await this.disconnect();
    // LocalAuth faylları bəzən dərhal buraxılmır — bir neçə cəhd et.
    for (let i = 0; i < 3; i += 1) {
      try {
        if (!fs.existsSync(SESSION_DIR)) break;
        fs.rmSync(SESSION_DIR, { recursive: true, force: true });
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }
}
