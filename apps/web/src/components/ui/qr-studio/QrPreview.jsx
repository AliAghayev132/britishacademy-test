// Icons
import { AlertTriangle } from "lucide-react";

/** Canlı önbaxış, ölçü sətri və böyük logo xəbərdarlığı. */
export default function QrPreview({ svg, transparent, plan, logoBusy, risky }) {
  return (
    <>
      <div
        className="rounded-xl border border-gray-200 p-3 [&_svg]:h-auto [&_svg]:w-full"
        style={{
          // Şəffaf fon seçiləndə dama-dama altlıq — ağ QR ağ səhifədə
          // görünməz olardı.
          backgroundImage: transparent
            ? "linear-gradient(45deg,#e5e7eb 25%,transparent 25%),linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e7eb 75%),linear-gradient(-45deg,transparent 75%,#e5e7eb 75%)"
            : undefined,
          backgroundSize: transparent ? "16px 16px" : undefined,
          backgroundPosition: transparent ? "0 0,0 8px,8px -8px,-8px 0" : undefined,
        }}
        // Sətir bu modulda qurulur; istifadəçi mətni `escapeXml` ilə
        // qaçırılır, rənglər hex şablonu ilə süzülür.
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="mt-2 text-center text-xs text-gray-400">
        {plan ? `${plan.width} × ${plan.height} px · ${plan.modules} modul` : "—"}
        {logoBusy ? " · logo yüklənir…" : ""}
      </p>

      {risky && (
        <p className="mt-3 flex gap-2 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <span>
            Logo böyükdür. Kod hələ oxuna bilər, amma zədəli və ya uzaqdan
            çəkilmiş şəkildə tutulmaya bilər — <b>çapa göndərməzdən əvvəl
            telefonla yoxla</b>.
          </span>
        </p>
      )}
    </>
  );
}
