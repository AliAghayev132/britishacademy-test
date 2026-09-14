// Node
import fs from "node:fs";
import path from "node:path";

// Local
import { CLIENT_ID, MSG_TIMEOUT, SESSION_DIR } from "./constants.js";

/** "0501234567" / "+994 50 123 45 67" → "994501234567" */
export function normalizePhone(phone) {
  const cleaned = String(phone || "").replace(/[^0-9]/g, "");
  if (cleaned.startsWith("994")) return cleaned;
  if (cleaned.startsWith("0") && cleaned.length === 10) return `994${cleaned.slice(1)}`;
  if (cleaned.length === 9) return `994${cleaned}`;
  return cleaned;
}

/** Göndərmə MSG_TIMEOUT-dan uzun çəkərsə xəta ilə bitir. */
export const withSendTimeout = (promise) =>
  Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error("Göndərmə vaxtı bitdi")), MSG_TIMEOUT)),
  ]);

/** Kitabxananı yüklə; quraşdırılmayıbsa `false` (opsional asılılıq). */
export async function loadLib() {
  try {
    const pkg = await import("whatsapp-web.js");
    const mod = pkg.default || pkg;
    return {
      Client: mod.Client,
      LocalAuth: mod.LocalAuth,
      MessageMedia: mod.MessageMedia,
      Events: mod.Events,
      WAState: mod.WAState,
      MessageAck: mod.MessageAck,
      version: mod.version,
    };
  } catch {
    return false;
  }
}

/** Diskdə saxlanmış sessiya varmı? (varsa QR-siz bərpa mümkündür) */
export function sessionExists() {
  try {
    return fs.existsSync(path.join(SESSION_DIR, `session-${CLIENT_ID}`));
  } catch {
    return false;
  }
}

/** Sessiya qovluğunu sil. LocalAuth faylları bəzən dərhal buraxılmır — bir neçə cəhd et. */
export async function removeSessionDir() {
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

/** QR mətnini lokal PNG data URL-ə çevir (`qrcode` yoxdursa null). */
export async function makeQrDataUrl(text) {
  try {
    const { default: QRCode } = await import("qrcode");
    return await QRCode.toDataURL(text, { width: 320, margin: 1 });
  } catch {
    return null;
  }
}
