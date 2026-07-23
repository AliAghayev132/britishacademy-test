/**
 * Resource registry — drives the generic admin CRUD controller.
 *
 * Each entry maps a URL segment to its Mongoose model plus small per-resource
 * options (searchable fields, default sort, refs to populate). This keeps the
 * 17 near-identical admin endpoints in one place instead of 17 copy-pasted
 * controller files, while still following the template's asyncHandler +
 * response-envelope conventions (see adminController.js).
 */
import {
  Branch,
  Teacher,
  CourseCategory,
  Course,
  CourseGroup,
  Testimonial,
  Destination,
  BlogCategory,
  BlogPost,
  MenuItem,
  Lead,
  Page,
  Partner,
  Advantage,
  Faq,
  Media,
} from "#models";

export const RESOURCES = {
  branches: {
    model: Branch,
    search: ["name", "address", "district"],
    sort: { order: 1, name: 1 },
  },
  teachers: {
    model: Teacher,
    search: ["fullName", "title"],
    sort: { order: 1, fullName: 1 },
    populate: ["branches", "courses"],
  },
  "course-categories": {
    model: CourseCategory,
    search: ["name"],
    sort: { order: 1, name: 1 },
    populate: ["parent"],
  },
  courses: {
    model: Course,
    search: ["title", "h1", "lead"],
    sort: { order: 1, title: 1 },
    populate: ["category", "pricing.branch"],
  },
  "course-groups": {
    model: CourseGroup,
    search: ["code"],
    sort: { startDate: 1 },
    populate: ["course", "branch", "teacher"],
  },
  testimonials: {
    model: Testimonial,
    search: ["name", "achievement"],
    sort: { order: 1, createdAt: -1 },
    populate: ["course", "branch"],
  },
  destinations: {
    model: Destination,
    search: ["country", "region"],
    sort: { order: 1, country: 1 },
  },
  "blog-categories": {
    model: BlogCategory,
    search: ["name"],
    sort: { order: 1 },
  },
  "blog-posts": {
    model: BlogPost,
    search: ["title", "excerpt", "tags"],
    sort: { createdAt: -1 },
    populate: ["category", "author"],
  },
  "menu-items": {
    model: MenuItem,
    search: ["label"],
    sort: { location: 1, order: 1 },
    populate: ["parent"],
    softDelete: false, // menu items are hard-deleted
  },
  leads: {
    model: Lead,
    search: ["name", "phone", "email"],
    sort: { createdAt: -1 },
    populate: ["course", "branch", "handledBy"],
  },
  pages: {
    model: Page,
    search: ["title"],
    sort: { order: 1 },
  },
  partners: {
    model: Partner,
    search: ["name"],
    sort: { order: 1 },
  },
  advantages: {
    model: Advantage,
    search: ["title"],
    sort: { order: 1 },
  },
  faqs: {
    model: Faq,
    search: ["question"],
    sort: { order: 1 },
  },
  media: {
    model: Media,
    search: ["filename", "alt"],
    sort: { createdAt: -1 },
    softDelete: true,
  },
};

export const resourceNames = Object.keys(RESOURCES);
