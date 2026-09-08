import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { gtmIdOf } from "@/lib/gtm";

/**
 * GOOGLE TAG MANAGER.
 *
 * NİYƏ KODDA, «kod yerləşdirmə» sahəsində DEYİL: `CodeInjection` kodu
 * brauzerdə, səhifə yükləndikdən sonra əlavə edir. GTM üçün bunun iki
 * nəticəsi var —
 *
 *   1. konteyner gec qalxır;
 *   2. GTM-in `<noscript>` hissəsi ÜMUMİYYƏTLƏ işləmir: o, məhz JavaScript
 *      sönülü olanlar üçündür, `CodeInjection` isə onu JavaScript ilə əlavə
 *      edir. JS sönülüdürsə heç nə əlavə olunmur, JS açıqdırsa brauzer
 *      `<noscript>` içindəkinə baxmır. Yəni hər iki halda faydasız.
 *
 * Ona görə ID paneldən oxunur, markup isə SERVER tərəfdə düzgün yerdə
 * render olunur.
 */

const layout = fs.readFileSync("src/app/layout.js", "utf8");
const gtmComp = fs.readFileSync("src/components/site/GoogleTagManager.jsx", "utf8");
const seoLib = fs.readFileSync("src/lib/seo.js", "utf8");

describe("konteyner ID-sinin yoxlanışı", () => {
  it("düzgün ID qəbul olunur", () => {
    expect(gtmIdOf("GTM-5S6LVZ62")).toBe("GTM-5S6LVZ62");
    expect(gtmIdOf("GTM-ABCD1234")).toBe("GTM-ABCD1234");
  });

  it("boşluq və kiçik hərf düzəldilir", () => {
    // Admin ID-ni kopyalayanda ətrafında boşluq qalır.
    expect(gtmIdOf("  gtm-5s6lvz62  ")).toBe("GTM-5S6LVZ62");
  });

  it("boş dəyər GTM-i tamamilə söndürür", () => {
    for (const v of ["", "   ", null, undefined]) expect(gtmIdOf(v)).toBe("");
  });

  it("uyğun gəlməyən dəyər nəzərə alınmır", () => {
    // «Səssiz sınıq skript» yerinə «heç nə» — sayt sınmır.
    for (const v of ["GTM", "UA-12345", "G-R3BFKCT5WX", "salam", "GTM-"]) {
      expect(gtmIdOf(v), `${v} qəbul olunmamalıdır`).toBe("");
    }
  });

  it("skriptə kod yeritmək mümkün deyil", () => {
    // ID inline skriptin İÇİNƏ yazılır. Yoxlanış olmasaydı bunlar sayta
    // ixtiyari JS əlavə edərdi.
    const attacks = [
      "GTM-X');alert(1);//",
      "GTM-X'+alert(1)+'",
      "GTM-X</script><script>alert(1)</script>",
      "GTM-X\"; fetch('//evil')",
    ];
    for (const a of attacks) expect(gtmIdOf(a), `${a} keçdi!`).toBe("");
  });
});

describe("markup-un yeri", () => {
  it("`<noscript>` `<body>`-nin ƏVVƏLİNDƏDİR", () => {
    // Google-un tələb etdiyi yer budur. Sonda olsa da işləyərdi, amma
    // sıralamanı qəsdən qoruyuruq.
    const bodyAt = layout.indexOf("<body>");
    const nsAt = layout.indexOf("<GtmNoScript");
    const kidsAt = layout.indexOf("<Providers>");
    expect(bodyAt).toBeGreaterThan(0);
    expect(nsAt, "GtmNoScript <body> içində deyil").toBeGreaterThan(bodyAt);
    expect(nsAt, "GtmNoScript məzmundan sonra qalıb").toBeLessThan(kidsAt);
  });

  it("skript `<head>`dədir", () => {
    const headEnd = layout.indexOf("</head>");
    expect(layout.indexOf("<GtmScript")).toBeLessThan(headEnd);
  });

  it("ID `codeInjection`-dan oxunur", () => {
    // `seo` blokunda saxlamaq olmazdı — ora `editor` rolu da yaza bilir,
    // GTM konteyneri isə sayta ixtiyari JS yükləyir.
    expect(layout).toMatch(/inject\.gtmId/);
    expect(layout).toMatch(/codeInjection/);
  });

  it("ID boşdursa heç nə render olunmur", () => {
    // Sınaq mühitində təsadüfən statistika toplanmasın.
    expect(gtmComp).toMatch(/if \(!gtm\) return null/);
    expect((gtmComp.match(/if \(!gtm\) return null/g) || []).length).toBe(2);
  });

  it("skript `next/script` ilə yüklənir", () => {
    expect(gtmComp).toMatch(/from "next\/script"/);
    expect(gtmComp).toMatch(/strategy="afterInteractive"/);
  });
});

describe("tənzimləmələrin keşi", () => {
  it("`/site` 60 saniyəlik keşdədir", () => {
    // 3600 (bir saat) idi. `app/layout.js` GTM ID-sini məhz buradan oxuyur —
    // admin ID-ni yazandan sonra izləmənin başlaması bir saat çəkirdi və
    // «işləmədi» kimi görünürdü.
    expect(seoLib).toMatch(/apiGet\("\/site", \{ revalidate: 60 \}\)/);
  });

  it("eyni ünvan hər yerdə eyni müddətlədir", () => {
    // Bir URL üçün iki fərqli müddət vermək səliqəsizdir və hansının qalib
    // gəldiyi Next-in daxili qaydasından asılı qalır.
    const pub = fs.readFileSync("src/app/(public)/layout.js", "utf8");
    const withWindow = [...pub.matchAll(/apiGet\("\/site",\s*\{\s*revalidate:\s*(\d+)/g)].map((m) => m[1]);
    for (const w of withWindow) expect(w).toBe("60");
  });
});
