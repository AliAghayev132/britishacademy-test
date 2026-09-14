// Services
import {
  MailService,
  WhatsAppService,
  LibVersion,
  BulkQueue,
  socketService,
  mongoDBService,
} from "#services";

// ============ GRACEFUL SHUTDOWN ============
//
// Əvvəl yalnız HTTP server və Mongo bağlanırdı; Socket.IO, keep-alive
// bağlantılar, WhatsApp/Chromium və taymerlər açıq qalırdı. httpServer.close
// onları gözləyirdi, 10 saniyədən sonra məcburi exit(1) işə düşürdü —
// hər deploy «çökmə» kimi görünürdü, Chromium isə yetim qalırdı (audit #48).
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** httpServer üçün təkrar çağırışa davamlı `shutdown(signal)` qaytarır. */
export const createShutdown = (httpServer) => {
  let shuttingDown = false;

  return async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);

    const force = setTimeout(() => {
      console.error("❌ Forced shutdown after timeout");
      process.exit(1);
    }, 15000);
    force.unref();

    try {
      // 1) Toplu göndəriş: növbəti mesaj göndərilmir, cari mesaj bitsin.
      if (BulkQueue.cancel()) {
        console.log(`⏸  Toplu göndəriş dayandırıldı (${BulkQueue.getState().done ?? "?"} / ${BulkQueue.total} göndərilmişdi)`);
        for (let i = 0; i < 50 && BulkQueue.running; i += 1) await sleep(100);
      }

      // 2) Yeni sorğu qəbul olunmur; socket-lər bağlanır (io.close HTTP serveri də bağlayır).
      const serverClosed = socketService.getIO()
        ? socketService.close()
        : new Promise((r) => httpServer.close(() => r()));
      httpServer.closeIdleConnections?.();
      await Promise.race([serverClosed, sleep(3000)]);
      httpServer.closeAllConnections?.();

      // 3) Arxa fon işləri.
      LibVersion.stop();
      await WhatsAppService.shutdown();
      MailService.shutdown();

      await mongoDBService.disconnect();
      console.log("✅ Server closed");
      process.exit(0);
    } catch (err) {
      console.error("❌ Shutdown error:", err);
      process.exit(1);
    }
  };
};
