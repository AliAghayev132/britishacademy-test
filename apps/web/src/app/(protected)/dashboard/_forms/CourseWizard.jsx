"use client";

// ── Course wizard ──
// Creates/edits a course together with its per-branch price matrix and the
// teacher timetable (CourseGroups) in one go, mapping to the composer endpoints
// (POST/PUT /api/admin/courses/full). This is the "kurs yarat" flow: fill the
// course, add the branches it runs at, and for each branch add teacher groups.

// React
import { useEffect, useMemo, useState } from "react";
// Data (RTK Query)
import {
  useAdminLookupsQuery,
  useAdminCourseFullQuery,
  useAdminCreateCourseFullMutation,
  useAdminUpdateCourseFullMutation,
} from "@/store/api/adminApi";
// Local
import {
  Overlay, Field, SectionTitle, TextInput, NumberInput, TextArea,
  NativeSelect, Toggle, MultiSelectChips, AddButton, RemoveButton,
  WEEKDAYS, LEVELS, FORMATS, toId,
} from "./kit";
import { FileUpload } from "@/components/ui/FileUpload";

// ── Defaults / helpers ──
const emptyCourse = () => ({
  title: "", slug: "", category: "", h1: "", lead: "", excerpt: "",
  levels: [],
  lesson: { perWeek: 2, minutes: 90, levelDurationMonths: [1.5, 2] },
  groupSize: { min: 3, max: 6 },
  currency: "AZN", image: "", icon: "",
  seo: { metaTitle: "", metaDescription: "" },
  isFeatured: false, order: 0, isActive: true,
});

const emptyGroup = () => ({ teacher: "", level: "", format: "group", schedule: [], capacity: "" });
const emptyRow = (branch = "") => ({
  branch,
  pricing: { group: { day: "", evening: "" }, individual: { day: "", evening: "" }, note: "" },
  groups: [emptyGroup()],
});

const num = (v) => (v === "" || v === null || v === undefined ? undefined : Number(v));

