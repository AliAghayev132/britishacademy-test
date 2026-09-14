"use client";

// React
import { useEffect, useState } from "react";

// Icons
import { Save } from "lucide-react";

// Components
import { notify, QueryState } from "@/components";

// Store
import { useAdminGetSettingsQuery, useAdminUpdateSettingsMutation } from "@/store";

// Lib
import { resolveSections } from "@/lib";

// Utils
import { apiErrorMessage, rowKey } from "@/utils";

// Local
import {
  LocalizedFormProvider,
  LocaleSwitcher,
  GlobalAiBar,
  toLoc,
  trimLoc,
  locAz,
} from "../_forms/Localized";
import { SectionsPanel } from "./_components/SectionsPanel";
import { HeroPanel } from "./_components/HeroPanel";
import { MarqueePanel } from "./_components/MarqueePanel";
import { ContentPanel } from "./_components/ContentPanel";

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
 *
 * Bu fayl forma vəziyyətini və yadda saxlamanı saxlayır; hər tabın UI-ı
 * `_components/` altındadır.
 */

const TABS = [
  { key: "sections", label: "Bölmələr" },
  { key: "hero", label: "Hero" },
  { key: "marquee", label: "Lent və statistika" },
  { key: "content", label: "Məzmun seçimi" },
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
        pillLinks: (s.hero?.pillLinks || []).map((x) => ({
          _key: rowKey(),
          label: toLoc(x.label),
          href: x.href || "",
        })),
        colors: (s.hero?.colors || []).join(", "),
      },
      marquee: toLoc(Array.isArray(s.marquee) ? s.marquee.join(", ") : s.marquee),
      stats: (s.stats || []).map((x) => ({ _key: rowKey(), label: toLoc(x.label), value: toLoc(x.value) })),
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
          // Etiketi boş olan sətir atılır — səhvən əlavə edilmiş boş düymə
          // saytda görünməsin.
          pillLinks: (form.hero.pillLinks || [])
            .filter((x) => locAz(x.label).trim())
            .map((x) => ({ label: trimLoc(x.label), href: (x.href || "").trim() })),
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
      notify.error(apiErrorMessage(err, "Yadda saxlanmadı"));
    }
  };

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

        {tab === "sections" && <SectionsPanel rows={rows} move={move} toggleSection={toggleSection} />}
        {tab === "hero" && <HeroPanel form={form} set={set} />}
        {tab === "marquee" && <MarqueePanel form={form} set={set} />}
        {tab === "content" && <ContentPanel picker={picker} setPicker={setPicker} />}
      </div>
    </LocalizedFormProvider>
  );
}
