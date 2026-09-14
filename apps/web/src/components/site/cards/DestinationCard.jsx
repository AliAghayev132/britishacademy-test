"use client";

// Lib
import { getImageUrl } from "@/lib";

// Utils
import { isInlineSvg, svgDataUri } from "@/utils";

// Local
import { LocaleLink as Link } from "../LocaleLink";

// Country → flag emoji (used as a decorative wash when no SVG flag is stored).
const COUNTRY_FLAGS = {
  "Almaniya": "🇩🇪", "Türkiyə": "🇹🇷", "İngiltərə": "🇬🇧", "Kanada": "🇨🇦",
  "Polşa": "🇵🇱", "Latviya": "🇱🇻", "Macarıstan": "🇭🇺", "Litva": "🇱🇹",
  "Rusiya": "🇷🇺", "Gürcüstan": "🇬🇪", "Estoniya": "🇪🇪", "Amerika": "🇺🇸",
  "Fransa": "🇫🇷", "İspaniya": "🇪🇸", "İtaliya": "🇮🇹", "Niderland": "🇳🇱",
};

/**
 * Study-abroad destination card — sağ tərəfdə solğun "wash" görüntüsü.
 *
 * Üstünlük sırası:
 *   1) dest.image  — admin paneldən yüklənən şəkil (ƏN SADƏ YOL)
 *   2) dest.flag   — inline SVG bayraq (JSON redaktorundan)
 *   3) emoji       — heç nə yoxdursa (⚠️ Windows-da bayraq emojiləri
 *                    dəstəklənmir, "DE" kimi hərf cütü görünür)
 */
export default function DestinationCard({ dest }) {
  const flag = COUNTRY_FLAGS[dest.country] || (dest.isScholarship ? "🎓" : "🌍");
  return (
    <Link href={`/xaricde-tehsil/${dest.slug}`} className="ba-fdest" style={{ "--cc": dest.color || "#2E6BE6" }}>
      {dest.image ? (
        <span className="ba-flag" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getImageUrl(dest.image)} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </span>
      ) : dest.flag ? (
        <span className="ba-flag" aria-hidden="true">
          {/* Admin sərbəst mətn sahəsidir (inline SVG). <img> kimi yüklənən
              SVG-də skript işləmir — sanitizasiya və DOMPurify lazım deyil. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={isInlineSvg(dest.flag) ? svgDataUri(dest.flag) : dest.flag} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </span>
      ) : (
        <span aria-hidden="true" style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", fontSize: 92, lineHeight: 1, opacity: 0.9, pointerEvents: "none", userSelect: "none", WebkitMaskImage: "linear-gradient(to left, #000 55%, transparent)", maskImage: "linear-gradient(to left, #000 55%, transparent)" }}>{flag}</span>
      )}
      <span className="ba-fdest-body">
        <span className="ba-fdest-tag" style={{ display: "block" }}>{dest.region}</span>
        <span className="ba-fdest-name" style={{ display: "block" }}>{dest.country}</span>
        <span className="ba-fdest-sub" style={{ display: "block" }}>{dest.tagline}</span>
      </span>
    </Link>
  );
}
