"use client";

// ── Course group admin form ──
// Bespoke create/edit form for a single CourseGroup (resource "course-groups") —
// the timetable ("Dərs qrafiki"). Replaces the raw JSON editor: it answers which
// teacher runs which course, at which branch, on which days and at what time.
// `timeSlot` is derived server-side from the first slot, so it is NOT exposed.

// React
import { useMemo, useState } from "react";
// Data (RTK Query)
import {
  useAdminListQuery,
  useAdminLookupsQuery,
  useAdminCreateMutation,
  useAdminUpdateMutation,
} from "@/store/api/adminApi";
// Local
import {
  Overlay,
  Field,
  TextInput,
  NumberInput,
  TextArea,
  NativeSelect,
  Toggle,
  SectionTitle,
  AddButton,
  RemoveButton,
  toId,
  WEEKDAYS,
  LEVELS,
  FORMATS,
} from "./kit";
import { LocalizedInput, toLoc, trimLoc, locAz } from "./Localized";

// CourseGroup.status enum (apps/api/constants/shared/enums.js → groupStatus).
const STATUS = [
  { value: "open", label: "Açıq" },
  { value: "full", label: "Dolu" },
  { value: "ongoing", label: "Davam edir" },
  { value: "finished", label: "Bitib" },
  { value: "cancelled", label: "Ləğv edilib" },
];

const emptySlot = () => ({ weekday: "", from: "", to: "" });
// <input type="date"> wants "YYYY-MM-DD"; the model stores a Date/ISO string.
const toDateInput = (v) => (v ? String(v).slice(0, 10) : "");

