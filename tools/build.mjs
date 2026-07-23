/* ============================================================
   British Academy — static site generator
   Bir mənbədən bütün səhifələri, mega-menyunu, sitemap.xml və
   robots.txt faylını yaradır və mövcud səhifələri patch edir.

   İşə salmaq:  node tools/build.mjs
   Deploy üçün bu fayl LAZIM DEYİL — çıxış tam statik HTML-dir.
   ============================================================ */
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { COURSE_CONTENT } from './content.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* ============================================================
   KONFİQURASİYA — domain dəyişəndə yalnız bu sətri dəyiş
   ============================================================ */
const ORIGIN = 'https://britishacademy.az';       // <-- real domain buraya
const ORG = {
  name: 'British Academy',
  phone: '+994552124151',
  phone2: '+994124976297',
  email: 'office@britishacademy.az',
  address: 'C.Cabbarlı 44, Caspian Plaza',
  city: 'Bakı',
  hours: 'Həftə içi 09:00–21:00 · Şənbə 10:00–16:00',
  instagram: 'https://instagram.com/britishacademy.az',
  facebook: 'https://facebook.com/britishacademy.az',
  youtube: 'https://youtube.com/@britishacademy',
  whatsapp: 'https://wa.me/994552124151',
};

/* ============================================================
   MENYU AĞACI (PDF "Menu Bar")
   Yeni kurs əlavə etmək: uyğun massivə {label, slug} əlavə et,
   sonra `node tools/build.mjs` işə sal.
   ============================================================ */
const MENU = [
  { label: 'Haqqımızda', slug: 'haqqimizda.html', exists: true, hidden: true },

  { label: 'Uşaq Proqramları', slug: 'usaq-proqramlari.html', hidden: true, dd: [
    { label: 'Uşaqlar üçün İngilis dili', slug: 'usaq-ingilis-dili.html' },
    { label: 'Uşaqlar üçün Rus dili', slug: 'usaq-rus-dili.html' },
    { label: 'Uşaqlar üçün Məntiq', slug: 'usaq-mentiq.html' },
  ]},

  { label: 'Xidmətlər', slug: 'xidmetler.html', mega: [
    { label: 'Dil Kursları', slug: 'dil-kurslari.html', special: 'dil', items: [
      { label: 'İngilis dili kursu', slug: 'ingilis-dili-kursu.html' },
      { label: 'Biznes İngilis dili kursu', slug: 'biznes-ingilis-dili-kursu.html' },
      { label: 'Hüquqşünaslar üçün İngilis dili', slug: 'huquqsunaslar-ingilis-dili-kursu.html' },
      { label: 'Otel və Turizm üçün İngilis dili', slug: 'otel-turizm-ingilis-dili-kursu.html' },
      { label: 'Alman dili kursu', slug: 'alman-dili-kursu.html' },
      { label: 'Beynəlxalq Sertifikatlı Alman dili', slug: 'beynelxalq-sertifikatli-alman-dili-kursu.html' },
      { label: 'Rus dili kursu', slug: 'rus-dili-kursu.html' },
      { label: 'İspan dili kursu', slug: 'ispan-dili-kursu.html' },
      { label: 'İtalyan dili kursu', slug: 'italyan-dili-kursu.html' },
      { label: 'Fransız dili kursu', slug: 'fransiz-dili-kursu.html' },
    ]},
    { label: 'Danışıq Klubları və Praktika', slug: 'danisiq-klublari.html', items: [
      { label: 'Conversation Club', slug: 'conversation-club.html' },
      { label: 'Workshop', slug: 'workshop.html' },
    ]},
    { label: 'Beynəlxalq imtahanlara hazırlıq', slug: 'beynelxalq-imtahanlar.html', items: [
      { label: 'IELTS & Pre-IELTS', slug: 'ielts.html' },
      { label: 'TOEFL & Pre-TOEFL', slug: 'toefl.html' },
      { label: 'OET (Tibb işçiləri üçün)', slug: 'oet.html' },
      { label: 'TOEIC (Rəsmi imtahan)', slug: 'toeic.html' },
      { label: 'SAT & Pre-SAT', slug: 'sat.html' },
      { label: 'Duolingo', slug: 'duolingo.html' },
      { label: 'TOLES', slug: 'toles.html' },
    ]},
    { label: 'Peşəkar Sertifikat Proqramları', slug: 'pesekar-sertifikat.html', items: [
      { label: 'TEFL Kursları', slug: 'tefl-kurslari.html' },
    ]},
    { label: 'Kompüter Kursu', slug: 'komputer-kursu.html', items: [
      { label: 'MS Office proqramları', slug: 'ms-office.html' },
      { label: 'Peşəkar Excel kursu', slug: 'pesekar-excel-kursu.html' },
    ]},
    { label: 'Karyera kursları', slug: 'karyera-kurslari.html', items: [
      { label: 'Mühasibatlıq və 1C kursu', slug: 'muhasibatliq-1c-kursu.html' },
      { label: 'HR & Kargüzarlıq kursu', slug: 'hr-karguzarliq-kursu.html' },
    ]},
  ]},

  { label: 'Tələbələrə özəl', slug: 'telebelere-ozel.html', hidden: true, align: 'right', dd: [
    { label: 'Dinləmə günü', slug: 'dinleme-gunu.html' },
    { label: 'Film günü', slug: 'film-gunu.html' },
  ]},

  { label: 'Xaricdə təhsil', slug: 'xaricde-tehsil.html', align: 'right', cols: 2, dd: [
    { label: 'Almaniya', slug: 'xaricde-almaniya.html' },
    { label: 'Türkiyə', slug: 'xaricde-turkiye.html' },
    { label: 'Polşa', slug: 'xaricde-polsa.html' },
    { label: 'Latviya', slug: 'xaricde-latviya.html' },
    { label: 'Macarıstan', slug: 'xaricde-macaristan.html' },
    { label: 'Litva', slug: 'xaricde-litva.html' },
    { label: 'Rusiya', slug: 'xaricde-rusiya.html' },
    { label: 'Gürcüstan', slug: 'xaricde-gurcustan.html' },
    { label: 'İngiltərə', slug: 'xaricde-ingiltere.html' },
    { label: 'Kanada', slug: 'xaricde-kanada.html' },
    { label: 'Estoniya', slug: 'xaricde-estoniya.html' },
  ]},

  { label: 'Filiallar', slug: 'filiallar.html', branches: true },
  { label: 'Müəllimlər', slug: 'muellimler.html', exists: true },
  { label: 'Tələbələrimiz', slug: 'telebelerimiz.html', students: true },
  { label: 'Taqaüd Proqramları', slug: 'taqaud-proqramlari.html', hidden: true },
  { label: 'Əlaqə', slug: 'elaqe.html' },
];

/* ============================================================
   Filiallar — mock data (adları, ünvan, telefon, WhatsApp).
   WhatsApp popup datası js/main.js-dəki siyahı ilə eyni saxlanmalıdır.
   ============================================================ */
const BRANCHES = [
  { name: 'Mərkəz — Caspian Plaza', address: 'C.Cabbarlı 44, Caspian Plaza', metro: 'Nizami m.', phone: '(+994) 55 212 41 51', wa: '994552124151', hours: 'B.e–Şənbə 09:00–21:00' },
  { name: 'Nərimanov filialı', address: 'Nərimanov r., Atatürk pr. 25', metro: 'Nərimanov m.', phone: '(+994) 55 212 41 52', wa: '994552124152', hours: 'B.e–Şənbə 09:00–21:00' },
  { name: 'Xətai filialı', address: 'Xətai r., Babək pr. 88', metro: 'Həzi Aslanov m.', phone: '(+994) 55 212 41 53', wa: '994552124153', hours: 'B.e–Şənbə 09:00–20:00' },
  { name: 'Yasamal filialı', address: 'Yasamal r., Şərifzadə 12', metro: 'İnşaatçılar m.', phone: '(+994) 55 212 41 54', wa: '994552124154', hours: 'B.e–Şənbə 10:00–20:00' },
];

/* Kurs bazis qiyməti (AZN/ay). Filiallar üzrə +delta ilə mock data yaranır. */
const COURSE_BASE = {
  'ingilis-dili-kursu.html': 100, 'biznes-ingilis-dili-kursu.html': 170,
  'huquqsunaslar-ingilis-dili-kursu.html': 180, 'otel-turizm-ingilis-dili-kursu.html': 150,
  'alman-dili-kursu.html': 110, 'beynelxalq-sertifikatli-alman-dili-kursu.html': 160,
  'rus-dili-kursu.html': 80, 'ispan-dili-kursu.html': 110, 'italyan-dili-kursu.html': 110, 'fransiz-dili-kursu.html': 110,
  'ielts.html': 180, 'toefl.html': 180, 'oet.html': 200, 'toeic.html': 170, 'sat.html': 190, 'duolingo.html': 150, 'toles.html': 200,
  'conversation-club.html': 60, 'workshop.html': 70, 'tefl-kurslari.html': 220,
  'ms-office.html': 80, 'pesekar-excel-kursu.html': 90,
  'muhasibatliq-1c-kursu.html': 150, 'hr-karguzarliq-kursu.html': 140,
  'usaq-ingilis-dili.html': 90, 'usaq-rus-dili.html': 90, 'usaq-mentiq.html': 85,
};
const BRANCH_DELTA = [0, 10, -5, 5];
const branchPrices = (slug) => {
  const base = COURSE_BASE[slug] || 100;
  return BRANCHES.map((b, i) => (base + BRANCH_DELTA[i]) + ' AZN / ay');
};

/* Müəllim heyəti — mock. Hər kurs səhifəsində 3-ü göstərilir. */
const TEACHERS = [
  { n: 'Aygün Əliyeva', i: 'A', s: 'IELTS 8.5 · İngilis dili', c: '#2E6BE6' },
  { n: 'Günel Sadıqova', i: 'G', s: 'İngilis dili · Uşaq proqramları', c: '#12B5A5' },
  { n: 'Rəşad Məmmədov', i: 'R', s: 'Biznes İngilis · Danışıq', c: '#7C4DFF' },
  { n: 'Kamran İsmayılov', i: 'K', s: 'IELTS · TOEFL hazırlıq', c: '#E0533D' },
  { n: 'Nigar Hüseynova', i: 'N', s: 'Rus dili · Danışıq klubu', c: '#F5A524' },
  { n: 'Elvin Quliyev', i: 'E', s: 'Kompüter · Ofis proqramları', c: '#0EA5E9' },
  { n: 'Leyla Rəhimova', i: 'L', s: 'Alman dili · Sertifikat', c: '#FF3D8B' },
  { n: 'Tural Əhmədov', i: 'T', s: 'SAT · İmtahan hazırlığı', c: '#22B07D' },
];
const pick3 = (slug) => {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  const L = TEACHERS.length, b = h % L;
  // 0,3,5 offsetləri L=8 üçün həmişə fərqlidir — döngüsüz, stabil seçim
  return [b % L, (b + 3) % L, (b + 5) % L].map((i) => TEACHERS[i]);
};

