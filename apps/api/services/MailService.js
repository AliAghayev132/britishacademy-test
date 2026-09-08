// Utils
import { nodemailer } from "#lib";

// Config
import { config } from "#config";

// Models
import { SiteSetting } from "#models";

// Templates
import { otpTemplate, welcomeTemplate } from "#templates";

/**
 * MailService (static)
 * Thin wrapper over nodemailer. SMTP config admin paneldən (SiteSetting.smtp)
 * gəlir; boş sahələr ENV-dən (config.smtp) doldurulur. Hər göndərişdə cari
 * konfiqurasiya oxunur — admin dəyişəndə yenidən başlatmağa ehtiyac yoxdur.
 */
class MailService {
  /** Startup no-op (geriyə uyğunluq üçün saxlanılır). */
  static init() {}

  /** Cari SMTP konfiqurasiyası: DB (admin) üstünlükdə, ENV fallback. */
  static async resolveConfig() {
    let smtp = {};
    try {
      const s = await SiteSetting.get();
      smtp = s?.smtp || {};
    } catch {
      smtp = {};
    }
    const host = smtp.host || config.smtp.host;
    const port = smtp.port || config.smtp.port;
    const secure = smtp.secure ?? config.smtp.secure;
    const user = smtp.user || config.smtp.user;
    const pass = smtp.pass || config.smtp.pass;
    const fromName = smtp.fromName || config.siteName;
    const fromEmail = smtp.fromEmail || user;
    // DB-də açıqdırsa VƏ ya ENV tam qurulubsa aktiv say.
    const enabled = (smtp.enabled && host && user && pass) || (!!config.smtp.user && !!config.smtp.pass);
    return {
      host, port, secure, user, pass, fromName, fromEmail,
      enabled: Boolean(enabled),
      // Bildirişlər defolt olaraq SMTP hesabının ÖZ ünvanına gedir.
      notifyLeads: smtp.notifyLeads !== false,
      notifyEmail: smtp.notifyEmail || "",
    };
  }

