// Models
import { CourseCategory, Course } from "#models";

// Data
import { tri, COURSE_CONTENT } from "#data";

// Local
import { CATEGORIES, COURSES } from "./sourceData.js";
import { triOpt, toContentBlocks, toFaq, toInfo } from "./converters.js";

/** Kateqoriyalar + açar → sənəd xəritəsi (kurslar valideyn id-sini oradan alır). */
export function buildCategories() {
  const catByKey = {};
  const categories = CATEGORIES.map((c) => {
    const doc = new CourseCategory({ name: tri(c.name), slug: c.key, icon: c.icon, order: c.order });
    catByKey[c.key] = doc;
    return doc;
  });
  CATEGORIES.forEach((c, i) => { if (c.parent) categories[i].parent = catByKey[c.parent]._id; });
  return { categories, catByKey };
}

export function buildCourses(catByKey) {
  return COURSES.map((c, i) => {
    const C = COURSE_CONTENT[`${c.slug}.html`] || {};
    return new Course({
      title: tri(c.title), slug: c.slug, category: catByKey[c.cat]._id,
      h1: triOpt(C.h1), lead: triOpt(C.lead), excerpt: triOpt(C.lead),
      content: toContentBlocks(C), faq: toFaq(C), info: toInfo(C),
      levels: ["A1", "A2", "B1", "B2", "C1", "C2"],
      // Qiymətlər BOŞ gəlir — admin paneldən filial üzrə doldurulur.
      pricingMode: "branch",
      pricing: [],
      customPricing: [],
      pricingNote: triOpt(C.pricing && C.pricing.note),
      isFeatured: Boolean(c.featured),
      order: i,
    });
  });
}

