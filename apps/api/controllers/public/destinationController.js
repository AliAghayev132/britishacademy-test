// Models
import { Destination, Project } from "#models";

// Utils
import { fail, ok, asyncHandler } from "#utils";

// Local
import { CARD_EXCLUDE } from "./shared.js";

/* ---------------- Destinations ---------------- */

const listDestinations = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.scholarship === "true") filter.isScholarship = true;
  const destinations = await Destination.findPublic(filter).select(CARD_EXCLUDE);
  ok(res, { destinations });
});

const getDestinationBySlug = asyncHandler(async (req, res) => {
  const destination = await Destination.findOne({
    slug: req.params.slug,
    isActive: true,
    isDeleted: false,
  });
  if (!destination) {
    return fail(res, "Ölkə tapılmadı", 404);
  }
  ok(res, { destination });
});

/* ---------------- Projects ---------------- */

/** GET /api/projects — aktiv layihələr. */
const listProjects = asyncHandler(async (_req, res) => {
  const projects = await Project.findPublic().select(CARD_EXCLUDE);
  ok(res, { projects });
});

/** GET /api/projects/:slug */
const getProjectBySlug = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    slug: req.params.slug,
    isActive: true,
    isDeleted: false,
  });
  if (!project) {
    return fail(res, "Layihə tapılmadı", 404);
  }
  // Baxış sayğacı — statistika səhifəsi üçün (Destination ilə eyni yanaşma).
  ok(res, { project });
});

export { listDestinations, getDestinationBySlug, listProjects, getProjectBySlug };
