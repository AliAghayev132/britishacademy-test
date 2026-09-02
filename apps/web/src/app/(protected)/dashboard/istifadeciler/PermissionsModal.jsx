"use client";

// React
import { useState } from "react";
// Data
import { useSelector } from "react-redux";
import { pickAz } from "@/lib/adminResources";
import { useAdminUpdateUserMutation, useAdminLookupsQuery } from "@/store/api/adminApi";
// UI
import { Overlay } from "../_forms/kit";
import { notify } from "@/components/ui/feedback";
import { SECTIONS, SEES_EVERYTHING, ROLE_LABELS } from "@/lib/permissions";
// Icons
import { Check, ShieldCheck, Info } from "lucide-react";

/**
 * Bölmə icazələri modalı.
 *
 * Bir admin hansı bölmələri görəcəyini burada təyin edirik. Seçim həm
 * sidebar-a, həm route mühafizəsinə, həm də SERVER tərəfə (requireSection)
 * təsir edir — yəni gizlədilən bölmə API-dən də bağlıdır.
 *
 * BOŞ SİYAHI = «məhdudiyyət yoxdur». Bu, qəsdən belədir: sistem tətbiq
 * olunanda mövcud adminlərin icazə massivi boş idi və «boş = heç nə»
 * qaydası onları paneldən kilidləyərdi.
 */
export function PermissionsModal({ user, onClose }) {
  const me = useSelector((s) => s.auth.user);
  const [selected, setSelected] = useState(() => new Set(user?.permissions || []));
  // Ölkə əhatəsi — boş = məhdudiyyət yoxdur (serverdəki konvensiya ilə eyni).
  const [dests, setDests] = useState(() => new Set((user?.allowedDestinations || []).map(String)));
  const { data: lookups } = useAdminLookupsQuery();
  const allDestinations = lookups?.data?.destinations || [];
  const [branches, setBranches] = useState(() => new Set((user?.allowedBranches || []).map(String)));
  const allBranches = lookups?.data?.branches || [];
  const [error, setError] = useState("");
  const [update, { isLoading }] = useAdminUpdateUserMutation();

  const unrestricted = SEES_EVERYTHING.includes(user?.role);

  const toggle = (key) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleDest = (id) =>
    setDests((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleBranch = (id) =>
    setBranches((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const save = async () => {
    setError("");
    try {
      await update({ id: user._id, data: { permissions: [...selected], allowedDestinations: [...dests], allowedBranches: [...branches] } }).unwrap();
      notify.success("İcazələr yeniləndi");
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Yadda saxlanmadı");
    }
  };

  const count = selected.size;

  return (
    <Overlay
      title={`İcazələr — ${user.firstName} ${user.lastName}`}
      onClose={onClose}
      onSave={unrestricted ? undefined : save}
      saving={isLoading}
      error={error}
    >
      {unrestricted ? (
        <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-none" />
          <div>
            <b>{ROLE_LABELS[user.role]}</b> rolu bütün bölmələri görür — icazə
            siyahısı tətbiq olunmur.
            {user.role === "developer" && (
              <> Developer alətləri də yalnız bu rola açıqdır.</>
            )}
            <div className="mt-2 text-blue-700">
              Məhdudlaşdırmaq üçün əvvəlcə rolu <b>Admin</b> və ya{" "}
              <b>Redaktor</b> edin.
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
            <Info className="mt-0.5 h-4 w-4 flex-none text-gray-400" />
            <span>
              İşarələnməyən bölmələr sidebar-da görünmür və həmin səhifələrə
              birbaşa ünvanla da girmək olmur.
              <b> Heç nə seçilməzsə məhdudiyyət tətbiq olunmur</b> (bütün
              bölmələr açıq qalır) — tam bağlamaq üçün hesabı deaktiv edin.
            </span>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Seçilib: <b className="text-gray-900">{count}</b> / {SECTIONS.length}
              {count === 0 && <span className="ml-1 text-amber-600">(məhdudiyyət yoxdur)</span>}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelected(new Set(SECTIONS.map((s) => s.key)))}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Hamısını seç
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Təmizlə
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SECTIONS.map((s) => {
              const on = selected.has(s.key);
              // Developer bölməsi yalnız developer rolundadır — admin-ə
              // verilməsi mənasızdır, ona görə seçilə bilməz.
              const locked = s.key === "developer";
              return (
                <button
                  key={s.key}
                  type="button"
                  disabled={locked}
                  onClick={() => toggle(s.key)}
                  title={locked ? "Yalnız developer rolu üçün" : undefined}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                    locked
                      ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300"
                      : on
                        ? "border-blue-900 bg-blue-50 font-semibold text-blue-900"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`grid h-4 w-4 flex-none place-items-center rounded border ${
                      on && !locked ? "border-blue-900 bg-blue-900 text-white" : "border-gray-300 bg-white"
                    }`}
                  >
                    {on && !locked && <Check className="h-3 w-3" />}
                  </span>
                  {s.label}
                </button>
              );
            })}
          </div>

            {/* Ölkə əhatəsi — yalnız xaricdə təhsil müraciətlərinə aiddir. */}
            {allDestinations.length > 0 && (
              <div className="mt-7">
                <div className="mb-1 text-sm font-bold text-gray-900">Xaricdə təhsil — ölkə əhatəsi</div>
                <p className="mb-3 text-xs text-gray-500">
                  Heç nə seçilməyibsə <b>bütün ölkələr</b> görünür. Ölkə seçilsə,
                  istifadəçi yalnız həmin ölkələrə aid müraciətləri görəcək —
                  siyahıda da, filtrdə də.
                </p>
                <div className="flex flex-wrap gap-2">
                  {allDestinations.map((d) => {
                    const on = dests.has(String(d._id));
                    return (
                      <button
                        key={d._id}
                        type="button"
                        onClick={() => toggleDest(String(d._id))}
                        aria-pressed={on}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                          on
                            ? "border-violet-300 bg-violet-50 text-violet-700"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {pickAz(d.country)}
                      </button>
                    );
                  })}
                </div>
                {dests.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setDests(new Set())}
                    className="mt-2 text-xs font-semibold text-gray-500 underline"
                  >
                    Məhdudiyyəti götür (bütün ölkələr)
                  </button>
                )}
              </div>
            )}

              {/* Filial əhatəsi — adi müraciətlər üçün. */}
              {allBranches.length > 0 && (
                <div className="mt-7">
                  <div className="mb-1 text-sm font-bold text-gray-900">Müraciətlər — filial əhatəsi</div>
                  <p className="mb-3 text-xs text-gray-500">
                    Heç nə seçilməyibsə <b>bütün filiallar</b> görünür. Filialsız
                    müraciətlər (ziyarətçi filial seçməyib) həmişə görünür — əks
                    halda onlar cavabsız qalardı.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allBranches.map((b) => {
                      const on = branches.has(String(b._id));
                      return (
                        <button
                          key={b._id}
                          type="button"
                          onClick={() => toggleBranch(String(b._id))}
                          aria-pressed={on}
                          className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                            on
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : "border-gray-200 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          {pickAz(b.name)}
                        </button>
                      );
                    })}
                  </div>
                  {branches.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setBranches(new Set())}
                      className="mt-2 text-xs font-semibold text-gray-500 underline"
                    >
                      Məhdudiyyəti götür (bütün filiallar)
                    </button>
                  )}
                </div>
              )}
        </>
      )}
    </Overlay>
  );
}
