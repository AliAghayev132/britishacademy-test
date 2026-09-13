// ============ EXTERNAL PACKAGES ============
import { http, cors, helmet, express, compression } from "#lib";
import { setUploadHeaders } from "#middlewares";

// ============ INTERNAL IMPORTS ============
import { config, corsConfig, securityConfig } from "#config";

// Services
import {
  MailService, WhatsAppService, LibVersion, BulkQueue,
  socketService,
  mongoDBService,
  bootstrapAdmin,
  bootstrapDeveloper,
} from "#services";

// Middlewares
import {
  noCookies,
  apiRateLimiter,
  securityHeaders,
  sanitizeInput,
  cacheHeaders,
} from "#middlewares";

// Routes
import {
  AuthRouter,
  MediaRouter,
  AIRouter,
  PublicRouter,
  AdminRouter,
} from "#routes";

// ============ APP INSTANCE ============
const app = express();
const httpServer = http.createServer(app);

// Trust reverse proxy (nginx) - required for rate limiting behind a proxy.
// "loopback": X-Forwarded-For-a YALNIZ sorğu serverin öz nginx-indən
// (127.0.0.1/::1) gələndə inanılır. `1` olsaydı, 30002 portuna birbaşa gələn
// sorğu da başlığı yazıb audit logdakı IP-ni və sürət limitini aldada bilərdi
// (audit #22).
app.set("trust proxy", "loopback");

// ============ SETUP FUNCTIONS ============

/**
 * Configure security middlewares
 */
const setupSecurity = (app) => {
  // Helmet for security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:", "http://localhost:*"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  // Custom security headers
  app.use(securityHeaders);

  // Only allow essential/httpOnly cookies
  app.use(noCookies);
};

/**
 * Configure general middlewares
 */
const setupMiddlewares = (app) => {
  // Gzip compression — sıxılmış cavablar daha sürətli gedir.
  // level 6 = yaxşı ölçü/CPU balansı; 512 baytdan böyük cavablar sıxılır;
  // klient `x-no-compression` göndərsə sıxılma keçilir.
  app.use(
    compression({
      level: 6,
      threshold: 512,
      filter: (req, res) => {
        if (req.headers["x-no-compression"]) return false;
        return compression.filter(req, res);
      },
    }),
  );

  // CORS
  app.use(cors(corsConfig));

  // Multipart fayllar QLOBAL qəbul olunmur — yalnız fayl marşrutlarında,
  // autentifikasiyadan sonra (bax middlewares/upload.js → receiveFiles).

  // Body parsers
  // İctimai yazma marşrutları üçün KİÇİK limit. Əvvəl hər yerdə 10 MB idi —
  // müraciət formundan meqabaytlarla mətn göndərmək olurdu. Burada parse
  // olunan body-ni aşağıdakı ümumi parser yenidən oxumur.
  app.use(["/api/leads", "/api/events", "/api/views", "/api/auth"], express.json({ limit: "32kb" }));
  app.use(express.json({ limit: securityConfig.maxPayloadSize }));
  app.use(
    express.urlencoded({ extended: true, limit: securityConfig.maxPayloadSize }),
  );
  // Parser tanımadığı tipdə (məs. fayl marşrutu olmayan yerə multipart)
  // Express 5 req.body-ni undefined saxlayır — controller-lər onu açanda 500
  // verirdi. Boş obyekt adi validasiya xətasına (400) aparır.
  app.use((req, _res, next) => {
    if (req.body === undefined) req.body = {};
    next();
  });

  // NoSQL injection sanitization
  app.use(sanitizeInput);

  // Rate limiting for the API
  app.use("/api", apiRateLimiter);

  // Keşləmə başlıqları — public GET-lər üçün qısa keş, qalanı üçün no-store.
  // Router-lərdən ƏVVƏL qoşulur ki, bütün /api cavablarını əhatə etsin.
  app.use("/api", cacheHeaders);

  // Static files (uploads) — təhlükəsizlik başlıqları ilə (bax setUploadHeaders).
  app.use("/uploads", express.static("uploads", { setHeaders: setUploadHeaders }));
};

/**
 * Configure API routes
 */
