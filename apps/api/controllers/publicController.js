// Public read endpoints — the data the Next.js site renders. All read-only,
// no auth, only active/published documents.

// Models
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
  Project,
} from "#models";

// Utils
import { fail, ok, pageInfo, parsePage, asyncHandler } from "#utils";

// Data
import { LEGACY_SLUG_OF } from "#data";

/**
 * Silinmiş və ya deaktiv edilmiş əlaqəli sənəd populate-da çıxmasın
 * (audit #40). Əvvəl kurs səhifəsində silinmiş filialın qiyməti, müəllim
 * kartında silinmiş kurs, cədvəldə silinmiş müəllim görünürdü.
 */
const LIVE = { isActive: true, isDeleted: false };
const live = (path, select) => ({ path, select, match: LIVE });

/** populate match-dən sonra istinadı boş qalan sətirləri at (POJO qaytarır). */
const dropDangling = (doc, field, ref) => {
  const obj = typeof doc?.toJSON === "function" ? doc.toJSON() : doc;
  if (obj && Array.isArray(obj[field])) obj[field] = obj[field].filter((row) => row?.[ref]);
  return obj;
};

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
    SiteSetting.getCached(),
    MenuItem.tree("header"),
    MenuItem.tree("footer"),
  ]);
  ok(res, { settings: publicSettings(settings), menu: { header, footer } });
});

/** GET /api/menu?location=header */
const getMenu = asyncHandler(async (req, res) => {
  const location = req.query.location || "header";
  const items = await MenuItem.tree(location);
  ok(res, { items });
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
  const [settings, featuredCourses, partners, advantages, destinations, faqs, featuredText, featuredVideo, featuredTeachers, featuredProjects] =
    await Promise.all([
      SiteSetting.getCached(),
      Course.findFeatured(HOME_COURSE_COUNT).populate("category").select(CARD_EXCLUDE),
      Partner.findPublic(),
      Advantage.findPublic(),
      Destination.findPublic({ isFeatured: true }).limit(8).select(CARD_EXCLUDE),
      Faq.findPublic().limit(8),
      Testimonial.findPublic({ type: "text", isFeatured: true }).limit(6),
      Testimonial.findPublic({ type: "video", isFeatured: true }).limit(8),
      // Ana səhifədəki müəllim lenti. Sıra klientdə qarışdırılır (bax
      // TeacherSwiper) — burada sabit sıra qaytarılır ki, SSR ilə ilk render
      // uyğun gəlsin və hidratasiya uyğunsuzluğu yaranmasın.
      Teacher.findPublic({ isFeatured: true }).limit(12),
      // Ana səhifədəki layihə lenti.
      Project.findPublic({ isFeatured: true }).limit(8).select(CARD_EXCLUDE),
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
      .populate("category")
      .select(CARD_EXCLUDE);
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

  ok(res, {
    settings: publicSettings(settings),
    courses, testimonials, videoTestimonials, partners, advantages, destinations, faqs,
    teachers: featuredTeachers,
    projects: featuredProjects,
  });
});

/* ---------------- Courses ---------------- */

/** GET /api/categories — the mega-menu tree. */
const getCategoryTree = asyncHandler(async (_req, res) => {
  const tree = await CourseCategory.findTree();
  ok(res, { categories: tree });
});

/** GET /api/courses?category=<slug> */
const listCourses = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category) {
    const cat = await CourseCategory.findOne({ slug: req.query.category, isDeleted: false });
    // Naməlum kateqoriya BÜTÜN kursları qaytarırdı (audit #40).
    if (!cat) return ok(res, { courses: [] });
    filter.category = cat._id;
  }
  const courses = await Course.findPublic(filter).populate("category").select(CARD_EXCLUDE);
  ok(res, { courses });
});

/**
 * GET /api/courses/:slug — full course page.
 * Populates category + the price matrix's branches, and derives the
 * "who teaches here" chips per branch from the schedule (CourseGroup).
 */
const findCourse = (slug) =>
  Course.findOne({ slug, isActive: true, isDeleted: false })
    .populate("category")
    .populate(live("pricing.branch"));

/**
 * Siyahı və kart sorğularında QAYTARILMAYAN ağır sahələr.
 *
 * Kartlar bunları işlətmir; onlar yalnız detal endpoint-lərinə (/:slug)
 * lazımdır. Əvvəl siyahılar tam sənəd qaytarırdı və Next onları klient
 * komponentlərinə (ölkə kartları, kurs vitrini, menyu) ötürürdü — hər
 * ölkənin mətni, FAQ-ı və SEO-su ana səhifə daxil HƏR səhifənin HTML-inə
 * yazılırdı (audit #15).
 */
const CARD_EXCLUDE = "-contentHtml -content -faq -seo";

