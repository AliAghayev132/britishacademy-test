// Config
import { config } from "#config";

// Services
import {
  MailService,
  WhatsAppService,
  LibVersion,
  mongoDBService,
  bootstrapAdmin,
  bootstrapDeveloper,
} from "#services";

// Local
import { validateEnv } from "./env.js";

/**
 * Initialize all services
 */
export const initializeServices = async () => {
  validateEnv();

  // Connect to the database
  await mongoDBService.connect();

  // Create the default admin if none exists
  await bootstrapAdmin();
  await bootstrapDeveloper();

  // Initialize the mail service
  MailService.init();

  // WhatsApp: saxlanmış sessiya varsa QR-siz avtomatik bərpa et.
  // (Sessiya yoxdursa heç nə etmir — Chromium boş yerə açılmır.)
  WhatsAppService.resumeIfSession().catch(() => {});
  // Kitabxananın yeni versiyasını yoxla (arxa fonda, gündə bir dəfə).
  // WhatsApp Web protokolu tez-tez dəyişir; kitabxana geri qalanda bağlantı
  // səbəbsiz görünən şəkildə sınır və panel bunu izah edə bilmirdi.
  LibVersion.start();
};

/**
 * Print startup banner
 */
export const printBanner = (port) => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                              ║
║   🚀 ${config.siteName} Server                               ║
║                                                              ║
║   Running on port ${port}                                      ║
║   Environment: ${process.env.NODE_ENV || "development"}                             ║
║                                                              ║
║   ✅ Security headers active                                 ║
║   ✅ Rate limiting enabled                                   ║
║   ✅ NoSQL sanitization enabled                              ║
║   ✅ Socket.IO ready                                         ║
║                                                              ║
╚════════════════════════════════════════════════════════════╝
  `);
};
