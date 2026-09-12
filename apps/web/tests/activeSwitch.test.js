import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * «AKTİV / DEAKTİV» — REDAKTƏ PƏNCƏRƏSİNİN ƏN SONUNDA.
 *
 * Əvvəl açar hər formada ayrı yerdə idi (bəzən ortada, bəzən SEO-dan sonra)
 * və gözə dəymirdi. İndi ortaq pəncərənin (Overlay) aşağı panelindədir,
 * «Yadda saxla»nın yanında — bütün formalarda eyni yerdə.
 */

const DIR = "src/app/(protected)/dashboard/_forms";
const read = (f) => fs.readFileSync(path.join(DIR, f), "utf8");

const FORMS = [
  "AdvantageForm.jsx", "BlogCategoryForm.jsx", "BranchForm.jsx", "CourseCategoryForm.jsx",
  "CourseGroupForm.jsx", "CourseWizard.jsx", "DestinationForm.jsx", "FaqForm.jsx",
  "PageForm.jsx", "PartnerForm.jsx", "ProjectForm.jsx", "QuizCategoryForm.jsx",
  "TeacherForm.jsx", "TestimonialForm.jsx",
];

describe("ortaq pəncərə", () => {
  const kit = read("kit.jsx");

  it("Overlay açarı aşağı paneldə göstərir", () => {
    expect(kit).toMatch(/export function Overlay\(\{[^}]*\bactive, onActiveChange\b/);
    // Açar gövdədən (children) SONRA, aşağı paneldədir.
    expect(kit.indexOf("<ActiveSwitch")).toBeGreaterThan(kit.indexOf("{children}</div>"));
  });

  it("açar dəyişəndə «yadda saxlanmayıb» işarəsi qoyulur", () => {
    expect(kit).toMatch(/onActiveChange\(v\);\s*setDirty\(true\);/);
  });
});

describe("formalar", () => {
  it.each(FORMS)("%s — açarı pəncərəyə ötürür, içində təkrar yoxdur", (f) => {
    const s = read(f);
    expect(s).toMatch(/<Overlay\s+active=\{[^}]+\}\s+onActiveChange=/);
    expect(s).not.toMatch(/label="Aktiv/);
  });

  it("isActive saxlanan hər forma siyahıdadır", () => {
    // Yeni forma isActive saxlayıb açarı unutmasın.
    const all = fs.readdirSync(DIR).filter((f) => /Form\.jsx$|Wizard\.jsx$/.test(f));
    // Şərhdəki söz sayılmasın (MenuItemForm: «isActive yoxdur») — yalnız
    // həqiqətən dəyişdirən formalar.
    const withActive = all.filter((f) => /\bsetIsActive\b|isActive: v\b/.test(read(f)));
    expect(withActive.sort()).toEqual([...FORMS].sort());
  });
});
