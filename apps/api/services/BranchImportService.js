// Models
import { Branch } from "#models";
// Data
import { BRANCHES } from "../data/branchData.mjs";

/**
 * Filial əlaqə məlumatlarının importu.
 *
 * Real ünvan, telefon, WhatsApp və xəritə linkləri seed faylında idi, amma
 * seed BÜTÜN məzmunu silib yenidən qurur — mövcud saytda onu işlətmək olmaz.
 * Bu servis yalnız filial sətirlərini yeniləyir, başqa heç nəyə toxunmur.
 *
 * Filial NORMALLAŞDIRILMIŞ ADDA açar sözə görə tapılır, slug-a görə yox:
 * seed ilə canlı bazada slug fərqlənə bilər (nerimanov-filiali vs
 * neriman-nerimanov-filiali).
 *
 * İDEMPOTENTDİR — təkrar işlədilə bilər.
 */

/** AZ hərflərinə davamlı normallaşdırma. */
const norm = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ə/g, "e")
    .trim();

/** Lokallaşdırılmış dəyərdən mətn götür. */
const az = (v) => (v && typeof v === "object" ? v.az || v.en || v.ru || "" : v || "");

/** Filial adından tanınma açar sözü. */
const KEYWORDS = [
  { kw: "caspian", match: "Mərkəz — Caspian Plaza" },
  { kw: "elmler", match: "Elmlər Akademiyası filialı" },
  { kw: "nerimanov", match: "Nəriman Nərimanov filialı" },
  { kw: "ehmedli", match: "Əhmədli filialı" },
];

/**
 * @param {object} opts
 * @param {boolean} [opts.dryRun]  yalnız hesabat, baza dəyişmir
 */
export async function importBranchData({ dryRun = false } = {}) {
  const existing = await Branch.find({ isDeleted: false });

  const report = [];
  const warnings = [];
  let updated = 0;
  let created = 0;

  for (const row of BRANCHES) {
    const key = KEYWORDS.find((k) => k.match === az(row.name));
    const kw = key ? key.kw : norm(az(row.name));

    const found = existing.find((b) => norm(az(b.name)).includes(kw));

    // Nəyin dəyişdiyini hesabatda göstərmək üçün.
    const changes = [];
    if (found) {
      if (az(found.phone) !== row.phone) changes.push("telefon");
      if (found.whatsapp !== row.whatsapp) changes.push("WhatsApp");
      if (found.mapUrl !== row.mapUrl) changes.push("xəritə");
      if (norm(az(found.address)) !== norm(az(row.address))) changes.push("ünvan");
      const c = row.coords;
      if (c && (found.coords?.lat !== c.lat || found.coords?.lng !== c.lng)) changes.push("koordinat");
    }

    if (!dryRun) {
      if (found) {
        found.address = row.address;
        found.district = row.district;
        found.metro = row.metro;
        found.phone = row.phone;
        found.whatsapp = row.whatsapp;
        found.mapUrl = row.mapUrl;
        // Koordinat OLANDA xəritə birbaşa embed olunur; olmayanda ünvana
        // görə qurulur, ona görə köhnə dəyəri silmirik.
        if (row.coords) found.coords = row.coords;
        found.workingHours = row.workingHours;
        if (row.isMain) found.isMain = true;
        await found.save();
        updated += 1;
      } else {
        await Branch.create(row);
        created += 1;
      }
    } else if (found) updated += 1;
    else created += 1;

    if (!found) {
      warnings.push(`«${az(row.name)}» bazada tapılmadı — yeni filial kimi yaradılır`);
    }

    report.push({
      name: az(row.name),
      status: found ? (changes.length ? `yeniləndi: ${changes.join(", ")}` : "dəyişiklik yoxdur") : "yaradıldı",
      phone: row.phone,
      map: row.coords ? "koordinat" : row.mapUrl ? "ünvan" : "—",
    });
  }

  return { dryRun, updated, created, total: BRANCHES.length, report, warnings };
}
