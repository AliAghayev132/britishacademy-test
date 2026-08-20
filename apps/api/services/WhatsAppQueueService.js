// Models
import { WhatsAppMessage } from "#models";

// Services
import { WhatsAppService } from "./WhatsAppService.js";

/**
 * WhatsApp toplu göndəriş növbəsi.
 *
 * Niyə növbə: WhatsApp sürətli ardıcıl göndərişi spam kimi qiymətləndirib
 * nömrəni MÜVƏQQƏTİ və ya HƏMİŞƏLİK bloklaya bilər. Ona görə mesajlar
 * ardıcıl (paralel YOX) və hər biri arasında təsadüfi gecikmə ilə göndərilir.
 *
 * Eyni anda yalnız bir toplu göndəriş işləyir; gedişat `getState()` ilə
 * izlənilir və `cancel()` ilə dayandırıla bilər.
 */

// Mesajlar arası gecikmə aralığı (ms) — insan ritmini təqlid edir.
const MIN_DELAY = 4_000;
const MAX_DELAY = 9_000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randomDelay = () => MIN_DELAY + Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY));

/**
 * Şablon dəyişənlərini əvəz et: "Salam {{ad}}" → "Salam Əli".
 * Naməlum dəyişən boş sətirlə əvəzlənir ki, mesajda `{{...}}` görünməsin.
 */
export function renderTemplate(template, vars = {}) {
  return String(template || "").replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const v = vars[key];
    return v == null ? "" : String(v);
  });
}

export class WhatsAppQueue {
  static running = false;
  static cancelled = false;
  static total = 0;
  static sent = 0;
  static failed = 0;
  static current = null;
  static startedAt = null;
  static finishedAt = null;
  static errors = []; // { phone, error }

  static getState() {
    return {
      running: this.running,
      total: this.total,
      sent: this.sent,
      failed: this.failed,
      current: this.current,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
      errors: this.errors.slice(0, 50),
    };
  }

  static cancel() {
    if (!this.running) return false;
    this.cancelled = true;
    return true;
  }

  /**
   * Toplu göndəriş başlat (arxa fonda işləyir — çağıran gözləmir).
   *
   * @param {object} opts
   * @param {Array<{ phone: string, vars?: object, lead?: string }>} opts.recipients
   * @param {string} opts.template  — `{{ad}}` kimi dəyişənlərlə mətn
   * @param {string} [opts.source]  — "bulk" | "lead"
   * @param {string} [opts.sentBy]  — göndərən istifadəçinin id-si
   * @param {boolean} [opts.skipDuplicates] — son 24 saatda mesaj alan nömrəni ötür
   */
  static async start({ recipients = [], template = "", source = "bulk", sentBy = null, skipDuplicates = true }) {
    if (this.running) throw new Error("Artıq işləyən toplu göndəriş var");
    if (!WhatsAppService.isReady) throw new Error("WhatsApp hazır deyil — əvvəlcə qoşulun");
    if (!template.trim()) throw new Error("Mesaj mətni boşdur");

    // Nömrələri normallaşdır və təkrarları at.
    const seen = new Set();
    const list = [];
    for (const r of recipients) {
      const phone = WhatsAppService.normalizePhone(r?.phone);
      if (!phone || seen.has(phone)) continue;
      seen.add(phone);
      list.push({ ...r, phone });
    }
    if (!list.length) throw new Error("Göndəriləcək nömrə yoxdur");

    this.running = true;
    this.cancelled = false;
    this.total = list.length;
    this.sent = 0;
    this.failed = 0;
    this.current = null;
    this.errors = [];
    this.startedAt = new Date();
    this.finishedAt = null;

    // Arxa fonda işlə — HTTP cavabı bloklanmasın.
    this._run(list, { template, source, sentBy, skipDuplicates }).catch((err) => {
      console.error("❌ WhatsApp növbə xətası:", err.message);
      this.running = false;
      this.finishedAt = new Date();
    });

    return this.getState();
  }

  static async _run(list, { template, source, sentBy, skipDuplicates }) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (let i = 0; i < list.length; i += 1) {
      if (this.cancelled) {
        console.log("⏹️ WhatsApp toplu göndəriş dayandırıldı");
        break;
      }
      const { phone, vars, lead } = list[i];
      this.current = phone;

      // Son 24 saatda eyni nömrəyə göndərilibsə ötür (təkrar spam olmasın).
      if (skipDuplicates) {
        const recent = await WhatsAppMessage.exists({
          phone,
          status: { $ne: "failed" },
          createdAt: { $gte: since },
        });
        if (recent) {
          this.failed += 1;
          this.errors.push({ phone, error: "Son 24 saatda mesaj göndərilib — ötürüldü" });
          continue;
        }
      }

      const body = renderTemplate(template, vars || {});
      try {
        await WhatsAppService.sendMessage(phone, body);
        this.sent += 1;
        await WhatsAppMessage.create({ phone, body, status: "sent", source, lead, sentBy });
      } catch (err) {
        this.failed += 1;
        this.errors.push({ phone, error: err.message });
        await WhatsAppMessage.create({
          phone, body, status: "failed", error: err.message, source, lead, sentBy,
        }).catch(() => {});
      }

      // Sonuncudan sonra gözləməyə ehtiyac yoxdur.
      if (i < list.length - 1 && !this.cancelled) await sleep(randomDelay());
    }

    this.running = false;
    this.current = null;
    this.finishedAt = new Date();
    console.log(`✅ WhatsApp toplu göndəriş bitdi: ${this.sent} göndərildi, ${this.failed} alınmadı`);
  }
}
