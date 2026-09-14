// Models
import { WhatsAppMessage } from "#models";

// Local
import { waLog } from "../WhatsAppLogService.js";
import { READY_TIMEOUT } from "./constants.js";
import { resetAutoRetry } from "./autoRetry.js";
import { makeQrDataUrl } from "./helpers.js";

/** `message_ack` → bazadakı mesajın çatdırılma statusunu yenilə. */
export async function onAck(msg, ack) {
  try {
    if (!msg?.fromMe || !msg?.to) return;
    const phone = String(msg.to).split("@")[0];
    // 1 = serverə çatdı, 2 = cihaza çatdı, 3 = oxundu, 4 = səsli mesaj dinlənildi
    const status = ack >= 3 ? "read" : ack === 2 ? "delivered" : ack === 1 ? "sent" : null;
    if (!status) return;
    await WhatsAppMessage.findOneAndUpdate(
      { phone, status: { $in: ["sent", "delivered"] } },
      { $set: { status } },
      { sort: { createdAt: -1 } },
    );
  } catch { /* ack izləmə kritik deyil */ }
}

/**
 * Klient hadisələrini servis vəziyyətinə bağla. `svc` — WhatsAppService sinfi
 * (vəziyyət onun statik sahələrindədir).
 */
export function attachClientEvents(svc, lib) {
  const client = svc.client;
  const E = lib.Events;

  client.on(E.QR_RECEIVED, async (qr) => {
    svc.qrCode = qr;
    svc.qrDataUrl = await makeQrDataUrl(qr);
    svc._qrCount = (svc._qrCount || 0) + 1;
    waLog("qr", `QR kodu yaradıldı (#${svc._qrCount})`, { meta: { attempt: svc._qrCount } });
  });

  // pairWithPhoneNumber rejimində QR yerinə 8 rəqəmli kod gəlir.
  client.on(E.CODE_RECEIVED, (code) => {
    svc.pairingCode = code;
    waLog("qr", `Telefon qoşulma kodu hazırdır: ${code}`, { meta: { code } });
  });

  client.on(E.LOADING_SCREEN, (pct, msg) => {
    console.log(`⏳ WhatsApp yüklənir: ${pct}% — ${msg}`);
    // Yalnız mərhələlər jurnala düşür — hər faiz sətir yaratmasın.
    if (pct === 0 || pct === 100) waLog("init", `Yüklənir: ${pct}% — ${msg}`, { meta: { pct } });
  });

  // authenticated gəldi, amma ready gəlmirsə: brauzeri bağla, SESSİYANI SAXLA.
  client.on(E.AUTHENTICATED, () => {
    if (svc._authOk) return;
    svc._authOk = true;
    svc.qrCode = null;
    svc.qrDataUrl = null;
    svc.pairingCode = null;
    waLog("auth", "Autentifikasiya uğurlu — hazır siqnalı gözlənilir");
    svc._readyTimer = setTimeout(async () => {
      if (!svc.isReady) {
        waLog("error", "Hazır siqnalı gəlmədi — klient bağlanır, sessiya saxlanılır", {
          level: "error",
          meta: { timeoutMs: READY_TIMEOUT, hint: "Adətən kitabxana köhnə qalanda olur — versiya bildirişinə bax" },
        });
        svc.lastError = "Qoşulma gecikdi — avtomatik yenidən cəhd ediləcək.";
        svc.isInitializing = false;
        svc._authOk = false;
        await svc._destroyClient(); // sessiya silinmir
      }
    }, READY_TIMEOUT);
  });

  client.on(E.READY, async () => {
    svc._clearTimers();
    svc.isReady = true;
    svc.isInitializing = false;
    svc.qrCode = null;
    svc.qrDataUrl = null;
    svc.pairingCode = null;
    svc.lastError = null;
    svc.readyAt = new Date();
    resetAutoRetry(svc);
    svc.info = svc.client?.info || null;
    svc.state = lib.WAState.CONNECTED;
    waLog("ready", `Hazırdır: ${svc.info?.pushname || "?"} (+${svc.info?.wid?.user || "?"})`, {
      meta: { pushname: svc.info?.pushname, phone: svc.info?.wid?.user, platform: svc.info?.platform },
    });
    svc.startHealthWatch();
  });

  client.on(E.AUTHENTICATION_FAILURE, async (msg) => {
    waLog("auth", `Autentifikasiya alınmadı: ${msg}`, { level: "error", meta: { reason: String(msg) } });
    svc.isReady = false;
    svc.isInitializing = false;
    svc._authOk = false;
    svc.lastError = "Auth failure: " + msg;
    // Saxlanmış kimlik həqiqətən etibarsızdır — YALNIZ burada avtomatik sil.
    await svc.clearSession();
    waLog("session", "Etibarsız sessiya avtomatik silindi — yenidən QR lazımdır", { level: "warn" });
  });

  client.on(E.DISCONNECTED, (reason) => {
    waLog("disconnect", `Bağlantı kəsildi: ${reason}`, {
      level: "warn",
      meta: { reason: String(reason), uptimeMin: svc.readyAt ? Math.round((Date.now() - svc.readyAt) / 60000) : null },
    });
    svc.isReady = false;
    svc.isInitializing = false;
    svc._authOk = false;
    svc.info = null;
    svc.state = null;
    svc.readyAt = null;
    svc.lastError = "Bağlantı kəsildi: " + reason;
    svc._clearTimers();
    svc._destroyClient().catch(() => {});
  });

  client.on(E.STATE_CHANGED, (s) => {
    const prev = svc.state;
    svc.state = s;
    // Eyni vəziyyət təkrarlanırsa jurnal doldurulmur.
    if (prev !== s) {
      waLog("state", `Vəziyyət: ${prev || "—"} → ${s}`, {
        level: s === "CONNECTED" ? "info" : "warn",
        meta: { from: prev, to: s },
      });
    }
  });

  // Göndərilən mesajların çatdırılma/oxunma statusu.
  client.on(E.MESSAGE_ACK, (msg, ack) => svc._onAck(msg, ack));
}
