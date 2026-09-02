"use client";

// React
import { useEffect, useState } from "react";
// Data
import { useAdminGetSettingsQuery, useAdminUpdateSettingsMutation } from "@/store/api/adminApi";
// UI
import { notify } from "@/components/ui/feedback";
import { QueryState } from "@/components/ui/QueryState";
import {
  LocalizedInput,
  LocalizedFormProvider,
  LocaleSwitcher,
  GlobalAiBar,
  toLoc,
  trimLoc,
} from "../_forms/Localized";
import { resolveSections } from "@/lib/homeSections";
import { FeaturedPicker } from "./FeaturedPicker";
// Icons
import { ArrowDown, ArrowUp, Eye, EyeOff, Lock, Save } from "lucide-react";

/**
 * Ana səhifə idarəetməsi — HAMISI BİR YERDƏ.
 *
 * Əvvəl ana səhifənin məzmunu beş ayrı yerdən idarə olunurdu: hero və lent
 * Tənzimləmələrdə, kurslar/ölkələr/rəylər isə öz resurs siyahılarında
 * «isFeatured» açarı ilə. İstifadəçi ana səhifəni qurarkən səhifələr arasında
 * gedib-gəlirdi və hansı dəyişikliyin harada olduğunu izləmək çətinləşirdi.
 *
 * İndi hər şey burada, tablarda:
 *   Bölmələr  — nə görünür, hansı sırada
 *   Hero      — başlıq, sözlər, həblər, rənglər
 *   Lent      — sürüşən sözlər və statistika
 *   Məzmun    — hansı kurs/ölkə/rəy ana səhifədə göstərilir
 */

const label = "mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500";
const input = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500";

const TABS = [
  { key: "sections", label: "Bölmələr" },
  { key: "hero", label: "Hero" },
  { key: "marquee", label: "Lent və statistika" },
  { key: "content", label: "Məzmun seçimi" },
];

/** «Məzmun seçimi» tabındakı resurslar. */
const PICKERS = [
  { key: "courses", label: "Kurslar", resource: "courses", limit: 6, title: "title", sub: "slug" },
  { key: "destinations", label: "Ölkələr", resource: "destinations", limit: 8, title: "country", sub: "tagline" },
  { key: "projects", label: "Layihələr", resource: "projects", limit: 6, title: "title", sub: "tagline" },
  { key: "videos", label: "Video rəylər", resource: "testimonials", limit: 8, title: "name", sub: "achievement", filter: { type: "video" } },
  { key: "testimonials", label: "Yazılı rəylər", resource: "testimonials", limit: 6, title: "name", sub: "achievement", filter: { type: "text" } },
  { key: "teachers", label: "Müəllimlər", resource: "teachers", limit: 8, title: "fullName", sub: "title" },
];