/* ============================================================
   Köməkçilər
   ============================================================ */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* JS söndürüləndə gizli qalan blokları açan fallback — tək mənbə */
const NOJS = '<noscript><style>#ba-loader{display:none!important}.ba-reveal{opacity:1!important;transform:none!important}.ba-faq-body{max-height:none!important;opacity:1!important}</style></noscript>';
const url = (slug) => ORIGIN + '/' + (slug === 'index.html' ? '' : slug);

function norm(s) {
  return s.replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i')
    .replace(/Ə/g, 'e').replace(/ə/g, 'e').replace(/Ş/g, 's').replace(/ş/g, 's')
    .replace(/Ç/g, 'c').replace(/ç/g, 'c').replace(/Ğ/g, 'g').replace(/ğ/g, 'g')
    .replace(/Ö/g, 'o').replace(/ö/g, 'o').replace(/Ü/g, 'u').replace(/ü/g, 'u').toLowerCase();
}
function iconFor(s) {
  const n = norm(s);
  const map = [
    ['usaq', '🧒'], ['mentiq', '🧩'], ['biznes', '💼'], ['huquq', '⚖️'], ['otel', '🏨'],
    ['ingilis', '🔤'], ['alman', '🇩🇪'], ['ispan', '🇪🇸'], ['italyan', '🇮🇹'], ['fransiz', '🇫🇷'],
    ['dil kurs', '🗣️'], ['ielts', '🎓'], ['toefl', '🎓'], ['oet', '🩺'], ['toeic', '🎓'],
    ['sat', '🎓'], ['duolingo', '🦉'], ['toles', '📜'], ['imtahan', '🎓'], ['conversation', '💬'],
    ['danisiq', '💬'], ['workshop', '🛠️'], ['tefl', '📜'], ['sertifikat', '📜'], ['excel', '📊'],
    ['office', '🖥️'], ['komputer', '💻'], ['muhasib', '🧮'], ['hr', '👔'], ['karyera', '💼'],
    ['dinleme', '🎧'], ['film', '🎬'], ['almaniya', '🇩🇪'], ['turkiye', '🇹🇷'], ['polsa', '🇵🇱'],
    ['latviya', '🇱🇻'], ['macaristan', '🇭🇺'], ['litva', '🇱🇹'], ['rusiya', '🇷🇺'], ['gurcustan', '🇬🇪'],
    ['ingiltere', '🇬🇧'], ['kanada', '🇨🇦'], ['estoniya', '🇪🇪'], ['xaricde', '✈️'], ['taqaud', '🏆'],
    ['rus', '🇷🇺'], ['elaqe', '📞'], ['xidmet', '⚙️'],
  ];
  for (const [k, ic] of map) if (n.includes(k)) return ic;
  return '📘';
}

/* Maskot şəkilləri — assets/mascot/ qovluğuna atılır.
   Fayl yoxdursa onerror ilə gizlənir, dizayn pozulmur.
   Gözlənilən adlar: point · gift · run · flag · wave  (.png) */
const mascot = (name, cls, alt) =>
  `<img src="assets/mascot/${name}.png" alt="${esc(alt || '')}" loading="lazy" decoding="async"${alt ? '' : ' aria-hidden="true"'} onerror="this.remove()" class="ba-mascot ${cls}">`;

const courseDesc = (l) => `British Academy-də ${l}: təcrübəli müəllimlər, müasir metodika və beynəlxalq standartlara uyğun proqram. Ətraflı məlumat, cədvəl və qeydiyyat üçün əlaqə saxla.`;
const hubDesc = (l) => `${l} — British Academy. Bütün istiqamətlər, proqram detalları və onlayn qeydiyyat bir səhifədə.`;
const countryDesc = (l) => `${l}-də təhsil — British Academy xaricdə təhsil dəstəyi: universitetlər, sənədlər, viza və qəbul prosesi haqqında məlumat.`;

/* ============================================================
   SEO baş hissə
   ============================================================ */
