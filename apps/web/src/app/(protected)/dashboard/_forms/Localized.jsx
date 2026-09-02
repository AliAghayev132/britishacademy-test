"use client";

// ── Çoxdilli (AZ/EN/RU) redaktə primitivləri ──
// Sahələr { az, en, ru } obyekti kimi saxlanılır. Aktiv dil MODAL SƏVİYYƏSİNDƏ
// tək qlobal düymə ilə seçilir (LocaleSwitcher, Overlay başlığında) — hər sahədə
// ayrı tab yoxdur. LocalizedFormProvider aktiv dili bütün sahələr üçün paylaşır.
//
// AI köməkçi düymələri (OpenRouter): "AZ-dən tərcümə et" (AZ → aktiv dil) və
// "Səliqəyə sal" (aktiv dilin mətnini düzəlt). Config Tənzimləmələr → AI-dədir.
//
// confirmLocalized: submit-dən öncə AZ mütləqdir, EN/RU boşdursa təsdiq alır.

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { confirmDialog, notify } from "@/components/ui/feedback";
import { useAiProcessMutation } from "@/store/api/adminApi";
import TiptapEditor from "@/components/editor/TiptapEditor";
import { Languages, Wand2, Loader2 } from "lucide-react";

const LOCALES = [
  { key: "az", label: "AZ" },
  { key: "en", label: "EN" },
  { key: "ru", label: "RU" },
];

const base =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 disabled:bg-gray-100";

/** string | { az, en, ru } → { az, en, ru } */
export function toLoc(v) {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return { az: v.az || "", en: v.en || "", ru: v.ru || "" };
  }
  return { az: typeof v === "string" ? v : "", en: "", ru: "" };
}

/** Hər dili trim et (body üçün). */
export function trimLoc(v) {
  const o = toLoc(v);
  return { az: o.az.trim(), en: o.en.trim(), ru: o.ru.trim() };
}

/** AZ variantı (preview üçün). */
export const locAz = (v) => toLoc(v).az;

// ── Modal səviyyəsində aktiv dil + sahə reyestri (paylaşılan kontekst) ──
// Reyestr qlobal AI düymələrinin (hamısını tərcümə et / səliqələ) bütün
// LocalizedInput/Editor sahələrini gəzməsi üçündür. Hər sahə öz cari
// { value, onChange, isHtml } ref-ini qeydiyyatdan keçirir.
const FormLocaleContext = createContext(null);

/** Overlay bunu bütün modal məzmununu əhatə edəcək şəkildə render edir. */
export function LocalizedFormProvider({ children }) {
  const [locale, setLocale] = useState("az");
  const fieldsRef = useRef(new Map());
  const register = useCallback((id, ref) => { fieldsRef.current.set(id, ref); }, []);
  const unregister = useCallback((id) => { fieldsRef.current.delete(id); }, []);
  return (
    <FormLocaleContext.Provider value={{ locale, setLocale, register, unregister, fieldsRef }}>
      {children}
    </FormLocaleContext.Provider>
  );
}

/** Provider yoxdursa AZ-a düşür (switcher olmadan da sahələr işləyir). */
export function useFormLocale() {
  return useContext(FormLocaleContext) || { locale: "az", setLocale: () => {} };
}

/** Sahəni reyestrə yaz — qlobal AI düymələri bunları gəzir. */
function useRegisterField(v, onChange, isHtml) {
  const ctx = useContext(FormLocaleContext);
  const id = useId();
  const ref = useRef({ value: v, onChange, isHtml });
  // Render zamanı ref-ə yazmaq React qaydasını pozur (concurrent render-də
  // etibarsızdır) — ona görə hər render-dən SONRA effektdə yenilənir.
  useEffect(() => {
    ref.current = { value: v, onChange, isHtml };
  });
  useEffect(() => {
    if (!ctx?.register) return undefined;
    ctx.register(id, ref);
    return () => ctx.unregister(id);
  }, [ctx, id]);
}

