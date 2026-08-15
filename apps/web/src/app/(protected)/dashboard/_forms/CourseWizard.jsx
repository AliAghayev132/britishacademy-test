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
import { SeoFields } from "./SeoFields";
import { LocalizedInput, LocalizedEditor, toLoc, trimLoc, locAz, confirmLocalized } from "./Localized";
import { CourseGroupForm } from "./CourseGroupForm";
import { Check } from "lucide-react";

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

const emptyRow = (branch = "") => ({
  branch,
  pricing: { group: { day: "", evening: "" }, individual: { day: "", evening: "" }, note: "" },
  groups: [], // teacher timetable is added after saving (Dərs qrafiki step)
});

const num = (v) => (v === "" || v === null || v === undefined ? undefined : Number(v));

export function CourseWizard({ item, onClose }) {
  const editingId = item?._id || null;

  // ── Lookups + prefill ──
  const { data: lk } = useAdminLookupsQuery();
  const { data: full, isFetching: loadingFull } = useAdminCourseFullQuery(editingId, { skip: !editingId });

  const branchOpts = useMemo(
    () => (lk?.data?.branches || []).map((b) => ({ value: b._id, label: locAz(b.name) })),
    [lk],
  );
  const teacherOpts = useMemo(
    () => (lk?.data?.teachers || []).map((t) => ({ value: t._id, label: locAz(t.title) ? `${locAz(t.fullName)} · ${locAz(t.title)}` : locAz(t.fullName) })),
    [lk],
  );
  const categoryOpts = useMemo(
    () => (lk?.data?.categories || []).map((c) => ({ value: c._id, label: locAz(c.name) })),
    [lk],
  );
  const branchName = (id) => branchOpts.find((b) => String(b.value) === String(id))?.label || "Filial";

  // ── State ──
  const [course, setCourse] = useState(emptyCourse());
  const [seo, setSeo] = useState(emptyCourse().seo);
  const [contentHtml, setContentHtml] = useState(editingId ? (full?.data?.course?.contentHtml || "") : "");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  // After a successful save we show a "add schedule" step for the saved course.
  const [saved, setSaved] = useState(null); // { id, title }
  const [scheduleOpen, setScheduleOpen] = useState(false);

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
    });
    setSeo(c.seo || emptyCourse().seo);
    setContentHtml(c.contentHtml || "");
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
    if (!course.category) return setError("Kateqoriya seçin");

    const guard = await confirmLocalized([
      { label: "Kurs adı", value: course.title, required: true },
      { label: "SEO başlıq (H1)", value: course.h1 },
      { label: "Qısa təsvir (lead)", value: course.lead },
      { label: "Excerpt", value: course.excerpt },
      { label: "Məzmun", value: contentHtml },
    ]);
    if (!guard.ok) {
      if (guard.error) setError(guard.error);
      return;
    }

    const body = {
      course: {
        title: trimLoc(course.title),
        // Send slug only when set; blank lets the server auto-generate.
        ...(course.slug?.trim() ? { slug: course.slug.trim() } : {}),
        category: course.category,
        h1: trimLoc(course.h1),
        lead: trimLoc(course.lead),
        excerpt: trimLoc(course.excerpt),
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
        seo,
        isFeatured: !!course.isFeatured,
        order: num(course.order) || 0,
        isActive: !!course.isActive,
        contentHtml: trimLoc(contentHtml),
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
      let id = editingId;
      if (editingId) await update({ id: editingId, data: body }).unwrap();
      else {
        const res = await create(body).unwrap();
        id = res?.data?.course?._id;
      }
      // Show the post-save step (add schedule) instead of closing immediately.
      setSaved({ id, title: locAz(course.title) });
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
        <span>{locAz(course.title) || "Kurs adı"}</span>
      </div>
      {locAz(course.lead) && (
        <p className="text-sm text-gray-600">{locAz(course.lead)}</p>
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
      {locAz(contentHtml) && (
        <div
          className="bz-body mt-4"
          dangerouslySetInnerHTML={{ __html: locAz(contentHtml) }}
        />
      )}
    </div>
  );

  // After save → offer to add the timetable for this course, right here.
  if (saved && scheduleOpen) {
    return <CourseGroupForm item={{ course: saved.id }} onClose={() => setScheduleOpen(false)} />;
  }
  if (saved) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-2xl">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Check className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Poppins'" }}>Kurs yadda saxlanıldı</h3>
          <p className="mt-2 text-sm text-gray-500">
            «{saved.title}» hazırdır. İndi bu kursa dərs qrafiki — müəllim, filial və gün/saatlar — əlavə edə bilərsən.
          </p>
          <div className="mt-6 flex gap-3">
            <button onClick={onClose} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Bağla</button>
            <button onClick={() => setScheduleOpen(true)} className="flex-1 rounded-lg bg-[#00157A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#00105e]">Dərs qrafiki əlavə et</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Overlay
      localized
      wide
      title={editingId ? "Kursu redaktə et" : "Yeni kurs"}
      subtitle="Kurs məlumatı → filiallar → qiymət — sonra dərs qrafiki"
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
              <Field label="Kurs adı" required info="3 dildə — AZ mütləqdir"><LocalizedInput value={course.title} onChange={(v) => patchCourse({ title: v })} /></Field>
              <Field label="Kateqoriya" required info="Kursun aid olduğu bölmə (menyu/filtrləmə üçün)"><NativeSelect placeholder="Seç…" options={categoryOpts} value={course.category} onChange={(e) => patchCourse({ category: e.target.value })} /></Field>
            </div>
            <Field label="Slug (linki)" info="Boş buraxsan addan avtomatik yaranır"><TextInput value={course.slug} onChange={(e) => patchCourse({ slug: e.target.value })} placeholder="ielts-hazirliq" /></Field>
            <Field label="SEO başlıq (H1)" hint="3 dildə — boş qalsa kurs adı işlənir"><LocalizedInput value={course.h1} onChange={(v) => patchCourse({ h1: v })} /></Field>
            <Field label="Qısa təsvir (lead)" info="3 dildə — səhifə başında görünən qısa mətn"><LocalizedInput value={course.lead} onChange={(v) => patchCourse({ lead: v })} multiline rows={2} /></Field>
            <Field label="Excerpt (kart mətni)" info="3 dildə — kurs kartında görünən bir cümlə"><LocalizedInput value={course.excerpt} onChange={(v) => patchCourse({ excerpt: v })} /></Field>
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
            <Field label="Sıra (order)"><NumberInput value={course.order} onChange={(e) => patchCourse({ order: e.target.value })} /></Field>
            <div className="flex gap-8">
              <Toggle checked={course.isFeatured} onChange={(v) => patchCourse({ isFeatured: v })} label="Ana səhifədə göstər" />
              <Toggle checked={course.isActive} onChange={(v) => patchCourse({ isActive: v })} label="Aktiv" />
            </div>
          </section>

          {/* ── Məzmun ── */}
          <section className="space-y-4">
            <SectionTitle>Məzmun</SectionTitle>
            <Field label="Məzmun" info="3 dildə">
              <LocalizedEditor value={contentHtml} onChange={setContentHtml} />
            </Field>
          </section>

          {/* ── Branches + teachers ── */}
          <section className="space-y-4">
            <SectionTitle
              right={<AddButton onClick={() => setRows((rs) => [...rs, emptyRow(freeBranchOpts[0]?.value || "")])}>Filial əlavə et</AddButton>}
            >
              Filiallar və qiymət
            </SectionTitle>
            <p className="text-xs text-gray-400">Müəllim və dərs qrafiki kurs yadda saxlanandan sonra əlavə olunur.</p>

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

              </div>
            ))}
          </section>

          {/* ── SEO ── */}
          <SeoFields value={seo} onChange={setSeo} />
        </>
      )}
    </Overlay>
  );
}
