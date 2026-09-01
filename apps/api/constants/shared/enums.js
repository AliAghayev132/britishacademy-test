// User roles
/**
 * İstifadəçi rolları — səlahiyyət artan sırada.
 *
 *   user        saytın adi istifadəçisi (admin panelə girişi yoxdur)
 *   editor      məhdud məzmun redaktoru
 *   admin       icazə verilmiş bölmələri idarə edir
 *   superadmin  admin YARADA və onlara icazə verə bilər
 *   developer   texniki alətlər (import, miqrasiya, seed) — ən yüksək
 */
const userRoles = ["user", "editor", "admin", "superadmin", "developer"];

/** Rol gücü — müqayisə üçün (böyük rəqəm = daha çox səlahiyyət). */
const ROLE_RANK = { user: 0, editor: 1, admin: 2, superadmin: 3, developer: 4 };

/**
 * Admin panelindəki bölmələr. İstifadəçiyə `permissions` massivi ilə verilir;
 * sidebar da, server də eyni siyahıdan istifadə edir ki, UI-da gizlədilən
 * bölmə API-dən də bağlı olsun.
 */
const adminSections = [
  "dashboard",     // İdarə paneli (hamıya açıq)
  "leads",         // Müraciətlər
  "home",          // Ana səhifə bölmələri
  "courses",       // Kurslar
  "teachers",      // Müəllimlər
  "branches",      // Filiallar
  "course-groups", // Dərs qrafiki
  "testimonials",  // Rəylər
  "destinations",  // Xaricdə təhsil
  "blog",          // Bloq
  "resources",     // Digər resurslar
  "whatsapp",      // WhatsApp / toplu göndəriş
  "users",         // İstifadəçilər
  "logs",          // Loglar
  "stats",         // Statistika
  "links",         // İzlənilən linklər (reklam kampaniyaları)
  "quizzes",       // Testlər
  "settings",      // Tənzimləmələr
  "developer",     // Texniki alətlər
];

// Account status
const accountStatus = ["active", "suspended", "pending"];

// Post status
const postStatus = ["draft", "published", "archived"];

// OTP types
const otpTypes = ["register", "reset-password", "verify-email"];

// ---------------------------------------------------------------------------
// British Academy domain enums
// ---------------------------------------------------------------------------

// CEFR levels used by every language course
const cefrLevels = ["A1", "A2", "B1", "B2", "C1", "C2"];

// How a lesson is delivered
const lessonFormats = ["group", "individual"];

// Day tariff vs. the after-17:00 tariff (evening carries a surcharge)
const timeSlots = ["day", "evening"];

// How a course price is presented on the course page
const pricingModes = ["branch", "custom"];

// Lifecycle of a scheduled study group
const groupStatus = ["open", "full", "ongoing", "finished", "cancelled"];

// Testimonials are either a talking-head video or a written review
const testimonialTypes = ["video", "text"];

// Navigation item rendering style
const menuTypes = ["link", "dropdown", "mega"];

// Application (Lead) pipeline
const leadStatus = ["new", "contacted", "enrolled", "rejected"];

// Where a lead came from
const leadSources = [
  "apply-modal",
  "contact-page",
  "course-page",
  "whatsapp",
  "phone",
  "other",
];

// Uploaded media kind
const mediaTypes = ["image", "video", "document"];

// Ordered rich blocks that make up a course / destination page body
const contentBlockTypes = [
  "paragraph",
  "list",
  "definitions",
  "highlight",
  "note",
];

export {
  userRoles,
  ROLE_RANK,
  adminSections,
  accountStatus,
  postStatus,
  otpTypes,
  cefrLevels,
  lessonFormats,
  timeSlots,
  pricingModes,
  groupStatus,
  testimonialTypes,
  menuTypes,
  leadStatus,
  leadSources,
  mediaTypes,
  contentBlockTypes,
};
