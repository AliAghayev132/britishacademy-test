"use client";

// Local
import { Field, TextInput, NumberInput, NativeSelect, Toggle } from "../../_forms/kit";
import { LocalizedInput } from "../../_forms/Localized";

const ORDER_OPTIONS = [
  { value: "sequential", label: "Sıra ilə (order üzrə)" },
  { value: "random", label: "Təsadüfi" },
];

/** «Test məlumatı» tabı. */
export function QuizMetaTab({ form, set, categoryOptions }) {
  return (
    <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-6 md:grid-cols-2">
      <Field label="Başlıq" required className="md:col-span-2">
        <LocalizedInput value={form.title} onChange={(v) => set("title", v)} />
      </Field>

      <Field label="Slug" required hint="Ünvanda görünür: /testler/<slug>">
        <TextInput value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="english-test" />
      </Field>
      {categoryOptions.length > 0 && (
        <Field label="Kateqoriya" hint="Testlər səhifəsində bölmələrə ayırmaq üçün.">
          <NativeSelect
            placeholder="Kateqoriyasız"
            options={categoryOptions}
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          />
        </Field>
      )}

      <Field label="Sıra">
        <NumberInput value={form.order} onChange={(e) => set("order", e.target.value)} />
      </Field>

      <Field label="Qısa təsvir" className="md:col-span-2">
        <LocalizedInput value={form.lead} onChange={(v) => set("lead", v)} />
      </Field>

      <Field label="Ətraflı təsvir" className="md:col-span-2">
        <LocalizedInput value={form.description} onChange={(v) => set("description", v)} multiline rows={3} />
      </Field>

      <Field label="Sual sırası" hint="Təsadüfi seçilsə hər açılışda sıra dəyişir.">
        {/* NativeSelect hadisə formasında qaytarır ({target:{value}}),
            xam dəyər yox — kitin qalan sahələri ilə eyni imza. */}
        <NativeSelect
          options={ORDER_OPTIONS}
          value={form.questionOrder}
          onChange={(e) => set("questionOrder", e.target.value)}
        />
      </Field>

      <Field label="Göstəriləcək sual sayı" hint="0 = hamısı. Sual bankından alt çoxluq seçmək üçün.">
        <NumberInput value={form.questionCount} onChange={(e) => set("questionCount", e.target.value)} />
      </Field>

      <Field label="Vaxt limiti (dəq)" hint="0 = limitsiz.">
        <NumberInput value={form.timeLimitMin} onChange={(e) => set("timeLimitMin", e.target.value)} />
      </Field>

      <Field label="Variantlar qarışdırılsın">
        <Toggle
          checked={form.shuffleOptions}
          onChange={(v) => set("shuffleOptions", v)}
          label="Düzgün cavab həmişə eyni yerdə olmasın"
        />
      </Field>

      <Field label="Nəticə düyməsinin adı" className="md:col-span-2">
        <LocalizedInput value={form.ctaLabel} onChange={(v) => set("ctaLabel", v)} />
      </Field>

      <Field label="Nəticə düyməsinin ünvanı" className="md:col-span-2" hint="Məsələn /kurslar/ingilis-dili-kurslari">
        <TextInput value={form.ctaHref} onChange={(e) => set("ctaHref", e.target.value)} />
      </Field>

      <Field label="Vəziyyət" className="md:col-span-2">
        <Toggle checked={form.isActive} onChange={(v) => set("isActive", v)} label="Saytda göstərilsin" />
      </Field>
    </div>
  );
}
