// ── Admin panelin naviqasiya xəritəsi + axtarış ──
//
// NİYƏ AYRICA MODUL: siyahı əvvəl `DashboardSidebar.jsx`-in içində idi.
// Axtarış əlavə olunanda ona həm siyahı, həm də uyğunluq məntiqi lazım oldu;
// komponentin içində qalsaydı test yazmaq üçün bütün React ağacını qurmaq
// lazım gələrdi. İndi məlumat və məntiq təmiz JS-dir, birbaşa yoxlanılır.
//
// ── ETİKETLƏR (`tags`) ──
// Hər bəndin ADI çox vaxt istifadəçinin AXTARDIĞI söz deyil. «Telefon
// nömrəsini haradan dəyişim?» sualının cavabı «Tənzimləmələr»dir, amma orada
// «telefon» sözü yoxdur. Etiketlər məhz bu boşluğu bağlayır: hər səhifə üçün
// ORADA NƏ EDİLDİYİNİ təsvir edən sözlər.
//
// Etiket yazarkən qayda: istifadəçinin dilində düşün, bölmənin adını təkrar
// etmə. «Kurslar» bəndinə «kurslar» yazmaq faydasızdır — «qiymət», «paket»,
// «endirim» faydalıdır.

// Icons
import {
  FileText, User, LayoutDashboard, Inbox, GraduationCap, Users, Building2,
  CalendarClock, MessageSquareQuote, MessageCircle, Globe2, Settings,
  Database, ShieldCheck, ScrollText, BarChart3, Home, Tags, HelpCircle,
  Sparkles, Handshake, Menu as MenuIcon, Image as ImageIcon, FileStack,
  Link2, ClipboardList, Rocket,
} from "lucide-react";

// Utils
import { fold } from "@/utils/fold";

export const NAV_TOP = [
  {
    name: "İdarə paneli", href: "/dashboard", icon: LayoutDashboard, exact: true, section: "dashboard",
    tags: ["əsas", "xülasə", "statistika", "son müraciətlər", "rəqəmlər", "ümumi baxış"],
  },
  {
    name: "Ana səhifə", href: "/dashboard/ana-sehife", icon: Home, section: "home",
    tags: ["hero", "banner", "slayder", "düymələr", "linklər", "bölmələr", "sırala", "gizlət", "lent", "marquee", "rəqəmlər", "kurslar bölməsi"],
  },
];

