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

/**
 * Public cavabdan çıxarılan sahələr.
 *
 * ⚠️ TƏHLÜKƏSİZLİK: /api/site autentifikasiyasızdır. SiteSetting sənədini olduğu
 * kimi qaytarmaq SMTP parolunu və OpenRouter API açarını hər kəsə açırdı.
 * Bura yalnız saytın işləməsi üçün lazım olanlar qalır; yeni gizli sahə əlavə
 * ediləndə onu da bu siyahıya yazın.
 */
const PRIVATE_SETTING_FIELDS = ["smtp", "ai"];

/** SiteSetting-i public üçün təhlükəsiz hala gətir. */
function publicSettings(doc) {
  const out = typeof doc?.toObject === "function" ? doc.toObject() : { ...doc };
  for (const f of PRIVATE_SETTING_FIELDS) delete out[f];
  return out;
}

/** GET /api/site — settings + header/footer menus (one call for the layout). */
const getSite = asyncHandler(async (_req, res) => {
  const [settings, header, footer] = await Promise.all([
    SiteSetting.get(),
    MenuItem.tree("header"),
    MenuItem.tree("footer"),
  ]);
  res.json({
    success: true,
    data: { settings: publicSettings(settings), menu: { header, footer } },
  });
});

/** GET /api/menu?location=header */
const getMenu = asyncHandler(async (req, res) => {
  const location = req.query.location || "header";
  const items = await MenuItem.tree(location);
  res.json({ success: true, data: { items } });
});

/** GET /api/home — everything the homepage needs, in one payload. */
// Ana səhifədəki «Kurslarımız» swiper-ində göstərilən kurs sayı.
// Admin hansıların vacib olduğunu seçir (isFeatured); seçilən sayı bundan
// AZDIRSA qalanı digər aktiv kurslarla tamamlanır ki, swiper yarımçıq
// qalmasın. Əvvəl yalnız seçilmişlər göstərilirdi — 2 kurs işarələnəndə
// bölmə 2 kartla qalırdı.
const HOME_COURSE_COUNT = 6;

const getHome = asyncHandler(async (_req, res) => {
  // Rəy sorğuları da bu dəstəyə daxildir. Əvvəl onlar ARDICIL icra olunurdu
  // (əvvəl mətn rəyləri gözlənilir, sonra videolar) — ana səhifə üçün 3 gediş
  // demək idi. İndi normal halda hamısı BİR gedişdə paralel gedir.
  const [settings, featuredCourses, partners, advantages, destinations, faqs, featuredText, featuredVideo] =
    await Promise.all([
      SiteSetting.get(),
      Course.findFeatured(HOME_COURSE_COUNT).populate("category"),
      Partner.findPublic(),
      Advantage.findPublic(),
      Destination.findPublic({ isFeatured: true }).limit(8),
      Faq.findPublic().limit(8),
      Testimonial.findPublic({ type: "text", isFeatured: true }).limit(6),
      Testimonial.findPublic({ type: "video", isFeatured: true }).limit(8),
    ]);

  // Seçilmiş kurslar 6-dan azdırsa qalanını sıraya görə digər aktiv
  // kurslarla tamamlayırıq. Onsuz da seçilmişlər ƏVVƏLDƏ qalır — admin-in
  // sırası qorunur, tamamlayıcılar sona əlavə olunur.
  let courses = featuredCourses;
  if (courses.length < HOME_COURSE_COUNT) {
    const fill = await Course.findPublic({
      _id: { $nin: courses.map((c) => c._id) },
    })
      .limit(HOME_COURSE_COUNT - courses.length)
      .populate("category");
    courses = [...courses, ...fill];
  }

  // Seçilmiş rəy yoxdursa istənilən dərc olunmuşa düşürük ki, bölmə yalnız
  // admin paneldə heç nə işarələnmədiyinə görə boş qalmasın. Bu ehtiyat
  // sorğular yalnız lazım olanda və yenə PARALEL işləyir.
  let testimonials = featuredText;
  let videoTestimonials = featuredVideo;

  if (!testimonials.length || !videoTestimonials.length) {
    const [fallbackText, fallbackVideo] = await Promise.all([
      testimonials.length ? null : Testimonial.findPublic({ type: "text" }).limit(6),
      videoTestimonials.length ? null : Testimonial.findPublic({ type: "video" }).limit(8),
    ]);
    if (fallbackText) testimonials = fallbackText;
    if (fallbackVideo) videoTestimonials = fallbackVideo;
  }

  res.json({
    success: true,
    data: {
      settings: publicSettings(settings),
      courses, testimonials, videoTestimonials, partners, advantages, destinations, faqs,
    },
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
  // Baxış sayğacı — statistika səhifəsi üçün. updateOne işlədilir ki,
  // sənəd yenidən yazılmasın və versiya konflikti olmasın.
  Course.updateOne({ _id: course._id }, { $inc: { views: 1 } }).catch(() => {});

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
    filter.branches = b ? b._id : null; // unknown branch → no results
  }

  // Filter by course via the timetable: teachers who run a group of that course.
  if (req.query.course) {
    const c = await Course.findOne({ slug: req.query.course });
    const ids = c
      ? await CourseGroup.find({
          course: c._id,
          isActive: true,
          isDeleted: false,
        }).distinct("teacher")
      : [];
    filter._id = { $in: ids };
  }

  // assignments.branch — kartda filial adlarını göstərmək və axtarışda
  // kurs/filial adlarına görə tapmaq üçün.
  const teachers = await Teacher.findPublic(filter)
    .populate("branches", "name slug")
    .populate("courses", "title slug")
    .populate("assignments.branch", "name slug")
    .populate("assignments.courses", "title slug");
  res.json({ success: true, data: { teachers } });
});

const getTeacherBySlug = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({
    slug: req.params.slug,
    isActive: true,
    isDeleted: false,
  })
    .populate("branches", "name slug")
    .populate("courses", "title slug")
    // Filial üzrə dərs təyinatları — müəllim səhifəsinin əsas bölməsi.
    .populate("assignments.branch", "name slug")
    .populate("assignments.courses", "title slug");
  if (!teacher) {
    return res.status(404).json({ success: false, message: "Müəllim tapılmadı" });
  }
  Teacher.updateOne({ _id: teacher._id }, { $inc: { views: 1 } }).catch(() => {});

  // Vaxtlı qrafik yalnız təyinat DOLDURULMAYIB isə göstərilir — köhnə
  // məlumatlarda müəllimin dərsləri yalnız CourseGroup-da ola bilər, onda
  // səhifə boş qalmasın. Təyinat varsa o üstündür (saatsız, sadə görünüş).
  const hasAssignments = (teacher.assignments || []).length > 0;
  const groups = hasAssignments
    ? []
    : await CourseGroup.find({
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
  Destination.updateOne({ _id: destination._id }, { $inc: { views: 1 } }).catch(() => {});
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
