// ============ EXTERNAL PACKAGES ============
import { http, cors, helmet, express, fileUpload, compression } from "#lib";

// ============ INTERNAL IMPORTS ============
import { config, corsConfig, securityConfig } from "#config";

// Services
import {
  MailService,
  socketService,
  mongoDBService,
  bootstrapAdmin,
} from "#services";

// Middlewares
import {
  noCookies,
  apiRateLimiter,
  securityHeaders,
  sanitizeInput,
} from "#middlewares";

// Routes
import {
  AuthRouter,
  PostRouter,
  MediaRouter,
  AIRouter,
  PublicRouter,
  AdminRouter,
} from "#routes";

// ============ APP INSTANCE ============
const app = express();
const httpServer = http.createServer(app);

// Trust reverse proxy (nginx) - required for rate limiting behind a proxy
app.set("trust proxy", 1);

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
  // Gzip compression
  app.use(compression());

  // CORS
  app.use(cors(corsConfig));

  // File upload (must be before body parsers to handle multipart/form-data).
  // The global ceiling is the largest allowed media type (video); each media
  // route then enforces its own smaller limit via the uploadLimit middleware.
  app.use(
    fileUpload({
      limits: { fileSize: config.upload.maxVideoSize },
      abortOnLimit: true,
      responseOnLimit: "File size limit exceeded",
    }),
  );

  // Body parsers
  app.use(express.json({ limit: securityConfig.maxPayloadSize }));
  app.use(
    express.urlencoded({ extended: true, limit: securityConfig.maxPayloadSize }),
  );

  // NoSQL injection sanitization
  app.use(sanitizeInput);

  // Rate limiting for the API
  app.use("/api", apiRateLimiter);

  // Static files (uploads)
  app.use("/uploads", express.static("uploads"));
};

/**
 * Configure API routes
 */
const setupRoutes = (app) => {
  app.use("/api/auth", AuthRouter);
  app.use("/api/posts", PostRouter);
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
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This record already exists",
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

  // Initialize the mail service
  MailService.init();
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
const shutdown = async (signal) => {
  console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
  httpServer.close(async () => {
    await mongoDBService.disconnect();
    console.log("✅ Server closed");
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("❌ Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
