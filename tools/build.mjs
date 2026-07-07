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
  { label: 'Haqqımızda', slug: 'haqqimizda.html', exists: true },

  { label: 'Uşaq Proqramları', slug: 'usaq-proqramlari.html', dd: [
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

  { label: 'Taqaüd Proqramları', slug: 'taqaud-proqramlari.html', hidden: true },
  { label: 'Əlaqə', slug: 'elaqe.html' },
];

/* ============================================================
   Köməkçilər
   ============================================================ */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

const courseDesc = (l) => `British Academy-də ${l}: təcrübəli müəllimlər, müasir metodika və beynəlxalq standartlara uyğun proqram. Ətraflı məlumat, cədvəl və qeydiyyat üçün əlaqə saxla.`;
const hubDesc = (l) => `${l} — British Academy. Bütün istiqamətlər, proqram detalları və onlayn qeydiyyat bir səhifədə.`;
const countryDesc = (l) => `${l}-də təhsil — British Academy xaricdə təhsil dəstəyi: universitetlər, sənədlər, viza və qəbul prosesi haqqında məlumat.`;

/* ============================================================
   SEO baş hissə
   ============================================================ */
function jsonLd(p) {
  const org = {
    '@context': 'https://schema.org', '@type': 'EducationalOrganization',
    name: ORG.name, url: ORIGIN + '/', logo: ORIGIN + '/og-cover.jpg',
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
<meta property="og:image" content="${ORIGIN}/og-cover.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.title)}">
<meta name="twitter:description" content="${esc(p.desc)}">
<meta name="twitter:image" content="${ORIGIN}/og-cover.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css">
<noscript><style>#ba-loader{display:none!important}.ba-reveal{opacity:1!important;transform:none!important}</style></noscript>
${jsonLd(p)}
</head>`;
}

/* ============================================================
   Paylaşılan bloklar: nav, header, mobil menyu, footer, modal
   ============================================================ */
const CARET = '<svg class="ba-caret" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>';

function navBlock() {
  // hidden: true → səhifə yaradılır, amma menyuda görünmür
  const NAV = MENU.filter((t) => !t.hidden);
  const items = NAV.map((top) => {
    if (top.mega) {
      const cols = top.mega.map((g) =>
        `<div class="ba-mega-col"><a class="ba-mega-title" href="${g.slug}">${esc(g.label)}</a>` +
        `<div class="ba-mega-links">${g.items.map((it) => `<a href="${it.slug}">${esc(it.label)}</a>`).join('')}</div></div>`
      ).join('');
      return `<div class="ba-nav-item has-mega"><a href="${top.slug}">${esc(top.label)} ${CARET}</a>` +
        `<div class="ba-mega"><div class="ba-mega-inner">${cols}</div></div></div>`;
    }
    if (top.dd) {
      const cls = 'ba-dd' + (top.align === 'right' ? ' ba-dd--right' : '') + (top.cols === 2 ? ' ba-dd--2col' : '');
      const links = top.dd.map((it) => `<a href="${it.slug}">${esc(it.label)}</a>`).join('');
      return `<div class="ba-nav-item"><a href="${top.slug}">${esc(top.label)} ${CARET}</a><div class="${cls}">${links}</div></div>`;
    }
    return `<div class="ba-nav-item"><a href="${top.slug}">${esc(top.label)}</a></div>`;
  }).join('\n          ');

  const mobile = NAV.map((top) => {
    let kids = null;
    if (top.dd) kids = top.dd;
    else if (top.mega) kids = top.mega.flatMap((g) => [{ label: g.label, slug: g.slug, head: true }, ...g.items]);
    if (!kids) return `<a class="ba-mrow" href="${top.slug}">${esc(top.label)}</a>`;
    return `<details class="ba-macc"><summary>${esc(top.label)}</summary><div class="ba-macc-body">` +
      `<a class="ba-msub ba-msub--all" href="${top.slug}">${esc(top.label)} — hamısı</a>` +
      kids.map((k) => `<a class="ba-msub${k.head ? ' ba-msub--head' : ''}" href="${k.slug}">${esc(k.label)}</a>`).join('') +
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
        <a href="index.html" style="display:flex; align-items:center; gap:12px; flex:none;">
          <span style="width:42px; height:42px; border-radius:11px; background:var(--accent); color:#fff; display:grid; place-items:center; font-family:'Space Grotesk'; font-weight:800; font-size:20px;">B</span>
          <span style="font-family:'Space Grotesk'; font-weight:700; font-size:20px; letter-spacing:-.01em; color:#14141C;">British Academy</span>
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
        <span style="font-family:'Space Grotesk'; font-weight:800; font-size:22px; color:#14141C;">Axtarış</span>
        <button data-close-search style="display:flex; align-items:center; gap:8px; background:#F1F2F6; border:1px solid #E7E8EE; color:#4C4C58; font-weight:600; font-size:14px; padding:9px 16px; border-radius:99px; cursor:pointer; font-family:inherit;">Bağla ✕</button>
      </div>
      <div style="display:flex; align-items:center; gap:12px; border:2px solid var(--accent); border-radius:16px; padding:15px 18px; background:#fff;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" style="color:var(--accent); flex:none;"><circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path></svg>
        <input id="ba-search-input" placeholder="Kurs, proqram və ya ölkə axtar..." autocomplete="off" style="border:none; outline:none; font-size:19px; width:100%; background:transparent; color:#14141C; font-family:inherit;">
      </div>
      <div id="ba-search-results" style="margin-top:20px; display:flex; flex-direction:column; gap:10px;"></div>
      <div id="ba-search-empty" style="display:none; text-align:center; color:#9A9AA6; padding:34px; font-size:16px;">Nəticə tapılmadı</div>
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
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="width:46px; height:46px; border-radius:13px; background:rgba(255,255,255,.2); color:#fff; display:grid; place-items:center; font-family:'Space Grotesk'; font-weight:700; font-size:23px;">B</span>
          <span style="font-family:'Space Grotesk'; font-weight:700; font-size:18px; color:#fff;">British Academy</span>
        </div>
        <h3 style="font-family:'Space Grotesk'; font-weight:700; font-size:30px; margin:22px 0 0; color:#fff; letter-spacing:-.015em;">Müraciət et</h3>
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
    <div style="position:absolute; top:0; left:50%; transform:translate(-50%,-50%); z-index:5; width:104px; height:104px; border-radius:50%; background:var(--accent); border:7px solid #0C0D1A; display:grid; place-items:center; box-shadow:0 14px 36px rgba(0,0,0,.45);"><span style="font-family:'Space Grotesk'; font-weight:700; font-size:44px; color:#fff; line-height:1;">B</span></div>
    <div class="footer-grid" style="position:relative; z-index:2; max-width:1240px; margin:0 auto; padding:64px 28px 20px; display:grid; grid-template-columns:1.7fr 1fr 1fr 1fr; gap:36px;">
      <div>
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="width:42px; height:42px; border-radius:11px; background:var(--accent); color:#fff; display:grid; place-items:center; font-family:'Space Grotesk'; font-weight:800; font-size:19px;">B</span>
          <span style="font-family:'Space Grotesk'; font-weight:800; font-size:19px; color:#fff;">British Academy</span>
        </div>
        <p style="font-size:14.5px; line-height:1.65; margin:20px 0 0; max-width:330px; color:#9A9BB0;">English UK akkreditasiyasından keçmiş yeganə Azərbaycan şirkəti. 2014-cü ildən keyfiyyətli dil təhsili və xaricdə təhsil.</p>
        <div style="font-size:14px; color:#8788A0; margin-top:20px; line-height:1.75;">${ORG.address}<br>(+994 12) 497 62 97 · (+994) 55 212 41 51<br>${ORG.email}</div>
      </div>
      ${col('Kurslar', [['Dil Kursları', 'dil-kurslari.html'], ['Beynəlxalq imtahanlar', 'beynelxalq-imtahanlar.html'], ['Uşaq Proqramları', 'usaq-proqramlari.html'], ['Kompüter Kursu', 'komputer-kursu.html'], ['Karyera kursları', 'karyera-kurslari.html']])}
      ${col('Akademiya', [['Haqqımızda', 'haqqimizda.html'], ['Xaricdə təhsil', 'xaricde-tehsil.html'], ['Taqaüd Proqramları', 'taqaud-proqramlari.html'], ['Müəllimlər', 'muellimler.html'], ['Bloq', 'bloq.html']])}
      ${col('Əlaqə', [['Instagram', ORG.instagram], ['Facebook', ORG.facebook], ['YouTube', ORG.youtube], ['Əlaqə', 'elaqe.html'], ['WhatsApp', ORG.whatsapp]])}
    </div>
    <div style="position:relative; z-index:2; border-top:1px solid rgba(255,255,255,.1); margin-top:24px;">
      <div style="max-width:1240px; margin:0 auto; padding:22px 28px; display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap; font-size:13px; color:#7B7C94;">
        <span>© 2014–2026 British Academy. Bütün hüquqlar qorunur.</span>
        <span>English UK · Cambridge · British Council · Duolingo · TOEFL</span>
      </div>
    </div>
    <div style="position:relative; z-index:1; line-height:.74; text-align:center; margin-top:4px; overflow:hidden;"><div style="font-family:'Space Grotesk'; font-weight:800; font-size:clamp(40px,9.5vw,124px); color:var(--accent-wm); letter-spacing:-.03em; white-space:nowrap; transform:translateY(12%);">British Academy</div></div>
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

function hero(p, eyebrow, lead) {
  return `  <section style="position:relative; background:var(--accent); overflow:hidden;">
    <div style="position:absolute; top:-90px; right:6%; width:340px; height:340px; border-radius:50%; background:rgba(255,255,255,.13); filter:blur(22px); pointer-events:none;"></div>
    <div style="position:absolute; inset:0; background-image:radial-gradient(rgba(255,255,255,.14) 1.3px, transparent 1.3px); background-size:24px 24px; -webkit-mask-image:radial-gradient(circle at 70% 30%, transparent 30%, #000 82%); mask-image:radial-gradient(circle at 70% 30%, transparent 30%, #000 82%); pointer-events:none;"></div>
    <div style="position:relative; max-width:1200px; margin:0 auto; padding:30px 28px 60px;">
      ${breadcrumb(p)}
      <span style="display:inline-block; margin-top:22px; font-size:12.5px; color:rgba(255,255,255,.9); font-weight:700; letter-spacing:.14em; text-transform:uppercase;">${esc(eyebrow)}</span>
      <h1 style="font-family:'Space Grotesk'; font-weight:700; font-size:clamp(34px,5vw,54px); letter-spacing:-.025em; margin:14px 0 0; line-height:1.08; color:#fff; max-width:860px;">${esc(p.h1)}</h1>
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
      <div style="position:relative;">
        <h2 style="font-family:'Space Grotesk'; font-weight:700; font-size:clamp(26px,3.4vw,36px); color:#fff; margin:0; letter-spacing:-.02em;">Hazırsan? Elə bu gün başla.</h2>
        <p style="font-size:16px; color:#B9BAD0; margin:14px auto 26px; max-width:520px; line-height:1.6;">Pulsuz səviyyə təyini və məsləhət üçün müraciət et — komandamız səninlə əlaqə saxlayacaq.</p>
        <button data-open-apply class="ba-btn-primary" style="background:var(--accent); color:#fff; border:none; font-weight:700; font-size:16px; padding:15px 30px; border-radius:99px; cursor:pointer; font-family:inherit; transition:.2s;">Müraciət et</button>
      </div>
    </div>
  </section>`;
}

function boxGrid(boxes) {
  return `<div class="grid-3" style="display:grid; grid-template-columns:repeat(3,1fr); gap:20px;">` +
    boxes.map((b) => `<a href="${b.slug}" class="ba-course ba-reveal" style="display:block; border:1px solid #ECEDF2; border-radius:20px; padding:26px; background:#fff; transition:transform .25s ease, box-shadow .25s ease, border-color .25s;">
      <span style="display:grid; place-items:center; width:54px; height:54px; border-radius:15px; background:var(--accent-soft); font-size:26px;">${b.icon || iconFor(b.label)}</span>
      <h3 style="font-family:'Space Grotesk'; font-weight:700; font-size:20px; color:#16161C; margin:18px 0 0; letter-spacing:-.01em;">${esc(b.label)}</h3>
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
        <h3 style="font-family:'Space Grotesk'; font-weight:700; font-size:22px; color:#16161C; margin:18px 0 4px;">${esc(title)}</h3>
        <p style="font-size:14px; color:#8A8A96; margin:0 0 14px;">${esc(sub)}</p>
        <div style="display:flex; flex-direction:column; gap:8px;">${list.map((x) => `<a href="${x.slug}" class="ba-flink" style="color:#3A3A46; font-weight:600; font-size:14.5px; padding:9px 12px; border-radius:10px; background:#F7F8FC;">${esc(x.label)} →</a>`).join('')}</div>
      </div>`;
    const single = (x) => `<a href="${x.slug}" class="ba-course ba-reveal" style="display:block; border:1px solid #ECEDF2; border-radius:22px; padding:28px; background:#fff;">
        <span style="display:grid; place-items:center; width:56px; height:56px; border-radius:15px; background:var(--accent-soft); font-size:28px;">${iconFor(x.label)}</span>
        <h3 style="font-family:'Space Grotesk'; font-weight:700; font-size:20px; color:#16161C; margin:18px 0 0;">${esc(x.label)}</h3>
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
    <h2 style="font-family:'Space Grotesk'; font-weight:700; font-size:clamp(24px,3vw,32px); color:#14141C; letter-spacing:-.02em; margin:0 0 26px;">İstiqamətlər</h2>
    ${body}
  </section>`,
    ctaBand(), footer(),
    '\n</div>\n<script src="js/main.js" defer></script>\n</body>\n</html>',
  ].join('\n');
}

/* ---- Kurs / ölkə (leaf) səhifə ---- */
function leafPage(p) {
  const isCountry = p.kind === 'country';
  const aboutTitle = isCountry ? 'Ölkə haqqında' : 'Kurs haqqında';
  const info = isCountry
    ? [['Təhsil dili', '—'], ['Təhsil haqqı', '—'], ['Viza dəstəyi', 'Var'], ['Müddət', '—']]
    : [['Müddət', '—'], ['Səviyyə', 'A1 – C1'], ['Format', 'Qrup / Fərdi'], ['Cədvəl', 'Həftədə 2–3 dəfə']];
  const feats = isCountry
    ? [['🎓', 'Universitet seçimi', 'Profilinə uyğun universitet və proqram seçimində dəstək.'], ['📄', 'Sənəd hazırlığı', 'Müraciət sənədləri, motivasiya məktubu və tərcümələr.'], ['🛂', 'Viza prosesi', 'Viza sənədləri və müsahibəyə hazırlıq.'], ['🏠', 'Yerləşmə', 'Yaşayış və adaptasiya məsələlərində köməklik.']]
    : [['🎯', 'Məqsədyönlü proqram', 'Sənin səviyyənə və hədəfinə uyğun fərdi tədris planı.'], ['👩‍🏫', 'Təcrübəli müəllimlər', 'Beynəlxalq sertifikatlı, təcrübəli müəllim heyəti.'], ['🗣️', 'Danışıq praktikası', 'Hər dərsdə canlı danışıq və interaktiv tapşırıqlar.'], ['📜', 'Sertifikat', 'Kurs sonunda British Academy sertifikatı.']];
  const rel = (p.siblings || []).filter((s) => s.slug !== p.slug).slice(0, 6);

  return [
    head(p), '\n<body>\n<div style="min-height:100vh; overflow-x:hidden; background:#fff;">\n',
    header(), searchOverlay(), applyModal(),
    hero(p, p.parent ? p.parent.label : 'British Academy', p.lead),
    `  <section style="max-width:1200px; margin:60px auto 0; padding:0 28px;">
    <div class="split" style="display:grid; grid-template-columns:1.6fr 1fr; gap:36px; align-items:start;">
      <div>
        <h2 style="font-family:'Space Grotesk'; font-weight:700; font-size:clamp(24px,3vw,32px); color:#14141C; letter-spacing:-.02em; margin:0 0 16px;">${aboutTitle}</h2>
        <p style="font-size:17px; line-height:1.8; color:#33333D; margin:0 0 18px;">${esc(p.lead)}</p>
        <p style="font-size:16.5px; line-height:1.8; color:#4a4a55; margin:0;">Bu bölmənin təfərrüatlı məzmunu tezliklə əlavə olunacaq. Proqram, qiymət və cədvəl barədə ətraflı məlumat üçün bizimlə əlaqə saxla və ya müraciət et.</p>
      </div>
      <aside style="border:1px solid #ECEDF2; border-radius:20px; padding:26px; background:#FAFBFF;">
        <div style="font-weight:700; font-size:13px; color:#9A9AA6; letter-spacing:.08em; text-transform:uppercase; margin-bottom:16px;">Qısa məlumat</div>
        ${info.map(([k, v]) => `<div style="display:flex; justify-content:space-between; gap:12px; padding:12px 0; border-bottom:1px solid #ECEDF2; font-size:15px;"><span style="color:#63636F;">${esc(k)}</span><span style="color:#16161C; font-weight:600;">${esc(v)}</span></div>`).join('')}
        <button data-open-apply class="ba-btn-primary" style="width:100%; margin-top:20px; background:var(--accent); color:#fff; border:none; font-weight:700; font-size:15px; padding:14px; border-radius:13px; cursor:pointer; font-family:inherit; transition:.2s;">Müraciət et</button>
      </aside>
    </div>
  </section>
  <section style="max-width:1200px; margin:56px auto 0; padding:0 28px;">
    <h2 style="font-family:'Space Grotesk'; font-weight:700; font-size:clamp(24px,3vw,32px); color:#14141C; letter-spacing:-.02em; margin:0 0 26px;">Üstünlüklər</h2>
    <div class="grid-4" style="display:grid; grid-template-columns:repeat(4,1fr); gap:18px;">
      ${feats.map(([ic, t, d]) => `<div class="ba-reveal" style="border:1px solid #ECEDF2; border-radius:18px; padding:24px; background:#fff;"><span style="display:grid; place-items:center; width:48px; height:48px; border-radius:13px; background:var(--accent-soft); font-size:23px;">${ic}</span><h3 style="font-family:'Space Grotesk'; font-weight:700; font-size:17px; color:#16161C; margin:16px 0 8px;">${t}</h3><p style="font-size:14px; color:#63636F; line-height:1.6; margin:0;">${d}</p></div>`).join('')}
    </div>
  </section>`,
    rel.length ? `  <section style="max-width:1200px; margin:56px auto 0; padding:0 28px;">
    <h2 style="font-family:'Space Grotesk'; font-weight:700; font-size:clamp(24px,3vw,32px); color:#14141C; letter-spacing:-.02em; margin:0 0 26px;">${isCountry ? 'Digər ölkələr' : 'Digər istiqamətlər'}</h2>
    ${boxGrid(rel.map((r) => ({ label: r.label, slug: r.slug })))}
  </section>` : '',
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
      ${cards.map(([ic, t, v]) => `<div style="border:1px solid #ECEDF2; border-radius:18px; padding:24px; background:#fff;"><span style="display:grid; place-items:center; width:48px; height:48px; border-radius:13px; background:var(--accent-soft); font-size:22px;">${ic}</span><h3 style="font-family:'Space Grotesk'; font-weight:700; font-size:16px; color:#16161C; margin:16px 0 8px;">${t}</h3><p style="font-size:14.5px; color:#63636F; line-height:1.6; margin:0;">${v}</p></div>`).join('')}
    </div>
    <div class="split" style="display:grid; grid-template-columns:1fr 1fr; gap:28px; margin-top:32px; align-items:stretch;">
      <div class="img-slot" style="min-height:340px; border-radius:22px;"><span>Xəritə buraya əlavə olunacaq<br>(Google Maps embed)</span></div>
      <form id="ba-apply-form" style="border:1px solid #ECEDF2; border-radius:22px; padding:30px; background:#FAFBFF; display:flex; flex-direction:column; gap:14px;">
        <h2 style="font-family:'Space Grotesk'; font-weight:700; font-size:24px; color:#14141C; margin:0 0 6px;">Bizə yaz</h2>
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
  p.title = p.title || `${p.h1} — British Academy`;
  pages.push(p);
}

for (const top of MENU) {
  if (top.exists) continue; // haqqimizda.html mövcuddur
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
    push({ slug: top.slug, kind: 'hub', h1: top.label, desc: hubDesc(top.label), lead: `${top.label} — bütün istiqamətlər bir səhifədə.`, parent: { label: 'Ana səhifə', slug: 'index.html' }, boxes: top.dd.map((it) => ({ label: it.label, slug: it.slug })) });
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
  else html = leafPage(p);
  writeFileSync(join(ROOT, p.slug), html, 'utf8');
  written++;
}

/* ============================================================
   sitemap.xml + robots.txt
   ============================================================ */
const allSlugs = ['index.html', 'haqqimizda.html', 'muellimler.html', 'muellim.html', 'bloq.html', 'blogyazi.html', ...pages.map((p) => p.slug)];
const uniqueSlugs = [...new Set(allSlugs)];
const today = '2026-07-07';
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
    logo: ORIGIN + '/og-cover.jpg', address: { '@type': 'PostalAddress', streetAddress: ORG.address, addressLocality: ORG.city, addressCountry: 'AZ' },
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
<meta property="og:image" content="${ORIGIN}/og-cover.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${ORIGIN}/og-cover.jpg">
<script type="application/ld+json">${JSON.stringify(org)}</script>`;
}

let patched = 0;
for (const [file, cfg] of Object.entries(EXISTING)) {
  let src = readFileSync(join(ROOT, file), 'utf8');

  // 1) SEO: inject before </head> if not already present
  if (!/rel="canonical"/.test(src)) {
    src = src.replace('</head>', seoBlock(file, cfg.canonicalSlug) + '\n</head>');
  }

  // 1b) no-JS fallback: hide loader, show .ba-reveal sections
  if (!src.includes('<noscript>')) {
    src = src.replace('</head>', '<noscript><style>#ba-loader{display:none!important}.ba-reveal{opacity:1!important;transform:none!important}</style></noscript>\n</head>');
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
