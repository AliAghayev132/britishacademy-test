// Local
import { waLog } from "./WhatsAppLogService.js";
import { INIT_TIMEOUT, HEALTH_INTERVAL } from "./whatsapp/constants.js";
import { explainChromeError } from "./whatsapp/chrome.js";
import { createClient, killClient } from "./whatsapp/client.js";
import { resetAutoRetry, autoAllowed, registerAutoFailure } from "./whatsapp/autoRetry.js";
import { attachClientEvents, onAck } from "./whatsapp/events.js";
import { buildStatus } from "./whatsapp/status.js";
import {
  normalizePhone,
  withSendTimeout,
  loadLib,
  sessionExists,
  removeSessionDir,
  makeQrDataUrl,
} from "./whatsapp/helpers.js";

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
 *
 * Köməkçi hissələr services/whatsapp/ altındadır (Chrome, klient, hadisələr,
 * geri çəkilmə, status); vəziyyət isə bu sinfin statik sahələrində qalır.
 */
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
  // Avtomatik bərpanın geri çəkilməsi (audit #38) — bax whatsapp/autoRetry.js.
  static _autoFailures = 0;
  static _nextAutoAt = 0;
  static _autoBlocked = null; // səbəb — əl ilə «Qoşul» basılana qədər avtomatik cəhd yoxdur

  // ── Admin açarı (SiteSetting.whatsapp.autoConnect) ──
  // Burada yalnız KEŞLƏNİR: bu sinif `#models`-i import etmir (dövri asılılıq
  // olmasın). Dəyəri server açılanda startup, sonra isə panel yazır.
  static autoConnect = true;
  // QR gözləməsi həddə çatıb dayandırılıbsa — panel səbəbi göstərsin.
  static qrStopped = false;

  // ── Kitabxana yüklənməsi (opsional asılılıq) ──

  /** Kitabxananı lazım olanda yüklə; yoxdursa `false` saxlanılır. */
  static async _load() {
    if (this._lib !== null) return this._lib;
    this._lib = await loadLib();
    return this._lib;
  }

  static get isInstalled() {
    return this._lib !== false;
  }

  /** Diskdə saxlanmış sessiya varmı? (varsa QR-siz bərpa mümkündür) */
  static get hasSession() {
    return sessionExists();
  }

  /** QR mətnini lokal PNG data URL-ə çevir (`qrcode` yoxdursa null). */
  static _makeQrDataUrl(text) {
    return makeQrDataUrl(text);
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
    await killClient(client);
  }

  /** `message_ack` → bazadakı mesajın çatdırılma statusunu yenilə. */
  static _onAck(msg, ack) {
    return onAck(msg, ack);
  }

  // ── Qoşulma ──

  /**
   * @param {{ pairPhone?: string }} [opts] — verilsə QR əvəzinə telefon nömrəsi
   *   üçün 8 rəqəmli qoşulma kodu istənilir.
   */
  static async init({ pairPhone, auto = false } = {}) {
    // Admin inteqrasiyanı söndürübsə heç bir yoldan qoşulmuruq.
    if (!this.autoConnect) {
      this.lastError = "WhatsApp inteqrasiyası paneldən söndürülüb";
      return;
    }
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
    this.qrStopped = false;
    this._qrCount = 0; // hədd hər qoşulma cəhdində sıfırdan sayılır
    this._auto = auto;
    // Əl ilə qoşulma geri çəkilməni sıfırlayır.
    if (!auto) resetAutoRetry(this);
    this.lastError = null;
    this._authOk = false;
    this.qrCode = null;
    this.qrDataUrl = null;
    this.pairingCode = null;
    this._pairPhone = pairPhone ? this.normalizePhone(pairPhone) : null;
    this._clearTimers(); // köhnə watchdog yeni klienti öldürməsin

    try {
      await this._destroyClient();

      this.client = createClient(lib, this._pairPhone);
      attachClientEvents(this, lib);

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
      const note = this._auto ? registerAutoFailure(this, error.message) : "";
      waLog("error", this.lastError + note, {
        level: "error",
        meta: { raw: error.message, autoFailures: this._autoFailures, nextAutoAt: this._nextAutoAt || null },
      });
      await this._destroyClient();
    }
  }

  /**
   * Server açılanda: saxlanmış sessiya varsa QR-siz avtomatik qoşul.
   * Sessiya yoxdursa heç nə etmir (Chromium boş yerə açılmasın).
   */
  static async resumeIfSession() {
    if (!this.autoConnect) return;
    const lib = await this._load();
    if (!lib || !this.hasSession || this.client || this.isInitializing) return;
    if (!this._autoAllowed()) return;
    waLog("session", "Saxlanmış sessiya tapıldı — avtomatik bərpa edilir");
    this.init({ auto: true }).catch(() => {});
    this.startHealthWatch();
  }

  /** Avtomatik cəhd indi edilə bilərmi (geri çəkilmə / daimi xəta)? */
  static _autoAllowed() {
    return autoAllowed(this);
  }

  /**
   * Dövri sağlamlıq yoxlaması: `getState()` CONNECTED deyilsə klienti bağlayıb
   * saxlanmış sessiya ilə yenidən qoşulur (QR tələb olunmur).
   */
  static startHealthWatch() {
    if (this._healthTimer || !this.autoConnect) return;
    this._healthTimer = setInterval(async () => {
      try {
        if (!this.autoConnect) return;
        if (this.isInitializing) return;
        // Klient yoxdur, amma sessiya var → bərpa et.
        if (!this.client) {
          if (this.hasSession) await this.resumeIfSession();
          return;
        }
        const state = await this.client.getState().catch(() => null);
        this.state = state;
        if (state && state !== "CONNECTED") {
          if (!this._autoAllowed()) return;
          waLog("health", `Sağlamlıq yoxlaması: vəziyyət ${state} — yenidən qoşulur`, {
            level: "warn", meta: { state },
          });
          this.isReady = false;
          await this._destroyClient();
          await this.init({ auto: true });
        }
      } catch { /* növbəti dövrədə yenidən yoxlanılacaq */ }
    }, HEALTH_INTERVAL);
    // Node prosesinin bağlanmasına mane olmasın.
    this._healthTimer.unref?.();
  }

  /**
   * Skan gözləməsini dayandır (QR həddi doldu və ya admin söndürdü).
   *
   * Sessiya SAXLANILIR — bu, «çıxış» deyil, sadəcə gözləməyin sonudur.
   * Chromium bağlanır ki, heç kim skan etmirsə server boş yerə brauzer
   * saxlamasın və jurnal QR sətirləri ilə dolmasın.
   */
  static async stopQrWait(reason = "QR gözləmə həddi doldu") {
    if (!this.client || this.isReady) return;
    this.qrStopped = true;
    this.qrCode = null;
    this.qrDataUrl = null;
    this.pairingCode = null;
    this.isInitializing = false;
    this.lastError = `${reason} — yenidən cəhd üçün «Qoşul» basın`;
    waLog("qr", `${reason} (${this._qrCount || 0} cəhd) — gözləmə dayandırıldı`, {
      level: "warn",
      meta: { attempts: this._qrCount || 0 },
    });
    this._clearTimers();
    await this._destroyClient().catch(() => {});
  }

  /**
   * Admin açarı. Söndürüləndə hər şey dayanır: sağlamlıq taymeri, açıq
   * Chromium və QR gözləməsi. Sessiya faylına toxunulmur — yandıranda
   * QR-siz bərpa olunur.
   */
  static async setAutoConnect(enabled) {
    this.autoConnect = Boolean(enabled);
    if (this.autoConnect) {
      this.lastError = null;
      this.qrStopped = false;
      resetAutoRetry(this);
      return;
    }
    this.stopHealthWatch();
    this._clearTimers();
    this.qrCode = null;
    this.qrDataUrl = null;
    this.pairingCode = null;
    this.isReady = false;
    this.isInitializing = false;
    this.lastError = null;
    await this._destroyClient().catch(() => {});
    waLog("session", "WhatsApp inteqrasiyası paneldən söndürüldü", { level: "warn" });
  }

  /** Proses dayananda: taymerləri dayandır, Chromium-u bağla, sessiyanı saxla. */
  static async shutdown() {
    this._clearTimers();
    this.stopHealthWatch();
    await this._destroyClient().catch(() => {});
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
    return normalizePhone(phone);
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
      await withSendTimeout(this.client.sendMessage(chatId, message));
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
      await withSendTimeout(this.client.sendMessage(chatId, media, caption ? { caption } : {}));
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
    return buildStatus(this);
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
    await removeSessionDir();
  }
}
