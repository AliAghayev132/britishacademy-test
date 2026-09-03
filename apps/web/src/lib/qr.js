// ── QR kod qurucusu ──
//
// NİYƏ HAZIR RENDERER DEYİL:
// `qrcode` paketi hazır PNG/SVG verir, amma ORTADA LOGO qoymağa imkan vermir —
// nə də göz (finder) formasını dəyişməyə. Ona görə paketdən yalnız KODLAMA
// (modul matrisi) alınır, çəkiliş burada aparılır.
//
// BİR HƏNDƏSƏ, İKİ RENDERER:
// Şəkillər SVG `path` sətri kimi qurulur. SVG-də birbaşa yazılır, canvas-da isə
// `new Path2D(d)` ilə eyni sətir çəkilir. Beləliklə PNG və SVG eyni çıxır — iki
// ayrı çəkiliş kodu saxlansaydı, biri dəyişəndə o biri səssizcə fərqlənərdi.
//
// SKAN EDİLƏBİLƏRLİK:
// Logo QR-ın bir hissəsini örtür. Buna görə səhv düzəltmə səviyyəsi «H»-dir
// (30% itkiyə dözür) və logonun ölçüsü təhlükəsiz həddə məhdudlaşdırılır.
// Bu iki şərt pozulsa kod OXUNMUR — çap olunmuş materialda bunu geri qaytarmaq
// mümkün olmur, ona görə həddlər koda yazılıb.

import QRCode from "qrcode";

/**
 * Logonun QR sahəsinə nisbətdə maksimum eni.
 *
 * ÖLÇÜLÜB, TƏXMİN EDİLMƏYİB: hər səviyyə real dekoderlə (jsQR) yoxlanılıb.
 * 30%-də QISA linklərin kodu heç bir ölçüdə oxunmurdu — kiçik versiyalı QR-da
 * eyni faiz daha az kodsözə düşür və «H» səviyyəsinin ehtiyatı çatmır.
 * 26%-ə qədər bütün versiyalar oxunurdu; 25% ehtiyatla seçilib.
 */
export const LOGO_MAX = 0.25;
/** Tövsiyə olunan hədd — bundan yuxarıda istifadəçiyə xəbərdarlıq göstərilir. */
export const LOGO_SAFE = 0.2;

export const QR_DEFAULTS = {
  size: 1024,
  margin: 4, // modul sayı — standart «sakit zona» 4-dür
  dark: "#00157A",
  light: "#FFFFFF",
  transparent: false,
  moduleStyle: "square", // square | soft | dots
  eyeStyle: "square", // square | soft | circle
  eyeColor: "", // boşdursa `dark`
  logo: "", // data URL
  // Defolt TƏHLÜKƏSİZ həddin özüdür: modal açılan kimi xəbərdarlıq çıxmasın,
  // amma istifadəçi böyütsə dərhal görsün.
  logoScale: 0.2,
  logoShape: "rounded", // rounded | circle | square
  // Logonun en/hündürlük nisbəti. Kvadrat yuvaya salınsaydı, üfüqi logo
  // (uzun lövhə) tanınmaz dərəcədə kiçilərdi.
  logoAspect: 1,
  caption: "",
  captionColor: "",
};

/** Rəngi təhlükəsiz hala gətir — SVG mətninə birbaşa yazılır. */
export const safeColor = (v, fallback = "#000000") =>
  /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(String(v || "")) ? String(v) : fallback;

/** SVG mətn qovşağına yazılan istifadəçi mətni. */
export const escapeXml = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const num = (v) => Math.round(v * 1000) / 1000;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Verilmiş en/hündürlük nisbəti üçün logonun maksimum BÖYÜK ölçüsü.
 *
 * ÜFÜQİ logo eyni endə daha az sahə örtür, ona görə 30%-ə qədər açıla bilər —
 * dekoderlə yoxlanılıb: 30% üfüqi logo 25% kvadratla eyni nəticə verir. Bu
 * olmasaydı saytın uzun logosu (553×110) mərkəzdə tanınmaz qalardı.
 *
 * ŞAQULİ logo isə genişlənmir, sahə hesabı buna icazə versə də: uzun şaquli
 * zolaq bütöv sətirləri kəsir və bərpa üçün lazım olan kodsözlər bir yerdə
 * itir. 45%-də şaquli logo BÜTÜN ölçülərdə oxunmurdu, halbuki örtülən sahə
 * kvadrat haldan çox deyildi.
 */
