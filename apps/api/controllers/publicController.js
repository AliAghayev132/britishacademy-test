// Public read endpoints — the data the Next.js site renders. All read-only,
// no auth, only active/published documents.
import { asyncHandler } from "#utils";
import {
  SiteSetting,
  MenuItem,
  Course,
  CourseCategory,
  CourseGroup,
  Branch,
  Teacher,
  Testimonial,
  Destination,
  BlogPost,
  BlogCategory,
  Page,
  Partner,
  Advantage,
  Faq,
} from "#models";

/* ---------------- Site chrome ---------------- */

/** GET /api/site — settings + header/footer menus (one call for the layout). */
const getSite = asyncHandler(async (_req, res) => {
  const [settings, header, footer] = await Promise.all([
    SiteSetting.get(),
    MenuItem.tree("header"),
    MenuItem.tree("footer"),
  ]);
  res.json({ success: true, data: { settings, menu: { header, footer } } });
});

/** GET /api/menu?location=header */
const getMenu = asyncHandler(async (req, res) => {
  const location = req.query.location || "header";
  const items = await MenuItem.tree(location);
  res.json({ success: true, data: { items } });
});

/** GET /api/home — everything the homepage needs, in one payload. */
const getHome = asyncHandler(async (_req, res) => {
  const [settings, courses, partners, advantages, destinations, faqs] =
    await Promise.all([
      SiteSetting.get(),
      Course.findFeatured(6).populate("category"),
      Partner.findPublic(),
      Advantage.findPublic(),
      Destination.findPublic({ isFeatured: true }).limit(8),
      Faq.findPublic().limit(8),
    ]);

  // The homepage renders the written-review wall. Prefer featured reviews, but
  // fall back to any published text review so the section is never empty just
  // because nothing was flagged in the admin panel.
  let testimonials = await Testimonial.findPublic({
    type: "text",
    isFeatured: true,
  }).limit(6);
  if (!testimonials.length) {
    testimonials = await Testimonial.findPublic({ type: "text" }).limit(6);
  }

  res.json({
    success: true,
    data: { settings, courses, testimonials, partners, advantages, destinations, faqs },
  });
});

/* ---------------- Courses ---------------- */

/** GET /api/categories — the mega-menu tree. */
const getCategoryTree = asyncHandler(async (_req, res) => {
  const tree = await CourseCategory.findTree();
  res.json({ success: true, data: { categories: tree } });
});

/** GET /api/courses?category=<slug> */
const listCourses = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category) {
    const cat = await CourseCategory.findOne({ slug: req.query.category });
    if (cat) filter.category = cat._id;
  }
  const courses = await Course.findPublic(filter).populate("category");
  res.json({ success: true, data: { courses } });
});

/**
 * GET /api/courses/:slug — full course page.
 * Populates category + the price matrix's branches, and derives the
 * "who teaches here" chips per branch from the schedule (CourseGroup).
 */
const getCourseBySlug = asyncHandler(async (req, res) => {
  const course = await Course.findOne({
    slug: req.params.slug,
    isActive: true,
    isDeleted: false,
  })
    .populate("category")
    .populate("pricing.branch");

  if (!course) {
    return res.status(404).json({ success: false, message: "Kurs tapılmadı" });
  }

  // Distinct teachers per branch, from the timetable.
  const groups = await CourseGroup.find({
    course: course._id,
    isActive: true,
    isDeleted: false,
  })
    .populate("teacher", "fullName slug title photo color")
    .populate("branch", "name slug");

  const teachersByBranch = {};
  for (const g of groups) {
    if (!g.branch || !g.teacher) continue;
    const key = String(g.branch._id);
    (teachersByBranch[key] ||= { branch: g.branch, teachers: [] });
    if (!teachersByBranch[key].teachers.some((t) => String(t._id) === String(g.teacher._id))) {
      teachersByBranch[key].teachers.push(g.teacher);
    }
  }

  // Related courses in the same category.
  const related = await Course.findPublic({
    category: course.category?._id,
    _id: { $ne: course._id },
  }).limit(6);

  res.json({
    success: true,
    data: {
      course,
      teachersByBranch: Object.values(teachersByBranch),
      related,
    },
  });
});

/* ---------------- Branches ---------------- */

const listBranches = asyncHandler(async (_req, res) => {
  const branches = await Branch.findPublic();
  res.json({ success: true, data: { branches } });
});

const getBranchBySlug = asyncHandler(async (req, res) => {
  const branch = await Branch.findOne({
    slug: req.params.slug,
    isActive: true,
    isDeleted: false,
  });
  if (!branch) {
    return res.status(404).json({ success: false, message: "Filial tapılmadı" });
  }
  res.json({ success: true, data: { branch } });
});

