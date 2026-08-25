// Models
import { Media } from "#models";

/**
 * Qalereya qeydiyyatı.
 *
 * Hər uğurlu yükləmədən sonra çağırılır ki, fayl media kitabxanasında görünsün
 * və növbəti dəfə yenidən yüklənmək əvəzinə seçilə bilsin. Əvvəl yükləmə
 * yalnız URL qaytarırdı — kitabxana həmişə boş qalırdı.
 *
 * Qeydiyyat İKİNCİ DƏRƏCƏLİDİR: burada baş verən xəta yükləməni sındırmamalıdır
 * (fayl artıq diskdədir, istifadəçi URL-i almalıdır). Ona görə çağıran tərəf
 * `.catch()` ilə çağırır, funksiya özü də daxildə tutur.
 */
export async function registerMedia({
  url,
  file,
  folder = "ümumi",
  tags = [],
  type = "image",
  uploadedBy = null,
}) {
  try {
    if (!url) return null;
    const filename = String(url).split("/").pop() || "media";

    // Eyni URL varsa yenidən yaratma — məlumatı yenilə (idempotent).
    return await Media.findOneAndUpdate(
      { url },
      {
        $set: {
          url,
          filename,
          folder: String(folder || "ümumi").trim().toLowerCase(),
          type,
          mimeType: file?.mimetype || "",
          sizeBytes: file?.size || 0,
          uploadedBy: uploadedBy || undefined,
          isDeleted: false,
        },
        // Teqlər əlavə olunur, mövcudlar silinmir.
        ...(tags.length ? { $addToSet: { tags: { $each: tags } } } : {}),
        // İlk yaradılışda alt mətni fayl adından götür.
        $setOnInsert: { alt: { az: "", en: "", ru: "" } },
      },
      { upsert: true, returnDocument: "after" },
    );
  } catch (err) {
    console.warn("⚠️ Qalereya qeydiyyatı alınmadı:", err.message);
    return null;
  }
}

/** Qalereyada mövcud qovluqların siyahısı (UI filtri üçün). */
export async function listFolders() {
  const rows = await Media.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: "$folder", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return rows
    .filter((r) => r._id)
    .map((r) => ({ folder: r._id, count: r.count }));
}