const setupRoutes = (app) => {
  app.use("/api/auth", AuthRouter);
  app.use("/api/media", MediaRouter);
  app.use("/api/ai", AIRouter);

  // ---- British Academy ----
  // ADMIN FIRST: every /api/admin/* route is authenticated + role-gated.
  // Mounting it before the public router guarantees no future public path can
  // ever shadow an admin one (PublicRouter is mounted on the bare /api prefix).
  app.use("/api/admin", AdminRouter);

  // PUBLIC: read-only, no auth. The single write endpoint is POST /api/leads
  // (rate-limited) — see routes/publicRoutes.js.
  app.use("/api", PublicRouter);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      message: "Server is running",
      timestamp: new Date().toISOString(),
    });
  });
};

/**
 * Configure error handlers
 */
const setupErrorHandlers = (app) => {
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: "Endpoint not found",
    });
  });

  // Central error handler
  app.use((err, req, res, _next) => {
    console.error("Server error:", err.message || err);

    // Mongoose validation error
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(err.errors).map((e) => e.message),
      });
    }

    // Mongoose duplicate key
    // Hansı sahə və hansı dəyər — mesaja YAZILIR. Əvvəl yalnız «This record
    // already exists» qaytarılırdı: seed 409 verəndə nə modelin, nə sahənin,
    // nə də dəyərin nə olduğu bilinmirdi və səbəbi tapmaq üçün kodu əl ilə
    // gəzmək lazım gəlirdi.
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
      const value = field ? err.keyValue?.[field] : undefined;
      return res.status(409).json({
        success: false,
        message: field
          ? `Təkrarlanan dəyər: «${field}» = ${JSON.stringify(value)} artıq mövcuddur`
          : "This record already exists",
        field,
      });
    }

    // JWT errors
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired",
      });
    }

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: statusCode === 500 ? "Server error" : err.message,
    });
  });
};

/**
 * Validate required environment variables in production
 */
const validateEnv = () => {
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) return;

  const defaults = {
    ACCESS_SECRET_KEY: "starter_access_secret_key",
    REFRESH_SECRET_KEY: "starter_refresh_secret_key",
    ENCRYPTION_KEY: "starter_32_char_encryption_key!!",
  };

  for (const [key, defaultVal] of Object.entries(defaults)) {
    if (!process.env[key] || process.env[key] === defaultVal) {
      console.error(
        `❌ CRITICAL: ${key} is using a default value in production! Set a strong random key.`,
      );
      process.exit(1);
    }
  }

  if (!process.env.MONGODB_URI) {
    console.error(
      "❌ CRITICAL: MONGODB_URI is not configured for production!",
    );
    process.exit(1);
  }

  // Dayandırmır, amma açıq xəbərdarlıq: onsuz Next-in bütün server sorğuları
  // bir IP-dən gəlib dəqiqədə 100 limitinə düşür (bot axınında menyular boş
  // qalır, 429/5xx), qısa linklərdə isə ziyarətçinin IP-si itir (audit #36).
  if (!config.internalApiKey) {
    console.warn(
      "⚠️  INTERNAL_API_KEY təyin olunmayıb — client və server .env-lərində EYNİ dəyəri yazın (bax deploy/README.md).",
    );
  }

  console.log("✅ Environment variables validated");
};

/**
 * Initialize all services
 */
const initializeServices = async () => {
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
const printBanner = (port) => {
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

// ============ BOOTSTRAP APPLICATION ============

/**
 * Start the application
 */
const startApp = async () => {
  try {
    setupSecurity(app);
    setupMiddlewares(app);
    setupRoutes(app);
    setupErrorHandlers(app);

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

startApp();

// ============ GRACEFUL SHUTDOWN ============
//
// Əvvəl yalnız HTTP server və Mongo bağlanırdı; Socket.IO, keep-alive
// bağlantılar, WhatsApp/Chromium və taymerlər açıq qalırdı. httpServer.close
// onları gözləyirdi, 10 saniyədən sonra məcburi exit(1) işə düşürdü —
// hər deploy «çökmə» kimi görünürdü, Chromium isə yetim qalırdı (audit #48).
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let shuttingDown = false;

const shutdown = async (signal) => {
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

    await mongoDBService.disconnect();
    console.log("✅ Server closed");
    process.exit(0);
  } catch (err) {
    console.error("❌ Shutdown error:", err);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
