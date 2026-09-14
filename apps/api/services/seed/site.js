// Models
import { SiteSetting, Branch } from "#models";

// Data
import { BRANCHES, tri } from "#data";

// Local
import { SlugService } from "../SlugService.js";
import { triList } from "./converters.js";

/** Sayt tənzimləmələri (brend, əlaqə, hero, SEO). */
export function buildSite() {
  return new SiteSetting({
    key: "site",
    brand: {
      name: "British Academy", logo: "/assets/logo.png", logoStack: "/assets/logo-stack.png",
      shield: "/assets/shield.png", badge: "/assets/badge11.png", favicon: "/assets/favicon.png",
      ogImage: "/assets/og-cover.png", themeColor: "#00157A",
    },
    contact: {
      phone: "(+994) 55 212 41 51", phone2: "(+994 12) 497 62 97", email: "office@britishacademy.az",
      address: tri("C.Cabbarlı 44, Caspian Plaza"),
      hours: tri("Həftə içi 09:00–21:00 · Şənbə 10:00–16:00"),
    },
    socials: {
      instagram: "https://instagram.com/britishacademy.az", facebook: "https://facebook.com/britishacademy.az",
      youtube: "https://youtube.com/@britishacademy", whatsapp: "https://wa.me/994552124151",
    },
    hero: {
      titlePrefix: tri("British Academy ilə"),
      // «xaricdə oxu» prefikslə birləşəndə «British Academy ilə xaricdə oxu»
      // oxunurdu; müştəri vurğunu universitet qəbuluna keçirdi.
      words: triList(["ingiliscə danış", "IELTS 8.5 al", "rus dili öyrən", "almanca danış", "top universitetlərə qəbul ol", "Duolingo-ya hazırlaş"]),
      colors: ["#001478", "#0B2A9C", "#C8102E", "#00105E", "#1438B8"],
      subtitle: tri("British Academy ilə top universitetlərə qəbul ol."),
    },
    stats: [
      { label: tri("məzun tələbə"), value: tri("20 000+") },
      { label: tri("korporativ tərəfdaş"), value: tri("30+") },
      { label: tri("filial · Bakı"), value: tri("4") },
    ],
    marquee: triList(["İNGİLİS DİLİ", "IELTS 8.5", "DUOLINGO", "DANIŞIQ KLUBU", "XARİCDƏ TƏHSİL", "RUS DİLİ", "ALMAN DİLİ", "BİZNES İNGİLİS"]),
    seo: {
      titleTemplate: "%s — British Academy",
      defaultDescription: tri("British Academy — English UK akkreditasiyalı dil mərkəzi. İngilis, rus, alman dili kursları, IELTS · TOEFL hazırlığı və xaricdə təhsil."),
      defaultOgImage: "/assets/og-cover.png",
    },
    robotsTxt: "User-agent: *\nAllow: /\n\nSitemap: https://britishacademy.az/sitemap.xml\n",
  });
}

export function buildBranches() {
  // Filial adı üçdillidir ({az,en,ru}); slugify obyekti «object-object»-ə
  // çevirirdi və dörd filialın hamısı eyni slug alıb unikal indeksi pozurdu
  // (seed 409 Conflict ilə dayanırdı). Slug AZ mətndən qurulur.
  return BRANCHES.map((b, i) => new Branch({ ...b, slug: SlugService.slugify(b.name?.az || b.name), order: i }));
}
