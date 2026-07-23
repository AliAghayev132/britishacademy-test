// Services
import { FileService } from "#services";

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
    res.status(200).json({ success: true, data: { url } });
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
    res.status(200).json({ success: true, data: { url } });
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

export { uploadImage, uploadVideo, uploadDocument };