function jsonLd(p) {
  const org = {
    '@context': 'https://schema.org', '@type': 'EducationalOrganization',
    name: ORG.name, url: ORIGIN + '/', logo: ORIGIN + '/assets/logo.png',
    description: 'English UK akkreditasiyalı dil mərkəzi və rəsmi TOEFL imtahan mərkəzi.',
    address: { '@type': 'PostalAddress', streetAddress: ORG.address, addressLocality: ORG.city, addressCountry: 'AZ' },
    telephone: ORG.phone, email: ORG.email,
    sameAs: [ORG.instagram, ORG.facebook, ORG.youtube],
  };
  const blocks = [org];

  const crumbs = [{ name: 'Ana səhifə', slug: 'index.html' }];
  if (p.grand) crumbs.push({ name: p.grand.label, slug: p.grand.slug });
  if (p.parent && p.parent.slug !== 'index.html') crumbs.push({ name: p.parent.label, slug: p.parent.slug });
  if (p.slug !== 'index.html') crumbs.push({ name: p.h1, slug: p.slug });
  if (crumbs.length > 1) {
    blocks.push({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: url(c.slug) })),
    });
  }
  if (p.kind === 'course') {
    blocks.push({
      '@context': 'https://schema.org', '@type': 'Course', name: p.h1, description: p.desc,
      provider: { '@type': 'EducationalOrganization', name: ORG.name, sameAs: ORIGIN + '/' },
    });
  }
  const C = COURSE_CONTENT[p.slug];
  if (C && C.faq && C.faq.length) {
    blocks.push({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: C.faq.map(([q, a]) => ({
        '@type': 'Question', name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    });
  }
  return blocks.map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`).join('\n');
}

function head(p) {
  const u = url(p.slug);
  return `<!DOCTYPE html>
<html lang="az">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.desc)}">
<link rel="canonical" href="${u}">
<meta name="robots" content="index, follow">
<meta property="og:type" content="website">
<meta property="og:site_name" content="British Academy">
<meta property="og:locale" content="az_AZ">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.desc)}">
<meta property="og:url" content="${u}">
<meta property="og:image" content="${ORIGIN}/assets/og-cover.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.title)}">
<meta name="twitter:description" content="${esc(p.desc)}">
<meta name="twitter:image" content="${ORIGIN}/assets/og-cover.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Nunito+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css">
<link rel="icon" type="image/png" sizes="76x76" href="assets/favicon.png">
<link rel="apple-touch-icon" sizes="180x180" href="assets/favicon-180.png">
<meta name="theme-color" content="#00157A">
${NOJS}
${jsonLd(p)}
</head>`;
}

/* ============================================================
   Paylaşılan bloklar: nav, header, mobil menyu, footer, modal
   ============================================================ */
const CARET = '<svg class="ba-caret" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>';
const SUBARROW = '<svg class="ba-dd-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"></path></svg>';

function navBlock() {
  // hidden: true → səhifə yaradılır, amma menyuda görünmür
  const NAV = MENU.filter((t) => !t.hidden);
  const items = NAV.map((top) => {
    if (top.mega) {
      // iç-içə dropdown: kateqoriya siyahısı + sağa açılan alt-menyu
      const rows = top.mega.map((g) =>
        `<div class="ba-dd-item"><a href="${g.slug}"><span>${esc(g.label)}</span>${SUBARROW}</a>` +
        `<div class="ba-dd-sub">${g.items.map((it) => `<a href="${it.slug}">${esc(it.label)}</a>`).join('')}</div></div>`
      ).join('');
      return `<div class="ba-nav-item"><a href="${top.slug}">${esc(top.label)} ${CARET}</a>` +
        `<div class="ba-dd ba-dd--nest">${rows}</div></div>`;
    }
    if (top.dd) {
      const cls = 'ba-dd' + (top.align === 'right' ? ' ba-dd--right' : '') + (top.cols === 2 ? ' ba-dd--2col' : '');
      const links = top.dd.map((it) => `<a href="${it.slug}">${esc(it.label)}</a>`).join('');
      return `<div class="ba-nav-item"><a href="${top.slug}">${esc(top.label)} ${CARET}</a><div class="${cls}">${links}</div></div>`;
    }
    return `<div class="ba-nav-item"><a href="${top.slug}">${esc(top.label)}</a></div>`;
  }).join('\n          ');

  const mobile = NAV.map((top) => {
    if (top.mega) {
      // mobil: iç-içə açılan akkordeon
      const groups = top.mega.map((g) =>
        `<details class="ba-macc ba-macc--sub"><summary>${esc(g.label)}</summary><div class="ba-macc-body">` +
        `<a class="ba-msub ba-msub--all" href="${g.slug}">${esc(g.label)} — hamısı</a>` +
        g.items.map((it) => `<a class="ba-msub" href="${it.slug}">${esc(it.label)}</a>`).join('') +
        `</div></details>`
      ).join('');
      return `<details class="ba-macc"><summary>${esc(top.label)}</summary><div class="ba-macc-body">` +
        `<a class="ba-msub ba-msub--all" href="${top.slug}">${esc(top.label)} — hamısı</a>` + groups + `</div></details>`;
    }
    if (!top.dd) return `<a class="ba-mrow" href="${top.slug}">${esc(top.label)}</a>`;
    return `<details class="ba-macc"><summary>${esc(top.label)}</summary><div class="ba-macc-body">` +
      `<a class="ba-msub ba-msub--all" href="${top.slug}">${esc(top.label)} — hamısı</a>` +
      top.dd.map((k) => `<a class="ba-msub" href="${k.slug}">${esc(k.label)}</a>`).join('') +
      `</div></details>`;
  }).join('\n      ');

  return `<!--BA-NAV--><nav class="ba-nav">
          ${items}
        </nav>
        <button class="ba-burger" aria-label="Menyu" aria-expanded="false"><span></span><span></span><span></span></button>
        <div id="ba-mnav" class="ba-mnav">
          <div class="ba-mnav-inner">
      ${mobile}
          </div>
        </div><!--/BA-NAV-->`;
}

function header() {
  return `  <div class="ba-fixhead" style="position:sticky; top:0; z-index:60;">
    <div id="ba-progress" style="position:fixed; top:0; left:0; height:3px; width:0; background:var(--accent); z-index:70; transition:width .08s linear;"></div>
    <div style="background:#0F1020; color:#C7C8DA; font-size:13px;">
      <div style="max-width:1240px; margin:0 auto; padding:8px 28px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:22px; flex-wrap:wrap;">
          <span>✉ ${ORG.email}</span>
          <span>☎ (+994) 55 212 41 51</span>
          <span style="opacity:.65;">${ORG.hours}</span>
        </div>
        <div style="display:flex; align-items:center; gap:16px;">
          <a href="#">Tələbə zonası</a>
          <div data-langs style="display:inline-flex; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.14); border-radius:99px; padding:2px;">
            <button data-lang="AZ" style="border:none; cursor:pointer; font-family:inherit; font-size:12px; font-weight:700; padding:4px 12px; border-radius:99px; background:var(--accent); color:#fff;">AZ</button>
            <button data-lang="EN" style="border:none; cursor:pointer; font-family:inherit; font-size:12px; font-weight:700; padding:4px 12px; border-radius:99px; background:transparent; color:rgba(255,255,255,.65);">EN</button>
            <button data-lang="RU" style="border:none; cursor:pointer; font-family:inherit; font-size:12px; font-weight:700; padding:4px 12px; border-radius:99px; background:transparent; color:rgba(255,255,255,.65);">RU</button>
          </div>
        </div>
      </div>
    </div>
    <header style="background:rgba(255,255,255,.94); backdrop-filter:blur(14px); border-bottom:1px solid #ECEDF2;">
      <div class="ba-headrow" style="max-width:1240px; margin:0 auto; padding:14px 28px; display:flex; align-items:center; justify-content:space-between; gap:20px;">
        <a href="index.html" aria-label="British Academy — ana səhifə" style="display:flex; align-items:center; flex:none;">
          <img src="assets/logo.png" alt="British Academy" width="553" height="110" style="height:46px; width:auto; display:block;">
        </a>
        ${navBlock()}
        <div style="display:flex; align-items:center; gap:10px; flex:none;">
          <button data-open-search aria-label="Axtar" class="ba-search-btn" style="display:flex; align-items:center; justify-content:flex-start; background:#F1F2F6; border:1px solid #E7E8EE; color:#4C4C58; font-weight:600; font-size:14px; height:42px; padding:0 13px; border-radius:99px; cursor:pointer; font-family:inherit; transition:background .2s, border-color .2s, color .2s;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="flex:none;"><circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path></svg>
            <span class="ba-search-txt" style="max-width:0; opacity:0; overflow:hidden; white-space:nowrap; transition:max-width .32s ease, opacity .25s ease, margin .32s ease;">Axtar</span>
          </button>
          <button data-open-apply class="ba-apply-btn" style="display:inline-flex; align-items:center; gap:8px; background:var(--accent); color:#fff; border:none; font-weight:700; font-size:14.5px; padding:11px 20px; border-radius:99px; cursor:pointer; font-family:inherit; transition:.2s; white-space:nowrap;">Müraciət et</button>
        </div>
      </div>
    </header>
  </div>`;
}

function searchOverlay() {
  return `  <div id="ba-search-overlay" style="display:none; position:fixed; inset:0; z-index:100; background:rgba(255,255,255,.98); backdrop-filter:blur(10px); padding:36px 24px; overflow:auto;">
    <div style="max-width:760px; margin:0 auto;">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:16px;">
        <span style="font-family:'Poppins'; font-weight:800; font-size:22px; color:#14141C;">Axtarış</span>
        <button data-close-search style="display:flex; align-items:center; gap:8px; background:#F1F2F6; border:1px solid #E7E8EE; color:#4C4C58; font-weight:600; font-size:14px; padding:9px 16px; border-radius:99px; cursor:pointer; font-family:inherit;">Bağla ✕</button>
      </div>
      <div style="display:flex; align-items:center; gap:12px; border:2px solid var(--accent); border-radius:16px; padding:15px 18px; background:#fff;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" style="color:var(--accent); flex:none;"><circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path></svg>
        <input id="ba-search-input" placeholder="Kurs, proqram və ya ölkə axtar..." autocomplete="off" style="border:none; outline:none; font-size:19px; width:100%; background:transparent; color:#14141C; font-family:inherit;">
      </div>
      <div id="ba-search-results" style="margin-top:20px; display:flex; flex-direction:column; gap:10px;"></div>
      <div id="ba-search-empty" style="display:none; text-align:center; color:#9A9AA6; padding:28px; font-size:16px;">${mascot('wave', 'ba-mascot-empty')}<div style="margin-top:10px;">Nəticə tapılmadı</div></div>
    </div>
  </div>`;
}

function applyModal() {
  const opts = ['İngilis dili', 'IELTS · TOEFL', 'Rus dili', 'Alman dili', 'Biznes İngilis', 'Uşaqlar üçün', 'Xaricdə təhsil', 'Kompüter kursları']
    .map((o) => `<div class="ba-sel-opt" style="padding:13px 16px; font-size:15px; color:#1C1C26; cursor:pointer; transition:.15s;">${o}</div>`).join('');
  return `  <div id="ba-apply-modal" style="display:none; position:fixed; inset:0; z-index:150; background:rgba(12,13,26,.55); backdrop-filter:blur(4px); align-items:center; justify-content:center; padding:24px;">
    <div style="width:100%; max-width:540px; background:#fff; border-radius:26px; overflow:hidden; box-shadow:0 40px 100px rgba(0,0,0,.45);">
      <div style="position:relative; background:var(--accent); padding:34px 34px 40px; overflow:hidden;">
        <button data-close-apply class="ba-modal-close" style="position:absolute; top:20px; right:20px; width:38px; height:38px; border:none; border-radius:50%; background:rgba(255,255,255,.22); color:#fff; cursor:pointer; font-size:15px; display:grid; place-items:center; transition:.2s; z-index:2;">✕</button>
        <div style="display:inline-flex; align-items:center; gap:12px; background:#fff; border-radius:12px; padding:9px 14px;">
          <img src="assets/shield.png" alt="British Academy" width="237" height="237" loading="lazy" style="height:34px; width:auto; display:block;">
          <span style="font-family:'Poppins'; font-weight:700; font-size:16px; color:#00157A;">British Academy</span>
        </div>
        <h3 style="font-family:'Poppins'; font-weight:700; font-size:30px; margin:22px 0 0; color:#fff; letter-spacing:-.015em;">Müraciət et</h3>
        <p style="font-size:15px; color:rgba(255,255,255,.92); margin:9px 0 0; line-height:1.55; max-width:370px;">Gələcəyinə bu gün başla — dil biliyini British Academy ilə növbəti səviyyəyə qaldır.</p>
      </div>
      <form id="ba-apply-form" style="padding:28px 34px 32px; display:flex; flex-direction:column; gap:14px;">
        <input class="ba-field" required placeholder="Ad Soyad" style="border:1.5px solid #E4E6EF; border-radius:13px; padding:15px 16px; font-size:15px; font-family:inherit; outline:none; transition:border-color .2s; color:#14141C;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
          <input class="ba-field" required placeholder="Telefon" style="border:1.5px solid #E4E6EF; border-radius:13px; padding:15px 16px; font-size:15px; font-family:inherit; outline:none; transition:border-color .2s; color:#14141C; min-width:0;">
          <input class="ba-field" type="email" placeholder="E-poçt" style="border:1.5px solid #E4E6EF; border-radius:13px; padding:15px 16px; font-size:15px; font-family:inherit; outline:none; transition:border-color .2s; color:#14141C; min-width:0;">
        </div>
        <div style="position:relative;">
          <button type="button" id="ba-apply-select" style="width:100%; display:flex; align-items:center; justify-content:space-between; gap:10px; border:1.5px solid #E4E6EF; border-radius:13px; padding:15px 16px; font-size:15px; font-family:inherit; background:#fff; cursor:pointer;">
            <span id="ba-apply-select-label" style="color:#9A9AA6;">Nəyə müraciət edirsən?</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9A9AA6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
          </button>
          <div id="ba-apply-menu" style="display:none; position:absolute; top:calc(100% + 6px); left:0; right:0; background:#fff; border:1px solid #E4E6EF; border-radius:13px; box-shadow:0 16px 40px rgba(20,20,45,.18); overflow:hidden; z-index:5; max-height:210px; overflow-y:auto;">${opts}</div>
        </div>
        <button type="submit" class="ba-apply-btn" style="margin-top:6px; background:var(--accent); color:#fff; border:none; font-weight:700; font-size:16px; padding:16px; border-radius:13px; cursor:pointer; font-family:inherit; transition:.2s;">Müraciəti göndər</button>
        <p style="text-align:center; font-size:12.5px; color:#9A9AA6; margin:2px 0 0;">Məlumatların üçüncü tərəflə paylaşılmır.</p>
      </form>
    </div>
  </div>`;
}

function footer() {
  const col = (title, links) => `<div><div style="font-weight:700; font-size:13px; color:#fff; letter-spacing:.08em; text-transform:uppercase; margin-bottom:18px;">${title}</div><div style="display:flex; flex-direction:column; gap:12px; font-size:14.5px;">${links.map(([l, h]) => `<a href="${h}" class="ba-flink">${esc(l)}</a>`).join('')}</div></div>`;
  return `  <footer style="position:relative; background:#0C0D1A; color:#C4C5D6; overflow:visible; margin-top:70px;">
    <div style="height:5px; background:var(--accent);"></div>
    <div style="position:absolute; top:0; left:50%; transform:translate(-50%,-50%); z-index:5; width:104px; height:104px; border-radius:50%; background:#fff; border:7px solid #0C0D1A; display:grid; place-items:center; box-shadow:0 14px 36px rgba(0,0,0,.45); overflow:hidden;"><img src="assets/badge11.png" alt="11 il sizinlə — est. 2014" width="248" height="220" loading="lazy" style="width:74px; height:auto; display:block;"></div>
    <div class="footer-grid" style="position:relative; z-index:2; max-width:1240px; margin:0 auto; padding:64px 28px 20px; display:grid; grid-template-columns:1.7fr 1fr 1fr 1fr; gap:36px;">
      <div>
        <div style="display:inline-block; background:#fff; border-radius:14px; padding:14px 18px;">
          <img src="assets/logo-stack.png" alt="British Academy — Education For Your Future" width="377" height="200" loading="lazy" style="height:74px; width:auto; display:block;">
        </div>
        <p style="font-size:14.5px; line-height:1.65; margin:20px 0 0; max-width:330px; color:#9A9BB0;">English UK akkreditasiyasından keçmiş yeganə Azərbaycan şirkəti. 2014-cü ildən keyfiyyətli dil təhsili və xaricdə təhsil.</p>
        <div style="font-size:14px; color:#8788A0; margin-top:20px; line-height:1.75;">${ORG.address}<br>(+994 12) 497 62 97 · (+994) 55 212 41 51<br>${ORG.email}</div>
      </div>
      ${col('Kurslar', [['Dil Kursları', 'dil-kurslari.html'], ['Beynəlxalq imtahanlar', 'beynelxalq-imtahanlar.html'], ['Uşaq Proqramları', 'usaq-proqramlari.html'], ['Kompüter Kursu', 'komputer-kursu.html'], ['Karyera kursları', 'karyera-kurslari.html']])}
      ${col('Akademiya', [['Haqqımızda', 'haqqimizda.html'], ['Filiallar', 'filiallar.html'], ['Xaricdə təhsil', 'xaricde-tehsil.html'], ['Müəllimlər', 'muellimler.html'], ['Bloq', 'bloq.html']])}
      ${col('Əlaqə', [['Instagram', ORG.instagram], ['Facebook', ORG.facebook], ['YouTube', ORG.youtube], ['Əlaqə', 'elaqe.html'], ['WhatsApp', ORG.whatsapp]])}
    </div>
    <div style="position:relative; z-index:2; border-top:1px solid rgba(255,255,255,.1); margin-top:24px;">
      <div style="max-width:1240px; margin:0 auto; padding:22px 28px; display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap; font-size:13px; color:#7B7C94;">
        <span>© 2014–2026 British Academy. Bütün hüquqlar qorunur.</span>
        <span>English UK · Cambridge · British Council · Duolingo · TOEFL</span>
      </div>
    </div>
    <div style="position:relative; z-index:1; line-height:.74; text-align:center; margin-top:4px; overflow:hidden;"><div style="font-family:'Poppins'; font-weight:800; font-size:clamp(40px,9.5vw,124px); color:var(--accent-wm); letter-spacing:-.03em; white-space:nowrap; transform:translateY(12%);">British Academy</div></div>
  </footer>
  <a href="${ORG.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp" class="ba-wa" style="position:fixed; right:22px; bottom:56px; z-index:90; width:72px; height:72px; border-radius:50%; background:#25D366; display:grid; place-items:center; box-shadow:0 14px 32px rgba(37,211,102,.5); transition:transform .2s;">
    <svg viewBox="0 0 32 32" width="38" height="38" fill="#fff"><path d="M16 .5C7.4.5.5 7.4.5 16c0 2.8.7 5.5 2.1 7.9L.4 31.6l7.9-2.1c2.3 1.3 4.9 1.9 7.6 1.9 8.6 0 15.5-6.9 15.5-15.5S24.6.5 16 .5zm0 28c-2.4 0-4.7-.6-6.7-1.8l-.5-.3-4.7 1.2 1.3-4.6-.3-.5c-1.3-2.1-2-4.5-2-7 0-7.1 5.8-12.9 13-12.9s12.9 5.8 12.9 12.9-5.8 12.9-13 13zm7.1-9.7c-.4-.2-2.3-1.1-2.6-1.3-.3-.1-.6-.2-.8.2-.2.4-.9 1.3-1.2 1.5-.2.2-.4.3-.8.1-.4-.2-1.6-.6-3.1-1.9-1.1-1-1.9-2.3-2.1-2.7-.2-.4 0-.6.2-.8.2-.2.4-.4.5-.7.2-.2.2-.4.4-.7.1-.3 0-.5 0-.7-.1-.2-.8-2-1.1-2.7-.3-.7-.6-.6-.8-.6h-.7c-.2 0-.6.1-.9.4-.3.4-1.2 1.2-1.2 2.9s1.2 3.4 1.4 3.6c.2.2 2.5 3.8 6 5.3.8.4 1.5.6 2 .8.8.3 1.6.2 2.2.1.7-.1 2.3-.9 2.6-1.8.3-.9.3-1.6.2-1.8-.1-.2-.3-.3-.7-.4z"></path></svg>
  </a>`;
}

/* ============================================================
   Məzmun blokları
   ============================================================ */
function breadcrumb(p) {
  const parts = [{ name: 'Ana səhifə', slug: 'index.html' }];
  if (p.grand) parts.push({ name: p.grand.label, slug: p.grand.slug });
  if (p.parent && p.parent.slug !== 'index.html') parts.push({ name: p.parent.label, slug: p.parent.slug });
  parts.push({ name: p.h1, slug: null });
  return `<nav class="ba-crumb" aria-label="Breadcrumb" style="display:flex; flex-wrap:wrap; align-items:center; gap:8px; font-size:13.5px; color:rgba(255,255,255,.8);">` +
    parts.map((c, i) => {
      const sep = i < parts.length - 1 ? '<span style="opacity:.5;">/</span>' : '';
      return (c.slug ? `<a href="${c.slug}" style="color:rgba(255,255,255,.8);">${esc(c.name)}</a>` : `<span style="color:#fff; font-weight:600;">${esc(c.name)}</span>`) + sep;
    }).join(' ') + `</nav>`;
}

function hero(p, eyebrow, lead, h1) {
  return `  <section style="position:relative; background:var(--accent); overflow:hidden;">
    <div style="position:absolute; top:-90px; right:6%; width:340px; height:340px; border-radius:50%; background:rgba(255,255,255,.13); filter:blur(22px); pointer-events:none;"></div>
    <div style="position:absolute; inset:0; background-image:radial-gradient(rgba(255,255,255,.14) 1.3px, transparent 1.3px); background-size:24px 24px; -webkit-mask-image:radial-gradient(circle at 70% 30%, transparent 30%, #000 82%); mask-image:radial-gradient(circle at 70% 30%, transparent 30%, #000 82%); pointer-events:none;"></div>
    ${p.mascot ? mascot(p.mascot, 'ba-mascot-hero') : ''}
    <div style="position:relative; max-width:1200px; margin:0 auto; padding:30px 28px 60px;">
      ${breadcrumb(p)}
      <span style="display:inline-block; margin-top:22px; font-size:12.5px; color:rgba(255,255,255,.9); font-weight:700; letter-spacing:.14em; text-transform:uppercase;">${esc(eyebrow)}</span>
      <h1 style="font-family:'Poppins'; font-weight:700; font-size:clamp(30px,4.4vw,48px); letter-spacing:-.025em; margin:14px 0 0; line-height:1.12; color:#fff; max-width:900px;">${esc(h1 || p.h1)}</h1>
      <p style="font-size:18px; color:rgba(255,255,255,.92); margin:18px 0 0; max-width:660px; line-height:1.6;">${esc(lead)}</p>
      <div style="display:flex; flex-wrap:wrap; gap:12px; margin-top:28px;">
        <button data-open-apply class="ba-btn-primary" style="background:#fff; color:var(--accent); border:none; font-weight:700; font-size:15px; padding:14px 26px; border-radius:99px; cursor:pointer; font-family:inherit; transition:.2s;">Müraciət et</button>
        <a href="elaqe.html" style="display:inline-flex; align-items:center; background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.3); color:#fff; font-weight:700; font-size:15px; padding:14px 26px; border-radius:99px;">Əlaqə saxla</a>
      </div>
    </div>
  </section>`;
}

function ctaBand() {
  return `  <section style="max-width:1200px; margin:64px auto 0; padding:0 28px;">
    <div style="position:relative; overflow:hidden; background:#0C0D1A; border-radius:28px; padding:52px 40px; text-align:center;">
      <div style="position:absolute; top:-60px; left:-30px; width:220px; height:220px; border-radius:50%; background:var(--accent-wm); filter:blur(10px);"></div>
      ${mascot('gift', 'ba-mascot-cta')}
      <div style="position:relative;">
        <h2 style="font-family:'Poppins'; font-weight:700; font-size:clamp(26px,3.4vw,36px); color:#fff; margin:0; letter-spacing:-.02em;">Hazırsan? Elə bu gün başla.</h2>
        <p style="font-size:16px; color:#B9BAD0; margin:14px auto 26px; max-width:520px; line-height:1.6;">Ödənişsiz səviyyə təyini və məsləhət üçün müraciət et — komandamız səninlə əlaqə saxlayacaq.</p>
        <button data-open-apply class="ba-btn-primary" style="background:var(--accent); color:#fff; border:none; font-weight:700; font-size:16px; padding:15px 30px; border-radius:99px; cursor:pointer; font-family:inherit; transition:.2s;">Müraciət et</button>
      </div>
    </div>
  </section>`;
}

function boxGrid(boxes) {
  return `<div class="grid-3" style="display:grid; grid-template-columns:repeat(3,1fr); gap:20px;">` +
    boxes.map((b) => `<a href="${b.slug}" class="ba-course ba-reveal" style="display:block; border:1px solid #ECEDF2; border-radius:20px; padding:26px; background:#fff; transition:transform .25s ease, box-shadow .25s ease, border-color .25s;">
      <span style="display:grid; place-items:center; width:54px; height:54px; border-radius:15px; background:var(--accent-soft); font-size:26px;">${b.icon || iconFor(b.label)}</span>
      <h3 style="font-family:'Poppins'; font-weight:700; font-size:20px; color:#16161C; margin:18px 0 0; letter-spacing:-.01em;">${esc(b.label)}</h3>
      <p style="font-size:14.5px; color:#63636F; margin:10px 0 0; line-height:1.6;">${esc(b.blurb || 'Ətraflı məlumat və qeydiyyat üçün klikləyin.')}</p>
      <span style="display:inline-flex; align-items:center; gap:6px; margin-top:16px; color:var(--accent); font-weight:700; font-size:14px;">Ətraflı →</span>
    </a>`).join('') + `</div>`;
}

/* ---- Hub səhifə (box/shape layout) ---- */
function hubPage(p) {
  let body;
  if (p.special === 'dil') {
    const it = p.items;
    const grp = (title, sub, list) => `<div class="ba-course ba-reveal" style="grid-column:span 1; border:1px solid #ECEDF2; border-radius:22px; padding:28px; background:#fff;">
        <span style="display:grid; place-items:center; width:56px; height:56px; border-radius:15px; background:var(--accent-soft); font-size:28px;">${iconFor(title)}</span>
        <h3 style="font-family:'Poppins'; font-weight:700; font-size:22px; color:#16161C; margin:18px 0 4px;">${esc(title)}</h3>
        <p style="font-size:14px; color:#8A8A96; margin:0 0 14px;">${esc(sub)}</p>
        <div style="display:flex; flex-direction:column; gap:8px;">${list.map((x) => `<a href="${x.slug}" class="ba-flink" style="color:#3A3A46; font-weight:600; font-size:14.5px; padding:9px 12px; border-radius:10px; background:#F7F8FC;">${esc(x.label)} →</a>`).join('')}</div>
      </div>`;
    const single = (x) => `<a href="${x.slug}" class="ba-course ba-reveal" style="display:block; border:1px solid #ECEDF2; border-radius:22px; padding:28px; background:#fff;">
        <span style="display:grid; place-items:center; width:56px; height:56px; border-radius:15px; background:var(--accent-soft); font-size:28px;">${iconFor(x.label)}</span>
        <h3 style="font-family:'Poppins'; font-weight:700; font-size:20px; color:#16161C; margin:18px 0 0;">${esc(x.label)}</h3>
        <span style="display:inline-flex; margin-top:14px; color:var(--accent); font-weight:700; font-size:14px;">Ətraflı →</span>
      </a>`;
    body = `<div class="grid-3" style="display:grid; grid-template-columns:repeat(3,1fr); gap:20px; align-items:start;">
      ${grp('İngilis dili', 'General, Business, Legal, Hospitality', it.slice(0, 4))}
      ${grp('Alman dili', 'A1–C1 və beynəlxalq sertifikat', it.slice(4, 6))}
      ${it.slice(6).map(single).join('\n      ')}
    </div>`;
  } else {
    body = boxGrid(p.boxes);
  }
  return [
    head(p), '\n<body>\n<div style="min-height:100vh; overflow-x:hidden; background:#fff;">\n',
    header(), searchOverlay(), applyModal(),
    hero(p, p.parent ? p.parent.label : 'British Academy', p.lead),
    `  <section style="max-width:1200px; margin:60px auto 0; padding:0 28px;">
    <h2 style="font-family:'Poppins'; font-weight:700; font-size:clamp(24px,3vw,32px); color:#14141C; letter-spacing:-.02em; margin:0 0 26px;">İstiqamətlər</h2>
    ${body}
  </section>`,
    ctaBand(), footer(),
    '\n</div>\n<script src="js/main.js" defer></script>\n</body>\n</html>',
  ].join('\n');
}

/* ---- Qiymətlər (yalnız kurs səhifələri) ---- */
function priceSection(p) {
  if (p.kind !== 'course') return '';
  const pr = (COURSE_CONTENT[p.slug] || {}).pricing || {};
  let list;
  if (pr.custom) {
    list = pr.custom;
  } else {
    const prices = branchPrices(p.slug);
    list = pr.only
      ? pr.only.map((i) => [BRANCHES[i].name, prices[i]])
      : BRANCHES.map((b, i) => [b.name, prices[i]]);
  }
  const rows = list.map(([k, v], i) =>
    `<div style="display:flex; align-items:center; justify-content:space-between; gap:14px; padding:16px 24px;${i < list.length - 1 ? ' border-bottom:1px solid #ECEDF2;' : ''}">
        <span style="font-size:15px; font-weight:600; color:#33333D;">${esc(k)}</span>
        <span style="font-size:15px; font-weight:800; color:var(--accent); white-space:nowrap;">${esc(v)}</span>
      </div>`).join('\n      ');
  const title = pr.custom ? 'Qiymətlər' : 'Filiallar üzrə qiymətlər';
  const extra = pr.note ? `<p style="font-size:14.5px; color:#33333D; margin:14px 0 0; padding:13px 16px; background:var(--accent-soft); border-radius:12px; font-weight:600;">${esc(pr.note)}</p>` : '';
  return `  <section id="qiymetler" style="max-width:1200px; margin:56px auto 0; padding:0 28px;">
    <h2 style="font-family:'Poppins'; font-weight:700; font-size:clamp(24px,3vw,32px); color:#14141C; letter-spacing:-.02em; margin:0 0 22px;">${title}</h2>
    <div style="border:1px solid #ECEDF2; border-radius:20px; background:#fff; overflow:hidden; max-width:720px;">
      ${rows}
    </div>
    ${extra}
    <p style="font-size:13.5px; color:#9A9AA6; margin:14px 0 0;">Qiymətlər qrupun ölçüsünə və formata görə dəyişə bilər. Bütün <a href="filiallar.html" style="color:var(--accent); font-weight:700;">filiallara bax</a> və ya <a href="elaqe.html" style="color:var(--accent); font-weight:700;">əlaqə saxla</a>.</p>
  </section>
