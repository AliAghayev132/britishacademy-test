/**
 * Müraciətlərin faylı — admin paneldə brauzerdə qurulur.
 *
 *   • Excel (.xlsx) — müraciətlər reklam sütunları ilə. CSV deyil: Excel-in
 *     AZ/RU dil ayarında ayırıcı «;»-dir, vergüllü CSV bir sütuna yığılırdı;
 *     «+994…» telefonu isə rəqəmə çevrilib «+» itirdi. xlsx-də hər xana mətndir.
 *   • Google Ads offline konversiya faylı (.csv) — Google-un yükləmə şablonu.
 */

const pickAz = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v.az || v.en || v.ru || "" : v || "");

/** Bakı vaxtı ilə «YYYY-MM-DD HH:mm:ss». Azərbaycanda yay vaxtı yoxdur — həmişə +04:00. */
export function bakuDateTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Baku",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

/**
 * Müraciət → Excel sətri. Başlıqlar admin cədvəlindəki adlarla eynidir.
 * `labels` — { status, source, channel } xəritələri; `campaignName` — ID → ad.
 */
export function leadExportRows(items, { labels = {}, campaignName = {} } = {}) {
  return (items || []).map((l) => {
    const a = l.attribution || {};
    return {
      Tarix: bakuDateTime(l.createdAt),
      Ad: l.name || "",
      Telefon: l.phone || "",
      "E-poçt": l.email || "",
      "Kurs / maraq": pickAz(l.course?.title) || pickAz(l.interest),
      Ölkələr: (l.destinations || []).map((d) => pickAz(d?.country)).filter(Boolean).join(", "),
      Filial: pickAz(l.branch?.name),
      Forma: labels.source?.[l.source] || l.source || "",
      Status: labels.status?.[l.status] || l.status || "",
      "Reklam mənbəyi": a.channel ? labels.channel?.[a.channel] || a.channel : "",
      "Kampaniya adı": a.campaign ? campaignName[a.campaign] || "" : "",
      "Kampaniya ID": a.campaign || "",
      "Açar söz": a.term || "",
      "Reklam qrupu": a.content || "",
      utm_source: a.source || "",
      utm_medium: a.medium || "",
      "Google klik kodu (gclid)": a.gclid || "",
      "Açılış səhifəsi": a.landing || "",
      "Gəldiyi sayt": a.referrerHost || "",
      Qeyd: l.message || "",
      "Operator qeydi": l.note || "",
      "Kim işləyib": [l.handledBy?.firstName, l.handledBy?.lastName].filter(Boolean).join(" "),
    };
  });
}

export async function downloadLeadsXlsx(rows, filename) {
  const XLSX = await import("xlsx"); // ~400 KB — yalnız düymə basılanda yüklənir
  const ws = XLSX.utils.json_to_sheet(rows);
  // Sütun eni başlığa və ilk sətirlərə görə — açılanda oxunaqlı olsun.
  const keys = Object.keys(rows[0] || {});
  ws["!cols"] = keys.map((k) => ({
    wch: Math.min(48, Math.max(k.length, ...rows.slice(0, 200).map((r) => String(r[k] ?? "").length)) + 2),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Müraciətlər");
  XLSX.writeFile(wb, filename);
}

const csvCell = (v) => {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * Google Ads «Konversiyalar → Yükləmələr» şablonu.
 *
 * İlk sətir saat qurşağıdır, vaxtlar isə ona görə yazılır. Konversiya adı
 * Google Ads-də yaradılmış konversiya əməliyyatının adı ilə HƏRF-BƏHƏRF eyni
 * olmalıdır, əks halda sətirlər rədd edilir. Dəyər boş qala bilər.
 */
export function googleConversionsCsv(rows, { name, value = "", currency = "AZN" } = {}) {
  const hasValue = String(value).trim() !== "";
  const lines = [
    "Parameters:TimeZone=+0400",
    "Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency",
    ...(rows || []).map((r) =>
      [r.gclid, name, bakuDateTime(r.conversionAt), hasValue ? value : "", hasValue ? currency : ""].map(csvCell).join(","),
    ),
  ];
  return lines.join("\r\n") + "\r\n";
}

export function downloadText(text, filename, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
