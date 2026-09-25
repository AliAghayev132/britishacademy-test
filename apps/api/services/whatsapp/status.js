// Local
import { installedVersion } from "../LibVersionService.js";
import { SESSION_DIR } from "./constants.js";
import { findSystemChrome } from "./chrome.js";

/** Admin paneli üçün vəziyyət şəkli (`svc` — WhatsAppService sinfi). */
export function buildStatus(svc) {
  return {
    installed: svc.isInstalled,
    // Admin açarı: söndürülübsə panel QR əvəzinə «söndürülüb» vəziyyətini
    // göstərir. `qrStopped` — skan gözləməsi həddə çatıb dayandırılıb.
    autoConnect: svc.autoConnect !== false,
    qrStopped: Boolean(svc.qrStopped),
    libVersion: installedVersion() || svc._lib?.version || null,
    isReady: svc.isReady,
    isInitializing: svc.isInitializing,
    initialized: Boolean(svc.client),
    hasSession: svc.hasSession,
    needsQR: Boolean(svc.qrCode) && !svc.isReady,
    qrDataUrl: svc.qrDataUrl,
    pairingCode: svc.pairingCode,
    state: svc.state,
    connectedAs: svc.info?.pushname || null,
    phoneNumber: svc.info?.wid?.user || null,
    readyAt: svc.readyAt,
    lastError: svc.lastError,

    // ── Diaqnostika ──
    // Bağlantı kəsiləndə ilk verilən suallar: nə qədərdir açıqdır, hansı
    // cihazdır, Chrome haradadır, sessiya faylı yerindədirmi.
    uptimeSec: svc.readyAt ? Math.round((Date.now() - svc.readyAt.getTime()) / 1000) : 0,
    platform: svc.info?.platform || null,
    deviceManufacturer: svc.info?.phone?.device_manufacturer || null,
    waVersion: svc.info?.phone?.wa_version || null,
    chromePath: findSystemChrome() || null,
    sessionDir: SESSION_DIR,
    qrCount: svc._qrCount || 0,
    healthWatch: Boolean(svc._healthTimer),
    serverUptimeSec: Math.round(process.uptime()),
  };
}
