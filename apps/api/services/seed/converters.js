// Data
import { tri } from "#data";

// ── Converters ──
//
// Qiymət generatoru SİLİNDİ. Əvvəl hər kurs üçün `base` dəyəri götürülüb
// filiala görə ±10 AZN sürüşdürülür, fərdi dərs isə qrupun 2.2 mislinə
// yuvarlaqlaşdırılırdı — yəni bütün qiymətlər DÜSTURLA uydurulmuşdu və
// həqiqi qiymətlərlə əlaqəsi yox idi. Belə rəqəmlər saytda göstərilməkdənsə
// heç olmaması yaxşıdır: admin paneldən doldurulur.

/**
 * Siyahı tipli sahə ({ az, en, ru } — hər dil üçün sətir-sətir mətn).
 *
 * `content.$.items` LIST_LOCALIZED_FIELDS-dədir: massiv yox, hər dil üçün
 * sətir keçidi ilə ayrılmış MƏTN saxlanılır (boş massiv truthy olduğuna görə
 * AZ fallback-i sındırardı).
 */
export const triList = (arr) => {
  const parts = (arr || []).map(tri);
  return {
    az: parts.map((x) => x.az).join("\n"),
    en: parts.map((x) => x.en).join("\n"),
    ru: parts.map((x) => x.ru).join("\n"),
  };
};

/** Boş dəyəri toxunulmaz burax — tri(undefined) {az:undefined} qaytarardı. */
export const triOpt = (v) => (v ? tri(v) : undefined);

export function toContentBlocks(C) {
  const blocks = [];
  (C.intro || []).forEach((body) => blocks.push({ type: "paragraph", body: tri(body) }));
  (C.sections || []).forEach((s) => {
    const base = { heading: triOpt(s.t), headingLevel: s.h === 3 ? 3 : 2 };
    if (s.p && s.p.length) blocks.push({ ...base, type: "paragraph", body: tri(s.p.join("\n\n")) });
    else blocks.push({ ...base, type: "paragraph", body: tri("") });
    if (s.ul) blocks.push({ type: "list", items: triList(s.ul) });
    if (s.dl) blocks.push({ type: "definitions", definitions: s.dl.map(([term, description]) => ({ term: tri(term), description: tri(description) })) });
    if (s.highlight) blocks.push({ type: "highlight", body: tri(s.highlight) });
    if (s.note) blocks.push({ type: "note", body: tri(s.note) });
  });
  return blocks;
}

export const toInfo = (C) => (C.info || []).map(([label, value]) => ({ label: tri(label), value: tri(value) }));
export const toFaq = (C) => (C.faq || []).map(([question, answer]) => ({ question: tri(question), answer: tri(answer) }));
