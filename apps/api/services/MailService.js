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
    return { host, port, secure, user, pass, fromName, fromEmail, enabled: Boolean(enabled) };
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