const getCourseBySlug = asyncHandler(async (req, res) => {
  let course = await findCourse(req.params.slug);

  // Slug dəyişdirilib, amma baza miqrasiyası hələ işlədilməyibsə yeni slug
  // bazada olmur. Yönləndirmə isə artıq yeni slug-a işarə edir — nəticədə
  // 301 → 404 zənciri yaranırdı. Ehtiyat olaraq köhnə slug ilə axtarırıq.
  if (!course && LEGACY_SLUG_OF[req.params.slug]) {
    course = await findCourse(LEGACY_SLUG_OF[req.params.slug]);
  }

  if (!course) {
    return fail(res, "Kurs tapılmadı", 404);
  }
  // Baxış sayğacı burada DEYİL — bu GET keşlənir. Brauzerdən sayılır:
  // POST /api/views (eventController.view).

  // Qruplar və əlaqəli kurslar bir-birini gözləmir (audit #51). Əlaqəli
  // kurslar yalnız kart kimi göstərilir — ağır sahələr çəkilmir.
  const [groups, related] = await Promise.all([
    CourseGroup.find({
      course: course._id,
      isActive: true,
      isDeleted: false,
    })
      .populate(live("teacher", "fullName slug title photo color"))
      .populate(live("branch", "name slug")),
    Course.findPublic({
      category: course.category?._id,
      _id: { $ne: course._id },
    })
      .limit(6)
      .select(CARD_EXCLUDE),
  ]);

  const teachersByBranch = {};
  for (const g of groups) {
    if (!g.branch || !g.teacher) continue;
    const key = String(g.branch._id);
    (teachersByBranch[key] ||= { branch: g.branch, teachers: [] });
    if (!teachersByBranch[key].teachers.some((t) => String(t._id) === String(g.teacher._id))) {
      teachersByBranch[key].teachers.push(g.teacher);
    }
  }

  ok(res, {
    course: dropDangling(course, "pricing", "branch"),
    teachersByBranch: Object.values(teachersByBranch),
    related,
  });
});

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
    .populate(live("branches", "name slug"))
    .populate(live("courses", "title slug"))
    .populate(live("assignments.branch", "name slug"))
    .populate(live("assignments.courses", "title slug"));
  ok(res, { teachers: teachers.map((t) => dropDangling(t, "assignments", "branch")) });
});

const getTeacherBySlug = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({
    slug: req.params.slug,
    isActive: true,
    isDeleted: false,
  })
    .populate(live("branches", "name slug"))
    .populate(live("courses", "title slug"))
    // Filial üzrə dərs təyinatları — müəllim səhifəsinin əsas bölməsi.
    .populate(live("assignments.branch", "name slug"))
    .populate(live("assignments.courses", "title slug"));
  if (!teacher) {
    return fail(res, "Müəllim tapılmadı", 404);
  }

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
        .populate(live("course", "title slug"))
        .populate(live("branch", "name slug"));

  ok(res, {
    teacher: dropDangling(teacher, "assignments", "branch"),
    groups: groups.filter((g) => g.course && g.branch),
  });
});

/* ---------------- Testimonials ---------------- */

const listTestimonials = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  const testimonials = await Testimonial.findPublic(filter);
  ok(res, { testimonials });
});

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

/* ---------------- Schedule (timetable) ---------------- */

/** GET /api/schedule?course=<slug>&branch=<slug> */
const listSchedule = asyncHandler(async (req, res) => {
  const filter = { isActive: true, isDeleted: false };
  // Naməlum kurs/filial süzgəci bütün cədvəli qaytarırdı (audit #40).
  const none = () => ok(res, { groups: [] });
  if (req.query.course) {
    const c = await Course.findOne({ slug: req.query.course, ...LIVE });
    if (!c) return none();
    filter.course = c._id;
  }
  if (req.query.branch) {
    const b = await Branch.findOne({ slug: req.query.branch, ...LIVE });
    if (!b) return none();
    filter.branch = b._id;
  }
  const groups = await CourseGroup.find(filter)
    .sort({ startDate: 1 })
    .populate(live("course", "title slug"))
    .populate(live("branch", "name slug"))
    .populate(live("teacher", "fullName slug title photo color"));
  ok(res, { groups: groups.filter((g) => g.course && g.branch) });
});

/* ---------------- Blog ---------------- */

const listBlog = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query, { defaultLimit: 9, maxLimit: 50 });

  const filter = { status: "published", isDeleted: false };
  if (req.query.category) {
    const cat = await BlogCategory.findOne({ slug: req.query.category, isDeleted: false });
    // Naməlum kateqoriya əvvəl bütün yazıları göstərirdi (audit #40).
    filter.category = cat ? cat._id : { $in: [] };
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

  ok(res, {
    posts,
    categories,
    pagination: pageInfo({ page, limit }, total),
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
    return fail(res, "Yazı tapılmadı", 404);
  }
  ok(res, { post });
});

/* ---------------- Editorial pages ---------------- */

const getPageBySlug = asyncHandler(async (req, res) => {
  const pageDoc = await Page.findOne({
    slug: req.params.slug,
    isActive: true,
    isDeleted: false,
  });
  if (!pageDoc) {
    return fail(res, "Səhifə tapılmadı", 404);
  }
  ok(res, { page: pageDoc });
});

const listPartners = asyncHandler(async (_req, res) => {
  const partners = await Partner.findPublic();
  ok(res, { partners });
});

const listFaqs = asyncHandler(async (_req, res) => {
  const faqs = await Faq.findPublic();
  ok(res, { faqs });
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
  listProjects,
  getProjectBySlug,
  listSchedule,
  listBlog,
  getBlogBySlug,
  getPageBySlug,
  listPartners,
  listFaqs,
};
