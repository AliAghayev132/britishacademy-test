"use client";

// React
import { useState } from "react";
// Icons
import { ExternalLink, MapPin } from "lucide-react";
// i18n
import { useT } from "@/lib/i18n/useT";

/**
 * Filiallar səhifəsindəki xəritə — filial seçilə bilir.
 *
 * Əvvəl burada YALNIZ bir xəritə göstərilirdi: siyahıda `mapEmbedUrl` təyin
 * olunmuş ilk filial. Praktikada heç birində o sahə dolu olmurdu, ona görə
 * ziyarətçi «Xəritə buraya əlavə olunacaq» plaseholderi görürdü.
 *
 * İndi düymələrlə filial seçilir və xəritə dəyişir.
 *
 * Mənbə üstünlüyü:
 *   1) mapEmbedUrl — admin tam nəzarət istəyirsə
 *   2) coords      — Google embed (dəqiq nöqtə)
 *   3) address     — Google axtarış embed-i
 * Qısa goo.gl linkləri iframe-də AÇILMIR, ona görə onlar yalnız «Xəritədə aç»
 * düyməsində işlədilir.
 */

function embedSrc(b) {
  if (b?.mapEmbedUrl) return b.mapEmbedUrl;

  const lat = Number(b?.coords?.lat);
  const lng = Number(b?.coords?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://maps.google.com/maps?q=${lat},${lng}&z=17&hl=az&output=embed`;
  }

  const q = [b?.name, b?.address].filter(Boolean).join(", ");
  return q ? `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed` : null;
}

function openLink(b) {
  if (b?.mapUrl) return b.mapUrl;
  const lat = Number(b?.coords?.lat);
  const lng = Number(b?.coords?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
  const q = [b?.name, b?.address].filter(Boolean).join(", ");
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
}

export function BranchMapSwitcher({ branches = [] }) {
  const t = useT();
  const [idx, setIdx] = useState(0);

  if (!branches.length) return null;

  const active = branches[Math.min(idx, branches.length - 1)];
  const src = embedSrc(active);
  const link = openLink(active);

  return (
    <div style={{ marginTop: 28 }}>
      {/* Filial seçimi */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {branches.map((b, i) => {
          const on = i === idx;
          return (
            <button
              key={b._id || i}
              type="button"
              onClick={() => setIdx(i)}
              aria-pressed={on}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                border: `1px solid ${on ? "var(--accent)" : "#E4E5EC"}`,
                background: on ? "var(--accent)" : "#fff",
                color: on ? "#fff" : "#4A4A57",
                borderRadius: 99,
                padding: "9px 17px",
                fontSize: 14.5,
                fontWeight: on ? 700 : 600,
                fontFamily: "inherit",
                cursor: "pointer",
                transition: "all .2s",
              }}
            >
              <MapPin size={14} />
              {b.name}
            </button>
          );
        })}
      </div>

      {src ? (
        <div style={{ position: "relative", borderRadius: 22, overflow: "hidden", border: "1px solid #ECEDF2" }}>
          <iframe
            // key — filial dəyişəndə iframe yenidən yüklənsin
            key={src}
            src={src}
            title={active?.name || t("page.branchesMap")}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            style={{ width: "100%", minHeight: 380, border: 0, display: "block" }}
          />
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                position: "absolute",
                right: 12,
                bottom: 12,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#fff",
                border: "1px solid #E4E5EC",
                borderRadius: 10,
                padding: "8px 12px",
                fontSize: 13,
                fontWeight: 700,
                color: "#33333D",
                boxShadow: "0 6px 18px rgba(20,20,45,.12)",
              }}
            >
              <ExternalLink size={14} /> {t("common.openMap")}
            </a>
          )}
        </div>
      ) : (
        <div className="img-slot" style={{ minHeight: 340, borderRadius: 22 }}>
          <span>{t("common.mapSoon")}</span>
        </div>
      )}
    </div>
  );
}
