// Lead capture — the "Müraciət et" modal and contact form post here.

// Models
import { Course, Lead, SiteSetting } from "#models";

// Services
import { MailService, logAction, diffDocs, recordLeadSubmit, leadInReach } from "#services";

// Utils
import {
  fail,
  ok,
  asyncHandler,
  isObjectId,
  cleanIds,
  courseTitleIndex,
  normTitle,
  sanitizeAttribution,
} from "#utils";

/**
 * Müraciətin kursu: sayt id göndəribsə o, göndərməyibsə `interest` mətni
 * kurs adına (AZ/EN/RU) uyğun gəlirsə həmin kurs. Köhnə keşlənmiş səhifələr
 * və kurs adını seçib göndərən formalar da beləcə kursa bağlanır.
 */
async function resolveCourse(course, interest) {
  if (isObjectId(course)) return course;
  const text = normTitle(interest);
  if (!text) return undefined;
  const courses = await Course.find({ isDeleted: false }).select("title").lean();
  return courseTitleIndex(courses).get(text)?._id;
}

/**
 * POST /api/leads — public. Rate-limited at the route.
 * Minimal validation; everything else is optional context.
 */
const createLead = asyncHandler(async (req, res) => {
  // Honeypot: `website` sahəsi formada gizlidir — insan onu doldurmur, botlar
  // isə bütün sahələri doldurur. Bot uğur cavabı alır (yenidən cəhd etməsin),
  // müraciət isə yazılmır və məktub getmir.
  if (req.body?.website) {
    return ok(res, {}, "Müraciətin qəbul edildi!", 201);
  }
  const { name, phone, email, course, branch, interest, message, source, pageUrl } =
    req.body;

  // Ölkə seçimi yalnız massiv kimi qəbul olunur və ObjectId formasına
  // uyğunluğu yoxlanılır — açıq endpointdir, gələn dəyərə etibar etmirik.
  const destinations = cleanIds(req.body?.destinations, 12);

  if (!name || !phone) {
    return fail(res, "Ad və telefon mütləqdir", 400);
  }

  const lead = await Lead.create({
    name,
    phone,
    email,
    // Əvvəl `course || undefined` idi və sayt heç vaxt id göndərmirdi —
    // statistikada «kursa bağlı müraciət yoxdur» görünürdü.
    course: await resolveCourse(course, interest),
    branch: branch || undefined,
    interest,
    message,
    source,
    pageUrl,
    destinations: destinations.length ? destinations : undefined,
    // Layihə müraciəti — yalnız layihənin öz səhifəsindən gəlir.
    project: isObjectId(req.body?.project) ? req.body.project : undefined,
    // Reklam mənbəyi — sayt yadda saxladığı UTM / Google klik kodunu müraciətlə
    // BİRLİKDƏ göndərir. Təmizlənir və kanal (Google Ads, organik …) serverdə
    // hesablanır. Yoxdursa (razılıq verilməyib, başqa vərəqdən qayıdıb) müraciət
    // reklam məlumatısız yazılır — bu, xəta deyil.
    attribution: sanitizeAttribution(req.body?.attribution),
  });

  ok(res, { id: lead._id }, "Müraciətin qəbul edildi! Tezliklə səninlə əlaqə saxlayacağıq.", 201);

  // ── Bildiriş məktubu ──
  //
  // CAVABDAN SONRA və «tut-unut» şəklində: SMTP yavaş olsa (və ya ümumiyyətlə
  // cavab verməsə) ziyarətçi formanın göndərildiyini bilməmiş gözləməməlidir.
  // Poçtun uğursuzluğu müraciətin itməsi demək deyil — o, artıq bazadadır.
  Lead.findById(lead._id)
    .populate("course", "title")
    .populate("branch", "name")
    .populate("project", "title")
    .populate("destinations", "country")
    .lean()
    .then((full) => MailService.sendLeadNotice(full || lead))
    .catch((err) => console.error("Lead notice failed:", err.message));

  // ── Müraciət hunisi ──
  // «Göndərdi» addımı YALNIZ burada, müraciət bazada yarandıqdan sonra
  // yazılır. Sayt `sid` (anonim sessiya kodu) göndərir ki, müraciət
  // həmin sessiyanın ziyarəti və mənbəyi ilə bağlansın.
  recordLeadSubmit(req.body?.sid, { path: pageUrl, form: source, ua: req.headers["user-agent"] })
    .catch((err) => console.error("Lead funnel event failed:", err.message));
});