/** Qlobal dil düyməsi — Overlay başlığında bir dəfə göstərilir. */
export function LocaleSwitcher() {
  const { locale, setLocale } = useFormLocale();
  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-gray-100 p-1">
      <Languages className="mx-1 h-3.5 w-3.5 text-gray-400" />
      {LOCALES.map((l) => {
        const on = locale === l.key;
        return (
          <button
            key={l.key}
            type="button"
            onClick={() => setLocale(l.key)}
            className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${on ? "bg-[#00157A] text-white shadow-sm" : "text-gray-500 hover:bg-gray-200"}`}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}

/** Doldurulmamış EN/RU üçün xəbərdarlıq (AZ dolu olduqda). */
function EmptyWarn({ value }) {
  const az = (value.az || "").trim();
  const miss = LOCALES.filter((l) => l.key !== "az" && !(value[l.key] || "").trim()).map((l) => l.label);
  if (!az || !miss.length) return null;
  return (
    <div className="mt-1 text-xs font-medium text-amber-600">
      {miss.join(", ")} boşdur — bu dil(lər)də AZ göstəriləcək
    </div>
  );
}

/** Kiçik AI düyməsi (loading spinner ilə). */
export function AiBtn({ onClick, busy, disabled, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      className="inline-flex items-center gap-1.5 rounded-md border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}

/** OpenRouter çağırışı — yeni mətni qaytarır (boşdursa ""). */
async function aiTransform(run, { action, v, locale, isHtml }) {
  const body =
    action === "translate"
      ? { action: "translate", content: v.az, sourceLang: "az", targetLang: locale, isHtml }
      : { action: "polish", content: v[locale], sourceLang: locale, isHtml };
  const res = await run(body).unwrap();
  const text = res?.data?.result;
  return typeof text === "string" ? text.trim() : "";
}

/**
 * AI köməkçi zolağı — aktiv dilə görə tərcümə/səliqə düymələri (hər sahədə).
 *  - Aktiv dil ≠ AZ və AZ doludursa → "AZ-dən tərcümə et"
 *  - Aktiv dilin mətni doludursa → "Səliqəyə sal"
 */
function AiBar({ v, onChange, isHtml }) {
  const { locale } = useFormLocale();
  const [run] = useAiProcessMutation();
  const [busy, setBusy] = useState(null);

  const az = (v.az || "").trim();
  const cur = (v[locale] || "").trim();
  const canTranslate = locale !== "az" && Boolean(az);
  const canPolish = Boolean(cur);
  if (!canTranslate && !canPolish) return null;

  const call = async (action) => {
    setBusy(action);
    try {
      const text = await aiTransform(run, { action, v, locale, isHtml });
      if (text) {
        onChange({ ...v, [locale]: text });
        notify.success(action === "translate" ? "Tərcümə edildi" : "Səliqəyə salındı");
      } else {
        notify.error("AI boş cavab qaytardı");
      }
    } catch (err) {
      notify.error(err?.data?.message || "AI xətası — Tənzimləmələr → AI-ı yoxlayın");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {canTranslate && (
        <AiBtn onClick={() => call("translate")} busy={busy === "translate"} disabled={Boolean(busy)} icon={Languages}>
          AZ-dən tərcümə et
        </AiBtn>
      )}
      {canPolish && (
        <AiBtn onClick={() => call("polish")} busy={busy === "polish"} disabled={Boolean(busy)} icon={Wand2}>
          Səliqəyə sal
        </AiBtn>
      )}
    </div>
  );
}

/**
 * Qlobal AI zolağı — modalın başında bir dəfə (Overlay-də). Bütün çoxdilli
 * sahələri birdən emal edir:
 *  - "Hamısını tərcümə et" (aktiv dil ≠ AZ): hər sahədə AZ → aktiv dil
 *  - "Hamısını səliqələ": hər sahədə aktiv dilin mətni düzəldilir
 */
export function GlobalAiBar() {
  const ctx = useContext(FormLocaleContext);
  const [run] = useAiProcessMutation();
  const [busy, setBusy] = useState(null);
  if (!ctx) return null;
  const { locale, fieldsRef } = ctx;

  const runAll = async (action) => {
    const entries = [...fieldsRef.current.values()].map((r) => r.current).filter(Boolean);
    const targets = entries.filter((e) => {
      const v = toLoc(e.value);
      return action === "translate" ? locale !== "az" && v.az.trim() : (v[locale] || "").trim();
    });
    if (!targets.length) {
      notify.info(action === "translate" ? "Tərcümə üçün AZ mətn yoxdur" : "Səliqələmək üçün mətn yoxdur");
      return;
    }
    setBusy(action);
    let done = 0;
    let failed = 0;
    for (const e of targets) {
      const v = toLoc(e.value);
      try {
        const text = await aiTransform(run, { action, v, locale, isHtml: e.isHtml });
        if (text) {
          e.onChange({ ...v, [locale]: text });
          done += 1;
        } else {
          failed += 1;
        }
      } catch {
        failed += 1;
      }
    }
    setBusy(null);
    if (done) {
      notify.success(`${done} sahə ${action === "translate" ? "tərcümə edildi" : "səliqələndi"}${failed ? `, ${failed} alınmadı` : ""}`);
    } else {
      notify.error("AI xətası — Tənzimləmələr → AI-ı yoxlayın");
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      {locale !== "az" && (
        <AiBtn onClick={() => runAll("translate")} busy={busy === "translate"} disabled={Boolean(busy)} icon={Languages}>
          Hamısını tərcümə et
        </AiBtn>
      )}
      <AiBtn onClick={() => runAll("polish")} busy={busy === "polish"} disabled={Boolean(busy)} icon={Wand2}>
        Hamısını səliqələ
      </AiBtn>
    </div>
  );
}

export function LocalizedInput({ value, onChange, placeholder, multiline, rows = 3 }) {
  const v = toLoc(value);
  const { locale } = useFormLocale();
  useRegisterField(v, onChange, false);
  const set = (text) => onChange({ ...v, [locale]: text });
  return (
    <div>
      {multiline ? (
        <textarea value={v[locale]} onChange={(e) => set(e.target.value)} placeholder={placeholder} rows={rows} className={base} />
      ) : (
        <input value={v[locale]} onChange={(e) => set(e.target.value)} placeholder={placeholder} className={base} />
      )}
      <AiBar v={v} onChange={onChange} isHtml={false} />
      <EmptyWarn value={v} />
    </div>
  );
}

export function LocalizedEditor({ value, onChange, ...rest }) {
  const v = toLoc(value);
  const { locale } = useFormLocale();
  useRegisterField(v, onChange, true);
  const set = (html) => onChange({ ...v, [locale]: html });
  return (
    <div>
      {/* key={locale} — dil dəyişəndə editor həmin dilin məzmunu ilə remount olur */}
      <TiptapEditor key={locale} content={v[locale]} onChange={set} {...rest} />
      <AiBar v={v} onChange={onChange} isHtml />
      <EmptyWarn value={v} />
    </div>
  );
}

/**
 * Submit-dən öncə çoxdilli sahələri yoxla.
 *  entries: [{ label, value, required }]
 *  - required sahədə AZ boşdursa → { ok:false, error } (submit bloklanır)
 *  - AZ dolu, EN/RU boşdursa → təsdiq ("AZ istifadə olunacaq")
 */
export async function confirmLocalized(entries) {
  const missAz = entries.filter((e) => e.required && !toLoc(e.value).az.trim());
  if (missAz.length) {
    return { ok: false, error: `${missAz.map((e) => e.label).join(", ")} — Azərbaycan dili mütləqdir` };
  }
  const partial = entries.filter((e) => {
    const o = toLoc(e.value);
    return o.az.trim() && (!o.en.trim() || !o.ru.trim());
  });
  if (partial.length) {
    const ok = await confirmDialog({
      tone: "warning",
      title: "Bəzi dillər boşdur",
      text: `${partial.map((e) => e.label).join(", ")} sahəsində EN və ya RU boşdur. Həmin dillərdə <b>Azərbaycan dili</b> göstəriləcək.<br><br>Davam edilsin?`,
      confirmText: "Bəli, davam et",
      cancelText: "Geri qayıt",
    });
    if (!ok) return { ok: false };
  }
  return { ok: true };
}
