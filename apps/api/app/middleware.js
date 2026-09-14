// Lib
import { cors, helmet, express, compression } from "#lib";

// Config
import { corsConfig, securityConfig } from "#config";

// Middlewares
import {
  setUploadHeaders,
  noCookies,
  apiRateLimiter,
  securityHeaders,
  sanitizeInput,
  cacheHeaders,
} from "#middlewares";

/**
 * Configure security middlewares
 */
export const setupSecurity = (app) => {
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
export const setupMiddlewares = (app) => {
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
