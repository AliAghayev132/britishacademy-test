// Models
import { Branch } from "#models";

// Utils
import { fail, ok, asyncHandler } from "#utils";

/* ---------------- Branches ---------------- */

const listBranches = asyncHandler(async (_req, res) => {
  const branches = await Branch.findPublic();
  ok(res, { branches });
});

const getBranchBySlug = asyncHandler(async (req, res) => {
  const branch = await Branch.findOne({
    slug: req.params.slug,
    isActive: true,
    isDeleted: false,
  });
  if (!branch) {
    return fail(res, "Filial tapılmadı", 404);
  }
  ok(res, { branch });
});

export { listBranches, getBranchBySlug };
