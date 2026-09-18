// ── Seed service ──
// Rebuilds the whole British Academy content graph from the known static-site
// data and (re)loads it into MongoDB. Used by the CLI (scripts/seed.js) AND by
// the admin "Developer" panel (POST /api/admin/dev/seed).
//
// Self-contained: the long course copy lives at data/courseContent.mjs (copied
// from the legacy generator) so this works inside the standalone server repo.
// Kolleksiya qrupları üzrə qurucular services/seed/ altındadır.
//
// ⚠️ seedDatabase() WIPES the BA content collections before inserting.

// Local
import { HEADER_MENU } from "./seed/sourceData.js";
import { buildSite, buildBranches } from "./seed/site.js";
import { buildCategories, buildCourses } from "./seed/courses.js";
import { buildTeachers, linkTeachers } from "./seed/teachers.js";
import {
  buildDestinations,
  buildTestimonials,
  buildAdvantages,
  buildPartners,
  buildMenu,
  buildFaqs,
  buildQuizzes,
  buildPages,
} from "./seed/content.js";
import { validateGraph } from "./seed/validate.js";
import { insertGraph } from "./seed/insert.js";

export { HEADER_MENU, validateGraph };

// ── Build the full document graph (pure — no DB) ──
export function buildGraph() {
  const site = buildSite();
  const branches = buildBranches();
  const { categories, catByKey } = buildCategories();
  const { teachers, teacherRowsByName } = buildTeachers();
  const courses = buildCourses(catByKey);
  // Əlaqə kurslar və filiallar hazır olduqdan SONRA — kurs id-ləri lazımdır.
  linkTeachers({ teachers, teacherRowsByName, courses, branches });

  const destinations = buildDestinations();
  const testimonials = buildTestimonials();
  const advantages = buildAdvantages();
  const partners = buildPartners();
  const menu = buildMenu();
  const faqs = buildFaqs();
  const quizzes = buildQuizzes();
  const pages = buildPages();

  return { site, branches, categories, teachers, courses, destinations, testimonials, advantages, partners, menu, pages, faqs, quizzes };
}

/**
 * Build → validate → wipe → insert. Assumes an active Mongo connection.
 * Throws if validation fails (nothing is deleted in that case).
 * @returns {Promise<{counts: object}>}
 */
export async function seedDatabase() {
  const graph = buildGraph();
  const { ok, errors } = validateGraph(graph);
  if (!ok) {
    const err = new Error("Seed validasiyası uğursuz oldu");
    err.details = errors;
    throw err;
  }
  const counts = await insertGraph(graph);
  return { counts };
}
