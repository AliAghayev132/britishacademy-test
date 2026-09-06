// Config / constants
import { Router, adminRoles } from "#constants";
import { config } from "#config";

// Controllers
import { mediaController } from "#controllers";

// Models
import { SiteSetting } from "#models";

// Middlewares
import { authenticate, requireRole, uploadLimit } from "#middlewares";

/**
 * Şəkil limiti admin panelindən idarə olunur (Tənzimləmələr → SEO/Texniki →
 * "Maks. şəkil ölçüsü"). Dəyər yoxdursa və ya oxunmasa config-dəki limitə
 * düşürük. `config.upload.maxImageSize` sərt tavandır — FileService onu
 * ayrıca yoxlayır, ona görə admin ondan böyük dəyər versə də keçməyəcək.
 */
const resolveImageLimit = async () => {
  try {
    const s = await SiteSetting.get();
    const kb = Number(s?.maxImageSizeKb);
    if (kb > 0) return Math.min(kb * 1024, config.upload.maxImageSize);
  } catch { /* DB əlçatmazdırsa config-ə düş */ }
  return config.upload.maxImageSize;
};

const MediaRouter = Router();

// ROL YOXLAMASI BÜTÜN MARŞRUTLARA.
// Əvvəl yalnız `authenticate` vardı — yəni panel rolu olmayan istənilən
// autentifikasiya olunmuş hesab qalereyanı oxuya və SERVERƏ FAYL YÜKLƏYƏ
// bilərdi. Qalereya bütün formalarda (kurs, müəllim, bloq) işlədilir, ona
// görə bölmə səviyyəsində deyil, ROL səviyyəsində qorunur.
MediaRouter.use(authenticate, requireRole(adminRoles));

// Qalereya qovluqları (UI filtri üçün) — yükləmə marşrutlarından əvvəl.
MediaRouter.get("/folders", mediaController.folders);

// Yükləmələr — hər marşrut öz ölçü limitini `uploadLimit` ilə tətbiq edir
// (fayl FileService-ə çatmazdan əvvəl).
MediaRouter.post(
  "/upload-image",
  uploadLimit(resolveImageLimit),
  mediaController.uploadImage,
);
MediaRouter.post(
  "/upload-video",
  uploadLimit(config.upload.maxVideoSize),
  mediaController.uploadVideo,
);
MediaRouter.post(
  "/upload-document",
  uploadLimit(config.upload.maxDocSize),
  mediaController.uploadDocument,
);

export { MediaRouter };
