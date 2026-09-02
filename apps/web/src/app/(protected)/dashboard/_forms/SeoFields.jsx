"use client";

// ── SEO fields ──
// Reusable SEO editor shared by the bespoke admin forms. Not a modal — render it
// inside a form's <Overlay> body. Reads/writes a single `seo` object:
//   { metaTitle, metaDescription, keywords, ogImage, canonical, noindex }
// metaTitle / metaDescription / keywords 3 dillidir ({ az, en, ru }) — aktiv dil
// modalın yuxarısındakı qlobal düymə ilə seçilir, AI düymələri də oradan işləyir.
// keywords hər dil üçün vergüllə ayrılmış mətndir.
//
// «AI ilə doldur» düyməsi səhifənin öz məzmunundan çıxış edərək hər üç dili
// birdən doldurur — bax `fillWithAi`.

// React
import { useState } from "react";
// Data
import { useAiProcessMutation } from "@/store/api/adminApi";
// Local
import { SectionTitle, Field, TextInput, Toggle } from "./kit";
import { LocalizedInput, AiBtn } from "./Localized";
import { FileUpload } from "@/components/ui/FileUpload";
import { IMAGE_SPECS } from "@/lib/imageSpecs";
import { confirmDialog, notify } from "@/components/ui/feedback";
import { Sparkles } from "lucide-react";

/** HTML-i mətnə çevir — modelə teq yox, məna lazımdır (token da yeyir). */
function stripHtml(s) {
  return String(s || "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** Lokallaşdırılmış və ya adi dəyərdən AZ mətni götür. */
function az(v) {
  if (!v) return "";
  if (typeof v === "object") return String(v.az || v.en || v.ru || "");
  return String(v);
}

/**
 * Modelə göndəriləcək məzmunu yığ.
 *
 * `body` sətir, massiv və ya çoxdilli obyekt ola bilər — hər forma öz
 * sahələrini bilir, ona görə onları olduğu kimi ötürür, normallaşdırma burada
 * bir yerdə edilir.
 *
 * 6000 simvolda kəsilir: uzun kurs səhifələri token limitini aşırdı və model
 * cavabı yarımçıq JSON kimi qaytarırdı.
 */
function buildContent(context) {
  const parts = [];
  const push = (v) => {
    if (Array.isArray(v)) return v.forEach(push);
    const t = stripHtml(az(v));
    if (t) parts.push(t);
  };
  push(context?.title);
  push(context?.body);
  return parts.join("\n\n").slice(0, 6000);
}

const LOCALES = ["az", "en", "ru"];

export function SeoFields({ value = {}, onChange, context }) {
  const set = (key, val) => onChange({ ...value, [key]: val });

  const [run] = useAiProcessMutation();
  const [busy, setBusy] = useState(false);

  /**
   * Üç dilin SEO sahələrini bir çağırışda doldurur.
   *
   * Server `seo-suite` əməliyyatı ilə { az, en, ru } qaytarır. Tək dillik
   * `generate-seo` əvəzinə bu işlədilir: sayt üçdillidir və admin eyni düyməni
   * üç dəfə basmalı olsaydı EN/RU praktikada boş qalardı.
   */
  const fillWithAi = async () => {
    const content = buildContent(context);
    if (content.length < 40) {
      notify.error("Əvvəlcə başlıq və məzmunu doldurun — AI onlardan çıxış edir");
      return;
    }

    // Doldurulmuş sahələr varsa təsdiq al: düymə səhvən basılanda admin-in
    // yazdığı mətn xəbərsiz itməsin.
    const hasExisting = ["metaTitle", "metaDescription", "keywords"].some((k) =>
      LOCALES.some((l) => String(value?.[k]?.[l] || "").trim()),
    );
    if (hasExisting) {
      const ok = await confirmDialog({
        title: "Mövcud SEO mətnləri əvəz olunsun?",
        text: "Meta başlıq, meta təsvir və açar sözlər <b>hər üç dildə</b> yenidən yazılacaq.",
        confirmText: "Bəli, doldur",
      });
      if (!ok) return;
    }

    setBusy(true);
    try {
      const res = await run({
        action: "seo-suite",
        kind: context?.kind || "səhifə",
        title: stripHtml(az(context?.title)).slice(0, 200),
        content,
      }).unwrap();

      const r = res?.data?.result;
      // Model bəzən JSON əvəzinə mətn qaytarır — sahələri kor-koranə yazsaq
      // formada "undefined" görünərdi.
      if (!r || typeof r !== "object" || !r.az) {
        notify.error("AI gözlənilən formatda cavab vermədi — yenidən yoxlayın");
        return;
      }

      const pick = (field) =>
        LOCALES.reduce((acc, l) => {
          const v = r?.[l]?.[field];
          // keywords massiv gəlsə vergüllə birləşdiririk (sahə mətndir).
          acc[l] = Array.isArray(v) ? v.join(", ") : String(v || "").trim();
          return acc;
        }, {});

      onChange({
        ...value,
        metaTitle: pick("metaTitle"),
        metaDescription: pick("metaDescription"),
        keywords: pick("keywords"),
      });
      notify.success("SEO sahələri üç dildə dolduruldu");
    } catch (err) {
      notify.error(
        err?.data?.message || "AI xətası — Tənzimləmələr → AI-ı yoxlayın",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle>SEO</SectionTitle>
        {context && (
          <AiBtn onClick={fillWithAi} busy={busy} icon={Sparkles}>
            AI ilə doldur (3 dil)
          </AiBtn>
        )}
      </div>
      {context && (
        <p className="-mt-2 text-xs text-gray-500">
          Səhifənin məzmunundan çıxış edir və Azərbaycan üzrə axtarış vərdişlərinə
          uyğun açar sözlər seçir — rusdilli sorğular da nəzərə alınır.
        </p>
      )}

      <Field label="Meta başlıq" info="3 dildə — boş qalsa avtomatik başlıq işlənir">
        <LocalizedInput
          value={value.metaTitle}
          onChange={(v) => set("metaTitle", v)}
        />
      </Field>
      <Field label="Meta təsvir" info="3 dildə — axtarış nəticəsində görünən mətn">
        <LocalizedInput
          value={value.metaDescription}
          onChange={(v) => set("metaDescription", v)}
          multiline
          rows={3}
        />
      </Field>
      <Field label="Açar sözlər" info="3 dildə — vergüllə ayır, məs: IELTS, təhsil, viza">
        <LocalizedInput
          value={value.keywords}
          onChange={(v) => set("keywords", v)}
          placeholder="IELTS, təhsil, viza"
        />
      </Field>
      <Field label="OG şəkil" info="Paylaşımlarda görünən şəkil (1200×630)">
        <FileUpload
          value={value.ogImage}
          onChange={(url) => set("ogImage", url)}
          kind="image"
          spec={IMAGE_SPECS.ogImage}
        />
      </Field>
      <Field label="Canonical URL" info="Yalnız xüsusi hal üçün; boş qoy">
        <TextInput
          value={value.canonical || ""}
          onChange={(e) => set("canonical", e.target.value)}
          placeholder="https://…"
        />
      </Field>
      <Toggle
        checked={Boolean(value.noindex)}
        onChange={(v) => set("noindex", v)}
        label="Axtarış sistemlərindən gizlə"
      />
    </section>
  );
}