export const maxLogoScale = (aspect = 1) => {
  const a = clamp(Number(aspect) || 1, 0.25, 4);
  return a >= 1 ? Math.min(0.3, LOGO_MAX * Math.sqrt(a)) : LOGO_MAX;
};

/**
 * Künc radiusları ayrı-ayrı verilən düzbucaqlı.
 * @param {number[]} r [sol-üst, sağ-üst, sağ-alt, sol-alt]
 */
function roundRectPath(x, y, w, h, r) {
  const m = Math.min(w, h) / 2;
  const [a, b, c, d] = r.map((v) => clamp(v, 0, m));
  if (!a && !b && !c && !d) return `M${num(x)} ${num(y)}h${num(w)}v${num(h)}h${num(-w)}Z`;
  return [
    `M${num(x + a)} ${num(y)}`,
    `H${num(x + w - b)}`,
    b ? `A${num(b)} ${num(b)} 0 0 1 ${num(x + w)} ${num(y + b)}` : "",
    `V${num(y + h - c)}`,
    c ? `A${num(c)} ${num(c)} 0 0 1 ${num(x + w - c)} ${num(y + h)}` : "",
    `H${num(x + d)}`,
    d ? `A${num(d)} ${num(d)} 0 0 1 ${num(x)} ${num(y + h - d)}` : "",
    `V${num(y + a)}`,
    a ? `A${num(a)} ${num(a)} 0 0 1 ${num(x + a)} ${num(y)}` : "",
    "Z",
  ]
    .filter(Boolean)
    .join("");
}

/** Dairə — iki yarım qövsdən. `Path2D` bunu da oxuyur. */
function circlePath(cx, cy, r) {
  return `M${num(cx - r)} ${num(cy)}a${num(r)} ${num(r)} 0 1 0 ${num(r * 2)} 0a${num(r)} ${num(r)} 0 1 0 ${num(-r * 2)} 0Z`;
}

/**
 * Mətndən modul matrisi.
 * Səviyyə həmişə «H»-dir: ortadakı logo modulları örtür və aşağı səviyyədə
 * kod oxunmaz olur.
 */
export function buildMatrix(text) {
  const qr = QRCode.create(String(text ?? ""), { errorCorrectionLevel: "H" });
  const size = qr.modules.size;
  const data = qr.modules.data;
  return {
    size,
    at: (r, c) => r >= 0 && c >= 0 && r < size && c < size && data[r * size + c] === 1,
  };
}

/** Modul üç «göz»dən (finder pattern) birinin içindədirmi? */
const inEye = (r, c, size) =>
  (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);

/**
 * Çəkiliş planı — həndəsə burada bir dəfə hesablanır, SVG və canvas onu
 * paylaşır.
 */