export function CourseGroupForm({ item, onClose }) {
  const isEdit = Boolean(item?._id);

  // ── Option sources ──
  const { data: coursesData } = useAdminListQuery({
    resource: "courses",
    limit: 200,
  });
  const { data: lk } = useAdminLookupsQuery();

  const courseOpts = useMemo(
    () =>
      (coursesData?.data?.items || []).map((c) => ({
        value: c._id,
        label: locAz(c.title),
      })),
    [coursesData],
  );
  const branchOpts = useMemo(
    () =>
      (lk?.data?.branches || []).map((b) => ({ value: b._id, label: locAz(b.name) })),
    [lk],
  );
  const teacherOpts = useMemo(
    () =>
      (lk?.data?.teachers || []).map((t) => ({
        value: t._id,
        label: locAz(t.title)
          ? `${locAz(t.fullName)} · ${locAz(t.title)}`
          : locAz(t.fullName),
      })),
    [lk],
  );

  // ── State ──
  const [create, { isLoading: creating }] = useAdminCreateMutation();
  const [update, { isLoading: updating }] = useAdminUpdateMutation();

  const [course, setCourse] = useState(toId(item?.course));
  const [branch, setBranch] = useState(toId(item?.branch));
  const [teacher, setTeacher] = useState(toId(item?.teacher));

  const [level, setLevel] = useState(item?.level || "");
  const [format, setFormat] = useState(item?.format || "group");
  const [status, setStatus] = useState(item?.status || "open");
  const [code, setCode] = useState(item?.code || "");
  const [capacity, setCapacity] = useState(
    item?.capacity != null ? String(item.capacity) : "6",
  );
  const [startDate, setStartDate] = useState(toDateInput(item?.startDate));
  const [endDate, setEndDate] = useState(toDateInput(item?.endDate));
  const [priceOverride, setPriceOverride] = useState(
    item?.priceOverride != null ? String(item.priceOverride) : "",
  );
  const [note, setNote] = useState(toLoc(item?.note));
  const [isActive, setIsActive] = useState(
    isEdit ? Boolean(item?.isActive) : true,
  );

  const [schedule, setSchedule] = useState(
    Array.isArray(item?.schedule) && item.schedule.length
      ? item.schedule.map((s) => ({
          weekday: s.weekday != null ? String(s.weekday) : "",
          from: s.from || "",
          to: s.to || "",
        }))
      : [],
  );

  const [error, setError] = useState("");

  const saving = creating || updating;

  // ── Schedule helpers ──
  const addSlot = () => setSchedule((rows) => [...rows, emptySlot()]);
  const removeSlot = (i) =>
    setSchedule((rows) => rows.filter((_, idx) => idx !== i));
  const setSlot = (i, key, val) =>
    setSchedule((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)),
    );

  // Qrafikin insan oxunaqlı xülasəsi — admin nəticəni dərhal görsün.
  const scheduleSummary = schedule
    .filter((s) => s.weekday && s.from && s.to)
    .map((s) => {
      const day = WEEKDAYS.find((w) => String(w.v) === String(s.weekday));
      return (day ? day.l : "?") + " " + s.from + "–" + s.to;
    })
    .join(" · ");

  const onSave = async () => {
    setError("");
    if (!course) return setError("Kurs seçin");
    if (!branch) return setError("Filial seçin");
    if (!teacher) return setError("Müəllim seçin");

    const data = {
      course,
      branch,
      teacher,
      format: format || "group",
      status: status || "open",
      capacity: Number(capacity) || undefined,
      isActive,
      schedule: schedule
        .filter((s) => s.weekday && s.from.trim() && s.to.trim())
        .map((s) => ({
          weekday: Number(s.weekday),
          from: s.from.trim(),
          to: s.to.trim(),
        })),
    };
    // Prune empty optionals.
    if (level) data.level = level;
    const codeVal = code.trim();
    if (codeVal) data.code = codeVal;
    if (startDate) data.startDate = startDate;
    if (endDate) data.endDate = endDate;
    if (priceOverride.trim() !== "")
      data.priceOverride = Number(priceOverride);
    const noteVal = trimLoc(note);
    if (noteVal.az || noteVal.en || noteVal.ru) data.note = noteVal;

    try {
      if (isEdit) {
        await update({
          resource: "course-groups",
          id: item._id,
          data,
        }).unwrap();
      } else {
        await create({ resource: "course-groups", data }).unwrap();
      }
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Xəta baş verdi");
    }
  };

  const g2 = "grid grid-cols-1 gap-4 sm:grid-cols-2";

  return (
    <Overlay
      localized
      wide
      title={isEdit ? "Qrafiki redaktə et" : "Yeni qrup / qrafik"}
      subtitle="Kim, harada, hansı kurs üçün — və hansı gün/saatlarda"
      onClose={onClose}
      onSave={onSave}
      saving={saving}
      error={error}
    >
      {/* ── Kim / harada / nə ── */}
      <section className="space-y-4">
        <SectionTitle>Qrup</SectionTitle>
        <Field
          label="Kurs"
          required
          info="Bu qrup hansı kurs üçündür"
        >
          <NativeSelect
            placeholder="Seç…"
            options={courseOpts}
            value={course}
            onChange={(e) => setCourse(e.target.value)}
          />
        </Field>
        <div className={g2}>
          <Field
            label="Filial"
            required
            info="Bu qrupu harada aparır"
          >
            <NativeSelect
              placeholder="Seç…"
              options={branchOpts}
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            />
          </Field>
          <Field
            label="Müəllim"
            required
            info="Bu qrupu kim aparır"
          >
            <NativeSelect
              placeholder="Seç…"
              options={teacherOpts}
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
            />
          </Field>
        </div>
      </section>

      {/* ── Səviyyə və format ── */}
      <section className="space-y-4">
        <SectionTitle>Səviyyə və format</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Səviyyə" info="CEFR səviyyəsi (A1–C2). Bilinmirsə boş buraxın.">
            <NativeSelect
              placeholder="—"
              options={LEVELS.map((l) => ({ value: l, label: l }))}
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            />
          </Field>
          <Field label="Format" info="Qrup — bir neçə tələbə birlikdə. Fərdi — tək tələbə ilə.">
            <NativeSelect
              options={FORMATS}
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            />
          </Field>
          <Field label="Tutum" info="Qrupa maksimum neçə tələbə qəbul olunur (adətən 3–7).">
            <NumberInput
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </Field>
        </div>
      </section>

      {/* ── Vəziyyət və tarixlər ── */}
      <section className="space-y-4">
        <SectionTitle>Vəziyyət və tarixlər</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field
            label="Status"
            info="Açıq — qeydiyyat davam edir · Dolu — yer yoxdur · Davam edir — dərslər başlayıb · Bitib / Ləğv edilib"
          >
            <NativeSelect
              options={STATUS}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
          </Field>
          <Field label="Başlama tarixi" info="Qrupun ilk dərs günü (istəyə bağlı)">
            <TextInput
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Field>
          <Field label="Bitmə tarixi" info="Proqramın planlaşdırılan sonu (istəyə bağlı)">
            <TextInput
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Field>
        </div>
      </section>

      {/* ── Həftəlik qrafik ── */}
      <section className="space-y-3">
        <SectionTitle right={<AddButton onClick={addSlot}>Vaxt əlavə et</AddButton>}>
          Həftəlik qrafik
        </SectionTitle>
        <p className="text-sm text-gray-500">
          Dərslərin hansı günlər və saatlarda keçiriləcəyi. Həftədə 2 dərs varsa
          iki sətir əlavə edin.
        </p>

        {schedule.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">
            Hələ vaxt əlavə edilməyib — «Vaxt əlavə et» düyməsinə basın.
          </div>
        ) : (
          <div className="space-y-2">
            {/* Sütun başlıqları — əvvəl hansı sahənin nə olduğu bilinmirdi */}
            <div className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wide text-gray-500">
              <span className="w-32">Gün</span>
              <span className="w-28">Başlanğıc</span>
              <span className="w-4" />
              <span className="w-28">Bitiş</span>
            </div>
            {schedule.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <NativeSelect
                  className="w-32"
                  placeholder="Gün"
                  options={WEEKDAYS.map((w) => ({ value: w.v, label: w.l }))}
                  value={s.weekday}
                  onChange={(e) => setSlot(i, "weekday", e.target.value)}
                />
                {/* type="time" — native saat seçici, əl ilə "19:00" yazmaqdan rahatdır */}
                <TextInput
                  type="time"
                  className="w-28"
                  value={s.from}
                  onChange={(e) => setSlot(i, "from", e.target.value)}
                />
                <span className="w-4 text-center text-gray-400">–</span>
                <TextInput
                  type="time"
                  className="w-28"
                  value={s.to}
                  onChange={(e) => setSlot(i, "to", e.target.value)}
                />
                <RemoveButton onClick={() => removeSlot(i)} />
              </div>
            ))}
          </div>
        )}

        {scheduleSummary && (
          <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">
            <span className="font-semibold">Saytda belə görünəcək:</span> {scheduleSummary}
          </div>
        )}
      </section>

      {/* ── Əlavə (istəyə bağlı) ── */}
      <section className="space-y-4">
        <SectionTitle>Əlavə məlumat</SectionTitle>
        <p className="text-sm text-gray-500">
          Bu sahələr istəyə bağlıdır — boş buraxıla bilər.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Qrup kodu"
            info="Daxili istifadə üçün oxunaqlı ad, məs. ENG-B1-AXŞAM-01. Saytda görünmür."
          >
            <TextInput
              value={code}
              placeholder="ENG-B1-AXŞAM-01"
              onChange={(e) => setCode(e.target.value)}
            />
          </Field>
          <Field
            label="Xüsusi qiymət (AZN)"
            info="Yalnız bu qrup üçün kursun qiymət matrisini əvəz edir. Boş qalsa kursun öz qiyməti işlənir."
          >
            <NumberInput
              value={priceOverride}
              onChange={(e) => setPriceOverride(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Qeyd" info="3 dildə — qrup haqqında əlavə izah (məs. «yalnız həftə sonu»)">
          <LocalizedInput multiline rows={3} value={note} onChange={setNote} />
        </Field>
        <div className="flex items-center">
          <Toggle
            checked={isActive}
            onChange={setIsActive}
            label="Aktiv (saytda göstərilsin)"
          />
        </div>
      </section>
    </Overlay>
  );
}
