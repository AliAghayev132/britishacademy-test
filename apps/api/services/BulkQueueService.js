// Models
import { WhatsAppMessage } from "#models";

// Services
import { WhatsAppService } from "./WhatsAppService.js";
import { MailService } from "./MailService.js";

/**
 * Toplu göndəriş növbəsi — WhatsApp VƏ e-poçt.
 *
 * Niyə növbə: WhatsApp sürətli ardıcıl göndərişi spam kimi qiymətləndirib
 * nömrəni müvəqqəti və ya həmişəlik bloklaya bilər; SMTP provayderlərində də
 * saniyəlik limitlər var. Ona görə mesajlar ARDICIL (paralel yox) və hər biri
 * arasında gecikmə ilə göndərilir.
 *
 * Eyni anda yalnız bir toplu göndəriş işləyir; gedişat `getState()` ilə
 * izlənilir və `cancel()` ilə dayandırıla bilər.
 */

// Kanal üzrə mesajlar arası gecikmə (ms). WhatsApp insan ritmini təqlid
// etməlidir; e-poçt daha sürətli gedə bilər.
const DELAY = {
  whatsapp: { min: 4_000, max: 9_000 },
  email: { min: 800, max: 1_600 },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randomDelay = (channel) => {
  const d = DELAY[channel] || DELAY.whatsapp;
  return d.min + Math.floor(Math.random() * (d.max - d.min));
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Şablon dəyişənlərini əvəz et: "Salam {{ad}}" → "Salam Əli".
 * Naməlum dəyişən boş sətirlə əvəzlənir ki, mesajda {{...}} görünməsin.
 */
export function renderTemplate(template, vars = {}) {
  return String(template || "").replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const v = vars[key];
    return v == null ? "" : String(v);
  });
}

/**
 * Xam alıcı siyahısını (Excel/əl ilə/müraciətlər) normallaşdır və doğrula.
 * Kanal üzrə lazımi sahə yoxdursa sətir «etibarsız» kimi qaytarılır —
 * səssizcə atılmır ki, admin nəyin düşdüyünü görsün.
 *
 * @returns {{ valid: Array, invalid: Array, duplicates: number }}
 */
export function normalizeRecipients(rows = [], channel = "whatsapp") {
  const seen = new Set();
  const valid = [];
  const invalid = [];
  let duplicates = 0;

  for (const raw of rows) {
    const r = typeof raw === "string" ? { value: raw } : raw || {};
    const name = String(r.name || r.ad || "").trim();

    if (channel === "email") {
      const email = String(r.email || r.value || "").trim().toLowerCase();
      if (!EMAIL_RE.test(email)) {
        invalid.push({ input: r.email || r.value || "", reason: "e-poçt formatı yanlışdır" });
        continue;
      }
      if (seen.has(email)) { duplicates += 1; continue; }
      seen.add(email);
      valid.push({ email, name, lead: r.lead, vars: { ad: name, email } });
      continue;
    }

    // WhatsApp
    const phone = WhatsAppService.normalizePhone(r.phone || r.value || "");
    if (phone.length < 10 || phone.length > 15) {
      invalid.push({ input: r.phone || r.value || "", reason: "nömrə formatı yanlışdır" });
      continue;
    }
    if (seen.has(phone)) { duplicates += 1; continue; }
    seen.add(phone);
    valid.push({ phone, name, lead: r.lead, vars: { ad: name, telefon: phone } });
  }

  return { valid, invalid, duplicates };
}

export class BulkQueue {
  static running = false;
  static cancelled = false;
  static channel = null;
  static total = 0;
  static sent = 0;
  static failed = 0;
  static current = null;
  static startedAt = null;
  static finishedAt = null;
  static errors = []; // { to, error }

