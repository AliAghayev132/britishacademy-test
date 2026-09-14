// Icons
import { ArrowUpCircle } from "lucide-react";

/**
 * Kitabxananın yeni versiyası — WhatsApp Web protokolu tez-tez dəyişir
 * və paket geri qalanda bağlantı SƏBƏBSİZ görünən şəkildə sınır
 * («QR skan olundu, sonra qoşulma gecikdi»). Bunu bilmək üçün əvvəl
 * npm-ə əl ilə baxmaq lazım idi.
 */
export function UpdateNotice({ version }) {
  if (!version?.outdated) return null;
  return (
    <div className="flex flex-wrap items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
      <ArrowUpCircle className="mt-0.5 h-5 w-5 flex-none text-amber-600" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-amber-900">
          whatsapp-web.js yeniləməsi var: v{version.latest}
          <span className="ml-2 font-normal text-amber-700">(quraşdırılıb v{version.installed})</span>
        </p>
        <p className="mt-1 text-sm text-amber-800">
          WhatsApp Web protokolu tez-tez dəyişir. Kitabxana geri qalanda qoşulma
          səbəbsiz görünən şəkildə sınır — QR skan olunur, sonra «qoşulma gecikdi» yazır.
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-white/70 p-2.5 font-mono text-xs text-amber-900">{version.command}</pre>
        <p className="mt-1.5 text-xs text-amber-700">Quraşdırdıqdan sonra API-ni yenidən başladın.</p>
      </div>
    </div>
  );
}
