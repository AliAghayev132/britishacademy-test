import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * MƏTN REDAKTORU `<label>` İÇİNDƏ OLA BİLMƏZ.
 *
 * NASAZLIQ: `Field` sahəni `<label>` ilə bükürdü. Adi input üçün bu faydalıdır
 * — başlığa vurmaq input-u fokuslayır. Amma TipTap-ın yazı sahəsi
 * `contenteditable` div-dir və Chrome `<label>`-ə düşən `mousedown`-u «bağlı
 * idarəetməni fokusla» əməliyyatı kimi tutub susdurur; contenteditable isə
 * label-ə bağlana bilən element DEYİL. Nəticə: klik heç yerə getmir, kursor
 * qoyulmur. İstifadəçi yazmağa çalışır və yalnız 4-5 klikdən sonra (ikiqat /
 * üçqat kliklə gələn mətn seçməsi hesabına) təsadüfən alınır.
 *
 * ALTI FORMANIN HAMISINDA vardı: bloq, kurs, ölkə, səhifə, layihə, müəllim.
 * Ona görə yoxlama tək fayla yox, BÜTÜN formalara baxır — yeni forma yazan
 * adam eyni tələyə düşməsin.
 */

const FORMS = "src/app/(protected)/dashboard/_forms";

const files = fs
  .readdirSync(FORMS)
  .filter((f) => /\.jsx?$/.test(f))
  .map((f) => ({ name: f, src: fs.readFileSync(path.join(FORMS, f), "utf8") }));

/** `<Field …>` açılış teqlərini məzmunu ilə birlikdə çıxar. */
function fieldsWithEditor(src) {
  const out = [];
  const re = /<Field\b([^>]*)>/g;
  for (const m of src.matchAll(re)) {
    // Bu `<Field>`-in bağlanmasına qədər olan hissə
    const rest = src.slice(m.index + m[0].length);
    const end = rest.indexOf("</Field>");
    const body = end === -1 ? rest : rest.slice(0, end);
    if (/<(LocalizedEditor|TiptapEditor)\b/.test(body)) out.push({ attrs: m[1], body });
  }
  return out;
}

describe("redaktor sahələri", () => {
  it("redaktor saxlayan hər `<Field>` `as=\"div\"` ilədir", () => {
    const bad = [];
    let found = 0;
    for (const { name, src } of files) {
      for (const f of fieldsWithEditor(src)) {
        found += 1;
        if (!/\bas\s*=\s*["']div["']/.test(f.attrs)) bad.push(`${name}: <Field${f.attrs}>`);
      }
    }
    // Heç nə tapılmasa test boş yerə «keçərdi» — sayğac bunu tutur.
    expect(found, "heç bir redaktor sahəsi tapılmadı — selektor köhnəlib?").toBeGreaterThanOrEqual(6);
    expect(bad, `redaktor <label> içindədir:\n${bad.join("\n")}`).toEqual([]);
  });

  it("`Field` `as` prop-unu qəbul edir və defolt `label` qalır", () => {
    const kit = files.find((f) => f.name === "kit.jsx");
    expect(kit, "kit.jsx tapılmadı").toBeTruthy();
    expect(kit.src).toMatch(/as\s*=\s*["']label["']/); // defolt dəyişməyib
    expect(kit.src).toMatch(/const Tag = as/);
    expect(kit.src).toMatch(/<Tag className=/);
  });
});

describe("redaktorun yazı sahəsi qutunu doldurur", () => {
  const editor = fs.readFileSync("src/components/editor/TiptapEditor.jsx", "utf8");

  it("`.ProseMirror` sabit `min-h` ilə kilidlənməyib", () => {
    // NASAZLIQ: yazı sahəsi `min-h-[300px]`, xarici qutu isə 500px idi —
    // qutunun ALT 200 PİKSELİ ölü zona olurdu, orada klikləmək kursor
    // qoymurdu. Aşağıya klikləmək isə ən təbii hərəkətdir.
    expect(editor).not.toMatch(/class:\s*['"][^'"]*min-h-\[\d+px\]/);
    expect(editor).toMatch(/class:\s*['"][^'"]*\bflex-1\b/);
  });

  it("`EditorContent` sarğısı flex sütundur", () => {
    // `flex-1` yalnız valideyn flex konteyner olanda hündürlüyü tutur.
    const m = editor.match(/<EditorContent[\s\S]*?\/>/);
    expect(m, "EditorContent tapılmadı").toBeTruthy();
    expect(m[0]).toMatch(/className="[^"]*\bflex\b[^"]*\bflex-col\b/);
  });
});
