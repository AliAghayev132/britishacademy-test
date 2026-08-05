"use client";

// ── Developer tools ──
// Admin-only maintenance. Currently: reload the demo/mock content into the DB
// with one click (wipes existing content first). Handy for a fresh environment.

// React
import { useState } from "react";
// UI
import Swal from "sweetalert2";
import { Database, TriangleAlert } from "lucide-react";
// Data
import { useAdminSeedMutation } from "@/store/api/adminApi";

export default function DeveloperPage() {
  const [seed, { isLoading }] = useAdminSeedMutation();
  const [counts, setCounts] = useState(null);

  // ── Handlers ──
  const runSeed = async () => {
    const ok = await Swal.fire({
      icon: "warning",
      title: "Mock data yüklənsin?",
      html: "Bu əməliyyat <b>mövcud bütün content-i silir</b> (kurslar, müəllimlər, filiallar, dərs qrafiki, rəylər, menyu...) və yenidən demo data ilə doldurur.<br><br>Müraciətlər (leads) və istifadəçilər silinmir.",
      showCancelButton: true,
      confirmButtonText: "Bəli, yüklə",
      cancelButtonText: "İmtina",
      confirmButtonColor: "#B00E28",
    });
    if (!ok.isConfirmed) return;

    try {
      const res = await seed().unwrap();
      setCounts(res?.data?.counts || null);
      Swal.fire({ icon: "success", title: "Hazırdır!", text: res?.message || "Mock data yükləndi" });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Alınmadı", text: err?.data?.message || "Xəta baş verdi" });
    }
  };

  // ── Render ──
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-gray-900">Developer</h1>
      <p className="mb-6 text-sm text-gray-500">Yalnız admin üçün texniki alətlər.</p>

      <div className="max-w-2xl rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-blue-50 text-blue-900">
            <Database className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-900">Mock datanı yüklə</h2>
            <p className="mt-1 text-sm text-gray-600">
              İndiyə qədərki statik sayt məzmununu (4 filial, 8 müəllim, 27 kurs,
              105 dərs qrafiki, xaricdə təhsil, rəylər, menyu və s.) bir kliklə sistemə yükləyir.
            </p>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              <TriangleAlert className="mt-0.5 h-4 w-4 flex-none" />
              <span>Diqqət: mövcud content <b>tamamilə əvəzlənir</b>. Müraciətlər və istifadəçilər toxunulmur.</span>
            </div>

            <button
              onClick={runSeed}
              disabled={isLoading}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              <Database className="h-4 w-4" />
              {isLoading ? "Yüklənir…" : "Mock datanı yüklə"}
            </button>

            {counts && (
              <div className="mt-6">
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Yükləndi</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Object.entries(counts).map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                      <span className="font-bold text-gray-900">{v}</span>{" "}
                      <span className="text-gray-500">{k}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