export function planQr(text, options = {}) {
  const o = { ...QR_DEFAULTS, ...options };
  const m = buildMatrix(text);

  const margin = clamp(Math.round(o.margin) || 0, 0, 8);
  const total = m.size + margin * 2;
  const px = clamp(Math.round(o.size) || 0, 128, 4096);
  // Hüceyrə tam ədəd olmalıdır — kəsr olsa modullar arasında bir piksellik
  // ağ zolaqlar yaranır və bəzi skanerlər kodu tuta bilmir.
  const cell = Math.max(1, Math.floor(px / total));
  const qrPx = cell * total;
  const off = margin * cell;

  // Logo sahəsi modullardan ƏVVƏL hesablanır: altındakı modullar çəkilmir ki,
  // şəffaf fonda logonun ətrafı təmiz qalsın.
  const area = cell * m.size;
  let logo = null;
  if (o.logo) {
    const aspect = clamp(Number(o.logoAspect) || 1, 0.25, 4);
    const scale = clamp(Number(o.logoScale) || 0, 0.08, maxLogoScale(aspect));
    // BÖYÜK ölçü həmişə `scale`-ə bərabərdir, kiçiyi nisbətdən çıxır. Beləcə
    // örtülən sahə kvadrat haldan HEÇ VAXT çox olmur — ölçülmüş təhlükəsiz
    // hədd qüvvədə qalır — amma üfüqi logo tam eninə açılır.
    const big = area * scale;
    const w = aspect >= 1 ? big : big * aspect;
    const h = aspect >= 1 ? big / aspect : big;
    const pad = big * 0.14;
    const boxW = w + pad * 2;
    const boxH = h + pad * 2;
    const c0 = off + area / 2;
    const rMin = Math.min(boxW, boxH);
    logo = {
      x: num(c0 - w / 2),
      y: num(c0 - h / 2),
      w: num(w),
      h: num(h),
      pad: {
        x: c0 - boxW / 2,
        y: c0 - boxH / 2,
        w: boxW,
        h: boxH,
        r: o.logoShape === "circle" ? rMin / 2 : o.logoShape === "square" ? 0 : rMin * 0.2,
      },
    };
  }

  // Logo qutusu ilə kəsişən modul çəkilmir.
  const hidden = (x, y) =>
    logo !== null &&
    x + cell > logo.pad.x &&
    x < logo.pad.x + logo.pad.w &&
    y + cell > logo.pad.y &&
    y < logo.pad.y + logo.pad.h;

  const parts = [];

  for (let r = 0; r < m.size; r += 1) {
    for (let c = 0; c < m.size; c += 1) {
      if (!m.at(r, c)) continue;
      // Gözlər aşağıda AYRICA çəkilir — modul döngüsündən çıxarılır.
      if (inEye(r, c, m.size)) continue;
      const x = off + c * cell;
      const y = off + r * cell;
      if (hidden(x, y)) continue;

      if (o.moduleStyle === "dots") {
        // Radius hüceyrədən BÖYÜKDÜR (0.6) — qonşu dairələr üst-üstə düşür.
        //
        // Kiçik radius nə üçün olmaz: 0.42, 0.45, 0.48, 0.5, 0.55 sınandı və
        // hər birində müəyyən ölçü/uzunluq cütlərində kod oxunmadı.
        // Dairələr arasındakı ağ boşluq skanerin yerli parlaqlıq həddini
        // sürüşdürür. 0.6-da bütün versiya və ölçülər oxunur.
        //
        // Qonşu hüceyrənin MƏRKƏZİ 1.0 məsafədədir, yəni 0.6 radius onu heç
        // vaxt qaraltmır — məlumat pozulmur. Diaqonal künc 0.707-dədir, ona da
        // çatmır, ona görə görünüş hələ də «nöqtə»dir.
        parts.push(circlePath(x + cell / 2, y + cell / 2, cell * 0.6));
      } else if (o.moduleStyle === "soft") {
        // Künc yalnız HƏR İKİ qonşu boş olanda yuvarlaqlanır — qonşu modullar
        // beləcə bir-birinə axır, tək qalanlar isə nöqtə kimi görünür.
        const up = m.at(r - 1, c);
        const down = m.at(r + 1, c);
        const left = m.at(r, c - 1);
        const right = m.at(r, c + 1);
        const k = cell * 0.5;
        parts.push(
          roundRectPath(x, y, cell, cell, [
            !up && !left ? k : 0,
            !up && !right ? k : 0,
            !down && !right ? k : 0,
            !down && !left ? k : 0,
          ]),
        );
      } else {
        parts.push(roundRectPath(x, y, cell, cell, [0, 0, 0, 0]));
      }
    }
  }

  // ── Gözlər (finder pattern) ──
  //
  // HƏMİŞƏ BÜTÖV ÇƏKİLİR — modul üslubundan asılı olmayaraq.
  // Skaner kodu əvvəlcə gözün mərkəz xətti boyunca 1:1:3:1:1 nisbətinə görə
  // TAPIR. Göz «nöqtə» üslubunda 7×7 dairəyə bölünsə bu nisbət pozulur və kod
  // ümumiyyətlə aşkarlanmır — səhv düzəltmə burada kömək etmir, çünki
  // gözlər məlumat deyil, struktur elementidir.
  // (Bu, real dekoderlə yoxlanılıb: nöqtəli gözlərdə kod oxunmurdu.)
  //
  // Üç hissə BİR yolda birləşir və `evenodd` ilə doldurulur: çöl çərçivə
  // (1 keçid → dolu), aradakı ağ halqa (2 → boş), ortadakı nüvə (3 → dolu).
  // Ayrı yollar olsaydı ağ halqanı şəffaf fonda çəkmək mümkün olmazdı.
  const eyes = [];
  for (const [r, c] of [
    [0, 0],
    [0, m.size - 7],
    [m.size - 7, 0],
  ]) {
    const x = off + c * cell;
    const y = off + r * cell;
    const s = cell * 7;
    if (o.eyeStyle === "circle") {
      eyes.push(circlePath(x + s / 2, y + s / 2, s / 2));
      eyes.push(circlePath(x + s / 2, y + s / 2, s / 2 - cell));
      eyes.push(circlePath(x + s / 2, y + s / 2, cell * 1.5));
    } else {
      // «square» üçün radiuslar sıfırdır — nəticə matrisin özü ilə eynidir.
      const k = o.eyeStyle === "soft" ? 1 : 0;
      const ro = cell * 2 * k;
      eyes.push(roundRectPath(x, y, s, s, [ro, ro, ro, ro]));
      const ri = cell * 1.4 * k;
      eyes.push(roundRectPath(x + cell, y + cell, s - cell * 2, s - cell * 2, [ri, ri, ri, ri]));
      const rb = cell * 0.9 * k;
      eyes.push(roundRectPath(x + cell * 2, y + cell * 2, cell * 3, cell * 3, [rb, rb, rb, rb]));
    }
  }

  // Alt yazı üçün aşağıda yer ayrılır — QR-ın özü yuxarıda qalır.
  const captionH = o.caption ? Math.round(qrPx * 0.15) : 0;

  return {
    width: qrPx,
    height: qrPx + captionH,
    qr: qrPx,
    cell,
    off,
    captionH,
    modules: m.size,
    modulesPath: parts.join(""),
    eyesPath: eyes.join(""),
    logo,
    opts: o,
  };
}