/**
 * GET /api/admin/ad-campaigns — kampaniya ID → ad uyğunluğu və müraciətlərdə
 * GÖRÜNƏN kampaniyalar.
 *
 * `seen` — müraciətlərə gəlmiş, amma çox vaxt hələ adı yazılmamış ID-lər.
 * Admin ID-ləri Google Ads-dən əvvəlcədən köçürməyə məcbur deyil: müraciət
 * gəldikcə ID burada görünür, qarşısına ad yazmaq kifayətdir.
 */
const getAdCampaigns = asyncHandler(async (_req, res) => {
  const [settings, seen] = await Promise.all([
    SiteSetting.get(),
    Lead.aggregate([
      { $match: { isDeleted: false, "attribution.campaign": { $nin: [null, ""] } } },
      {
        $group: {
          _id: "$attribution.campaign",
          count: { $sum: 1 },
          lastAt: { $max: "$createdAt" },
          channel: { $last: "$attribution.channel" },
        },
      },
      { $sort: { lastAt: -1 } },
      { $limit: 200 },
    ]),
  ]);
  ok(res, {
    map: (settings.adCampaigns || []).map(({ id, name }) => ({ id, name })),
    seen: seen.map((r) => ({ id: r._id, count: r.count, lastAt: r.lastAt, channel: r.channel })),
  });
});

/** PUT /api/admin/ad-campaigns — uyğunluq cədvəlini bütövlükdə əvəz et. */
const updateAdCampaigns = asyncHandler(async (req, res) => {
  const rows = Array.isArray(req.body?.map) ? req.body.map : null;
  if (!rows) return fail(res, "map massivi tələb olunur", 400);

  // Boş sətirlər atılır, eyni ID təkrarlanırsa SONUNCU qalır.
  const byId = new Map();
  for (const r of rows.slice(0, 500)) {
    const id = String(r?.id ?? "").trim().slice(0, 150);
    const name = String(r?.name ?? "").trim().slice(0, 200);
    if (id && name) byId.set(id, { id, name });
  }

  const settings = await SiteSetting.get();
  settings.adCampaigns = [...byId.values()];
  await settings.save();
  SiteSetting.clearCache?.();

  await logAction(req, {
    action: "update",
    resource: "leads",
    summary: `Kampaniya adları yeniləndi (${byId.size} kampaniya)`,
  });
  ok(res, { map: settings.adCampaigns }, "Kampaniya adları yadda saxlanıldı");
});

/** PATCH /api/admin/leads/:id/status — admin marks a lead handled. */
const updateLeadStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const lead = await Lead.findById(req.params.id);
  if (!lead || lead.isDeleted) {
    return fail(res, "Müraciət tapılmadı", 404);
  }
  // Statusu dəyişmək müraciəti görmək deməkdir. Adi müraciətlərə baxan adam
  // xaricdə təhsil müraciətini id ilə tapıb işarələyə bilməməlidir.
  // Bölmə VƏ filial/ölkə əhatəsi — oxuma ilə eyni qayda (bax leadInReach).
  if (!leadInReach(req.user, lead)) {
    return fail(res, "Müraciət tapılmadı", 404);
  }
  // Müraciətə TOXUNAN hər şey jurnala düşməlidir. Bu endpoint generic
  // CRUD-dan yan keçir, ona görə əvvəl heç bir iz qoymurdu: kimin hansı
  // müraciəti hansı statusa keçirdiyi (və qeydi dəyişdiyi) görünmürdü.
  const before = { status: lead.status, note: lead.note };

  if (status) lead.status = status;
  if (note !== undefined) lead.note = note;
  lead.handledBy = req.user._id;
  lead.handledAt = new Date();
  await lead.save();

  await logAction(req, {
    action: "status",
    resource: "leads",
    resourceId: lead._id,
    summary: `Müraciət yeniləndi: ${lead.name}`,
    changes: diffDocs(before, { status: lead.status, note: lead.note }),
  });

  ok(res, { lead }, "Yeniləndi");
});

export { createLead, updateLeadStatus, getAdCampaigns, updateAdCampaigns };
