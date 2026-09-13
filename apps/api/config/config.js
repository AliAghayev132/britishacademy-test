import { dotenv } from "#lib";

const NODE_ENV = process.env.NODE_ENV || "development";

// Load environment-specific file first (e.g. .env.development), then fall back to .env.
// dotenv does not override already-defined variables, so the first match wins.
dotenv.config({ path: `.env.${NODE_ENV}` });
dotenv.config();

const isProduction = NODE_ENV === "production";
const domain = process.env.DOMAIN || "localhost";

const config = {
  development: {
    port: process.env.PORT || 5000,
    db: {
      host: process.env.DB_HOST || "localhost",
      name: process.env.DB_NAME || "starter",
      username: process.env.DB_USERNAME || "",
      password: process.env.DB_PASSWORD || "",
      clusterName: process.env.DB_CLUSTER_NAME || "",
    },
  },

  // Site
  // Məktubların göndərən adı (SMTP-də ad yazılmayıbsa), AI başlığı, başlanğıc logu.
  siteName: "British Academy",
  domain,
  appUrl: process.env.APP_URL || "http://localhost:5000",
  clientUrl:
    process.env.CLIENT_URL ||
    (isProduction ? `https://${domain}` : "http://localhost:3000"),

  // Auth secrets (override in production via env)
  accessSecretKey: process.env.ACCESS_SECRET_KEY || "starter_access_secret_key",
  refreshSecretKey: process.env.REFRESH_SECRET_KEY || "starter_refresh_secret_key",
  encryptionKey: process.env.ENCRYPTION_KEY || "starter_32_char_encryption_key!!",

  /**
   * Shared secret for trusted server-to-server calls (the Next.js SSR layer).
   * All SSR traffic arrives from a single IP, so without this the per-IP API
   * rate limiter would throttle the whole public site. Requests carrying this
   * key in `x-internal-key` skip the general rate limiter (they never skip
   * authentication — admin routes still require a JWT).
   */
  internalApiKey: process.env.INTERNAL_API_KEY || "",

  // Next serverinin DAXİLİ ünvanı — admin dəyişikliyindən sonra sayt keşini
  // təmizləmək üçün (services/SiteCacheService.js). nginx-dən keçmir.
  webInternalUrl: (
    process.env.WEB_INTERNAL_URL ||
    (isProduction ? "http://127.0.0.1:30001" : "http://localhost:3000")
  ).replace(/\/$/, ""),

  // Default admin (created on first boot by BootstrapService)
  defaultAdmin: {
    email: process.env.DEFAULT_ADMIN_EMAIL || "admin@example.com",
    password: process.env.DEFAULT_ADMIN_PASSWORD || "Admin123!",
  },

  // Developer hesabı — texniki alətlər (import, miqrasiya, seed) üçün.
  // İlk açılışda yaradılır; sahibi öz adını, e-poçtunu və parolunu profil
  // səhifəsindən dəyişə bilər. ENV-dəki dəyərlər yalnız İLK yaradılışda
  // işlədilir, sonrakı açılışlarda mövcud hesaba toxunulmur.
  defaultDeveloper: {
    email: process.env.DEFAULT_DEVELOPER_EMAIL || "developer@britishacademy.az",
    password: process.env.DEFAULT_DEVELOPER_PASSWORD || "Developer123!",
  },

  // Cookie names (prefixed to avoid collisions)
  accessCookieName: "__starter_at",
  refreshCookieName: "__starter_rt",
  // Tokensiz göstərici — Next proxy-si /dashboard qapısı üçün oxuyur
  // (apps/web/src/proxy.js). Ad dəyişsə orada da dəyişilməlidir.
  sessionCookieName: "__starter_s",

  // Cookie options (bax utils/authCookies.js)
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    // Defolt host-only: sayt və API nginx arxasında eyni origin-dədir.
    // Əvvəl `.${DOMAIN}` idi — DOMAIN serverdə unudulanda `.localhost`
    // olurdu və brauzer cookie-ni səssizcə rədd edirdi. Subdomenlər arası
    // paylaşım lazımdırsa COOKIE_DOMAIN təyin et.
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: "/",
  },

  // Token durations (ms)
  accessTokenMaxAge: 15 * 60 * 1000, // 15 minutes
  refreshTokenMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  rememberMeMaxAge: 30 * 24 * 60 * 60 * 1000, // 30 days

  // OTP
  otpExpiresIn: 600, // 10 minutes (seconds)

  // SMTP
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    secure: process.env.SMTP_SECURE === "true",
  },

  // File upload limits/types (used by FileService media helpers + uploadLimit)
  upload: {
    maxImageSize: 30 * 1024 * 1024, // images — 30MB
    // Tələbə video rəyləri 200 MB-a qədər ola bilər — 250 MB ehtiyatla.
    // Bu dəyər HƏM qlobal express-fileupload limitini, HƏM marşrut
    // limitini, HƏM də FileService yoxlamasını idarə edir (app.js:95).
    // ⚠️ Reverse proxy (nginx: client_max_body_size) də uyğun olmalıdır.
    maxVideoSize: Number(process.env.MAX_VIDEO_SIZE_MB || 250) * 1024 * 1024,
    maxDocSize: 100 * 1024 * 1024, // documents — 100MB
    allowedImageTypes: ["image/jpeg", "image/png", "image/webp", "image/jpg"],
    allowedVideoTypes: ["video/mp4", "video/webm", "video/ogg"],
    allowedDocTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/csv",
    ],
  },

  // AI (OpenRouter) — optional; endpoints return 503 when apiKey is empty
  ai: {
    apiKey: process.env.OPENROUTER_API_KEY || "",
    model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
  },
};

// CORS
// Ağ siyahı. Əvvəl `origin: true` idi (hər origin əks olunurdu) — sessiya
// cookie-yə keçəndən sonra bu, başqa saytın admin adından sorğu göndərib
// cavabı oxumasına yol açardı (SameSite yeganə sədd qalardı).
//
// Sayt API-ni nginx arxasında EYNİ origin-dən çağırır; eyni origin sorğusu
// CORS-dan asılı deyil, ona görə bu siyahı adi işə təsir etmir. Başqa
// origin lazımdırsa: CORS_ORIGINS=https://a.az,https://b.az
const corsOrigins = [
  ...new Set(
    [
      process.env.CLIENT_URL,
      ...(isProduction ? [`https://${domain}`, `https://www.${domain}`] : []),
      ...(process.env.CORS_ORIGINS || "").split(","),
    ]
      .map((o) => (o || "").trim().replace(/\/$/, ""))
      .filter(Boolean),
  ),
  // Dev: istənilən lokal port (next dev 3000, e2e build 3599, vite 5173).
  ...(isProduction ? [] : [/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/]),
];

const corsConfig = {
  origin: corsOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type", "x-internal-key"],
  credentials: true,
};

// Extra security-related knobs
const securityConfig = {
  // Session timeout hint (15 minutes)
  sessionTimeout: 15 * 60 * 1000,
  // Max request/upload payload size
  maxPayloadSize: "10mb",
  maxFileSize: 10 * 1024 * 1024, // 10MB
};

export { config, corsConfig, securityConfig };
