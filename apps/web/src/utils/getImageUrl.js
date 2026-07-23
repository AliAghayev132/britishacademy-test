/**
 * Image URL Utility
 * Backend şəkil URL-lərini düzgün formatda almaq üçün
 */

import { IMAGE_URL as API_URL } from "@/lib/variables";
import { stripLegacyHost } from "@/utils/legacyHosts";

/**
 * Şəkil URL-ini düzgün formatda al
 * Backend-dən gələn path-i tam URL-ə çevirir
 *
 * @param {string|object} imagePath - Şəkil path-i (string və ya Next.js image object)
 * @returns {string|null} - Tam şəkil URL-i
 *
 * @example
 * // Backend path
 * getImageUrl('/public/uploads/news/image.jpg')
 * // Returns: 'http://localhost:3001/public/uploads/news/image.jpg'
 *
 * @example
 * // Full URL (olduğu kimi qaytarır)
 * getImageUrl('https://example.com/image.jpg')
 * // Returns: 'https://example.com/image.jpg'
 *
 * @example
 * // Next.js static import
 * getImageUrl(newsImage) // newsImage = import from '@/assets/images/...'
 * // Returns: newsImage (object)
 */
export function getImageUrl(imagePath) {
  // Null/undefined check
  if (!imagePath) return null;

  // Next.js static import (object with src property)
  if (typeof imagePath === "object" && imagePath.src) {
    return imagePath;
  }

  // String olmayan hallar
  if (typeof imagePath !== "string") return null;

  // Köhnə (legacy) host (məs. server IP-si) ilə başlayırsa, prefiksi sil ki,
  // yenidən cari `IMAGE_URL`-ə bağlana bilsin.
  const stripped = stripLegacyHost(imagePath);

  // Artıq tam URL-dirsə, olduğu kimi qaytar
  if (stripped.startsWith("http://") || stripped.startsWith("https://")) {
    return stripped;
  }

  // Data URL (base64)
  if (stripped.startsWith("data:")) {
    return stripped;
  }

  // Relative path - API URL əlavə et
  // Path "/" ilə başlayırsa, birbaşa əlavə et
  // Əks halda "/" əlavə et
  const cleanPath = stripped.startsWith("/") ? stripped : `/${stripped}`;

  // API_URL sonunda "/" varsa, çıxar
  const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;

  return `${baseUrl}${cleanPath}`;
}

/**
 * Şəkil URL-inin valid olub-olmadığını yoxla
 *
 * @param {string} url - Şəkil URL-i
 * @returns {boolean}
 */
export function isValidImageUrl(url) {
  if (!url) return false;

  // Object (Next.js static import)
  if (typeof url === "object" && url.src) return true;

  if (typeof url !== "string") return false;

  // URL formatını yoxla
  try {
    new URL(url);
    return true;
  } catch {
    // Relative path olduqda da valid sayılır
    return url.startsWith("/") || url.startsWith("public/");
  }
}

/**
 * Placeholder şəkil URL-i
 * Şəkil olmadıqda istifadə üçün
 */
export const PLACEHOLDER_IMAGE = "/placeholder-image.jpg";

/**
 * Default news cover image
 */
export const DEFAULT_NEWS_IMAGE = "/images/default-news.jpg";

/**
 * getImageUrl with fallback
 * Şəkil yoxdursa, fallback göstər
 *
 * @param {string} imagePath
 * @param {string} fallback - Default: PLACEHOLDER_IMAGE
 * @returns {string}
 */
export function getImageUrlWithFallback(
  imagePath,
  fallback = PLACEHOLDER_IMAGE
) {
  const url = getImageUrl(imagePath);
  return url || fallback;
}
