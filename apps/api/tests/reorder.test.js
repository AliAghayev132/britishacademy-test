import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { RESOURCES } from "../controllers/resourceRegistry.js";
import { planReorder } from "../controllers/adminController.js";

/**
 * TOPLU SIRALAMA (`PATCH /admin/:resource/reorder`).
 *
 * Endpoint mövcud idi, amma paneldə HEÇ İŞLƏDİLMİRDİ — sıranı dəyişmək üçün
 * hər elementi açıb «Sıra» xanasına rəqəm yazmaq lazım gəlirdi. Panelə
 * yuxarı/aşağı oxları qoşulanda endpoint ilk dəfə real yüklə qarşılaşdı və
 * üç boşluq üzə çıxdı:
 *
 *  1. `start` yox idi — panel yalnız CARİ SƏHİFƏNİN id-lərini göndərir; 2-ci
 *     səhifə də 0-dan nömrələnib 1-ci ilə tam toqquşurdu.
 *  2. Yararsız id `findByIdAndUpdate`-i CastError ilə çökdürürdü (500).
 *  3. `order` sahəsi olmayan modeldə (müraciətlər, media) sxemə yad sahə
 *     yazılırdı və heç nəyə təsir etmirdi.
 */

const src = fs.readFileSync("controllers/adminController.js", "utf8");
const reorderFn = src.slice(src.indexOf("const reorder = asyncHandler"), src.indexOf("const updateSettings"));

/** Sıralaması `order` ilə BAŞLAYAN resurslar — oxlar yalnız onlarda mənalıdır. */
const orderFirst = Object.entries(RESOURCES).filter(
  ([, e]) => Object.keys(e.sort || {})[0] === "order",
);

describe("sıralanabilən resurslar", () => {
  it("`order`-ə görə düzülən hər modelin `order` sahəsi var", () => {
    // Əks halda siyahı mövcud olmayan sahəyə görə düzülərdi (yəni sabit sıra),
    // oxlar isə sanki heç nə etmirmiş kimi görünərdi.
    const bad = orderFirst.filter(([, e]) => !e.model.schema.path("order")).map(([k]) => k);
    expect(bad, `sxemdə \`order\` yoxdur: ${bad.join(", ")}`).toEqual([]);
    expect(orderFirst.length).toBeGreaterThanOrEqual(13);
  });

  it("`order` sahəsi olan model mütləq ona görə düzülür", () => {
    // Sahə var, sıralama başqa şeyə görədirsə admin «Sıra» yazır, siyahı isə
    // dəyişmir — istifadəçi üçün səssiz uğursuzluqdur. İstisnalar açıqdır.
    const EXCEPTIONS = {
      "blog-posts": "tarixə görə (createdAt) — bloqda sıra deyil, təzəlik vacibdir",
      "menu-items": "əvvəlcə `location`, sonra `order` — hər yer öz içində sıralanır",
      quizzes: "order-lə başlayır (istisna deyil)",
    };
    const bad = Object.entries(RESOURCES)
      .filter(([k, e]) => e.model.schema.path("order")
        && Object.keys(e.sort || {})[0] !== "order"
        && !EXCEPTIONS[k])
      .map(([k]) => k);
    expect(bad, `\`order\` var, amma ona görə düzülmür: ${bad.join(", ")}`).toEqual([]);
  });
});

describe("planReorder", () => {
  const docs = (...orders) => orders.map((order, i) => ({ _id: `id${i}`, order }));

  it("2-ci səhifədə dəyişiklik 1-ci səhifəni qarışdırmır", () => {
    // Hamısı 0-da (köhnə vəziyyət), səhifə ölçüsü 2: 2-ci səhifədə id3 yuxarı.
    const all = docs(0, 0, 0, 0);
    const ops = planReorder(all, ["id3", "id2"]);
    const order = Object.fromEntries(all.map((d, i) => [d._id, i]));
    for (const { id, order: o } of ops) order[id] = o;
    expect(Object.entries(order).sort((a, b) => a[1] - b[1]).map(([id]) => id)).toEqual(["id0", "id1", "id3", "id2"]);
  });

  it("süzülmüş (qeyri-ardıcıl) elementlər yalnız öz yerlərində dəyişir", () => {
    const all = docs(0, 1, 2, 3, 4);
    expect(planReorder(all, ["id3", "id1"])).toEqual([
      { id: "id3", order: 1 },
      { id: "id1", order: 3 },
    ]);
  });

  it("dəyişməyən sıra yazılmır, naməlum id nəzərə alınmır", () => {
    expect(planReorder(docs(0, 1, 2), ["id0", "id1"])).toEqual([]);
    expect(planReorder(docs(0, 1), ["yoxdur"])).toBeNull();
  });
});

describe("reorder endpoint-inin qorumaları", () => {
  it("bölmə icazəsi yoxlanılır", () => {
    // Yazma əməliyyatıdır — `denySection` olmasa yalnız «müraciətlər» icazəsi
    // olan admin kursların/ölkələrin sırasını dəyişə bilərdi.
    expect(reorderFn).toMatch(/denySection\(req, res, req\.params\.resource\)/);
  });

  it("`order` sahəsi olmayan model rədd edilir", () => {
    expect(reorderFn).toMatch(/schema\.path\("order"\)/);
  });

  it("id-lər ObjectId kimi yoxlanılır", () => {
    expect(reorderFn).toMatch(/isValidObjectId/);
  });

  it("bütün siyahı yenidən nömrələnir (audit #26)", () => {
    expect(reorderFn).toMatch(/planReorder\(all, ids\)/);
  });

  it("massivin ölçüsü məhduddur", () => {
    expect(reorderFn).toMatch(/length\s*>\s*200/);
  });
});