  /**
   * Send an email
   * @param {Object} options - { to, subject, html }
   */
  static async send({ to, subject, html }) {
    const c = await this.resolveConfig();
    if (!c.enabled || !c.host || !c.user || !c.pass) {
      console.warn("Mail service not configured (SMTP host/user/pass missing)");
      return { success: false, error: "Mail service not configured" };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: c.host,
        port: c.port,
        secure: c.secure,
        auth: { user: c.user, pass: c.pass },
      });
      await transporter.sendMail({
        from: `"${c.fromName}" <${c.fromEmail}>`,
        to,
        subject,
        html,
      });
      return { success: true };
    } catch (error) {
      console.error("Mail send error:", error);
      return { success: false, error: error.message };
    }
  }

  /** Admin "Test göndər" — SMTP konfiqurasiyasını yoxlamaq üçün test məktubu. */
  static async sendTest(to) {
    return this.send({
      to,
      subject: `SMTP test — ${config.siteName}`,
      html: `<div style="font-family:sans-serif;padding:24px"><h2>SMTP işləyir ✅</h2><p>Bu, ${config.siteName} admin panelindən göndərilən test məktubudur. SMTP konfiqurasiyanız düzgündür.</p></div>`,
    });
  }

  /**
   * Yeni müraciət bildirişi — SMTP hesabı ÖZÜNƏ məktub atır.
   *
   * NİYƏ: müraciət yalnız bazaya düşürdü, kimsə admin paneli açmayana qədər
   * onun gəldiyi bilinmirdi. İndi forma göndərilən kimi poçt qutusuna düşür.
   *
   * ÜNVAN: `smtp.notifyEmail` doldurulubsa ora (vergüllə bir neçə ünvan olar),
   * boşdursa SMTP-nin öz ünvanına — yəni məktub özünə gedir.
   *
   * Bu funksiya HEÇ VAXT atmır: müraciətin qeydə alınması poçtdan asılı
   * olmamalıdır. Çağıran tərəf cavabı ziyarətçiyə ARTIQ göndərmiş olur.
   *
   * @param {object} lead  populate edilmiş müraciət (course/branch/destinations adları ilə)
   */
  static async sendLeadNotice(lead) {
    try {
      const c = await this.resolveConfig();
      if (!c.enabled || !c.notifyLeads) return { success: false, error: "disabled" };

      const to = c.notifyEmail || c.fromEmail || c.user;
      if (!to) return { success: false, error: "no recipient" };

      const az = (v) => (v && typeof v === "object" ? v.az || v.en || v.ru || "" : v || "");
      const esc = (v) =>
        String(v ?? "")
          .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");

      const rows = [
        ["Ad", lead.name],
        ["Telefon", lead.phone],
        ["E-poçt", lead.email],
        ["Maraq", lead.interest],
        ["Kurs", az(lead.course?.title)],
        ["Filial", az(lead.branch?.name)],
        ["Layihə", az(lead.project?.title)],
        ["Ölkələr", (lead.destinations || []).map((d) => az(d.country)).filter(Boolean).join(", ")],
        ["Mesaj", lead.message],
        ["Haradan", lead.pageUrl],
        ["Mənbə", lead.source],
      ].filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "");

      // Telefon və e-poçt klikləndikdə birbaşa zəng/məktub açılsın — bildiriş
      // çox vaxt telefondan oxunur.
      const cell = (label, value) => {
        const v = esc(value);
        if (label === "Telefon") return `<a href="tel:${v.replace(/[^\d+]/g, "")}" style="color:#00157A">${v}</a>`;
        if (label === "E-poçt") return `<a href="mailto:${v}" style="color:#00157A">${v}</a>`;
        return v;
      };

      // Başlıqda ADMİNİN yazdığı göndərən adı işlədilir. `config.siteName`
      // ENV defoltudur və qurulmamış mühitdə «Starter» kimi çıxırdı.
      const brand = c.fromName || config.siteName;

      // Məktubda NİSBİ ünvan işə yaramır — düymə yalnız tam ünvan varsa çıxır.
      const base = String(config.clientUrl || "").trim().replace(/\/+$/, "");
      const button = /^https?:\/\//i.test(base)
        ? `
    <div style="padding:18px 22px;border-top:1px solid #eef0f5">
      <a href="${esc(base)}/dashboard/muracietler"
         style="display:inline-block;background:#00157A;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 20px;border-radius:99px">
        Admin paneldə aç →
      </a>
    </div>`
        : "";

      const html = `
<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#f5f6fa;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e6e8f0">
    <div style="background:#00157A;color:#fff;padding:18px 22px">
      <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.75">${esc(brand)}</div>
      <div style="font-size:19px;font-weight:700;margin-top:2px">Yeni müraciət</div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${rows.map(([k, v]) => `
      <tr>
        <td style="padding:11px 22px;color:#6b7280;white-space:nowrap;vertical-align:top;border-top:1px solid #eef0f5;width:110px">${esc(k)}</td>
        <td style="padding:11px 22px;color:#111827;border-top:1px solid #eef0f5">${cell(k, v)}</td>
      </tr>`).join("")}
    </table>${button}
  </div>
</div>`;

      return await this.send({
        to,
        // Mövzuda ad və telefon var — poçt qutusunda açmadan görünür.
        subject: `Yeni müraciət — ${lead.name} (${lead.phone})`,
        html,
      });
    } catch (error) {
      console.error("Lead notice error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send an OTP verification code
   */
  static async sendOTP(email, code, type = "register") {
    const titles = {
      register: "Registration Verification",
      "reset-password": "Password Reset",
      "verify-email": "Email Verification",
    };

    const messages = {
      register: "Enter the code below to complete your registration:",
      "reset-password": "Enter the code below to reset your password:",
      "verify-email": "Enter the code below to verify your email address:",
    };

    return this.send({
      to: email,
      subject: `${titles[type]} - ${config.siteName}`,
      html: otpTemplate(titles[type], messages[type], code),
    });
  }

  /**
   * Send a welcome email (example of a domain-specific mail)
   */
  static async sendWelcome(email, firstName) {
    return this.send({
      to: email,
      subject: `Welcome to ${config.siteName}!`,
      html: welcomeTemplate(firstName, config.clientUrl),
    });
  }
}

export { MailService };
