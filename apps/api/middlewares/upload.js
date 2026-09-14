// Node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Lib
import { fileUpload } from "#lib";

// Config
import { config } from "#config";

// Utils
import { fail } from "#utils";

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
          return fail(res, limit < 1024 * 1024
              ? `Fayl çox böyükdür. Maksimum: ${Math.round(limit / 1024)} KB`
              : `Fayl çox böyükdür. Maksimum: ${Math.round(limit / 1024 / 1024)} MB`, 413);
        }
      }
    }
  }
  next();
};

/**
 * Multipart faylları qəbul et (audit #52).
 *
 * Əvvəl express-fileupload BÜTÜN marşrutlarda, autentifikasiyadan ƏVVƏL və
 * faylı YADDAŞDA saxlayaraq işləyirdi: istənilən ziyarətçi /api/leads-ə
 * 250 MB göndərib prosesin yaddaşını doldura bilərdi. İndi:
 *  - yalnız fayl qəbul edən marşrutlarda, `authenticate`-dən SONRA;
 *  - fayl müvəqqəti diskə yazılır (FileService `mv()` ilə köçürür);
 *  - köçürülməyən müvəqqəti fayl cavabdan sonra silinir.
 */
const receiveFiles = (() => {
  const parse = fileUpload({
    limits: { fileSize: config.upload.maxVideoSize },
    abortOnLimit: true,
    responseOnLimit: "File size limit exceeded",
    useTempFiles: true,
    tempFileDir: path.join(os.tmpdir(), "ba-uploads"),
  });
  const cleanup = (req) => {
    for (const entry of Object.values(req.files || {})) {
      for (const file of Array.isArray(entry) ? entry : [entry]) {
        if (file?.tempFilePath) fs.unlink(file.tempFilePath, () => {});
      }
    }
  };
  return (req, res, next) => {
    res.on("finish", () => cleanup(req));
    res.on("close", () => cleanup(req));
    parse(req, res, next);
  };
})();

export { uploadLimit, receiveFiles };
