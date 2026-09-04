// Models
import { WhatsAppMessage } from "#models";

// Services
import { WhatsAppService } from "./WhatsAppService.js";
import { MailService } from "./MailService.js";
import socketService from "./SocketService.js";

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

/**
 * Mesajlar arası gecikmə — SANİYƏ ilə, admin panelindən verilir.
 *
 * Əvvəl sabit idi (WhatsApp 4–9 s). Sabit dəyər iki tərəfdən pisdir: kiçik
 * siyahıda lüzumsuz gözlətmə yaradır, böyük siyahıda isə kifayət etmir.
 * İndi hər göndərişdə seçilir; aşağıdakılar yalnız DEFOLT və HƏDDLƏRDİR.
 */
export const DELAY_LIMITS = {
  whatsapp: { min: 2, max: 300, def: 6 },
  email: { min: 1, max: 300, def: 2 },
};

/** Kanal üçün etibarlı gecikmə (saniyə). */
export function resolveDelaySec(channel, value) {
  const lim = DELAY_LIMITS[channel] || DELAY_LIMITS.whatsapp;
  // BOŞ DƏYƏR «VERİLMƏYİB» DEMƏKDİR, «sıfır saniyə» yox.
  // `Number("")` → 0 qaytarır və o, sonlu ədəddir; yalnız `isFinite`
  // yoxlansaydı, boş sahə minimum fasiləyə (ən sürətli rejimə) düşərdi —
  // halbuki admin sadəcə heç nə seçməyib.
  if (value === null || value === undefined || String(value).trim() === "") return lim.def;
  const n = Number(value);
  if (!Number.isFinite(n)) return lim.def;
  return Math.min(lim.max, Math.max(lim.min, Math.round(n * 10) / 10));
}

/**
 * WhatsApp-da gecikməyə 0–30% təsadüfi əlavə olunur.
 *
 * Niyə: dəqiq eyni fasilə ilə gedən mesajlar avtomat ritmi kimi görünür və
 * nömrənin bloklanma riskini artırır. E-poçtda belə problem yoxdur, ona görə
 * orada gecikmə dəqiq saxlanılır — admin nə yazıbsa, o qədər.
 */