export function CourseWizard({ item, onClose }) {
  const editingId = item?._id || null;

  // ── Lookups + prefill ──
  const { data: lk } = useAdminLookupsQuery();
  const { data: full, isFetching: loadingFull } = useAdminCourseFullQuery(editingId, { skip: !editingId });

  const branchOpts = useMemo(
    () => (lk?.data?.branches || []).map((b) => ({ value: b._id, label: b.name })),
    [lk],
  );
  const teacherOpts = useMemo(
    () => (lk?.data?.teachers || []).map((t) => ({ value: t._id, label: t.title ? `${t.fullName} · ${t.title}` : t.fullName })),
    [lk],
  );
  const categoryOpts = useMemo(
    () => (lk?.data?.categories || []).map((c) => ({ value: c._id, label: c.name })),
    [lk],
  );
  const branchName = (id) => branchOpts.find((b) => String(b.value) === String(id))?.label || "Filial";

  // ── State ──
  const [course, setCourse] = useState(emptyCourse());
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  // Prefill from the composer response when editing.
  useEffect(() => {
    if (!editingId) return;
    const c = full?.data?.course;
    if (!c) return;
    setCourse({
      ...emptyCourse(),
      ...c,
      category: toId(c.category),
      levels: c.levels || [],
      lesson: { ...emptyCourse().lesson, ...(c.lesson || {}), levelDurationMonths: c.lesson?.levelDurationMonths || [1.5, 2] },
      groupSize: { ...emptyCourse().groupSize, ...(c.groupSize || {}) },
      seo: { metaTitle: c.seo?.metaTitle || "", metaDescription: c.seo?.metaDescription || "" },
    });
    setRows(
      (full.data.branches || []).map((r) => ({
        branch: toId(r.branch),
        pricing: {
          group: { day: r.pricing?.group?.day ?? "", evening: r.pricing?.group?.evening ?? "" },
          individual: { day: r.pricing?.individual?.day ?? "", evening: r.pricing?.individual?.evening ?? "" },
          note: r.pricing?.note || "",
        },
        groups: (r.groups || []).map((g) => ({
          teacher: toId(g.teacher), level: g.level || "", format: g.format || "group",
          schedule: (g.schedule || []).map((s) => ({ weekday: s.weekday, from: s.from, to: s.to })),
          capacity: g.capacity ?? "",
        })),
      })),
    );
  }, [editingId, full]);

  // ── Immutable nested updaters ──
  const patchCourse = (patch) => setCourse((c) => ({ ...c, ...patch }));
  const patchRow = (ri, patch) => setRows((rs) => rs.map((r, i) => (i === ri ? { ...r, ...patch } : r)));
  const patchPricing = (ri, section, key, val) =>
    setRows((rs) => rs.map((r, i) => (i === ri ? { ...r, pricing: { ...r.pricing, [section]: { ...r.pricing[section], [key]: val } } } : r)));
  const patchGroup = (ri, gi, patch) =>
    setRows((rs) => rs.map((r, i) => (i === ri ? { ...r, groups: r.groups.map((g, j) => (j === gi ? { ...g, ...patch } : g)) } : r)));
  const patchSlot = (ri, gi, si, patch) =>
    setRows((rs) => rs.map((r, i) => (i === ri ? {
      ...r, groups: r.groups.map((g, j) => (j === gi ? { ...g, schedule: g.schedule.map((s, k) => (k === si ? { ...s, ...patch } : s)) } : g)),
    } : r)));

  const usedBranches = new Set(rows.map((r) => String(r.branch)).filter(Boolean));
  const freeBranchOpts = branchOpts.filter((b) => !usedBranches.has(String(b.value)));

  // ── Save ──
  const [create, { isLoading: creating }] = useAdminCreateCourseFullMutation();
  const [update, { isLoading: updating }] = useAdminUpdateCourseFullMutation();
  const saving = creating || updating || (editingId && loadingFull);

  const save = async () => {
    setError("");
    if (!course.title.trim()) return setError("Kurs adı tələb olunur");
    if (!course.category) return setError("Kateqoriya seçin");

    const body = {
      course: {
        title: course.title.trim(),
        // Send slug only when set; blank lets the server auto-generate.
        ...(course.slug?.trim() ? { slug: course.slug.trim() } : {}),
        category: course.category,
        h1: course.h1 || undefined,
        lead: course.lead || undefined,
        excerpt: course.excerpt || undefined,
        levels: course.levels,
        lesson: {
          perWeek: num(course.lesson.perWeek),
          minutes: num(course.lesson.minutes),
          levelDurationMonths: [num(course.lesson.levelDurationMonths[0]), num(course.lesson.levelDurationMonths[1])],
        },
        groupSize: { min: num(course.groupSize.min), max: num(course.groupSize.max) },
        currency: course.currency || "AZN",
        image: course.image || undefined,
        icon: course.icon || undefined,
        seo: { metaTitle: course.seo.metaTitle || undefined, metaDescription: course.seo.metaDescription || undefined },
        isFeatured: !!course.isFeatured,
        order: num(course.order) || 0,
        isActive: !!course.isActive,
      },
      branches: rows.filter((r) => r.branch).map((r) => ({
        branch: r.branch,
        pricing: {
          group: { day: num(r.pricing.group.day), evening: num(r.pricing.group.evening) },
          individual: { day: num(r.pricing.individual.day), evening: num(r.pricing.individual.evening) },
          note: r.pricing.note || undefined,
        },
        groups: r.groups.filter((g) => g.teacher).map((g) => ({
          teacher: g.teacher,
          level: g.level || undefined,
          format: g.format || "group",
          capacity: num(g.capacity),
          schedule: g.schedule
            .filter((s) => s.weekday && s.from && s.to)
            .map((s) => ({ weekday: Number(s.weekday), from: s.from, to: s.to })),
        })),
      })),
    };

    try {
      if (editingId) await update({ id: editingId, data: body }).unwrap();
      else await create(body).unwrap();
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Yadda saxlanmadı");
    }
  };

  const g2 = "grid grid-cols-2 gap-4";

  // ── Preview (as it will look on the site) ──
  const priceRows = rows
    .filter((r) => r.branch)
    .map((r) => {
      const prices = [
        r.pricing.group.day,
        r.pricing.group.evening,
        r.pricing.individual.day,
        r.pricing.individual.evening,
      ]
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n) && n > 0);
      const min = prices.length ? Math.min(...prices) : null;
      return { name: branchName(r.branch), min };
    });

  const preview = (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
        {course.icon && <span>{course.icon}</span>}
        <span>{course.title.trim() || "Kurs adı"}</span>
      </div>
      {course.lead?.trim() && (
        <p className="text-sm text-gray-600">{course.lead.trim()}</p>
      )}
      {course.levels?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {course.levels.map((l) => (
            <span
              key={l}
              className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-900"
            >
              {l}
            </span>
          ))}
        </div>
      )}
      {priceRows.length > 0 && (
        <div className="space-y-1 text-sm text-gray-700">
          {priceRows.map((p, i) => (
            <div key={i} className="flex justify-between border-t border-gray-100 pt-1">
              <span>{p.name}</span>
              <span className="font-semibold">
                {p.min != null
                  ? `${p.min} ${course.currency || "AZN"}/ay`
                  : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Overlay
      wide
      title={editingId ? "Kursu redaktə et" : "Yeni kurs"}
      subtitle="Kurs məlumatı → filiallar → hər filiala müəllim və qrafik"
      onClose={onClose}
      onSave={save}
      saving={saving}
      error={error}
      preview={preview}
    >
      {editingId && loadingFull ? (
        <p className="text-sm text-gray-500">Yüklənir…</p>
      ) : (
        <>
          {/* ── Course basics ── */}
          <section className="space-y-4">
            <SectionTitle>Kurs məlumatı</SectionTitle>
            <div className={g2}>
              <Field label="Kurs adı" required><TextInput value={course.title} onChange={(e) => patchCourse({ title: e.target.value })} /></Field>
              <Field label="Kateqoriya" required info="Kursun aid olduğu bölmə (menyu/filtrləmə üçün)"><NativeSelect placeholder="Seç…" options={categoryOpts} value={course.category} onChange={(e) => patchCourse({ category: e.target.value })} /></Field>
            </div>
            <Field label="Slug (linki)" info="Boş buraxsan addan avtomatik yaranır"><TextInput value={course.slug} onChange={(e) => patchCourse({ slug: e.target.value })} placeholder="ielts-hazirliq" /></Field>
            <Field label="SEO başlıq (H1)" hint="Boş qalsa kurs adı işlənir"><TextInput value={course.h1} onChange={(e) => patchCourse({ h1: e.target.value })} /></Field>
            <Field label="Qısa təsvir (lead)" info="Səhifə başında görünən qısa mətn"><TextArea rows={2} value={course.lead} onChange={(e) => patchCourse({ lead: e.target.value })} /></Field>
            <Field label="Excerpt (kart mətni)" info="Kurs kartında görünən bir cümlə"><TextInput value={course.excerpt} onChange={(e) => patchCourse({ excerpt: e.target.value })} /></Field>
            <Field label="Səviyyələr" info="Kursun əhatə etdiyi səviyyələr (A1–C2)"><MultiSelectChips options={LEVELS.map((l) => ({ value: l, label: l }))} value={course.levels} onChange={(v) => patchCourse({ levels: v })} /></Field>
            <div className="grid grid-cols-4 gap-4">
              <Field label="Həftədə dərs" info="Həftədə neçə dərs keçilir"><NumberInput value={course.lesson.perWeek} onChange={(e) => patchCourse({ lesson: { ...course.lesson, perWeek: e.target.value } })} /></Field>
              <Field label="Dəqiqə" info="Bir dərsin uzunluğu (dəq)"><NumberInput value={course.lesson.minutes} onChange={(e) => patchCourse({ lesson: { ...course.lesson, minutes: e.target.value } })} /></Field>
              <Field label="Qrup min" info="Qrupdakı minimum tələbə"><NumberInput value={course.groupSize.min} onChange={(e) => patchCourse({ groupSize: { ...course.groupSize, min: e.target.value } })} /></Field>
              <Field label="Qrup max" info="Qrupdakı maksimum tələbə"><NumberInput value={course.groupSize.max} onChange={(e) => patchCourse({ groupSize: { ...course.groupSize, max: e.target.value } })} /></Field>
            </div>
            <div className={g2}>
              <Field label="Şəkil" info="Kursun kart/başlıq şəkli"><FileUpload value={course.image} onChange={(url) => patchCourse({ image: url })} kind="image" /></Field>
              <Field label="İkon (emoji/ad)" info="Kart üçün emoji, məs. 🎯"><TextInput value={course.icon} onChange={(e) => patchCourse({ icon: e.target.value })} /></Field>
            </div>
            <div className={g2}>
              <Field label="SEO meta başlıq"><TextInput value={course.seo.metaTitle} onChange={(e) => patchCourse({ seo: { ...course.seo, metaTitle: e.target.value } })} /></Field>
              <Field label="Sıra (order)"><NumberInput value={course.order} onChange={(e) => patchCourse({ order: e.target.value })} /></Field>
            </div>
            <Field label="SEO meta təsvir"><TextArea rows={2} value={course.seo.metaDescription} onChange={(e) => patchCourse({ seo: { ...course.seo, metaDescription: e.target.value } })} /></Field>
            <div className="flex gap-8">
              <Toggle checked={course.isFeatured} onChange={(v) => patchCourse({ isFeatured: v })} label="Ana səhifədə göstər" />
              <Toggle checked={course.isActive} onChange={(v) => patchCourse({ isActive: v })} label="Aktiv" />
            </div>
          </section>

          {/* ── Branches + teachers ── */}
          <section className="space-y-4">
            <SectionTitle
              right={<AddButton onClick={() => setRows((rs) => [...rs, emptyRow(freeBranchOpts[0]?.value || "")])}>Filial əlavə et</AddButton>}
            >
              Filiallar və müəllimlər
            </SectionTitle>

            {rows.length === 0 && <p className="text-sm text-gray-400">Hələ filial əlavə edilməyib. Bu kursun keçiriləcəyi filialları əlavə et.</p>}

            {rows.map((r, ri) => (
              <div key={ri} className="rounded-xl border border-gray-200 p-4 space-y-4">
                <div className="flex items-end gap-3">
                  <Field label="Filial" className="flex-1">
                    <NativeSelect
                      placeholder="Seç…"
                      value={r.branch}
                      options={branchOpts.filter((b) => !usedBranches.has(String(b.value)) || String(b.value) === String(r.branch))}
                      onChange={(e) => patchRow(ri, { branch: e.target.value })}
                    />
                  </Field>
                  <RemoveButton onClick={() => setRows((rs) => rs.filter((_, i) => i !== ri))} />
                </div>

                {/* pricing */}
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Qiymət (AZN/ay)</div>
                  <div className="grid grid-cols-4 gap-3">
                    <Field label="Qrup · gündüz"><NumberInput value={r.pricing.group.day} onChange={(e) => patchPricing(ri, "group", "day", e.target.value)} /></Field>
                    <Field label="Qrup · axşam"><NumberInput value={r.pricing.group.evening} onChange={(e) => patchPricing(ri, "group", "evening", e.target.value)} /></Field>
                    <Field label="Fərdi · gündüz"><NumberInput value={r.pricing.individual.day} onChange={(e) => patchPricing(ri, "individual", "day", e.target.value)} /></Field>
                    <Field label="Fərdi · axşam"><NumberInput value={r.pricing.individual.evening} onChange={(e) => patchPricing(ri, "individual", "evening", e.target.value)} /></Field>
                  </div>
                  <Field label="Qeyd" info="Qiymətə dair əlavə qeyd (məs. endirim)" className="mt-3"><TextInput value={r.pricing.note} onChange={(e) => patchRow(ri, { pricing: { ...r.pricing, note: e.target.value } })} /></Field>
                </div>

                {/* groups */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Müəllim qrupları — {branchName(r.branch)}</span>
                    <AddButton onClick={() => patchRow(ri, { groups: [...r.groups, emptyGroup()] })}>Qrup</AddButton>
                  </div>

                  {r.groups.map((g, gi) => (
                    <div key={gi} className="rounded-lg border border-gray-200 p-3 space-y-3">
                      <div className="flex items-end gap-3">
                        <Field label="Müəllim" className="flex-1"><NativeSelect placeholder="Seç…" options={teacherOpts} value={g.teacher} onChange={(e) => patchGroup(ri, gi, { teacher: e.target.value })} /></Field>
                        <Field label="Səviyyə"><NativeSelect placeholder="—" options={LEVELS.map((l) => ({ value: l, label: l }))} value={g.level} onChange={(e) => patchGroup(ri, gi, { level: e.target.value })} /></Field>
                        <Field label="Format" info="Qrup və ya fərdi dərs"><NativeSelect options={FORMATS} value={g.format} onChange={(e) => patchGroup(ri, gi, { format: e.target.value })} /></Field>
                        <Field label="Tutum" info="Qrupun yer sayı"><NumberInput className="w-20" value={g.capacity} onChange={(e) => patchGroup(ri, gi, { capacity: e.target.value })} /></Field>
                        <RemoveButton onClick={() => patchRow(ri, { groups: r.groups.filter((_, j) => j !== gi) })} />
                      </div>

                      {/* schedule */}
                      <div className="space-y-2 pl-1">
                        {g.schedule.map((s, si) => (
                          <div key={si} className="flex items-center gap-2">
                            <NativeSelect className="w-28" placeholder="Gün" options={WEEKDAYS.map((w) => ({ value: w.v, label: w.l }))} value={s.weekday} onChange={(e) => patchSlot(ri, gi, si, { weekday: e.target.value })} />
                            <TextInput className="w-24" placeholder="19:00" value={s.from} onChange={(e) => patchSlot(ri, gi, si, { from: e.target.value })} />
                            <span className="text-gray-400">–</span>
                            <TextInput className="w-24" placeholder="20:30" value={s.to} onChange={(e) => patchSlot(ri, gi, si, { to: e.target.value })} />
                            <RemoveButton onClick={() => patchGroup(ri, gi, { schedule: g.schedule.filter((_, k) => k !== si) })} />
                          </div>
                        ))}
                        <AddButton onClick={() => patchGroup(ri, gi, { schedule: [...g.schedule, { weekday: "", from: "", to: "" }] })}>Vaxt</AddButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </Overlay>
  );
}
