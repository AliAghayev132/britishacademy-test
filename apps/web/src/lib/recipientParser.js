// ── Alıcı siyahısı parseri (Excel / CSV / əl ilə yazılan mətn) ──
//
// Fayl BRAUZERDƏ parse olunur, serverə yalnız hazır JSON siyahı gedir. Belə
// olduqda 10 MB-lıq Excel yüklənmir, server yeni asılılıq götürmür və admin
// göndərmədən əvvəl nəticəni dərhal görür.
//
// SheetJS rəsmi CDN-dən quraşdırılıb (0.20.3) — npm-dəki 0.18.5-də məlum
// prototype-pollution və ReDoS zəiflikləri var.

// Libraries
import * as XLSX from "xlsx";

/** Başlıq adlarını tanımaq üçün sinonimlər (kiçik hərflə müqayisə olunur). */
const HEAD = {
  name: ["ad", "adı", "ad soyad", "name", "fullname", "full name", "имя", "фио"],
  phone: ["nömrə", "nomre", "telefon", "tel", "phone", "mobile", "number", "телефон", "номер"],
  email: ["e-poçt", "epoct", "email", "e-mail", "mail", "почта", "эл. почта"],
};

const norm = (v) => String(v ?? "").trim().toLowerCase();

/** Sətir obyektindəki sütunları ad/telefon/e-poçt sahələrinə uyğunlaşdır. */
function mapRow(row) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    const k = norm(key);
    if (!out.name && HEAD.name.includes(k)) out.name = String(value ?? "").trim();
    else if (!out.phone && HEAD.phone.includes(k)) out.phone = String(value ?? "").trim();
    else if (!out.email && HEAD.email.includes(k)) out.email = String(value ?? "").trim();
  }
  return out;
}

/**
 * Excel/CSV faylını alıcı siyahısına çevir.
 *
 * Başlıq sətri tanınırsa (Ad / Nömrə / E-poçt) sütunlar ona görə oxunur.
 * Tanınmırsa fayl başlıqsız sayılır: hər sətrin ilk xanası dəyər kimi götürülür.
 *
 * @returns {Promise<{ rows: Array, headerDetected: boolean, sheet: string }>}
 */
export async function parseSpreadsheet(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { rows: [], headerDetected: false, sheet: "" };

  const ws = wb.Sheets[sheetName];
  // Əvvəlcə başlıqlı oxumağa çalış.
  const objects = XLSX.utils.sheet_to_json(ws, { defval: "" });
  const firstKeys = objects.length ? Object.keys(objects[0]).map(norm) : [];
  const known = [...HEAD.name, ...HEAD.phone, ...HEAD.email];
  const headerDetected = firstKeys.some((k) => known.includes(k));

  if (headerDetected) {
    const rows = objects.map(mapRow).filter((r) => r.name || r.phone || r.email);
    return { rows, headerDetected: true, sheet: sheetName };
  }

  // Başlıq yoxdur — matris kimi oxu, ilk dolu xananı dəyər say.
  const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  const rows = [];
  for (const line of matrix) {
    const cells = line.map((c) => String(c ?? "").trim()).filter(Boolean);
    if (!cells.length) continue;
    // İki xana varsa: "Ad" + "dəyər" ehtimalı
    if (cells.length >= 2) rows.push({ name: cells[0], value: cells[1] });
    else rows.push({ value: cells[0] });
  }
  return { rows, headerDetected: false, sheet: sheetName };
}

/** Şablonun başlıqları — parserin tanıdığı adlardandır (bax HEAD). */
export const TEMPLATE_HEADERS = ["Ad", "Nömrə", "E-poçt"];
const TEMPLATE_ROWS = 1000;

/**
 * Doldurulmağa hazır Excel şablonu (workbook obyekti).
 *
 * Birinci vərəq «Alıcılar» — yalnız başlıq; parser məhz birinci vərəqi
 * oxuyur, ona görə nümunə sətirlər oraya QOYULMUR (yoxsa silinməsi unudulanda
 * nümunə nömrələrə mesaj gedərdi). Nümunə və qaydalar ikinci vərəqdədir.
 *
 * Nömrə və e-poçt sütunları mətn formatındadır: Excel «0501234567»-ni ədəd
 * sayıb baştakı sıfırı silirdi.
 */
export function buildRecipientTemplate() {
  const recipients = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
  for (let r = 1; r <= TEMPLATE_ROWS; r += 1) {
    for (const c of [1, 2]) {
      recipients[XLSX.utils.encode_cell({ r, c })] = { t: "s", v: "", z: "@" };
    }
  }
  recipients["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: TEMPLATE_ROWS, c: 2 } });
  recipients["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 30 }];

  const guide = XLSX.utils.aoa_to_sheet([
    ["Necə doldurmalı"],
    [],
    ["1. «Alıcılar» vərəqində hər sətrə bir nəfər yazın. Başlıq sətrini silməyin."],
    ["2. WhatsApp göndərişi üçün «Nömrə», e-poçt göndərişi üçün «E-poçt» sütunu kifayətdir."],
    ["3. «Ad» istəyə bağlıdır — mesajdakı {{ad}} dəyişəninin yerinə yazılır."],
    ["4. Nömrə istənilən formada ola bilər: 0501234567, 994501234567, +994 50 123 45 67."],
    ["5. Faylı yadda saxlayıb admin paneldə «Excel faylı» mənbəyi ilə yükləyin."],
    [],
    ["Nümunə (bu vərəq oxunmur):"],
    TEMPLATE_HEADERS,
    ["Aynur Məmmədova", "0501234567", "aynur@mail.com"],
    ["Elvin Əliyev", "+994 55 212 41 51", ""],
  ]);
  guide["!cols"] = [{ wch: 28 }, { wch: 22 }, { wch: 30 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, recipients, "Alıcılar");
  XLSX.utils.book_append_sheet(wb, guide, "Təlimat");
  return wb;
}

/** Şablonu brauzerdə .xlsx kimi endir. */
export function downloadRecipientTemplate() {
  XLSX.writeFile(buildRecipientTemplate(), "toplu-gonderis-sablonu.xlsx");
}

/**
 * Əl ilə yazılan mətni siyahıya çevir — hər sətir bir alıcı.
 *
 * Dəstəklənən formatlar:
 *   0501234567
 *   Aynur, 0501234567
 *   Aynur; aynur@mail.com
 *   Aynur - 0501234567
 */
export function parseLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s*[,;|]\s*|\s+[-–—]\s+/).filter(Boolean);
      if (parts.length >= 2) return { name: parts[0], value: parts[1] };
      return { value: parts[0] || line };
    });
}