`;
}

/* ---- Müştəri SEO məzmunu: bölmələr ---- */
function contentSections(p) {
  const C = COURSE_CONTENT[p.slug];
  if (!C || !C.sections) return '';
  return C.sections.map((s) => {
    const tag = s.h === 3 ? 'h3' : 'h2';
    const size = s.h === 3 ? 'clamp(19px,2.3vw,24px)' : 'clamp(23px,2.9vw,31px)';
    const out = [`<${tag} style="font-family:'Poppins'; font-weight:700; font-size:${size}; color:#14141C; letter-spacing:-.02em; margin:0 0 14px;">${esc(s.t)}</${tag}>`];
    (s.p || []).forEach((x) => out.push(`<p style="font-size:16.5px; line-height:1.85; color:#3c3c47; margin:0 0 16px;">${esc(x)}</p>`));
    if (s.ul) out.push(`<ul role="list" style="margin:0 0 18px; padding:0; list-style:none; display:flex; flex-direction:column; gap:10px;">`
      + s.ul.map((x) => `<li style="display:flex; gap:11px; font-size:16px; line-height:1.65; color:#3c3c47;"><span style="color:var(--accent); font-weight:800; flex:none;">✓</span><span>${esc(x)}</span></li>`).join('')
      + `</ul>`);
    if (s.dl) out.push(`<div style="display:flex; flex-direction:column; gap:11px; margin:0 0 18px;">`
      + s.dl.map(([k, v]) => `<div style="border-left:3px solid var(--accent); background:#FAFBFF; border-radius:0 12px 12px 0; padding:13px 16px;"><strong style="font-weight:700; color:#16161C;">${esc(k)}:</strong> <span style="color:#4a4a55; font-size:15.5px; line-height:1.7;">${esc(v)}</span></div>`).join('')
      + `</div>`);
    if (s.highlight) out.push(`<div style="display:flex; gap:12px; align-items:flex-start; background:var(--accent-soft); border:1px solid var(--accent); border-radius:14px; padding:16px 18px; margin:0 0 18px;"><span style="font-size:19px; flex:none; line-height:1.3;">★</span><p style="margin:0; font-size:15.5px; line-height:1.7; color:#26263a; font-weight:600;">${esc(s.highlight)}</p></div>`);
    if (s.note) out.push(`<p style="font-size:15px; line-height:1.7; color:#55555f; margin:0 0 16px; padding:13px 16px; background:#F7F8FC; border-radius:12px;">${esc(s.note)}</p>`);
    return `  <section style="max-width:900px; margin:44px auto 0; padding:0 28px;">\n    ${out.join('\n    ')}\n  </section>`;
  }).join('\n');
}

/* ---- Müştəri SEO məzmunu: FAQ akkordeonu ---- */
function faqSection(p) {
  const C = COURSE_CONTENT[p.slug];
  if (!C || !C.faq || !C.faq.length) return '';
  const items = C.faq.map(([q, a]) => `<div class="ba-faq" style="border:1px solid #ECEDF2; border-radius:16px; background:#fff; overflow:hidden; transition:.2s;">
        <div class="ba-faq-q" style="display:flex; align-items:center; justify-content:space-between; gap:16px; padding:19px 22px; cursor:pointer;">
          <span style="font-family:'Poppins'; font-weight:600; font-size:16.5px; color:#1C1C26;">${esc(q)}</span>
          <span class="ba-faq-sign" style="width:30px; height:30px; flex:none; border-radius:50%; background:var(--accent-soft); color:var(--accent); display:grid; place-items:center; font-size:20px; font-weight:600;">+</span>
        </div>
        <div class="ba-faq-body" style="overflow:hidden; transition:max-height .4s ease, opacity .35s ease; max-height:0; opacity:0;"><div style="padding:0 22px 20px; font-size:15.5px; color:#5A5A66; line-height:1.7;">${esc(a)}</div></div>
      </div>`).join('\n      ');
  return `  <section style="max-width:900px; margin:56px auto 0; padding:0 28px;">
    <h2 style="font-family:'Poppins'; font-weight:700; font-size:clamp(24px,3vw,32px); color:#14141C; letter-spacing:-.02em; margin:0 0 24px;">Tez-tez verilən suallar</h2>
    <div style="display:flex; flex-direction:column; gap:12px;">
      ${items}
    </div>
  </section>
