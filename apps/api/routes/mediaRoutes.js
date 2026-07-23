import { Router } from "#constants";
import { config } from "#config";
import { mediaController } from "#controllers";
import { authenticate, uploadLimit } from "#middlewares";

const MediaRouter = Router();

// Editor media uploads (auth required). Each route enforces its own size limit
// via uploadLimit before the file is persisted by FileService.
MediaRouter.post(
  "/upload-image",
  authenticate,
  uploadLimit(config.upload.maxImageSize),
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
