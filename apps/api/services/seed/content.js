// Models
import { Testimonial, Destination, MenuItem, Partner, Advantage, Page, Faq, Quiz } from "#models";

// Data
import { tri, FAQS, QUIZZES } from "#data";

// Local
import { SlugService } from "../SlugService.js";
import { DESTINATIONS, TESTIMONIALS, ADVANTAGES, PARTNERS, HEADER_MENU } from "./sourceData.js";
import { triOpt } from "./converters.js";

export const buildDestinations = () =>
  DESTINATIONS.map((d, i) =>
    new Destination({
      ...d,
      country: tri(d.country),
      region: tri(d.region),
      tagline: tri(d.tagline),
      slug: SlugService.slugify(d.country),
      order: i,
      isFeatured: i < 8,
    }),
  );

export const buildTestimonials = () =>
  TESTIMONIALS.map((t, i) =>
    // Ad tərcümə olunmur (şəxs adıdır); rəy mətni və nailiyyət olunur.
    new Testimonial({ ...t, quote: triOpt(t.quote), achievement: triOpt(t.achievement), order: i }),
  );

export const buildAdvantages = () =>
  ADVANTAGES.map((a, i) =>
    new Advantage({ ...a, title: tri(a.title), text: tri(a.text), order: i }),
  );

export const buildPartners = () => PARTNERS.map((p) => new Partner(p));

export function buildMenu() {
  // Valideyn və uşaq bəndləri BİR massivdə qaytarılır — `parent` sahəsi
  // əlaqəni qurur. `new MenuItem()` _id-ni dərhal verir, ona görə iki
  // mərhələli yazmaq lazım gəlmir.
  const menu = [];
  HEADER_MENU.forEach((m, i) => {
    const { children, ...rest } = m;
    const parent = new MenuItem({ ...rest, label: tri(m.label), location: "header", order: i });
    menu.push(parent);
    (children || []).forEach((c, ci) => {
      menu.push(
        new MenuItem({ ...c, label: tri(c.label), location: "header", parent: parent._id, order: ci }),
      );
    });
  });
  return menu;
}

// Sayt üzrə FAQ — ana səhifədəki bölmə. Əvvəl seed-də ümumiyyətlə yox idi,
// ona görə /api/faqs boş qayıdırdı və bölmə sabit mətnlərə düşürdü.
export const buildFaqs = () => FAQS.map((f, i) => new Faq({ ...f, order: i }));

// Səviyyə testləri — köhnə saytın ən çox girilən iki səhifəsi
// (/english-test, /rus-dili-test) bunlara yönləndirilir.
export const buildQuizzes = () =>
  QUIZZES.map(
    (z) =>
      new Quiz({
        ...z,
        questions: z.questions.map((qq, qi) => ({ ...qq, order: qi, isActive: true })),
      }),
  );

export const buildPages = () => [
  new Page({ title: tri("Haqqımızda"), slug: "haqqimizda", isSystem: true, h1: tri("2014-cü ildən dünya dillərini Azərbaycana öyrədirik"), lead: tri("British Academy — “English UK” akkreditasiyasından keçmiş yeganə Azərbaycan şirkəti və rəsmi TOEFL beynəlxalq imtahan mərkəzidir."), order: 0 }),
  new Page({ title: tri("Əlaqə"), slug: "elaqe", isSystem: true, h1: tri("Əlaqə"), lead: tri("Sualların var? Bizimlə əlaqə saxla — komandamız kömək etməyə hazırdır."), order: 1 }),
];