/** Alt yazının şrift ölçüsü — hər iki rendererdə eyni olmalıdır. */
const captionFont = (plan) => Math.round(plan.qr * 0.062);

const FONT_STACK = "Segoe UI, Roboto, Helvetica, Arial, sans-serif";

/**
 * SVG sətri. Logo `data:` URI kimi içəri yazılır ki, fayl müstəqil olsun —
 * xarici linkə baxsaydı, çapa göndərilən SVG-də logo görünməzdi.
 */
export function renderSvg(text, options = {}) {
  const plan = planQr(text, options);
  const o = plan.opts;
  const dark = safeColor(o.dark, "#000000");
  const eyeColor = o.eyeColor ? safeColor(o.eyeColor, dark) : dark;
  const light = safeColor(o.light, "#FFFFFF");

  const bits = [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${plan.width}" height="${plan.height}" viewBox="0 0 ${plan.width} ${plan.height}">`,
  ];
  if (!o.transparent) {
    bits.push(`<rect width="${plan.width}" height="${plan.height}" fill="${light}"/>`);
  }
  if (plan.modulesPath) bits.push(`<path fill="${dark}" d="${plan.modulesPath}"/>`);
  if (plan.eyesPath) {
    bits.push(`<path fill="${eyeColor}" fill-rule="evenodd" d="${plan.eyesPath}"/>`);
  }
  if (plan.logo) {
    const p = plan.logo.pad;
    // Altlıq şəffaf fonda da lazımdır: rəngli logo tünd modulların üstünə
    // düşsə seçilmir.
    bits.push(
      `<path fill="${light}" d="${roundRectPath(p.x, p.y, p.w, p.h, [p.r, p.r, p.r, p.r])}"/>`,
    );
    const href = escapeXml(o.logo);
    bits.push(
      `<image x="${plan.logo.x}" y="${plan.logo.y}" width="${plan.logo.w}" height="${plan.logo.h}" preserveAspectRatio="xMidYMid meet" href="${href}" xlink:href="${href}"/>`,
    );
  }
  if (o.caption) {
    const fs = captionFont(plan);
    const fill = o.captionColor ? safeColor(o.captionColor, dark) : dark;
    bits.push(
      `<text x="${plan.width / 2}" y="${num(plan.qr + plan.captionH / 2 + fs * 0.36)}" text-anchor="middle" font-family="${FONT_STACK}" font-size="${fs}" font-weight="700" fill="${fill}">${escapeXml(o.caption)}</text>`,
    );
  }
  bits.push("</svg>");
  return bits.join("");
}