  static getState() {
    return {
      running: this.running,
      channel: this.channel,
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
   * @param {"whatsapp"|"email"} opts.channel
   * @param {Array} opts.recipients      normalizeRecipients-dən keçmiş siyahı
   * @param {string} opts.template       {{ad}} kimi dəyişənlərlə mətn
   * @param {string} [opts.subject]      e-poçt mövzusu (kanal=email üçün)
   * @param {string} [opts.source]       "bulk" | "lead" | "excel" | "list"
   * @param {string} [opts.sentBy]       göndərən istifadəçinin id-si
   * @param {boolean} [opts.skipDuplicates] son 24 saatda mesaj alanı ötür
   */
  static async start({
    channel = "whatsapp",
    recipients = [],
    template = "",
    subject = "",
    source = "bulk",
    sentBy = null,
    skipDuplicates = true,
  }) {
    if (this.running) throw new Error("Artıq işləyən toplu göndəriş var");
    if (!template.trim()) throw new Error("Mesaj mətni boşdur");
    if (!recipients.length) throw new Error("Göndəriləcək alıcı yoxdur");

    if (channel === "whatsapp" && !WhatsAppService.isReady) {
      throw new Error("WhatsApp hazır deyil — əvvəlcə qoşulun");
    }
    if (channel === "email") {
      if (!subject.trim()) throw new Error("E-poçt mövzusu boşdur");
      const cfg = await MailService.resolveConfig();
      if (!cfg?.host) throw new Error("SMTP konfiqurasiya olunmayıb (Tənzimləmələr → SMTP)");
    }

    this.running = true;
    this.cancelled = false;
    this.channel = channel;
    this.total = recipients.length;
    this.sent = 0;
    this.failed = 0;
    this.current = null;
    this.errors = [];
    this.startedAt = new Date();
    this.finishedAt = null;

    // Arxa fonda işlə — HTTP cavabı bloklanmasın.
    this._run(recipients, { channel, template, subject, source, sentBy, skipDuplicates })
      .catch((err) => {
        console.error("❌ Toplu göndəriş xətası:", err.message);
        this.running = false;
        this.finishedAt = new Date();
      });

    return this.getState();
  }

  static async _run(list, { channel, template, subject, source, sentBy, skipDuplicates }) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const isEmail = channel === "email";

    for (let i = 0; i < list.length; i += 1) {
      if (this.cancelled) {
        console.log("⏹️ Toplu göndəriş dayandırıldı");
        break;
      }
      const r = list[i];
      const to = isEmail ? r.email : r.phone;
      this.current = to;

      // Son 24 saatda eyni alıcıya göndərilibsə ötür (təkrar spam olmasın).
      if (skipDuplicates) {
        const recent = await WhatsAppMessage.exists({
          channel,
          ...(isEmail ? { email: to } : { phone: to }),
          status: { $ne: "failed" },
          createdAt: { $gte: since },
        });
        if (recent) {
          this.failed += 1;
          this.errors.push({ to, error: "Son 24 saatda mesaj göndərilib — ötürüldü" });
          continue;
        }
      }

      const body = renderTemplate(template, r.vars || {});
      const subj = isEmail ? renderTemplate(subject, r.vars || {}) : undefined;
      const log = {
        channel, name: r.name, body, source, lead: r.lead, sentBy,
        ...(isEmail ? { email: to, subject: subj } : { phone: to }),
      };

      try {
        if (isEmail) {
          // Düz mətni sadə HTML-ə çevir (sətir sonları qorunsun).
          const html = body.split("\n").map((l) => `<p>${l || "&nbsp;"}</p>`).join("");
          await MailService.send({ to, subject: subj, html });
        } else {
          await WhatsAppService.sendMessage(to, body);
        }
        this.sent += 1;
        await WhatsAppMessage.create({ ...log, status: "sent" }).catch(() => {});
      } catch (err) {
        this.failed += 1;
        this.errors.push({ to, error: err.message });
        await WhatsAppMessage.create({ ...log, status: "failed", error: err.message }).catch(() => {});
      }

      // Sonuncudan sonra gözləməyə ehtiyac yoxdur.
      if (i < list.length - 1 && !this.cancelled) await sleep(randomDelay(channel));
    }

    this.running = false;
    this.current = null;
    this.finishedAt = new Date();
    console.log(`✅ Toplu göndəriş bitdi (${channel}): ${this.sent} göndərildi, ${this.failed} alınmadı`);
  }
}
