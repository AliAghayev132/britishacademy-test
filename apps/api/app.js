// Lib
import { http, express } from "#lib";

// Config
import { config } from "#config";

// Services
import { socketService } from "#services";

// Local
import { setupSecurity, setupMiddlewares } from "./app/middleware.js";
import { setupRoutes } from "./app/routes.js";
import { setupErrorHandlers } from "./app/errors.js";
import { initializeServices, printBanner } from "./app/startup.js";
import { createShutdown } from "./app/shutdown.js";

// ============ APP INSTANCE ============
const app = express();
const httpServer = http.createServer(app);

// Trust reverse proxy (nginx) - required for rate limiting behind a proxy.
// "loopback": X-Forwarded-For-a YALNIZ sorğu serverin öz nginx-indən
// (127.0.0.1/::1) gələndə inanılır. `1` olsaydı, 30002 portuna birbaşa gələn
// sorğu da başlığı yazıb audit logdakı IP-ni və sürət limitini aldada bilərdi
// (audit #22).
app.set("trust proxy", "loopback");

// ============ BOOTSTRAP APPLICATION ============
// Qurulma hissələri app/ altındadır: middleware, routes, errors, env,
// startup, shutdown.

let configured = false;

/**
 * Middleware və marşrutları qoş (bir dəfə). İnteqrasiya testləri serveri
 * başlatmadan app-i buradan alır və öz portunda qaldırır (bax integration/).
 */
export const configureApp = () => {
  if (!configured) {
    setupSecurity(app);
    setupMiddlewares(app);
    setupRoutes(app);
    setupErrorHandlers(app);
    configured = true;
  }
  return app;
};

/**
 * Start the application
 */
const startApp = async () => {
  try {
    configureApp();

    await initializeServices();

    // Initialize Socket.IO
    socketService.init(httpServer);

    const port = config.development.port;
    httpServer.listen(port, () => printBanner(port));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// BA_NO_AUTOSTART=1 — yalnız inteqrasiya testləri qoyur: modul import olunur,
// amma port, bootstrap, WhatsApp və socket işə düşmür. «Birbaşa işə salınıb?»
// yoxlaması (argv) istifadə olunmur — PM2 cluster rejimində argv fərqlidir və
// server production-da başlamazdı.
const autostart = process.env.BA_NO_AUTOSTART !== "1";
if (autostart) startApp();

// ============ GRACEFUL SHUTDOWN ============ (bax app/shutdown.js)
const shutdown = createShutdown(httpServer);

if (autostart) {
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