`;
}

/* ---- Bu kursun müəllimləri (yalnız kurs səhifələri) ---- */
function teacherSection(p) {
  if (p.kind !== 'course') return '';
  const cards = pick3(p.slug).map((t) =>
    `<a href="muellimler.html" class="ba-course ba-reveal" style="display:flex; align-items:center; gap:14px; border:1px solid #ECEDF2; border-radius:18px; padding:18px; background:#fff; --accent:${t.c}; --accent-soft:${t.c}1f;">
        <span style="width:52px; height:52px; border-radius:50%; background:${t.c}; color:#fff; display:grid; place-items:center; font-family:'Poppins'; font-weight:700; font-size:22px; flex:none;">${t.i}</span>
        <span style="min-width:0;">
          <span style="display:block; font-family:'Poppins'; font-weight:700; font-size:16.5px; color:#16161C;">${esc(t.n)}</span>
          <span style="display:block; font-size:13px; color:#63636F; margin-top:3px;">${esc(t.s)}</span>
        </span>
      </a>`).join('\n      ');
  return `  <section style="max-width:1200px; margin:56px auto 0; padding:0 28px;">
    <h2 style="font-family:'Poppins'; font-weight:700; font-size:clamp(24px,3vw,32px); color:#14141C; letter-spacing:-.02em; margin:0 0 8px;">Bu kursun müəllimləri</h2>
    <p style="font-size:15px; color:#63636F; margin:0 0 24px;">Beynəlxalq sertifikatlı, təcrübəli müəllim heyəti. <a href="muellimler.html" style="color:var(--accent); font-weight:700;">Hamısına bax →</a></p>
    <div class="grid-3" style="display:grid; grid-template-columns:repeat(3,1fr); gap:16px;">
      ${cards}
    </div>
  </section>
