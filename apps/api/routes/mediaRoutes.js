// Config / constants
import { Router } from "#constants";
import { config } from "#config";

// Controllers
import { mediaController } from "#controllers";

// Models
import { SiteSetting } from "#models";

// Middlewares
import { authenticate, uploadLimit } from "#middlewares";

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

// Qalereya qovluqları (UI filtri üçün) — yükləmə marşrutlarından əvvəl.
MediaRouter.get("/folders", authenticate, mediaController.folders);

// Editor media uploads (auth required). Each route enforces its own size limit
// via uploadLimit before the file is persisted by FileService.
MediaRouter.post(
  "/upload-image",
  authenticate,
  uploadLimit(resolveImageLimit),
  mediaController.uploadImage,
);
MediaRouter.post(
  "/upload-video",
  authenticate,
  uploadLimit(config.upload.maxVideoSize),
  mediaController.uploadVideo,
);
MediaRouter.post(
  "/upload-document",
  authenticate,
  uploadLimit(config.upload.maxDocSize),
  mediaController.uploadDocument,
);

export { MediaRouter };
