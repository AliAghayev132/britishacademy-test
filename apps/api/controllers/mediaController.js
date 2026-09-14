// Services
import { FileService, registerMedia, listFolders } from "#services";

// Utils
import { fail, ok, asyncHandler } from "#utils";

/**
 * Editor media upload controllers (TipTap).
 * Files arrive via express-fileupload on `req.files`. Per-route size limits are
 * enforced by the `uploadLimit` middleware before these handlers run.
 */

/**
 * Upload an image.
 * POST /api/media/upload-image  (auth) — form field `image`
 */
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.image) {
    return fail(res, "Image file is required", 400);
  }

  try {
    const url = await FileService.uploadImage(req.files.image, "content");
    // Qalereyaya qeyd et — növbəti dəfə yenidən yükləmək əvəzinə seçilə bilsin.
    // Qeydiyyat uğursuz olsa da yükləmə uğurlu sayılır (fayl artıq diskdədir).
    const media = await registerMedia({
      url,
      file: req.files.image,
      folder: req.body?.folder || "ümumi",
      tags: String(req.body?.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
      type: "image",
      uploadedBy: req.user?._id,
    });
    ok(res, { url, media }, undefined, 200);
  } catch (error) {
    fail(res, error.message || "Image upload failed", 400);
  }
});

/**
 * Upload a video.
 * POST /api/media/upload-video  (auth) — form field `video`
 */
const uploadVideo = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.video) {
    return fail(res, "Video file is required", 400);
  }

  try {
    const url = await FileService.uploadVideo(req.files.video, "videos");
    const media = await registerMedia({
      url,
      file: req.files.video,
      folder: req.body?.folder || "video",
      type: "video",
      uploadedBy: req.user?._id,
    });
    ok(res, { url, media }, undefined, 200);
  } catch (error) {
    fail(res, error.message || "Video upload failed", 400);
  }
});

/**
 * Upload a document (PDF/Word/Excel/PowerPoint/text).
 * POST /api/media/upload-document  (auth) — form field `file`, optional `name`
 */
const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.file) {
    return fail(res, "Document file is required", 400);
  }

  const customName = req.body?.name || null;

  try {
    const result = await FileService.uploadDocument(
      req.files.file,
      "documents",
      customName,
    );
    ok(res, result, undefined, 200);
  } catch (error) {
    fail(res, error.message || "Document upload failed", 400);
  }
});

/**
 * GET /api/media/folders — qalereyadakı qovluqlar və say (UI filtri üçün).
 */
const folders = asyncHandler(async (_req, res) => {
  ok(res, { folders: await listFolders() });
});

export { uploadImage, uploadVideo, uploadDocument, folders };
