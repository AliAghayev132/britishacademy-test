// Profil — ad/telefon və avatar.

// Constants
import { uploadPaths } from "#constants";

// Models
import { User } from "#models";

// Services
import { FileService } from "#services";

// Utils
import { fail, ok, asyncHandler } from "#utils";

// Local
import { toUserResponse } from "./authHelpers.js";

/**
 * Update profile
 * PUT /api/auth/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    return fail(res, "User not found", 404);
  }

  if (firstName) user.firstName = firstName.trim();
  if (lastName) user.lastName = lastName.trim();
  if (phone !== undefined) user.phone = phone;

  await user.save();

  ok(res, { user: toUserResponse(user) }, "Profil yeniləndi");
});

/**
 * Update avatar (FileService upload example)
 * PUT /api/auth/avatar
 */
const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.avatar) {
    return fail(res, "Avatar file is required", 400);
  }

  const user = await User.findById(req.user._id);

  // Remove the previous avatar file if present.
  if (user.avatar) {
    FileService.deleteFile(user.avatar);
  }

  const savedFile = await FileService.saveFile(
    req.files.avatar,
    `${uploadPaths.avatars.replace("uploads/", "")}/${user._id}`,
  );

  user.avatar = savedFile.path;
  await user.save();

  ok(res, { avatar: user.avatar }, "Avatar updated");
});

export { updateProfile, updateAvatar };
