import { describe, it, expect } from "vitest";
import {
  buildMatrix,
  planQr,
  renderSvg,
  safeColor,
  escapeXml,
  LOGO_MAX,
  LOGO_SAFE,
  maxLogoScale,
} from "@/lib/qr";

const URL = "https://britishacademy.az/r/ig-sentyabr";
// 1×1 şəffaf PNG — testdə həqiqi fayl lazım deyil, yalnız `data:` URI.
const LOGO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

/** Yoldakı alt-fiqurların sayı (hər biri «M» ilə başlayır). */
const shapes = (d) => (d.match(/M/g) || []).length;

describe("QR — kodlama", () => {
  it("səhv düzəltmə səviyyəsi «H»-dir", () => {
    // ÇAP ÜÇÜN KRİTİKDİR: ortadakı logo modulların bir hissəsini örtür.
    // Yalnız «H» (30% itki) bu örtüyə dözür — səviyyə aşağı salınsa kod
    // oxunmaz olur və bunu çap olunmuş afişada geri qaytarmaq mümkün deyil.
    // 37 modul = versiya 5 @ H. Səviyyə dəyişsə bu rəqəm dərhal fərqlənir.
    expect(buildMatrix(URL).size).toBe(37);
  });

  it("matris sərhəddən kənarı «boş» sayır", () => {
    const m = buildMatrix(URL);
    expect(m.at(-1, 0)).toBe(false);
    expect(m.at(0, m.size)).toBe(false);
  });
});

describe("QR — plan", () => {
  it("hüceyrə tam pikseldir", () => {
    // Kəsr hüceyrə modullar arasında bir piksellik ağ zolaq yaradır və bəzi
    // skanerlər kodu tuta bilmir.
    const p = planQr(URL, { size: 1000, margin: 4 });
    expect(Number.isInteger(p.cell)).toBe(true);
    expect(p.width).toBe(p.cell * (p.modules + 8));
  });

  it("alt yazı olmayanda hündürlük enə bərabərdir", () => {
    const p = planQr(URL, { size: 512 });
    expect(p.height).toBe(p.width);
    expect(planQr(URL, { size: 512, caption: "Skan et" }).height).toBeGreaterThan(p.width);
  });

  it("logonun altındakı modullar çəkilmir", () => {
    const bare = planQr(URL, { size: 512 });
    const withLogo = planQr(URL, { size: 512, logo: LOGO, logoScale: 0.24 });
    expect(shapes(withLogo.modulesPath)).toBeLessThan(shapes(bare.modulesPath));
  });

  it("logo ölçüsü təhlükəsiz həddə sıxılır", () => {
    // İstifadəçi (və ya zədələnmiş localStorage) 90% göndərsə də kod
    // oxunaqlı qalmalıdır.
    const p = planQr(URL, { size: 512, logo: LOGO, logoScale: 0.9 });
    expect(p.logo.w / (p.cell * p.modules)).toBeCloseTo(LOGO_MAX, 3);
    expect(LOGO_SAFE).toBeLessThan(LOGO_MAX);
    // Hədd ölçülüb: 30%-də qısa linklərin kodu heç bir ölçüdə oxunmurdu.
    expect(LOGO_MAX).toBeLessThanOrEqual(0.26);
  });

  it("çəkilən kvadratlar matrisi hərfi-hərfinə təkrarlayır", () => {
    // ƏSAS YOXLAMA. Yol həndəsəsi öz kodumuzdadır: bir sürüşmə (offset) və ya
    // sətir/sütun yerdəyişməsi GÖZƏ ADİ QR KİMİ görünər, amma heç bir telefon
    // onu oxumaz. Burada yol geri parçalanır və modul-modul tutuşdurulur.
    // Gözlər ayrıca yolda olduğu üçün 7×7 sahələr kənarda saxlanılır.
    const p = planQr(URL, { size: 512, margin: 4, moduleStyle: "square" });
    const m = buildMatrix(URL);
    const eye = (r, c) =>
      (r < 7 && c < 7) || (r < 7 && c >= m.size - 7) || (r >= m.size - 7 && c < 7);

    const drawn = new Set();
    const re = /M(-?[\d.]+) (-?[\d.]+)h(-?[\d.]+)v(-?[\d.]+)h(-?[\d.]+)Z/g;
    let hit;
    while ((hit = re.exec(p.modulesPath)) !== null) {
      const [, x, y, w] = hit.map(Number);
      expect(w).toBe(p.cell);
      drawn.add(`${(y - p.off) / p.cell},${(x - p.off) / p.cell}`);
    }

    let dark = 0;
    for (let r = 0; r < m.size; r += 1) {
      for (let c = 0; c < m.size; c += 1) {
        if (eye(r, c)) continue;
        if (!m.at(r, c)) {
          expect(drawn.has(`${r},${c}`)).toBe(false);
          continue;
        }
        dark += 1;
        expect(drawn.has(`${r},${c}`)).toBe(true);
      }
    }
    expect(drawn.size).toBe(dark);
  });

  it("logo həddi yalnız ÜFÜQİ logo üçün genişlənir", () => {
    // Ölçülüb: 30% üfüqi logo 25% kvadratla eyni nəticə verir (eyni endə daha
    // az sahə örtür). Şaquli logo isə sahə hesabı icazə versə də genişlənmir —
    // uzun şaquli zolaq bütöv sətirləri kəsir və 45%-də BÜTÜN ölçülərdə
    // oxunmurdu.
    expect(maxLogoScale(1)).toBe(LOGO_MAX);
    expect(maxLogoScale(5)).toBe(0.3);
    expect(maxLogoScale(0.3)).toBe(LOGO_MAX);
    expect(maxLogoScale(0.05)).toBe(LOGO_MAX); // həddindən artıq şaquli
    expect(maxLogoScale(undefined)).toBe(LOGO_MAX);
  });

  it("üfüqi logo enini itirmir", () => {
    // Kvadrat yuvaya salınsaydı, 5:1 lövhə mərkəzdə tanınmaz qalardı.
    const wide = planQr(URL, { size: 512, logo: LOGO, logoAspect: 5, logoScale: 0.3 });
    const square = planQr(URL, { size: 512, logo: LOGO, logoScale: 0.25 });
    expect(wide.logo.w).toBeGreaterThan(square.logo.w);
    expect(wide.logo.h).toBeLessThan(square.logo.h);
    // Örtülən sahə kvadrat haldan çox olmamalıdır.
    expect(wide.logo.w * wide.logo.h).toBeLessThanOrEqual(square.logo.w * square.logo.h);
  });

  it("gözlər HƏR üslubda bütöv çəkilir", () => {
    // REGRESSİYA QORUMASI — real dekoderlə tapılmış baq.
    // Əvvəl gözlər yalnız «square» olmayan üslubda ayrıca çəkilirdi. Nəticədə
    // «nöqtə» üslubunda göz 7×7 dairəyə parçalanırdı, skanerin axtardığı
    // 1:1:3:1:1 nisbəti pozulurdu və kod ÜMUMİYYƏTLƏ tapılmırdı. Səhv düzəltmə
    // burada kömək etmir: gözlər məlumat deyil, struktur elementidir.
    for (const eyeStyle of ["square", "soft", "circle"]) {
      for (const moduleStyle of ["square", "soft", "dots"]) {
        const p = planQr(URL, { eyeStyle, moduleStyle });
        // 3 göz × 3 fiqur (çərçivə, ağ halqa, nüvə).
        expect(shapes(p.eyesPath), `${moduleStyle}/${eyeStyle}`).toBe(9);
      }
    }
  });

  it("«nöqtə» dairəsi qonşunun mərkəzinə çatmır", () => {
    // Radius 0.6-dır: skan üçün lazımdır (kiçik radiusda kod oxunmurdu), amma
    // qonşu hüceyrənin MƏRKƏZİ 1.0 məsafədədir. Radius 1.0-a çatsa qonşu modul
    // qaralar və məlumat pozulardı.
    const p = planQr(URL, { size: 512, moduleStyle: "dots" });
    const r = Number(/a([\d.]+) /.exec(p.modulesPath)[1]);
    expect(r).toBeGreaterThan(p.cell * 0.5); // boşluqsuz
    expect(r).toBeLessThan(p.cell); // qonşunun mərkəzinə toxunmur
  });

  it("«dots» və «soft» üslubları modul sayını dəyişmir", () => {
    // Forma dəyişir, MƏLUMAT yox — modul sayı eyni qalmalıdır.
    const n = shapes(planQr(URL, { moduleStyle: "square" }).modulesPath);
    expect(shapes(planQr(URL, { moduleStyle: "dots" }).modulesPath)).toBe(n);
    expect(shapes(planQr(URL, { moduleStyle: "soft" }).modulesPath)).toBe(n);
  });
});