const JITTER = { whatsapp: 0.3, email: 0 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nextDelay = (channel, delaySec) => {
  const base = delaySec * 1000;
  const j = JITTER[channel] ?? 0;
  return Math.round(base + Math.random() * base * j);
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

/** Canlı axında saxlanılan son hadisə sayı. */
const FEED_LIMIT = 300;

export class BulkQueue {
  static running = false;
  static cancelled = false;
  static channel = null;
  static total = 0;
  static sent = 0;
  static failed = 0;
  static skipped = 0;
  static index = 0; // neçəncisi işlənir (1-dən)
  static delaySec = 0;
  static current = null;
  static startedAt = null;
  static finishedAt = null;
  static errors = []; // { to, error }
  // Canlı izləmə üçün son hadisələr — hər alıcı üçün bir sətir.
  // Tarixçə bazadadır; bu, gedişatı EKRANDA görmək üçündür.
  static feed = [];

  static getState() {
    const done = this.sent + this.failed + this.skipped;
    const left = Math.max(0, this.total - done);
    return {
      running: this.running,
      channel: this.channel,
      total: this.total,
      sent: this.sent,
      failed: this.failed,
      skipped: this.skipped,
      done,
      index: this.index,
      delaySec: this.delaySec,
      // Qalan alıcı × gecikmə — «nə vaxt bitəcək» sualının cavabı.
      etaSec: this.running ? Math.round(left * this.delaySec) : 0,
      current: this.current,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
      errors: this.errors.slice(0, 50),
      feed: this.feed,
    };
  }

  /**
   * Canlı axına bir sətir yaz və izləyən adminlərə göndər.
   *
   * Socket YAYIMDIR, mənbə deyil: bağlantı qopsa da vəziyyət `getState()`
   * ilə tam bərpa olunur — panel həm socket-ə qulaq asır, həm arada bir
   * status sorğusu göndərir.
   */
  static push(entry) {
    const row = { ...entry, at: new Date() };
    this.feed.unshift(row);
    if (this.feed.length > FEED_LIMIT) this.feed.length = FEED_LIMIT;
    socketService.emitToRole(["admin", "superadmin", "developer"], "bulk:progress", {
      entry: row,
      state: {
        running: this.running,
        channel: this.channel,
        total: this.total,
        sent: this.sent,
        failed: this.failed,
        skipped: this.skipped,
        done: this.sent + this.failed + this.skipped,
        index: this.index,
        delaySec: this.delaySec,
        current: this.current,
        // Panel bununla ayırd edir: gələn hadisə HƏMİN göndərişə aiddirmi?
        // Bir göndəriş bitib başqası başlayanda köhnə sətirlər qarışmasın.
        startedAt: this.startedAt,
      },
    });
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
   * @param {number} [opts.delaySec] mesajlar arası fasilə (saniyə)
   */
  static async start({
    channel = "whatsapp",
    recipients = [],
    template = "",
    subject = "",
    source = "bulk",
    sentBy = null,
    skipDuplicates = true,
    delaySec,
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
    this.skipped = 0;
    this.index = 0;
    this.delaySec = resolveDelaySec(channel, delaySec);
    this.current = null;
    this.errors = [];
    this.feed = [];
    this.startedAt = new Date();
    this.finishedAt = null;

    socketService.emitToRole(["admin", "superadmin", "developer"], "bulk:start", this.getState());

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
        this.push({ status: "cancelled", error: `${list.length - i} alıcı göndərilmədi`, i: i + 1 });
        break;
      }
      const r = list[i];
      const to = isEmail ? r.email : r.phone;
      this.current = to;
      this.index = i + 1;

      const body = renderTemplate(template, r.vars || {});
      const subj = isEmail ? renderTemplate(subject, r.vars || {}) : undefined;
      const log = {
        channel, name: r.name, body, source, lead: r.lead, sentBy,
        ...(isEmail ? { email: to, subject: subj } : { phone: to }),
      };

      // Son 24 saatda eyni alıcıya göndərilibsə ötür (təkrar spam olmasın).
      //
      // ÖTÜRÜLƏN ALICI DA TARİXÇƏYƏ YAZILIR. Əvvəl yalnız sayğac artırdı və
      // sətir heç yerdə qalmırdı — admin sonradan «bu adama niyə getmədi»
      // sualına cavab tapa bilmirdi. Həm də «alınmadı» sayılırdı, halbuki
      // ötürmə QƏSDƏNDİR: hesabat xətalı görünürdü.
      if (skipDuplicates) {
        const recent = await WhatsAppMessage.exists({
          channel,
          ...(isEmail ? { email: to } : { phone: to }),
          // Ötürülən sətirlər özləri sayılmamalıdır — əks halda bir dəfə
          // ötürülən alıcı 24 saat boyu ötürülməkdə qalardı.
          status: { $in: ["sent", "delivered", "read"] },
          createdAt: { $gte: since },
        });
        if (recent) {
          const reason = "Son 24 saatda mesaj göndərilib";
          this.skipped += 1;
          await WhatsAppMessage.create({ ...log, status: "skipped", error: reason }).catch(() => {});
          this.push({ to, name: r.name, status: "skipped", error: reason, i: this.index });
          continue;
        }
      }

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
        this.push({ to, name: r.name, status: "sent", i: this.index });
      } catch (err) {
        this.failed += 1;
        this.errors.push({ to, error: err.message });
        await WhatsAppMessage.create({ ...log, status: "failed", error: err.message }).catch(() => {});
        this.push({ to, name: r.name, status: "failed", error: err.message, i: this.index });
      }

      // Sonuncudan sonra gözləməyə ehtiyac yoxdur.
      if (i < list.length - 1 && !this.cancelled) await sleep(nextDelay(channel, this.delaySec));
    }

    this.running = false;
    this.current = null;
    this.finishedAt = new Date();
    socketService.emitToRole(["admin", "superadmin", "developer"], "bulk:done", this.getState());
    console.log(
      `✅ Toplu göndəriş bitdi (${channel}): ${this.sent} göndərildi, ${this.failed} alınmadı, ${this.skipped} ötürüldü`,
    );
  }
}