export const NAV_GROUPS = [
  {
    key: "muracietler",
    label: "Müraciətlər",
    icon: Inbox,
    items: [
      {
        name: "Bütün müraciətlər", href: "/dashboard/muracietler", icon: Inbox, exact: true, section: "leads",
        tags: ["lead", "sifariş", "zəng", "əlaqə formu", "yeni müraciət", "status", "toplu mesaj", "whatsapp göndər", "qeyd"],
      },
      {
        name: "Xaricdə təhsil", href: "/dashboard/muracietler/xaricde-tehsil", icon: Globe2, section: "leads-abroad",
        tags: ["abroad", "ölkə müraciəti", "viza", "universitet müraciəti", "təqaüd müraciəti"],
      },
    ],
  },
  {
    key: "tedris",
    label: "Tədris",
    icon: GraduationCap,
    items: [
      {
        name: "Kurslar", href: "/dashboard/resurslar/courses", icon: GraduationCap, section: "courses",
        tags: ["qiymət", "paket", "endirim", "səviyyə", "müddət", "ielts", "toefl", "ingilis", "sıra", "ana səhifədə göstər"],
      },
      {
        name: "Kurs kateqoriyaları", href: "/dashboard/resurslar/course-categories", icon: Tags, section: "courses",
        tags: ["qrup", "bölmə", "dil kursları", "kompüter", "rəng"],
      },
      {
        name: "Dərs qrafiki", href: "/dashboard/resurslar/course-groups", icon: CalendarClock, section: "course-groups",
        tags: ["cədvəl", "saat", "gün", "qrup", "başlanğıc tarixi", "yer sayı", "açıq qrup"],
      },
      {
        name: "Müəllimlər", href: "/dashboard/resurslar/teachers", icon: Users, section: "teachers",
        tags: ["heyət", "bio", "şəkil", "sertifikat", "təcrübə", "kadr"],
      },
      {
        name: "Filiallar", href: "/dashboard/resurslar/branches", icon: Building2, section: "branches",
        tags: ["ünvan", "metro", "xəritə", "rayon", "şöbə", "iş saatı", "telefon"],
      },
      {
        name: "Testlər", href: "/dashboard/testler", icon: ClipboardList, section: "quizzes",
        tags: ["quiz", "sual", "cavab", "nəticə", "səviyyə testi", "imtahan"],
      },
      {
        name: "Test kateqoriyaları", href: "/dashboard/resurslar/quiz-categories", icon: Tags, section: "quizzes",
        tags: ["quiz qrupu", "test bölməsi"],
      },
    ],
  },
  {
    key: "mezmun",
    label: "Məzmun",
    icon: FileText,
    items: [
      {
        name: "Bloq yazıları", href: "/dashboard/resurslar/blog-posts", icon: FileText, section: "blog",
        tags: ["xəbər", "məqalə", "post", "yazı", "dərc et", "qaralama", "redaktor", "mətn"],
      },
      {
        name: "Bloq kateqoriyaları", href: "/dashboard/resurslar/blog-categories", icon: Tags, section: "blog",
        tags: ["xəbər bölməsi", "rubrika"],
      },
      {
        name: "Rəylər", href: "/dashboard/resurslar/testimonials", icon: MessageSquareQuote, section: "testimonials",
        tags: ["şagird rəyi", "video rəy", "tələbə", "nəticə", "bal", "uğur hekayəsi"],
      },
      {
        name: "Xaricdə təhsil", href: "/dashboard/resurslar/destinations", icon: Globe2, section: "destinations",
        tags: ["ölkə", "bayraq", "universitet", "təqaüd", "viza", "almaniya", "türkiyə", "sıra"],
      },
      {
        name: "Layihələr", href: "/dashboard/resurslar/projects", icon: Rocket, section: "projects",
        tags: ["proqram", "tədbir", "düşərgə", "yay məktəbi"],
      },
      {
        name: "Səhifələr", href: "/dashboard/resurslar/pages", icon: FileStack, section: "resources",
        tags: ["haqqımızda", "statik səhifə", "mətn səhifəsi", "səhifə şəkli"],
      },
      {
        name: "FAQ", href: "/dashboard/resurslar/faqs", icon: HelpCircle, section: "resources",
        tags: ["sual", "cavab", "tez-tez verilən suallar"],
      },
      {
        name: "Üstünlüklər", href: "/dashboard/resurslar/advantages", icon: Sparkles, section: "resources",
        tags: ["niyə biz", "səbəb", "fərq", "ikon"],
      },
      {
        name: "Tərəfdaşlar", href: "/dashboard/resurslar/partners", icon: Handshake, section: "resources",
        tags: ["logo", "əməkdaşlıq", "brend", "karusel"],
      },
      {
        name: "Menyu", href: "/dashboard/resurslar/menu-items", icon: MenuIcon, section: "resources",
        tags: ["naviqasiya", "başlıq menyusu", "footer", "altlıq", "link", "sıra"],
      },
      {
        name: "Media", href: "/dashboard/resurslar/media", icon: ImageIcon, section: "resources",
        tags: ["qalereya", "şəkil", "video", "fayl", "yüklə", "kitabxana"],
      },
    ],
  },
  {
    key: "sistem",
    label: "Sistem",
    icon: Settings,
    items: [
      {
        name: "WhatsApp", href: "/dashboard/whatsapp", icon: MessageCircle, section: "whatsapp",
        tags: ["qr", "qoşul", "mesaj", "şablon", "toplu göndəriş", "tarixçə", "jurnal", "bağlantı", "nömrə yoxla"],
      },
      {
        name: "İstifadəçilər", href: "/dashboard/istifadeciler", icon: ShieldCheck, section: "users",
        tags: ["admin", "rol", "icazə", "səlahiyyət", "parol", "hesab", "əməkdaş", "bloklamaq"],
      },
      {
        name: "Statistika", href: "/dashboard/statistika", icon: BarChart3, section: "stats",
        tags: ["hesabat", "qrafik", "say", "analitika", "baxış"],
      },
      {
        name: "İzlənilən linklər", href: "/dashboard/linkler", icon: Link2, section: "links",
        tags: ["qr kod", "qısa link", "klik", "utm", "kampaniya", "reklam", "yüklə"],
      },
      {
        name: "Loglar", href: "/dashboard/loglar", icon: ScrollText, section: "logs",
        tags: ["jurnal", "tarixçə", "kim dəyişdi", "audit", "əməliyyat"],
      },
      {
        name: "Tənzimləmələr", href: "/dashboard/tenzimlemeler", icon: Settings, section: "settings",
        tags: [
          "telefon", "nömrə", "e-poçt", "mail", "ünvan", "iş saatları", "sosial şəbəkə",
          "instagram", "facebook", "logo", "brend", "rəng", "seo", "meta", "robots",
          "smtp", "ai", "açar", "kod əlavə et", "favicon",
        ],
      },
      {
        name: "Developer", href: "/dashboard/developer", icon: Database, section: "developer",
        tags: ["miqrasiya", "seed", "yüklə", "tərcümə", "3 dil", "baza", "texniki"],
      },
    ],
  },
];

