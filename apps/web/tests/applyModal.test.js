import { describe, it, expect } from "vitest";
import fs from "node:fs";

/**
 * Müraciət modalının mobil auditi.
 *
 * Üç ayrı problem tapılmışdı:
 *  1. kartın hündürlüyü məhdud deyildi — 375×667-də üst-alt kəsilirdi,
 *     landşaftda «Göndər» düyməsi ümumiyyətlə görünmürdü və arxa fon kilidli
 *     olduğuna görə heç yerə sürüşdürmək mümkün deyildi;
 *  2. açılış animasiyası `both` fill-mode ilə bitəndən sonra da hesablanmış
 *     `transform` saxlayırdı (identity matrisi) — belə element `position:
 *     fixed` övladlar üçün containing block olur, ona görə açılan siyahılar
 *     kartın daxilinə bağlanıb `overflow: hidden` ilə kəsilirdi;
 *  3. siyahının mövqeyi yalnız açılan anda hesablanırdı — pəncərə ölçüsü
 *     dəyişəndə və ya forma sürüşəndə siyahı düymədən ayrı düşürdü.
 */

const read = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");

describe("müraciət modalı — mobil yerləşim", () => {
  it("kartın hündürlüyü ekranla məhdudlaşır, gövdə ayrıca sürüşür", () => {
    const css = read("src/styles/globals.css");
    expect(css).toMatch(/\.ba-am-card \{[^}]*max-height: calc\(100dvh - 48px\)/s);
    expect(css).toMatch(/\.ba-am-body \{[^}]*overflow-y: auto/s);
    // Kiçik ekranda doldurmalar daralır (inline üslub media sorğusuna tabe
    // olmadığı üçün ölçülər CSS-dədir).
    expect(css).toMatch(/@media \(max-width: 480px\)/);
    expect(css).toMatch(/@media \(max-height: 560px\)/);

    const modal = read("src/components/site/ApplyModal.jsx");
    expect(modal).toMatch(/<div className="ba-am-body">/);
    // Ölçülər inline qalsaydı media sorğusu onları üstələyə bilməzdi.
    expect(modal).not.toMatch(/className="ba-am-head"[^>]*padding:/);
    expect(modal).not.toMatch(/className="ba-am-form"[^>]*padding:/);
  });

  it("açılış animasiyaları bitəndən sonra transform saxlamır", () => {
    const css = read("src/styles/globals.css");
    for (const rule of [
      /\.ba-am-overlay \{ animation: ba-am-fade [^}]*\}/,
      /\.ba-am-card \{ animation: ba-am-pop [^}]*\}/,
      /\.ba-am-head > \* \{ animation: ba-am-rise [^}]*\}/,
      /\.ba-am-form > \* \{ animation: ba-am-rise [^}]*\}/,
    ]) {
      const [line] = css.match(rule);
      expect(line).toContain("backwards");
      expect(line).not.toMatch(/\bboth\b/);
    }
    // Bağlanışda isə son kadr (şəffaflıq 0) saxlanılmalıdır.
    expect(css).toMatch(/\.ba-am-overlay\.is-closing \.ba-am-card \{ animation: ba-am-drop [^}]*both/);
  });
});

describe("ictimai seçim siyahısı", () => {
  it("siyahı <body>-yə portal edilir və düyməyə bağlı qalır", () => {
    const src = read("src/components/site/SiteSelect.jsx");
    expect(src).toMatch(/import \{ createPortal \} from "react-dom";/);
    expect(src).toMatch(/createPortal\(/);
    expect(src).toMatch(/document\.body,/);
    expect(src).toMatch(/useAnchoredPosition\(open, tRef, \{ panelHeight: 300, gap: 6, matchWidth: true \}\)/);
    // Bir dəfəlik hesablama geri qayıtmasın.
    expect(src).not.toMatch(/getBoundingClientRect/);
  });

  it("fokus tələsi portaldakı siyahını dialoqun bir hissəsi sayır", () => {
    expect(read("src/components/site/SiteSelect.jsx")).toMatch(/data-dialog-portal=""/);
    expect(read("src/components/site/useDialogFocus.js")).toMatch(/\[data-dialog-portal\]/);
  });
});
