/**
 * Per-route upload size guard.
 *
 * express-fileupload is mounted once with a single global limit (the largest
 * allowed type). This factory lets each media route enforce its own, smaller
 * per-type limit and respond with a clean 413 envelope BEFORE the file reaches
 * FileService.
 *
 * `maxBytes` həm rəqəm, həm də funksiya ola bilər — funksiya verilsə hər
 * sorğuda çağırılır. Bu, limitin admin panelindən (SiteSetting.maxImageSizeKb)
 * idarə olunmasına imkan verir: müştəri texniki tələbi 500 KB idi, amma dəyər
 * yalnız bazada saxlanılırdı və HEÇ VAXT tətbiq olunmurdu.
 *
 * @param {number|Function} maxBytes - Limit (bayt) və ya onu qaytaran funksiya.
 * @returns {Function} Express middleware
 */
const uploadLimit = (maxBytes) => async (req, res, next) => {
  let limit;
  try {
    limit = typeof maxBytes === "function" ? await maxBytes() : maxBytes;
  } catch {
    limit = null; // limit oxunmadısa bloklamırıq — FileService onsuz da yoxlayır
  }

  if (limit && req.files) {
    for (const key of Object.keys(req.files)) {
      const entry = req.files[key];
      // A field may hold a single file or an array of files.
      const files = Array.isArray(entry) ? entry : [entry];
      for (const file of files) {
        if (file && typeof file.size === "number" && file.size > limit) {
          return res.status(413).json({
            success: false,
            message:
              limit < 1024 * 1024
                ? `Fayl çox böyükdür. Maksimum: ${Math.round(limit / 1024)} KB`
                : `Fayl çox böyükdür. Maksimum: ${Math.round(limit / 1024 / 1024)} MB`,
          });
        }
      }
    }
  }
  next();
};

export { uploadLimit };
