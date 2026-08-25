// Services
import { FileService, registerMedia, listFolders } from "#services";

// Utils
import { asyncHandler } from "#utils";

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
    return res
      .status(400)
      .json({ success: false, message: "Image file is required" });
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
    res.status(200).json({ success: true, data: { url, media } });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, message: error.message || "Image upload failed" });
  }
});

/**
 * Upload a video.
 * POST /api/media/upload-video  (auth) — form field `video`
 */
const uploadVideo = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.video) {
    return res
      .status(400)
      .json({ success: false, message: "Video file is required" });
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
    res.status(200).json({ success: true, data: { url, media } });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, message: error.message || "Video upload failed" });
  }
});

/**
 * Upload a document (PDF/Word/Excel/PowerPoint/text).
 * POST /api/media/upload-document  (auth) — form field `file`, optional `name`
 */
const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.file) {
    return res
      .status(400)
      .json({ success: false, message: "Document file is required" });
  }

  const customName = req.body?.name || null;

  try {
    const result = await FileService.uploadDocument(
      req.files.file,
      "documents",
      customName,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Document upload failed",
    });
  }
});

/**
 * GET /api/media/folders — qalereyadakı qovluqlar və say (UI filtri üçün).
 */
const folders = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: { folders: await listFolders() } });
});

export { uploadImage, uploadVideo, uploadDocument, folders };
