// Models
import { BlogPost, BlogCategory } from "#models";
// Data
import { BLOG_CATEGORIES, BLOG_POSTS } from "../data/blogData.mjs";

/**
 * Bloq məzmununun importu.
 *
 * NİYƏ AYRICA SERVİS, `seed` yox: `seed` bütün məzmunu silib yenidən qurur və
 * canlı saytda işlədilə bilməz. Bu servis YALNIZ bloq kateqoriyalarına və
 * yazılarına toxunur, mövcud məzmunu silmir.
 *
 * DAVRANIŞ (slug-a görə):
 *   • yoxdursa — yaradılır
 *   • varsa    — DƏYİŞDİRİLMİR. Admin mətni redaktə etmiş ola bilər; üzərinə
 *                yazmaq onun işini silmək olardı.
 * `overwrite: true` verilsə mövcud yazı da başlanğıc mətnlə əvəz olunur.
 *
 * VƏZİYYƏT: yazılar `draft` kimi yüklənir. Dərc etmək admin-in qərarıdır —
 * mətn mərkəzin tonuna uyğunlaşdırılmalı və faktlar yoxlanmalıdır. Buna görə
 * import özbaşına saytda məzmun dərc etmir.
 *
 * İDEMPOTENTDİR: iki dəfə çağırmaq təkrar yazı yaratmır.
 */
export async function importBlog({ dryRun = false, overwrite = false, publish = false } = {}) {
  const report = { categories: [], posts: [] };

  // ── Kateqoriyalar ──
  // Əvvəlcə onlar qurulur: yazı kateqoriyaya id ilə bağlanır.
  const catId = new Map();
  for (const c of BLOG_CATEGORIES) {
    const existing = await BlogCategory.findOne({ slug: c.slug });
    if (existing) {
      catId.set(c.slug, existing._id);
      report.categories.push({ slug: c.slug, status: "mövcuddur" });
      continue;
    }
    if (dryRun) {
      report.categories.push({ slug: c.slug, status: "yaradılacaq" });
      continue;
    }
    const doc = await BlogCategory.create({ ...c, isActive: true, isDeleted: false });
    catId.set(c.slug, doc._id);
    report.categories.push({ slug: c.slug, status: "yaradıldı" });
  }

  // ── Yazılar ──
  // Dərc tarixi hər yazıya 1 dəqiqə fərqlə verilir — hamısı eyni anda dərc
  // olunsa bloqdakı sıra təsadüfi olardı. Beləcə sıra data-dakı sıradır.
  const base = Date.now();
  for (const [i, p] of BLOG_POSTS.entries()) {
    const { category, ...rest } = p;
    const existing = await BlogPost.findOne({ slug: p.slug });
    const publishedAt = new Date(base - i * 60_000);

    const doc = {
      ...rest,
      category: catId.get(category),
      status: publish ? "published" : "draft",
      ...(publish ? { publishedAt } : {}),
      isDeleted: false,
    };

    if (!existing) {
      if (!dryRun) await BlogPost.create(doc);
      report.posts.push({ slug: p.slug, status: dryRun ? "yaradılacaq" : "yaradıldı" });
      continue;
    }

    // `publish` + mövcud QARALAMA → yalnız status dəyişir, mətnə toxunulmur.
    // Canlıda məhz belə oldu: yazılar qaralama kimi yükləndi, bloq boş qaldı,
    // mövcud yazını dərc etməyin isə yolu yox idi.
    if (publish && !overwrite && existing.status === "draft" && !existing.isDeleted) {
      if (!dryRun) {
        existing.status = "published";
        existing.publishedAt = publishedAt;
        await existing.save();
      }
      report.posts.push({ slug: p.slug, status: dryRun ? "dərc olunacaq" : "dərc olundu" });
      continue;
    }

    if (!overwrite) {
      report.posts.push({ slug: p.slug, status: "mövcuddur — toxunulmadı" });
      continue;
    }

    if (!dryRun) {
      Object.assign(existing, doc);
      await existing.save();
    }
    report.posts.push({ slug: p.slug, status: "əvəz olundu" });
  }

  const created = report.posts.filter((r) => r.status.startsWith("yarad")).length;
  const skipped = report.posts.filter((r) => r.status.startsWith("mövcud")).length;

  return {
    report,
    summary: {
      categories: report.categories.length,
      posts: report.posts.length,
      created,
      skipped,
      replaced: report.posts.filter((r) => r.status === "əvəz olundu").length,
      published: report.posts.filter((r) => r.status.startsWith("dərc olun")).length,
    },
  };
}
