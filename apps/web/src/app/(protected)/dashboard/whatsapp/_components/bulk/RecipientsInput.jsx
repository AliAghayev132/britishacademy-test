"use client";

// Icons
import { Download, Loader2, FileSpreadsheet, Upload, X } from "lucide-react";

// Components
import { Select } from "@/components";

// Lib
import { downloadRecipientTemplate, parseLines } from "@/lib";

// Local
import { input, label, LEAD_STATUSES } from "../shared";

/**
 * Mənbəyə görə giriş: müraciət statusu / Excel faylı / əl ilə siyahı.
 * State BulkTab-dadır — göndəriş gedərkən forma gizlənir, qayıdanda
 * seçilmiş fayl və yazılmış siyahı itməsin.
 */
export function RecipientsInput({
  source,
  isEmail,
  leadStatus,
  onLeadStatus,
  rows,
  fileName,
  parsing,
  onFile,
  onClearFile,
  lines,
  onLines,
}) {
  return (
    <>
      {source === "leads" && (
        <div>
          <label className={label}>Müraciət statusu</label>
          <Select value={leadStatus} onChange={(e) => onLeadStatus(e.target.value)} options={LEAD_STATUSES} ariaLabel="Müraciət statusu" />
          <p className="mt-1 text-xs text-gray-400">
            {isEmail
              ? "E-poçtu olmayan müraciətlər avtomatik ötürülür."
              : "Nömrəsi olmayan müraciətlər avtomatik ötürülür."}
          </p>
        </div>
      )}

      {source === "excel" && (
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label className="block text-sm font-medium text-gray-700">Excel / CSV faylı</label>
            {/* Hazır şablon — başlıqlar parserin tanıdığı adlardır, nömrə
                sütunu mətn formatındadır (baştakı 0 itmir). */}
            <button
              type="button"
              onClick={downloadRecipientTemplate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              <Download className="h-3.5 w-3.5" />
              Şablonu endir
            </button>
          </div>
          {rows.length > 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-2.5">
              <FileSpreadsheet className="h-5 w-5 flex-none text-emerald-600" />
              <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{fileName}</span>
              <span className="flex-none rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                {rows.length} sətir
              </span>
              <button
                onClick={onClearFile}
                className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50"
                aria-label="Sil"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-5 text-sm font-medium text-gray-500 transition-colors hover:border-[#00157A] hover:text-[#00157A]">
              {parsing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              {parsing ? "Oxunur…" : "Fayl seç (.xlsx, .xls, .csv)"}
              <input type="file" accept=".xlsx,.xls,.csv" onChange={onFile} className="hidden" />
            </label>
          )}
          <p className="mt-1 text-xs text-gray-400">
            Başlıq sətri varsa <b>Ad</b>, <b>Nömrə</b>, <b>E-poçt</b> sütunları tanınır.
            Başlıq yoxdursa hər sətrin ilk xanası dəyər sayılır.
          </p>
        </div>
      )}

      {source === "list" && (
        <div>
          <label className={label}>Siyahı — hər sətirdə bir alıcı</label>
          <textarea
            rows={7}
            value={lines}
            onChange={(e) => onLines(e.target.value)}
            placeholder={isEmail
              ? "aynur@mail.com\nElvin, elvin@mail.com\nnigar@mail.com"
              : "0501234567\nAynur, 0552124151\nElvin - 0777777777"}
            className={`${input} resize-none font-mono text-sm`}
          />
          <p className="mt-1 text-xs text-gray-400">
            {parseLines(lines).length} sətir · «Ad, dəyər» formatı da qəbul olunur
            (vergül, nöqtəli vergül və ya tire ilə).
          </p>
        </div>
      )}
    </>
  );
}