`;
}

/* ---- Kurs / ölkə (leaf) səhifə ---- */
function leafPage(p) {
  const isCountry = p.kind === 'country';
  const C = COURSE_CONTENT[p.slug] || null;
  const aboutTitle = isCountry ? 'Ölkə haqqında' : 'Kurs haqqında';
  const info = (C && C.info) ? C.info : (isCountry
    ? [['Təhsil dili', '—'], ['Təhsil haqqı', '—'], ['Viza dəstəyi', 'Var'], ['Müddət', '—']]
    : [['Müddət', '—'], ['Səviyyə', 'A1 – C1'], ['Format', 'Qrup / Fərdi'], ['Cədvəl', 'Həftədə 2–3 dəfə']]);
  const feats = isCountry
    ? [['🎓', 'Universitet seçimi', 'Profilinə uyğun universitet və proqram seçimində dəstək.'], ['📄', 'Sənəd hazırlığı', 'Müraciət sənədləri, motivasiya məktubu və tərcümələr.'], ['🛂', 'Viza prosesi', 'Viza sənədləri və müsahibəyə hazırlıq.'], ['🏠', 'Yerləşmə', 'Yaşayış və adaptasiya məsələlərində köməklik.']]
    : [['🎯', 'Məqsədyönlü proqram', 'Sənin səviyyənə və hədəfinə uyğun fərdi tədris planı.'], ['👩‍🏫', 'Təcrübəli müəllimlər', 'Beynəlxalq sertifikatlı, təcrübəli müəllim heyəti.'], ['🗣️', 'Danışıq praktikası', 'Hər dərsdə canlı danışıq və interaktiv tapşırıqlar.'], ['📜', 'Sertifikat', 'İmtahanda uğur qazanan tələbələrə British Academy sertifikatı.']];
  const rel = (p.siblings || []).filter((s) => s.slug !== p.slug).slice(0, 6);

  return [
    head(p), '\n<body>\n<div style="min-height:100vh; overflow-x:hidden; background:#fff;">\n',
    header(), searchOverlay(), applyModal(),
    hero(p, p.parent ? p.parent.label : 'British Academy', (C && C.lead) || p.lead, C && C.h1),
    `  <section style="max-width:1200px; margin:60px auto 0; padding:0 28px;">
    <div class="split" style="display:grid; grid-template-columns:1.6fr 1fr; gap:36px; align-items:start;">
      <div>
        <h2 style="font-family:'Poppins'; font-weight:700; font-size:clamp(24px,3vw,32px); color:#14141C; letter-spacing:-.02em; margin:0 0 16px;">${aboutTitle}</h2>
        ${C && C.intro
          ? C.intro.map((x) => `<p style="font-size:16.5px; line-height:1.85; color:#3c3c47; margin:0 0 16px;">${esc(x)}</p>`).join('\n        ')
          : `<p style="font-size:17px; line-height:1.8; color:#33333D; margin:0 0 18px;">${esc(p.lead)}</p>
        <p style="font-size:16.5px; line-height:1.8; color:#4a4a55; margin:0;">Bu bölmənin təfərrüatlı məzmunu tezliklə əlavə olunacaq. Proqram, qiymət və cədvəl barədə ətraflı məlumat üçün bizimlə əlaqə saxla və ya müraciət et.</p>`}
      </div>
      <aside style="border:1px solid #ECEDF2; border-radius:20px; padding:26px; background:#FAFBFF;">
        <div style="font-weight:700; font-size:13px; color:#9A9AA6; letter-spacing:.08em; text-transform:uppercase; margin-bottom:16px;">Qısa məlumat</div>
        ${info.map(([k, v]) => `<div style="display:flex; justify-content:space-between; gap:12px; padding:12px 0; border-bottom:1px solid #ECEDF2; font-size:15px;"><span style="color:#63636F;">${esc(k)}</span><span style="color:#16161C; font-weight:600;">${esc(v)}</span></div>`).join('')}
        <button data-open-apply class="ba-btn-primary" style="width:100%; margin-top:20px; background:var(--accent); color:#fff; border:none; font-weight:700; font-size:15px; padding:14px; border-radius:13px; cursor:pointer; font-family:inherit; transition:.2s;">Müraciət et</button>
      </aside>
    </div>
  </section>
${priceSection(p)}  <section style="max-width:1200px; margin:56px auto 0; padding:0 28px;">
    <h2 style="font-family:'Poppins'; font-weight:700; font-size:clamp(24px,3vw,32px); color:#14141C; letter-spacing:-.02em; margin:0 0 26px;">Üstünlüklər</h2>
    <div class="grid-4" style="display:grid; grid-template-columns:repeat(4,1fr); gap:18px;">
      ${feats.map(([ic, t, d]) => `<div class="ba-reveal" style="border:1px solid #ECEDF2; border-radius:18px; padding:24px; background:#fff;"><span style="display:grid; place-items:center; width:48px; height:48px; border-radius:13px; background:var(--accent-soft); font-size:23px;">${ic}</span><h3 style="font-family:'Poppins'; font-weight:700; font-size:17px; color:#16161C; margin:16px 0 8px;">${t}</h3><p style="font-size:14px; color:#63636F; line-height:1.6; margin:0;">${d}</p></div>`).join('')}
    </div>
  </section>
