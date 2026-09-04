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
  ShortLink,
  Quiz,
  QuizCategory,
  Project,
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
    // assignments.* — redaktə formasının filial üzrə dərsləri göstərməsi üçün.
    populate: ["branches", "courses", "assignments.branch", "assignments.courses"],
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
    populate: ["course", "branch", "handledBy", "destinations", "project"],
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
  projects: {
    model: Project,
    search: ["title", "tagline", "lead"],
    sort: { order: 1, createdAt: -1 },
  },
  "quiz-categories": {
    model: QuizCategory,
    search: ["name"],
    sort: { order: 1, name: 1 },
  },
  faqs: {
    model: Faq,
    search: ["question"],
    sort: { order: 1 },
  },
  quizzes: {
    model: Quiz,
    search: ["title", "slug"],
    sort: { order: 1, createdAt: -1 },
    populate: ["category"],
  },
  "short-links": {
    model: ShortLink,
    search: ["code", "title", "target"],
    // Ən çox kliklənən əvvəldə — kampaniya siyahısında ən vacib sıralama.
    sort: { clicks: -1, createdAt: -1 },
    populate: ["createdBy"],
  },
  media: {
    model: Media,
    search: ["filename", "alt", "tags", "folder"],
    sort: { createdAt: -1 },
    softDelete: true,
  },
};

export const resourceNames = Object.keys(RESOURCES);

/**
 * Resurs → panel bölməsi (icazə açarı).
 *
 * NİYƏ LAZIMDIR: generic CRUD marşrutları (`/admin/:resource`) heç bir bölmə
 * yoxlamasından keçmirdi. Yəni icazələr YALNIZ arayüzdə işləyirdi: sidebar-da
 * bənd gizlədilirdi, amma yalnız «müraciətlər» icazəsi olan admin sorğunu əl
 * ilə yazıb kursları, müəllimləri, testləri, linkləri və logları oxuya
 * bilirdi. Panelin özündə düymə yoxdur, lakin API açıq idi.
 *
 * Bölmə adları arayüzdəki `SECTIONS` siyahısı ilə eyni olmalıdır
 * (apps/web/src/lib/permissions.js) — testlə də yoxlanılır.
 */
export const RESOURCE_SECTION = {
  leads: "leads",

  courses: "courses",
  "course-categories": "courses",
  "course-groups": "course-groups",
  teachers: "teachers",
  branches: "branches",
  quizzes: "quizzes",
  "quiz-categories": "quizzes",

  "blog-posts": "blog",
  "blog-categories": "blog",
  testimonials: "testimonials",
  destinations: "destinations",
  projects: "projects",

  // «Digər resurslar» — ayrıca bölməsi olmayan kiçik məzmun növləri.
  pages: "resources",
  faqs: "resources",
  advantages: "resources",
  partners: "resources",
  "menu-items": "resources",
  media: "resources",

  "short-links": "links",
};