/* ---------------- Teachers ---------------- */

const listTeachers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.branch) {
    const b = await Branch.findOne({ slug: req.query.branch });
    if (b) filter.branches = b._id;
  }
  const teachers = await Teacher.findPublic(filter).populate(
    "branches",
    "name slug",
  );
  res.json({ success: true, data: { teachers } });
});

const getTeacherBySlug = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({
    slug: req.params.slug,
    isActive: true,
    isDeleted: false,
  })
    .populate("branches", "name slug")
    .populate("courses", "title slug");
  if (!teacher) {
    return res.status(404).json({ success: false, message: "Müəllim tapılmadı" });
  }
  // Which courses/branches/times this teacher runs.
  const groups = await CourseGroup.find({
    teacher: teacher._id,
    isActive: true,
    isDeleted: false,
  })
    .populate("course", "title slug")
    .populate("branch", "name slug");
  res.json({ success: true, data: { teacher, groups } });
});

/* ---------------- Testimonials ---------------- */

const listTestimonials = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  const testimonials = await Testimonial.findPublic(filter);
  res.json({ success: true, data: { testimonials } });
});

/* ---------------- Destinations ---------------- */

const listDestinations = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.scholarship === "true") filter.isScholarship = true;
  const destinations = await Destination.findPublic(filter);
  res.json({ success: true, data: { destinations } });
});

const getDestinationBySlug = asyncHandler(async (req, res) => {
  const destination = await Destination.findOne({
    slug: req.params.slug,
    isActive: true,
    isDeleted: false,
  });
  if (!destination) {
    return res.status(404).json({ success: false, message: "Ölkə tapılmadı" });
  }
  res.json({ success: true, data: { destination } });
});

/* ---------------- Schedule (timetable) ---------------- */

/** GET /api/schedule?course=<slug>&branch=<slug> */
const listSchedule = asyncHandler(async (req, res) => {
  const filter = { isActive: true, isDeleted: false };
  if (req.query.course) {
    const c = await Course.findOne({ slug: req.query.course });
    if (c) filter.course = c._id;
  }
  if (req.query.branch) {
    const b = await Branch.findOne({ slug: req.query.branch });
    if (b) filter.branch = b._id;
  }
  const groups = await CourseGroup.find(filter)
    .sort({ startDate: 1 })
    .populate("course", "title slug")
    .populate("branch", "name slug")
    .populate("teacher", "fullName slug title photo color");
  res.json({ success: true, data: { groups } });
});

/* ---------------- Blog ---------------- */

const listBlog = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 9, 1), 50);
  const skip = (page - 1) * limit;

  const filter = { status: "published", isDeleted: false };
  if (req.query.category) {
    const cat = await BlogCategory.findOne({ slug: req.query.category });
    if (cat) filter.category = cat._id;
  }

  const [posts, total, categories] = await Promise.all([
    BlogPost.find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("category", "name slug color")
      .populate("author", "firstName lastName"),
    BlogPost.countDocuments(filter),
    BlogCategory.findPublic(),
  ]);

  res.json({
    success: true,
    data: {
      posts,
      categories,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

const getBlogBySlug = asyncHandler(async (req, res) => {
  const post = await BlogPost.findOne({
    slug: req.params.slug,
    status: "published",
    isDeleted: false,
  })
    .populate("category", "name slug color")
    .populate("author", "firstName lastName avatar");
  if (!post) {
    return res.status(404).json({ success: false, message: "Yazı tapılmadı" });
  }
  await BlogPost.updateOne({ _id: post._id }, { $inc: { views: 1 } });
  res.json({ success: true, data: { post } });
});

/* ---------------- Editorial pages ---------------- */

const getPageBySlug = asyncHandler(async (req, res) => {
  const pageDoc = await Page.findOne({
    slug: req.params.slug,
    isActive: true,
    isDeleted: false,
  });
  if (!pageDoc) {
    return res.status(404).json({ success: false, message: "Səhifə tapılmadı" });
  }
  res.json({ success: true, data: { page: pageDoc } });
});

const listPartners = asyncHandler(async (_req, res) => {
  const partners = await Partner.findPublic();
  res.json({ success: true, data: { partners } });
});

const listFaqs = asyncHandler(async (_req, res) => {
  const faqs = await Faq.findPublic();
  res.json({ success: true, data: { faqs } });
});

export {
  getSite,
  getMenu,
  getHome,
  getCategoryTree,
  listCourses,
  getCourseBySlug,
  listBranches,
  getBranchBySlug,
  listTeachers,
  getTeacherBySlug,
  listTestimonials,
  listDestinations,
  getDestinationBySlug,
  listSchedule,
  listBlog,
  getBlogBySlug,
  getPageBySlug,
  listPartners,
  listFaqs,
};