${teacherSection(p)}`,
    contentSections(p),
    faqSection(p),
    rel.length ? `  <section style="max-width:1200px; margin:56px auto 0; padding:0 28px;">
    <h2 style="font-family:'Poppins'; font-weight:700; font-size:clamp(24px,3vw,32px); color:#14141C; letter-spacing:-.02em; margin:0 0 26px;">${isCountry ? 'Digər ölkələr' : 'Digər istiqamətlər'}</h2>
    ${boxGrid(rel.map((r) => ({ label: r.label, slug: r.slug })))}
  </section>` : '',
    ctaBand(), footer(),
    '\n</div>\n<script src="js/main.js" defer></script>\n</body>\n</html>',
  ].join('\n');
}

/* ---- Filiallar səhifəsi ---- */
function branchesPage(p) {
  const cards = BRANCHES.map((b, i) => {
    const cc = ['#2E6BE6', '#12B5A5', '#7C4DFF', '#E0533D'][i % 4];
    return `<div class="ba-course ba-reveal" style="border:1px solid #ECEDF2; border-radius:20px; padding:26px; background:#fff; --accent:${cc}; --accent-soft:${cc}1f;">
        <div style="display:flex; align-items:center; gap:13px;">
          <span style="width:48px; height:48px; border-radius:13px; background:var(--accent-soft); color:var(--accent); display:grid; place-items:center; font-size:22px; flex:none;">📍</span>
          <h3 style="font-family:'Poppins'; font-weight:700; font-size:19px; color:#16161C; margin:0;">${esc(b.name)}</h3>
        </div>
        <div style="margin-top:18px; display:flex; flex-direction:column; gap:10px; font-size:14.5px; color:#54545F;">
          <div>📍 ${esc(b.address)}</div>
          <div>🚇 ${esc(b.metro)}</div>
          <div>🕐 ${esc(b.hours)}</div>
          <div>☎ ${esc(b.phone)}</div>
        </div>
        <div style="display:flex; gap:10px; margin-top:20px;">
          <a href="https://wa.me/${b.wa}" target="_blank" rel="noopener" style="flex:1; display:inline-flex; align-items:center; justify-content:center; gap:7px; background:#25D366; color:#fff; font-weight:700; font-size:14px; padding:12px; border-radius:12px;">WhatsApp</a>
          <a href="tel:+${b.wa}" style="flex:1; text-align:center; background:var(--accent); color:#fff; font-weight:700; font-size:14px; padding:12px; border-radius:12px;">Zəng et</a>
        </div>
      </div>`;
  }).join('\n      ');
  return [
    head(p), '\n<body>\n<div style="min-height:100vh; overflow-x:hidden; background:#fff;">\n',
    header(), searchOverlay(), applyModal(),
    hero(p, 'British Academy', p.lead),
    `  <section style="max-width:1200px; margin:60px auto 0; padding:0 28px;">
    <div class="grid-2 ba-sg" style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
      ${cards}
    </div>
    <div class="img-slot" style="min-height:340px; border-radius:22px; margin-top:24px;"><span>Xəritə buraya əlavə olunacaq<br>(Google Maps — bütün filiallar)</span></div>
  </section>`,
    ctaBand(), footer(),
    '\n</div>\n<script src="js/main.js" defer></script>\n</body>\n</html>',
  ].join('\n');
}

/* ---- Sadə səhifə (Taqaüd) ---- */
function simplePage(p) {
  return [
    head(p), '\n<body>\n<div style="min-height:100vh; overflow-x:hidden; background:#fff;">\n',
    header(), searchOverlay(), applyModal(),
    hero(p, 'British Academy', p.lead),
    `  <section style="max-width:900px; margin:60px auto 0; padding:0 28px;">
    <p style="font-size:17.5px; line-height:1.85; color:#33333D;">${esc(p.lead)}</p>
    <p style="font-size:16.5px; line-height:1.85; color:#4a4a55;">Bu səhifənin təfərrüatlı məzmunu tezliklə əlavə olunacaq. Ətraflı məlumat üçün bizimlə əlaqə saxla.</p>
  </section>`,
    ctaBand(), footer(),
    '\n</div>\n<script src="js/main.js" defer></script>\n</body>\n</html>',
  ].join('\n');
}

/* ============================================================
   Tələbələrimiz — video rəylər + şərh divarı (mock data)
   Real profil şəkli: assets/students/<ad-soyad>.jpg  (yoxdursa hərf qalır)
   ============================================================ */
const VIDEO_REVIEWS = [
  { n: 'Aysel Məmmədova', c: 'IELTS Hazırlıq · 7.5 bal', d: 25 },
  { n: 'Rəşad Quliyev', c: 'Biznes İngilis dili', d: 58 },
  { n: 'Nigar Əhmədzadə', c: 'İngilis dili · C1', d: 53 },
  { n: 'Bülbül İsmayılova', c: 'Xaricdə təhsil · Almaniya', d: 47 },
];

const TEXT_REVIEWS = [
  { n: 'Leyla Hüseynova', c: 'İngilis dili · B2', r: 5, col: '#2E6BE6', t: 'Sıfırdan başladım, dörd ayda B2 səviyyəsinə çatdım. Ən çox xoşuma gələn danışıq klublarıdır — dərsdə öyrəndiyini elə həmin həftə real söhbətdə işlədirsən.' },
  { n: 'Elvin Səfərov', c: 'IELTS · 7.0 bal', r: 5, col: '#7C4DFF', t: 'İkinci cəhdimdə 7.0 aldım. Müəllim hər həftə yazı tapşırıqlarımı ayrıca yoxlayır, səhvlərimi bir-bir izah edirdi.' },
  { n: 'Günel Rzayeva', c: 'Uşaqlar üçün İngilis', r: 5, col: '#FF3D8B', t: 'Oğlum 8 yaşındadır, dərsə həvəslə gedir. Oyunlarla keçdikləri üçün onun üçün bu, dərs yox, əyləncədir.' },
  { n: 'Tural Abbasov', c: 'Biznes İngilis dili', r: 5, col: '#F5A524', t: 'Xarici tərəfdaşlarla görüşlərdə özümü rahat hiss edirəm. Təqdimat hazırlamağı və işgüzar yazışmanı ayrıca öyrətdilər.' },
  { n: 'Aynur Kərimli', c: 'Alman dili · A2', r: 5, col: '#12B5A5', t: 'Almaniyada təhsil üçün hazırlaşıram. Qrup kiçik olduğuna görə müəllim hər kəsə ayrıca vaxt ayıra bilir.' },
  { n: 'Kamran Əliyev', c: 'Peşəkar Excel kursu', r: 4, col: '#0EA5E9', t: 'İş yerimdə hesabatları üç dəfə tez hazırlayıram. Praktik nümunələr üzərində işlədik, quru nəzəriyyə yox idi.' },
  { n: 'Səbinə Nəbiyeva', c: 'Rus dili kursu', r: 5, col: '#E0533D', t: 'Uzun illər dili anlayırdım, amma danışa bilmirdim. Buradakı danışıq blokları məni bu kompleksdən qurtardı.' },
  { n: 'Orxan Məmmədli', c: 'TOEFL hazırlıq', r: 5, col: '#22B07D', t: 'Sınaq imtahanları real imtahandan fərqlənmirdi, ona görə imtahan günü ümumiyyətlə həyəcanlanmadım.' },
  { n: 'Fidan Qasımova', c: 'İtalyan dili kursu', r: 5, col: '#B45CF0', t: 'Onlayn qoşulurdum, amma qrupla əlaqəm heç kəsilmirdi. Müəllim ekran arxasından da hamını danışdırırdı.' },
];

const avatar = (name, color, size) => {
  const file = norm(name).replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
  return `<span class="ba-av" style="--c:${color}; width:${size}px; height:${size}px; font-size:${Math.round(size * 0.4)}px;">`
    + `<img src="assets/students/${file}.jpg" alt="" loading="lazy" onerror="this.remove()">`
    + `<span>${esc(name.trim().charAt(0))}</span></span>`;
};

const stars = (n) => `<span class="ba-stars" aria-label="${n} ulduz">`
  + '★'.repeat(n) + `<span style="opacity:.25;">${'★'.repeat(5 - n)}</span></span>`;

function videoReviewCard(v) {
  const mm = String(Math.floor(v.d / 60)).padStart(2, '0'), ss = String(v.d % 60).padStart(2, '0');
  return `<div class="ba-vcard" data-video data-dur="${v.d}" data-frac="0" data-playing="0" style="position:relative; aspect-ratio:3/4; border-radius:20px; overflow:hidden; background:#0F1020;">
        <div class="img-slot" style="position:absolute; inset:0; width:100%; height:100%;"><span>Məzun videosu</span></div>
        <div style="position:absolute; inset:0; background:linear-gradient(to bottom, rgba(0,0,0,.42), transparent 26%, transparent 52%, rgba(0,0,0,.82)); pointer-events:none;"></div>
        <div style="position:absolute; top:12px; left:12px; right:12px;">
          <span style="display:inline-block; background:rgba(0,0,0,.55); color:#fff; font-size:12.5px; font-weight:600; padding:5px 10px; border-radius:8px; backdrop-filter:blur(4px);">${esc(v.n)}</span>
          <span style="display:block; margin-top:6px; font-size:11.5px; font-weight:700; color:#fff; background:var(--accent); padding:4px 9px; border-radius:7px; width:fit-content;">${esc(v.c)}</span>
        </div>
        <button class="v-play ba-vplay" aria-label="Oynat" style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:64px; height:64px; border-radius:20px; background:var(--accent); border:none; cursor:pointer; display:grid; place-items:center; box-shadow:0 12px 28px rgba(0,0,0,.45); transition:opacity .25s, transform .2s;">
          <svg class="v-ic-play" width="24" height="24" viewBox="0 0 24 24" style="fill:#fff; margin-left:2px;"><path d="M8 5.14v13.72a1 1 0 0 0 1.53.85l10.79-6.86a1 1 0 0 0 0-1.7L9.53 4.29A1 1 0 0 0 8 5.14z"></path></svg>
          <svg class="v-ic-pause" width="22" height="22" viewBox="0 0 24 24" style="fill:#fff; display:none;"><rect x="6" y="4.5" width="4.5" height="15" rx="1.6"></rect><rect x="13.5" y="4.5" width="4.5" height="15" rx="1.6"></rect></svg>
        </button>
        <div style="position:absolute; left:12px; right:12px; bottom:12px; display:flex; align-items:center; gap:10px;">
          <button class="v-mini ba-vmini" aria-label="Oynat / Dayandır" style="width:26px; height:26px; border:none; border-radius:50%; background:rgba(255,255,255,.92); cursor:pointer; display:grid; place-items:center; flex:none;">
            <svg class="v-ic-play" width="14" height="14" viewBox="0 0 24 24" fill="#14141C" style="margin-left:2px;"><path d="M7 4.5v15l13-7.5z"></path></svg>
            <svg class="v-ic-pause" width="13" height="13" viewBox="0 0 24 24" fill="#14141C" style="display:none;"><rect x="6" y="4.5" width="4.5" height="15" rx="1.4"></rect><rect x="13.5" y="4.5" width="4.5" height="15" rx="1.4"></rect></svg>
          </button>
          <div class="v-track ba-vtrack" style="flex:1; height:5px; border-radius:99px; background:rgba(255,255,255,.32); overflow:hidden;"><div class="v-fill ba-vfill" style="height:100%; width:0%; background:var(--accent); border-radius:99px;"></div></div>
          <span class="v-time ba-vtime" style="color:#fff; font-size:12px; font-weight:600; white-space:nowrap;">${mm}:${ss}</span>
        </div>
      </div>`;
}

function studentsPage(p) {
  const statBox = (num, label) => `<div style="text-align:center;">
        <div style="font-family:'Poppins'; font-weight:800; font-size:clamp(30px,4vw,44px); color:var(--accent); letter-spacing:-.02em;">${num}</div>
        <div style="font-size:14.5px; color:#63636F; margin-top:4px;">${label}</div>
      </div>`;

  const wall = TEXT_REVIEWS.map((t) => `<figure class="ba-review" style="--c:${t.col};">
        <span class="ba-review-quote" aria-hidden="true">”</span>
        ${stars(t.r)}
        <blockquote style="margin:12px 0 0; font-size:15.5px; line-height:1.75; color:#3c3c47;">${esc(t.t)}</blockquote>
        <figcaption style="display:flex; align-items:center; gap:12px; margin-top:18px; padding-top:16px; border-top:1px solid #EFF0F5;">
          ${avatar(t.n, t.col, 46)}
          <span>
            <span style="display:block; font-family:'Poppins'; font-weight:700; font-size:15px; color:#16161C;">${esc(t.n)}</span>
            <span style="display:block; font-size:13px; color:var(--c); font-weight:600; margin-top:2px;">${esc(t.c)}</span>
          </span>
        </figcaption>
      </figure>`).join('\n      ');

  return [
    head(p), '\n<body>\n<div style="min-height:100vh; overflow-x:hidden; background:#fff;">\n',
    header(), searchOverlay(), applyModal(),
    hero(p, 'British Academy', p.lead),
    `  <section style="max-width:1200px; margin:52px auto 0; padding:0 28px;">
    <div class="grid-4" style="display:grid; grid-template-columns:repeat(4,1fr); gap:18px; border:1px solid #ECEDF2; border-radius:22px; padding:30px 24px; background:linear-gradient(150deg,#FAFBFF,#FFF6F2);">
      ${statBox('20 000+', 'məzun tələbə')}
      ${statBox('4.9', 'orta qiymətləndirmə')}
      ${statBox('96%', 'dostuna tövsiyə edir')}
      ${statBox('11 il', 'təhsil təcrübəsi')}
    </div>
  </section>
  <section class="ba-reveal" style="max-width:1200px; margin:64px auto 0; padding:0 28px;">
    <h2 style="font-family:'Poppins'; font-weight:700; font-size:clamp(24px,3vw,34px); color:#14141C; letter-spacing:-.02em; margin:0 0 8px;">Onlar danışır</h2>
    <p style="font-size:15.5px; color:#63636F; margin:0 0 26px;">Məzunlarımız təcrübələrini öz sözləri ilə paylaşır.</p>
    <div class="grid-4 ba-sg" style="display:grid; grid-template-columns:repeat(4,1fr); gap:18px;">
      ${VIDEO_REVIEWS.map(videoReviewCard).join('\n      ')}
    </div>
  </section>
  <section class="ba-reveal" style="max-width:1200px; margin:70px auto 0; padding:0 28px;">
    <h2 style="font-family:'Poppins'; font-weight:700; font-size:clamp(24px,3vw,34px); color:#14141C; letter-spacing:-.02em; margin:0 0 8px;">Tələbə rəyləri</h2>
    <p style="font-size:15.5px; color:#63636F; margin:0 0 26px;">Kurs sonunda topladığımız real geri bildirimlər.</p>
    <div class="ba-wall">
      ${wall}
    </div>
  </section>`,
    ctaBand(), footer(),
    '\n</div>\n<script src="js/main.js" defer></script>\n</body>\n</html>',
  ].join('\n');
}

/* ---- Əlaqə səhifəsi ---- */
function contactPage(p) {
  const cards = [
    ['📍', 'Ünvan', ORG.address + ', ' + ORG.city],
    ['☎', 'Telefon', '(+994) 55 212 41 51<br>(+994 12) 497 62 97'],
    ['✉', 'E-poçt', ORG.email],
    ['🕐', 'İş saatları', ORG.hours],
  ];
  return [
    head(p), '\n<body>\n<div style="min-height:100vh; overflow-x:hidden; background:#fff;">\n',
    header(), searchOverlay(), applyModal(),
    hero(p, 'British Academy', p.lead),
    `  <section style="max-width:1200px; margin:60px auto 0; padding:0 28px;">
    <div class="grid-4" style="display:grid; grid-template-columns:repeat(4,1fr); gap:18px;">
      ${cards.map(([ic, t, v]) => `<div style="border:1px solid #ECEDF2; border-radius:18px; padding:24px; background:#fff;"><span style="display:grid; place-items:center; width:48px; height:48px; border-radius:13px; background:var(--accent-soft); font-size:22px;">${ic}</span><h3 style="font-family:'Poppins'; font-weight:700; font-size:16px; color:#16161C; margin:16px 0 8px;">${t}</h3><p style="font-size:14.5px; color:#63636F; line-height:1.6; margin:0;">${v}</p></div>`).join('')}
    </div>
    <div class="split" style="display:grid; grid-template-columns:1fr 1fr; gap:28px; margin-top:32px; align-items:stretch;">
      <div class="img-slot" style="min-height:340px; border-radius:22px;"><span>Xəritə buraya əlavə olunacaq<br>(Google Maps embed)</span></div>
      <form id="ba-contact-form" style="border:1px solid #ECEDF2; border-radius:22px; padding:30px; background:#FAFBFF; display:flex; flex-direction:column; gap:14px;">
        <h2 style="font-family:'Poppins'; font-weight:700; font-size:24px; color:#14141C; margin:0 0 6px;">Bizə yaz</h2>
        <input class="ba-field" required placeholder="Ad Soyad" style="border:1.5px solid #E4E6EF; border-radius:13px; padding:14px 16px; font-size:15px; font-family:inherit; outline:none; color:#14141C;">
        <input class="ba-field" required placeholder="Telefon" style="border:1.5px solid #E4E6EF; border-radius:13px; padding:14px 16px; font-size:15px; font-family:inherit; outline:none; color:#14141C;">
        <input class="ba-field" type="email" placeholder="E-poçt" style="border:1.5px solid #E4E6EF; border-radius:13px; padding:14px 16px; font-size:15px; font-family:inherit; outline:none; color:#14141C;">
        <textarea class="ba-field" rows="4" placeholder="Mesajın" style="border:1.5px solid #E4E6EF; border-radius:13px; padding:14px 16px; font-size:15px; font-family:inherit; outline:none; color:#14141C; resize:vertical;"></textarea>
        <button type="submit" class="ba-apply-btn" style="background:var(--accent); color:#fff; border:none; font-weight:700; font-size:16px; padding:15px; border-radius:13px; cursor:pointer; font-family:inherit; transition:.2s;">Göndər</button>
      </form>
    </div>
  </section>`,
    footer(),
    '\n</div>\n<script src="js/main.js" defer></script>\n</body>\n</html>',
  ].join('\n');
}

/* ============================================================
   Səhifə reyestrini MENU-dan qur
   ============================================================ */
const pages = [];
function push(p) {
  // müştəri mətni varsa, meta description onu əks etdirsin (boilerplate yox)
  const C = COURSE_CONTENT[p.slug];
  if (C && C.lead) p.desc = `${p.h1} — ${C.lead}`.slice(0, 300);
  p.title = p.title || `${p.h1} — British Academy`;
  pages.push(p);
}

for (const top of MENU) {
  if (top.exists) continue; // haqqimizda.html / muellimler.html mövcuddur
  if (top.students) {
    push({
      slug: top.slug, kind: 'students', mascot: 'wave', h1: 'Tələbələrimiz',
      desc: 'British Academy məzunlarının rəyləri — video təcrübələr, qiymətləndirmələr və real geri bildirimlər.',
      lead: 'Məzunlarımız British Academy təcrübəsini öz sözləri ilə danışır.',
      parent: { label: 'Ana səhifə', slug: 'index.html' },
    });
    continue;
  }
  if (top.branches) {
    push({ slug: top.slug, kind: 'branches', mascot: 'point', h1: 'Filiallar', desc: 'British Academy filialları — ünvanlar, telefon, iş saatları və WhatsApp. Özünə ən yaxın filialı seç.', lead: 'British Academy-nin Bakıdakı filialları — özünə ən yaxın filialı seç və birbaşa əlaqə saxla.', parent: { label: 'Ana səhifə', slug: 'index.html' } });
    continue;
  }
  if (top.mega) {
    push({ slug: top.slug, kind: 'hub', h1: top.label, desc: hubDesc(top.label), lead: 'British Academy xidmətləri — dil kurslarından beynəlxalq imtahanlara, kompüter və karyera proqramlarına qədər.', parent: { label: 'Ana səhifə', slug: 'index.html' }, boxes: top.mega.map((g) => ({ label: g.label, slug: g.slug, blurb: 'Alt-istiqamətlərə bax' })) });
    for (const g of top.mega) {
      push({ slug: g.slug, kind: 'hub', special: g.special || null, items: g.items, h1: g.label, desc: hubDesc(g.label), lead: `${g.label} üzrə bütün proqramlar və qeydiyyat.`, parent: { label: top.label, slug: top.slug }, boxes: g.items.map((it) => ({ label: it.label, slug: it.slug })) });
      for (const it of g.items) {
        push({ slug: it.slug, kind: 'course', h1: it.label, desc: courseDesc(it.label), lead: `${it.label} — British Academy-nin təcrübəli müəllimləri ilə.`, parent: { label: g.label, slug: g.slug }, grand: { label: top.label, slug: top.slug }, siblings: g.items });
      }
    }
  } else if (top.dd) {
    const isCountryHub = top.slug === 'xaricde-tehsil.html';
    const hubMascot = isCountryHub ? 'flag' : (top.slug === 'usaq-proqramlari.html' ? 'wave' : null);
    push({ slug: top.slug, kind: 'hub', mascot: hubMascot, h1: top.label, desc: hubDesc(top.label), lead: `${top.label} — bütün istiqamətlər bir səhifədə.`, parent: { label: 'Ana səhifə', slug: 'index.html' }, boxes: top.dd.map((it) => ({ label: it.label, slug: it.slug })) });
    for (const it of top.dd) {
      push({ slug: it.slug, kind: isCountryHub ? 'country' : 'course', h1: it.label, desc: isCountryHub ? countryDesc(it.label) : courseDesc(it.label), lead: isCountryHub ? `${it.label}-də təhsil almaq üçün British Academy dəstəyi.` : `${it.label} — British Academy proqramı.`, parent: { label: top.label, slug: top.slug }, siblings: top.dd });
    }
  } else if (top.slug === 'elaqe.html') {
    push({ slug: top.slug, kind: 'contact', h1: 'Əlaqə', desc: 'British Academy ilə əlaqə — ünvan, telefon, e-poçt və iş saatları. Sualların üçün bizə yaz.', lead: 'Sualların var? Bizimlə əlaqə saxla — komandamız kömək etməyə hazırdır.', parent: { label: 'Ana səhifə', slug: 'index.html' } });
  } else {
    push({ slug: top.slug, kind: 'simple', h1: top.label, desc: hubDesc(top.label), lead: 'British Academy təqaüd və maliyyə dəstəyi proqramları haqqında məlumat.', parent: { label: 'Ana səhifə', slug: 'index.html' } });
  }
}

/* ============================================================
   Səhifələri yaz
   ============================================================ */
let written = 0;
for (const p of pages) {
  let html;
  if (p.kind === 'hub') html = hubPage(p);
  else if (p.kind === 'contact') html = contactPage(p);
  else if (p.kind === 'simple') html = simplePage(p);
  else if (p.kind === 'branches') html = branchesPage(p);
  else if (p.kind === 'students') html = studentsPage(p);
  else html = leafPage(p);
  writeFileSync(join(ROOT, p.slug), html, 'utf8');
  written++;
}

/* ============================================================
   sitemap.xml + robots.txt
   ============================================================ */
const allSlugs = ['index.html', 'haqqimizda.html', 'muellimler.html', 'muellim.html', 'bloq.html', 'blogyazi.html', ...pages.map((p) => p.slug)];
const uniqueSlugs = [...new Set(allSlugs)];
const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueSlugs.map((s) => {
  const priority = s === 'index.html' ? '1.0' : (MENU.some((m) => m.slug === s) ? '0.8' : '0.6');
  return `  <url>\n    <loc>${url(s)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}).join('\n')}
