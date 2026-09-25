// Node
import path from "node:path";

// ── Vaxt limitləri ──
export const MSG_TIMEOUT = 30_000;
export const INIT_TIMEOUT = 120_000;
export const READY_TIMEOUT = 180_000;   // authenticated → ready watchdog
export const HEALTH_INTERVAL = 60_000;  // dövri vəziyyət yoxlaması
// Avtomatik bərpa uğursuz olanda növbəti cəhdə qədər gözləmə: 1, 2, 4 … 30 dəq.
export const AUTO_RETRY_BASE = 60_000;
export const AUTO_RETRY_MAX = 30 * 60_000;
// Skan gözlənilərkən whatsapp-web.js təxminən hər 20 saniyədə YENİ QR yayır.
// Həddi yox idi: heç kim skan etməsə Chromium saatlarla açıq qalır, jurnal
// «QR kodu yaradıldı (#N)» sətirləri ilə dolur və paneldəki şəkil dayanmadan
// dəyişir. Bu qədər cəhddən (~3–4 dəqiqə) sonra gözləmə dayandırılır.
export const QR_MAX_ATTEMPTS = 10;

// İstehsalatda WhatsApp Web versiyasını pin etmək üçün (opsional).
export const WA_WEB_VERSION_URL = process.env.WA_WEB_VERSION_URL || null;
// Sessiya qovluğu — deploy-da persistent volume-a yönəldilə bilər.
export const SESSION_DIR = process.env.WA_SESSION_DIR || path.resolve(".wwebjs_auth");
export const CLIENT_ID = "british-academy";
