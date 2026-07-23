// User roles
const userRoles = ["user", "admin", "editor"];

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
