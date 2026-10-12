// ── Yükləmə tavanları ──
//
// ⚠️ Sorğu Cloudflare → nginx → Express zəncirindən keçir və YOL BOYU ƏN
// KİÇİK limit qərar verir:
//   • Cloudflare (pulsuz plan) — sorğu gövdəsi üçün 100 MB sərt tavan,
//     plan dəyişmədən artırıla bilmir;
//   • nginx — `client_max_body_size` (serverdəki sayt konfiqi);
//   • Express — `config.upload.*` (apps/api/config/config.js).
//
// Üçü də 100 MB-a uyğunlaşdırılıb. Əvvəl API 250 MB vəd edirdi, nginx isə
// 12 MB-da kəsirdi: 13 MB-lıq video 502, daha böyüyü 413 alırdı və panel
// yalnız donmuş gedişat çubuğu göstərirdi — buradakı ÖN yoxlama həmin
// faydasız gözləməni tamamilə aradan qaldırır.

/** Fayl növü üzrə maksimum ölçü (MB). */
export const UPLOAD_MAX_MB = { image: 30, video: 100, document: 100 };

/**
 * Fayl tavana sığırmı? Sığmırsa anlaşılan mətnlə istisna atır.
 * @param {File} file
 * @param {"image"|"video"|"document"} kind
 */
export function assertUploadSize(file, kind) {
  const maxMb = UPLOAD_MAX_MB[kind];
  if (!maxMb || !file || typeof file.size !== "number") return;
  if (file.size > maxMb * 1024 * 1024) {
    throw new Error(
      `Fayl çox böyükdür: ${(file.size / 1024 / 1024).toFixed(1)} MB. Maksimum ${maxMb} MB.`,
    );
  }
}