describe("QR — SVG", () => {
  it("düzgün kök element və viewBox verir", () => {
    const svg = renderSvg(URL, { size: 512 });
    expect(svg.startsWith("<svg ")).toBe(true);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toMatch(/viewBox="0 0 \d+ \d+"/);
    expect(svg.endsWith("</svg>")).toBe(true);
  });

  it("şəffaf rejimdə fon düzbucaqlısı yoxdur", () => {
    expect(renderSvg(URL, { transparent: false })).toContain("<rect");
    expect(renderSvg(URL, { transparent: true })).not.toContain("<rect");
  });

  it("logonu `data:` URI kimi içəri yazır", () => {
    // Xarici linkə baxsaydı, çapa göndərilən SVG-də logo görünməzdi.
    const svg = renderSvg(URL, { logo: LOGO });
    expect(svg).toContain("<image");
    expect(svg).toContain("data:image/png;base64,");
    expect(svg).toContain("xlink:href=");
  });

  it("alt yazını qaçırır", () => {
    const svg = renderSvg(URL, { caption: '<script>alert(1)</script> & "A"' });
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
    expect(svg).toContain("&amp;");
  });

  it("etibarsız rəngi defolta çevirir", () => {
    // Rəng SVG mətninə birbaşa yazılır — hex olmayan dəyər atributdan çıxıb
    // sənədə element əlavə edə bilərdi.
    const svg = renderSvg(URL, { dark: '"/><script>x()</script>' });
    expect(svg).not.toContain("<script>");
    expect(svg).toContain('fill="#000000"');
  });
});

describe("QR — köməkçilər", () => {
  it("safeColor yalnız hex qəbul edir", () => {
    expect(safeColor("#00157A")).toBe("#00157A");
    expect(safeColor("#abc")).toBe("#abc");
    expect(safeColor("#00157A80")).toBe("#00157A80");
    expect(safeColor("red")).toBe("#000000");
    expect(safeColor("")).toBe("#000000");
    expect(safeColor(null, "#FFFFFF")).toBe("#FFFFFF");
  });

  it("escapeXml beş xüsusi simvolu əvəz edir", () => {
    expect(escapeXml(`<>&"'`)).toBe("&lt;&gt;&amp;&quot;&apos;");
    expect(escapeXml(null)).toBe("");
  });
});
