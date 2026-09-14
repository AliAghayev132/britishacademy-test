// Config
import { config } from "#config";

/**
 * Validate required environment variables in production
 */
export const validateEnv = () => {
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