</urlset>
`;
writeFileSync(join(ROOT, 'sitemap.xml'), sitemap, 'utf8');

const robots = `# British Academy — robots.txt
User-agent: *
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
`;
writeFileSync(join(ROOT, 'robots.txt'), robots, 'utf8');

/* ============================================================
   Mövcud səhifələri patch et (nav + SEO)
   ============================================================ */
const EXISTING = {
  'index.html': { canonicalSlug: 'index.html' },
  'haqqimizda.html': { canonicalSlug: 'haqqimizda.html' },
  'muellimler.html': { canonicalSlug: 'muellimler.html' },
  'muellim.html': { canonicalSlug: 'muellim.html' },
  'bloq.html': { canonicalSlug: 'bloq.html' },
  'blogyazi.html': { canonicalSlug: 'blogyazi.html' },
};

function seoBlock(file, slug) {
  const src = readFileSync(join(ROOT, file), 'utf8');
  const title = (src.match(/<title>([\s\S]*?)<\/title>/) || [, 'British Academy'])[1].trim();
  const descM = src.match(/<meta name="description" content="([\s\S]*?)">/);
  const desc = descM ? descM[1] : '';
  const u = url(slug);
  const org = {
    '@context': 'https://schema.org', '@type': 'EducationalOrganization', name: ORG.name, url: ORIGIN + '/',
    logo: ORIGIN + '/assets/logo.png', address: { '@type': 'PostalAddress', streetAddress: ORG.address, addressLocality: ORG.city, addressCountry: 'AZ' },
    telephone: ORG.phone, email: ORG.email, sameAs: [ORG.instagram, ORG.facebook, ORG.youtube],
  };
  return `<link rel="canonical" href="${u}">
<meta name="robots" content="index, follow">
<meta property="og:type" content="website">
<meta property="og:site_name" content="British Academy">
<meta property="og:locale" content="az_AZ">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${u}">
<meta property="og:image" content="${ORIGIN}/assets/og-cover.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${ORIGIN}/assets/og-cover.png">
<script type="application/ld+json">${JSON.stringify(org)}</script>`;
}

let patched = 0;
for (const [file, cfg] of Object.entries(EXISTING)) {
  let src = readFileSync(join(ROOT, file), 'utf8');

  // 1) SEO: inject before </head> if not already present
  if (!/rel="canonical"/.test(src)) {
    src = src.replace('</head>', seoBlock(file, cfg.canonicalSlug) + '\n</head>');
  }

  // 1b) no-JS fallback (idempotent: köhnə bloku yeniləyir, yoxdursa əlavə edir)
  if (/<noscript>[\s\S]*?<\/noscript>/.test(src)) {
    src = src.replace(/<noscript>[\s\S]*?<\/noscript>/, NOJS);
  } else {
    src = src.replace('</head>', NOJS + '\n</head>');
  }

  // 1c) Logo: swap the "B" letter placeholders for the real logo (header + footer)
  if (!src.includes('assets/logo.png')) {
    src = src.replace(
      /<a href="index\.html"[^>]*>\s*<span style="width:42px;[^>]*>B<\/span>[\s\S]*?<\/a>/,
      `<a href="index.html" aria-label="British Academy — ana səhifə" style="display:flex; align-items:center; flex:none;"><img src="assets/logo.png" alt="British Academy" width="553" height="110" style="height:46px; width:auto; display:block;"></a>`
    );
  }
  if (!src.includes('assets/logo-stack.png')) {
    src = src.replace(
      /<a href="index\.html"[^>]*>\s*<span style="width:40px;[^>]*>B<\/span>[\s\S]*?<\/a>/,
      `<a href="index.html" aria-label="British Academy" style="display:inline-block; background:#fff; border-radius:12px; padding:10px 14px;"><img src="assets/logo-stack.png" alt="British Academy — Education For Your Future" width="377" height="200" loading="lazy" style="height:56px; width:auto; display:block;"></a>`
    );
  }

  // 2) Nav: replace the mega-menu block (idempotent via markers), else the original <nav>
  const marked = /<!--BA-NAV-->[\s\S]*?<!--\/BA-NAV-->/;
  if (marked.test(src)) {
    src = src.replace(marked, navBlock());
  } else {
    src = src.replace(/<nav class="ba-nav"[\s\S]*?<\/nav>/, navBlock());
  }

  writeFileSync(join(ROOT, file), src, 'utf8');
  patched++;
}

console.log(`✓ ${written} yeni səhifə yazıldı`);
console.log(`✓ ${patched} mövcud səhifə patch olundu`);
console.log(`✓ sitemap.xml (${uniqueSlugs.length} URL) + robots.txt yazıldı`);
