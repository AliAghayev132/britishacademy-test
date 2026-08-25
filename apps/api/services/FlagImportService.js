// Node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Models
import { Destination } from "#models";

// Services
import { registerMedia } from "./MediaLibraryService.js";

/**
 * Ölkə bayraqlarını qalereyaya endirir və ölkə kartlarına bağlayır.
 *
 * Niyə lazım oldu: `Destination.image` sahəsi boş idi və kart emoji bayrağa
 * düşürdü — Windows bayraq emojilərini dəstəkləmir, ona görə admin heç nə
 * görmürdü. Bayraqları əl ilə tapıb yükləmək 15+ ölkə üçün əziyyətlidir.
 *
 * Mənbə: flagcdn.com (açar tələb etmir). Fayllar LOKALA endirilir — sayt
 * kənar CDN-dən asılı qalmır.
 */

// Ölkə adı (AZ) → ISO 3166-1 alpha-2 kodu
const ISO = {
  almaniya: "de", türkiyə: "tr", turkiye: "tr", ingiltərə: "gb", ingiltere: "gb",
  britaniya: "gb", kanada: "ca", polşa: "pl", polsa: "pl", latviya: "lv",
  macarıstan: "hu", macaristan: "hu", litva: "lt", rusiya: "ru",
  gürcüstan: "ge", gurcustan: "ge", estoniya: "ee", amerika: "us", abş: "us",
  fransa: "fr", ispaniya: "es", italiya: "it", niderland: "nl", hollandiya: "nl",
  çexiya: "cz", cexiya: "cz", avstriya: "at", isveç: "se", isvec: "se",
  isveçrə: "ch", ukrayna: "ua", rumıniya: "ro", rumaniya: "ro",
  bolqarıstan: "bg", yunanıstan: "gr", portuqaliya: "pt", belçika: "be",
  danimarka: "dk", norveç: "no", finlandiya: "fi", polşa_: "pl",
  malta: "mt", kipr: "cy", slovakiya: "sk", sloveniya: "si", xorvatiya: "hr",
};

/** AZ adını normallaşdır (İ/ı/ə fərqlərini götür). */
const norm = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ə/g, "e")
    .trim();

/** Lokallaşmış dəyərdən AZ mətni götür. */
const az = (v) => (v && typeof v === "object" ? v.az || v.en || v.ru || "" : v || "");

/** ISO kodunu tap — həm birbaşa, həm normallaşdırılmış açarlarla. */
function isoFor(country) {
  const raw = String(country || "").toLowerCase().trim();
  if (ISO[raw]) return ISO[raw];
  const n = norm(country);
  for (const [k, v] of Object.entries(ISO)) {
    if (norm(k) === n) return v;
  }
  return null;
}

/**
 * @param {object} opts
 * @param {boolean} [opts.overwrite] şəkli olan ölkələri də yenilə
 * @param {number}  [opts.width]     flagcdn genişliyi (w320/w640/w1280)
 */
export async function importFlags({ overwrite = false, width = 1280 } = {}) {
  const uploadRoot = path.resolve("uploads", "flags");
  fs.mkdirSync(uploadRoot, { recursive: true });

  const destinations = await Destination.find({ isDeleted: false }).select("country image slug");
  const report = [];
  let imported = 0;
  let skipped = 0;

  for (const d of destinations) {
    const country = az(d.country);
    const code = isoFor(country);

    if (!code) {
      report.push({ country, status: "ISO kodu tapılmadı" });
      skipped += 1;
      continue;
    }
    if (d.image && !overwrite) {
      report.push({ country, status: "şəkli var — ötürüldü" });
      skipped += 1;
      continue;
    }

    try {
      const src = `https://flagcdn.com/w${width}/${code}.png`;
      const res = await fetch(src);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());

      const name = `${code}-${crypto.randomBytes(6).toString("hex")}.png`;
      fs.writeFileSync(path.join(uploadRoot, name), buf);
      const url = `/uploads/flags/${name}`;

      await registerMedia({
        url,
        file: { mimetype: "image/png", size: buf.length },
        folder: "bayraqlar",
        tags: [country, code, "bayraq"],
        type: "image",
      });

      d.image = url;
      await d.save();

      imported += 1;
      report.push({ country, status: "endirildi", url, kb: Math.round(buf.length / 1024) });
    } catch (err) {
      skipped += 1;
      report.push({ country, status: `xəta: ${err.message}` });
    }
  }

  return { imported, skipped, total: destinations.length, report };
}