export const NAV_BOTTOM = [
  {
    name: "Profil", href: "/dashboard/profile", icon: User,
    tags: ["hesabım", "parol dəyiş", "ad", "şəkil", "mənim məlumatlarım"],
  },
];

/**
 * Bir bənd sorğuya uyğun gəlirmi?
 *
 * Qaytarır: `null` (uyğun deyil) və ya `{ score, tagIndex, tag }` — `tag`
 * uyğunluq ETİKETDƏN gəlibsə həmin etiketdir. Nəticə siyahısında göstərilir
 * ki, istifadəçi «niyə bu çıxdı?» sualına cavab görsün.
 *
 * Bal sırası (kiçik = yuxarıda):
 *   0 — ad sorğunun EYNİSİ
 *   1 — etiket sorğunun EYNİSİ            («qr» → WhatsApp)
 *   2 — ad sorğu ilə başlayır             («tənzim» → Tənzimləmələr)
 *   3 — addakı hansısa SÖZ sorğu ilə başlayır («qraf» → Dərs qrafiki)
 *   4 — etiket sorğu ilə başlayır         («endir» → Kurslar)
 *   5 — ad sorğunu söz ortasında saxlayır
 *   6 — etiket sorğunu içində saxlayır
 *   7 — qrup adı uyğun gəlir              («sistem» → bütün Sistem bəndləri)
 *
 * BƏRABƏR BALDA ETİKETİN SIRASI həll edir: siyahıda əvvəldə yazılan etiket
 * həmin səhifə üçün daha mərkəzi sayılır. Konkret fayda — «telefon» sorğusu:
 * həm Filiallarda, həm Tənzimləmələrdə belə etiket var, amma Tənzimləmələrdə
 * o, birinci yazılıb (üst lentdəki nömrə oradan dəyişilir) və yuxarı çıxır.
 */
export function matchNavItem(item, query, groupLabel = "") {
  const q = fold(query).trim();
  if (!q) return null;

  const name = fold(item.name);
  if (name === q) return { score: 0, tagIndex: 0, tag: null };

  const tags = item.tags || [];
  const folded = tags.map(fold);

  const exact = folded.indexOf(q);
  if (exact !== -1) return { score: 1, tagIndex: exact, tag: tags[exact] };

  if (name.startsWith(q)) return { score: 2, tagIndex: 0, tag: null };
  // Söz başlanğıcı söz ortasından güclüdür: «qraf» → «Dərs qrafiki» mənalıdır,
  // «raf» → eyni nəticə isə təsadüfi uyğunluqdur.
  if (name.split(/\s+/).some((w) => w.startsWith(q))) return { score: 3, tagIndex: 0, tag: null };

  const pre = folded.findIndex((f) => f.startsWith(q));
  if (pre !== -1) return { score: 4, tagIndex: pre, tag: tags[pre] };

  if (name.includes(q)) return { score: 5, tagIndex: 0, tag: null };

  const inc = folded.findIndex((f) => f.includes(q));
  if (inc !== -1) return { score: 6, tagIndex: inc, tag: tags[inc] };

  if (groupLabel && fold(groupLabel).includes(q)) return { score: 7, tagIndex: 0, tag: null };
  return null;
}

/**
 * Bütün naviqasiyanı süz və bala görə sırala.
 *
 * @param {string} query
 * @param {Array}  groups  icazəyə görə artıq süzülmüş qruplar
 * @param {Array}  extra   qrupsuz bəndlər (yuxarı + alt siyahı)
 */
export function searchNav(query, groups, extra = []) {
  const rows = [
    ...extra.map((item) => ({ item, groupLabel: "" })),
    ...groups.flatMap((g) => g.items.map((item) => ({ item, groupLabel: g.label }))),
  ];

  return rows
    .map(({ item, groupLabel }) => {
      const m = matchNavItem(item, query, groupLabel);
      return m && { ...item, groupLabel, score: m.score, tagIndex: m.tagIndex, matchedTag: m.tag };
    })
    .filter(Boolean)
    // Bal → etiket sırası → orijinal sıra. `sort` sabitdir, ona görə hər üçü
    // bərabər olanda nəticələr sidebar-dakı ardıcıllıqla düzülür və tanış görünür.
    .sort((a, b) => a.score - b.score || a.tagIndex - b.tagIndex);
}