/** SVG-ni `<img src>` üçün data URI-yə çevir (unicode-təhlükəsiz). */
export function svgToDataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Canvas-a çək. SVG ilə EYNİ yolları işlədir — `Path2D` SVG `d` sintaksisini
 * qəbul edir.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {object} plan `planQr` nəticəsi
 * @param {CanvasImageSource|null} logoImg yüklənmiş logo (yoxdursa null)
 * @param {boolean} opaque JPEG üçün fon məcburi doldurulur
 */
export function drawQr(canvas, plan, logoImg, opaque = false) {
  const o = plan.opts;
  canvas.width = plan.width;
  canvas.height = plan.height;
  const ctx = canvas.getContext("2d");
  const dark = safeColor(o.dark, "#000000");
  const light = safeColor(o.light, "#FFFFFF");

  ctx.clearRect(0, 0, plan.width, plan.height);
  if (!o.transparent || opaque) {
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, plan.width, plan.height);
  }

  if (plan.modulesPath) {
    ctx.fillStyle = dark;
    ctx.fill(new Path2D(plan.modulesPath));
  }
  if (plan.eyesPath) {
    ctx.fillStyle = o.eyeColor ? safeColor(o.eyeColor, dark) : dark;
    ctx.fill(new Path2D(plan.eyesPath), "evenodd");
  }
  if (plan.logo) {
    const p = plan.logo.pad;
    ctx.fillStyle = light;
    ctx.fill(new Path2D(roundRectPath(p.x, p.y, p.w, p.h, [p.r, p.r, p.r, p.r])));
    if (logoImg) {
      // `preserveAspectRatio="xMidYMid meet"` qarşılığı — SVG ilə eyni yerləşsin.
      const iw = logoImg.naturalWidth || logoImg.width || 1;
      const ih = logoImg.naturalHeight || logoImg.height || 1;
      const k = Math.min(plan.logo.w / iw, plan.logo.h / ih);
      const w = iw * k;
      const h = ih * k;
      ctx.drawImage(
        logoImg,
        plan.logo.x + (plan.logo.w - w) / 2,
        plan.logo.y + (plan.logo.h - h) / 2,
        w,
        h,
      );
    }
  }
  if (o.caption) {
    const fs = captionFont(plan);
    ctx.fillStyle = o.captionColor ? safeColor(o.captionColor, dark) : dark;
    ctx.font = `700 ${fs}px ${FONT_STACK}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(o.caption, plan.width / 2, plan.qr + plan.captionH / 2, plan.width * 0.94);
  }
  return canvas;
}

/** Şəkli yüklə. Uğursuzluqda `null` — logo olmadan da QR çəkilməlidir. */
export function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Şəkil ünvanını `data:` URI-yə çevir.
 *
 * NİYƏ LAZIMDIR: xarici origin-dən gələn şəkil canvas-ı «çirkləndirir»
 * (tainted) və `toBlob` istisna atır — yəni PNG endirilə bilmir. Dev-də API
 * :5000, panel :3000 portundadır, yəni məhz bu hal yaranır.
 */
export async function fetchAsDataUrl(url) {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  const res = await fetch(url, { mode: "cors", credentials: "omit" });
  if (!res.ok) throw new Error(`Şəkil alınmadı (${res.status})`);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error("Şəkil oxunmadı"));
    fr.readAsDataURL(blob);
  });
}

/** Faylı endir — Blob URL yaddaşda qalmasın deyə buraxılır. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