export default function HomeAdminPage() {
  const { data, isLoading, isError, error, refetch } = useAdminGetSettingsQuery();
  const [update, { isLoading: saving }] = useAdminUpdateSettingsMutation();

  const [tab, setTab] = useState("sections");
  const [picker, setPicker] = useState("courses");
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState(null);
  const [dirty, setDirty] = useState(false);

  // Serverdən gələni forma vəziyyətinə köçür (bir dəfə).
  useEffect(() => {
    const s = data?.data?.settings;
    if (!s || form) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data gəlişinə reaksiya, mount deyil
    setRows(resolveSections(s.homeSections));
    setForm({
      hero: {
        titlePrefix: toLoc(s.hero?.titlePrefix),
        subtitle: toLoc(s.hero?.subtitle),
        words: toLoc(Array.isArray(s.hero?.words) ? s.hero.words.join(", ") : s.hero?.words),
        chipsLeft: toLoc(s.hero?.chipsLeft),
        chipsRight: toLoc(s.hero?.chipsRight),
        pills: toLoc(s.hero?.pills),
        colors: (s.hero?.colors || []).join(", "),
      },
      marquee: toLoc(Array.isArray(s.marquee) ? s.marquee.join(", ") : s.marquee),
      stats: (s.stats || []).map((x) => ({ label: toLoc(x.label), value: toLoc(x.value) })),
    });
  }, [data, form]);

  if (isLoading || isError || !form || !rows) {
    return <QueryState isLoading={isLoading || !form} isError={isError} error={error} onRetry={refetch} />;
  }

  const set = (path, value) => {
    setForm((f) => {
      const next = structuredClone(f);
      const keys = path.split(".");
      let cur = next;
      for (const k of keys.slice(0, -1)) cur = cur[k];
      cur[keys.at(-1)] = value;
      return next;
    });
    setDirty(true);
  };

  const toggleSection = (key) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, enabled: !r.enabled } : r)));
    setDirty(true);
  };

  const move = (index, dir) => {
    const next = [...rows];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);
    setDirty(true);
  };

  const save = async () => {
    try {
      await update({
        homeSections: rows.map((r) => ({ key: r.key, enabled: r.enabled })),
        hero: {
          titlePrefix: trimLoc(form.hero.titlePrefix),
          subtitle: trimLoc(form.hero.subtitle),
          words: trimLoc(form.hero.words),
          chipsLeft: trimLoc(form.hero.chipsLeft),
          chipsRight: trimLoc(form.hero.chipsRight),
          pills: trimLoc(form.hero.pills),
          colors: form.hero.colors.split(",").map((x) => x.trim()).filter(Boolean),
        },
        marquee: trimLoc(form.marquee),
        stats: form.stats
          .filter((x) => trimLoc(x.value).az || trimLoc(x.label).az)
          .map((x) => ({ label: trimLoc(x.label), value: trimLoc(x.value) })),
      }).unwrap();
      notify.success("Ana səhifə yeniləndi");
      setDirty(false);
    } catch (err) {
      notify.error(err?.data?.message || "Yadda saxlanmadı");
    }
  };

  const visible = rows.filter((r) => r.enabled).length;
  const active = PICKERS.find((p) => p.key === picker);

  return (
    <LocalizedFormProvider>
    <div className="max-w-4xl">
      {/* Dil keçidi + AI köməkçiləri — provider olmadan yalnız AZ redaktə
          oluna bilərdi, halbuki bütün hero mətnləri 3 dillidir. */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <LocaleSwitcher />
        <GlobalAiBar />
      </div>

      {/* Tablar + yadda saxla */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
                tab === t.key ? "bg-white text-[#00157A] shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Məzmun seçimi dərhal yadda saxlanılır, ona görə düymə orada gizlənir */}
        {tab !== "content" && (
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#00157A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#001d9e] disabled:opacity-40"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saxlanılır…" : dirty ? "Yadda saxla" : "Dəyişiklik yoxdur"}
          </button>
        )}
      </div>

      {/* ── Bölmələr ── */}
      {tab === "sections" && (
        <>
          <p className="mb-3 text-sm text-gray-500">
            Ana səhifədə <b className="text-gray-900">{visible}</b> / {rows.length} bölmə görünür.
            Sıranı oxlarla dəyişin.
          </p>
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div
                key={r.key}
                className={`flex items-start gap-3 rounded-xl border p-4 transition ${
                  r.enabled ? "border-gray-200 bg-white" : "border-dashed border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex flex-col gap-0.5 pt-0.5">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Yuxarı"
                    className="grid h-6 w-6 place-items-center rounded text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-20"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === rows.length - 1}
                    aria-label="Aşağı"
                    className="grid h-6 w-6 place-items-center rounded text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-20"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <span className="mt-1 grid h-6 w-6 flex-none place-items-center rounded-md bg-gray-100 text-xs font-bold text-gray-500">
                  {i + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${r.enabled ? "text-gray-900" : "text-gray-400"}`}>
                      {r.label}
                    </span>
                    {r.locked && (
                      <span title="Bu bölmə gizlədilə bilməz" className="text-gray-300">
                        <Lock className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {r.limit && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-500">
                        maks. {r.limit}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{r.hint}</p>
                </div>

                <button
                  onClick={() => toggleSection(r.key)}
                  disabled={r.locked}
                  title={r.locked ? "Bu bölmə həmişə göstərilir" : r.enabled ? "Gizlət" : "Göstər"}
                  className={`inline-flex flex-none items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    r.locked
                      ? "cursor-not-allowed border-gray-100 text-gray-300"
                      : r.enabled
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300"
                        : "border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}
                >
                  {r.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  {r.enabled ? "Görünür" : "Gizli"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Hero ── */}
      {tab === "hero" && (
        <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:grid-cols-2">
          <div>
            <label className={label}>Başlıq prefiksi (3 dildə)</label>
            <LocalizedInput value={form.hero.titlePrefix} onChange={(v) => set("hero.titlePrefix", v)} />
          </div>
          <div>
            <label className={label}>Alt yazı (3 dildə)</label>
            <LocalizedInput value={form.hero.subtitle} onChange={(v) => set("hero.subtitle", v)} />
          </div>
          <div>
            <label className={label}>Fırlanan sözlər — vergüllə (3 dildə)</label>
            <LocalizedInput value={form.hero.words} onChange={(v) => set("hero.words", v)} />
          </div>
          <div>
            <label className={label}>Rənglər (vergüllə, hex)</label>
            <input className={input} value={form.hero.colors} onChange={(e) => set("hero.colors", e.target.value)} />
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 sm:col-span-2">
            <p className="mb-3 text-xs text-gray-500">
              Hero-nun <b>solunda və sağında</b> üzən sözlər. Hər səhifə açılışında
              siyahıdan <b>təsadüfi 3-ü</b> seçilir — sol və sağ müstəqil şəkildə.
              Boş buraxsanız hazır dəyərlər işlənir.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Sol tərəf — vergüllə (3 dildə)</label>
                <LocalizedInput
                  value={form.hero.chipsLeft}
                  onChange={(v) => set("hero.chipsLeft", v)}
                  placeholder="Speaking, IELTS 8.5, Hallo"
                />
              </div>
              <div>
                <label className={label}>Sağ tərəf — vergüllə (3 dildə)</label>
                <LocalizedInput
                  value={form.hero.chipsRight}
                  onChange={(v) => set("hero.chipsRight", v)}
                  placeholder="Привет, A1 → C1, Konfrans"
                />
              </div>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className={label}>Kateqoriya həbləri — vergüllə (3 dildə)</label>
            <LocalizedInput
              value={form.hero.pills}
              onChange={(v) => set("hero.pills", v)}
              placeholder="İngilis dili, IELTS, Duolingo, Rus dili"
            />
            <p className="mt-1 text-xs text-gray-400">
              Hero-nun altında görünən kateqoriya sırası. Təsadüfi qarışdırılmır —
              yazdığınız ardıcıllıqla göstərilir.
            </p>
          </div>
        </div>
      )}

      {/* ── Lent və statistika ── */}
      {tab === "marquee" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <label className={label}>Hərəkət edən lent — vergüllə (3 dildə)</label>
            <LocalizedInput value={form.marquee} onChange={(v) => set("marquee", v)} />
            <p className="mt-1 text-xs text-gray-400">Hero-nun altında sürüşən sözlər.</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <label className={label}>Statistika (məs. 20 000+ · məzun)</label>
              <button
                onClick={() => set("stats", [...form.stats, { label: toLoc(""), value: toLoc("") }])}
                className="rounded-lg border border-dashed border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-blue-500 hover:text-blue-700"
              >
                + Göstərici
              </button>
            </div>
            {form.stats.length === 0 && <p className="text-sm text-gray-400">Göstərici əlavə edilməyib</p>}
            <div className="space-y-3">
              {form.stats.map((row, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex-1">
                    <label className={label}>Dəyər</label>
                    <LocalizedInput value={row.value} onChange={(v) => set(`stats.${i}.value`, v)} placeholder="20 000+" />
                  </div>
                  <div className="flex-1">
                    <label className={label}>Etiket</label>
                    <LocalizedInput value={row.label} onChange={(v) => set(`stats.${i}.label`, v)} placeholder="məzun tələbə" />
                  </div>
                  <button
                    onClick={() => set("stats", form.stats.filter((_, j) => j !== i))}
                    className="mt-6 rounded-lg border border-gray-200 p-2 text-red-500 hover:bg-red-50"
                    aria-label="Sil"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Məzmun seçimi ── */}
      {tab === "content" && (
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            {PICKERS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPicker(p.key)}
                className={`rounded-lg border px-3.5 py-1.5 text-sm font-semibold transition ${
                  picker === p.key
                    ? "border-[#00157A] bg-[#00157A] text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-3 text-xs text-gray-500">
              Kliklə seçin — dəyişiklik <b>dərhal</b> saxlanılır, ayrıca «yadda
              saxla» lazım deyil.
            </p>
            <FeaturedPicker
              key={active.key}
              resource={active.resource}
              limit={active.limit}
              filter={active.filter}
              titleField={active.title}
              subField={active.sub}
            />
          </div>
        </div>
      )}
    </div>
    </LocalizedFormProvider>
  );
}
