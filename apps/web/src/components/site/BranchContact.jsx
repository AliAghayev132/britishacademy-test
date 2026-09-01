"use client";

// ── Filial üzrə əlaqə + xəritə ──
//
// Əvvəl əlaqə səhifəsi YALNIZ ümumi məlumatı (SiteSetting.contact) göstərirdi,
// xəritə isə «(Google Maps embed)» yazan boş plaseholder idi. İndi filial
// seçilir — ünvan, telefon, WhatsApp, e-poçt, iş saatları və xəritə hamısı
// seçilən filiala görə dəyişir.
//
// Xəritə mənbəyi üstünlük sırası ilə:
//   1) branch.mapEmbedUrl — admin tam nəzarət istəyirsə (paneldən yazılır)
//   2) branch.coords      — OpenStreetMap embed (açar tələb etmir)
//   3) branch.address     — Google Maps axtarış embed-i (açar tələb etmir)
// Beləcə yalnız ünvan olan filiallarda da xəritə işləyir.

import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Train, MessageCircle, ExternalLink } from "lucide-react";
import { useT } from "@/lib/i18n/useT";

/** Seçilmiş filial üçün embed URL-i qur. */
function mapSrc(b) {
  if (b?.mapEmbedUrl) return b.mapEmbedUrl;

  const lat = Number(b?.coords?.lat);
  const lng = Number(b?.coords?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    // Google embed — açar tələb etmir. Əvvəl OpenStreetMap işlədilirdi, amma
    // filialların linkləri Google-dandır və ziyarətçi eyni görünüşü gözləyir.
    return `https://maps.google.com/maps?q=${lat},${lng}&z=17&hl=az&output=embed`;
  }

  const q = [b?.name, b?.address].filter(Boolean).join(", ");
  return q ? `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed` : null;
}

/**
 * Xəritəni böyük pəncərədə açan link.
 *
 * Admin `mapUrl` veribsə o üstündür — qısa Google linki dəqiq yeri göstərir
 * (ünvandan qurulan axtarış linki bəzən yaxınlıqdakı başqa obyekti tapır).
 * Həmin linklər iframe-də AÇILMIR, ona görə embed ayrıca qurulur.
 */
function mapLink(b) {
  if (b?.mapUrl) return b.mapUrl;

  const lat = Number(b?.coords?.lat);
  const lng = Number(b?.coords?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
  const q = [b?.name, b?.address].filter(Boolean).join(", ");
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
}

function Row({ icon: Icon, label, children }) {
  if (!children) return null;
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: "1px solid #F1F2F6" }}>
      <span style={{ display: "grid", placeItems: "center", width: 34, height: 34, borderRadius: 10, background: "var(--accent-soft)", color: "var(--accent)", flex: "none" }}>
        <Icon size={16} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#8A8A96", textTransform: "uppercase", letterSpacing: ".04em" }}>
          {label}
        </span>
        <span style={{ display: "block", fontSize: 15, color: "#33333D", lineHeight: 1.55, marginTop: 2 }}>
          {children}
        </span>
      </span>
    </div>
  );
}

export function BranchContact({ branches = [], fallback = {} }) {
  const t = useT();
  const [idx, setIdx] = useState(0);

  // Filial yoxdursa ümumi əlaqə məlumatına düş.
  if (!branches.length) {
    const b = { address: fallback.address, phone: fallback.phone, email: fallback.email };
    return <SinglePane t={t} b={b} hours={fallback.hours} />;
  }

  const b = branches[Math.min(idx, branches.length - 1)];
  const hours = (b.workingHours || [])
    .map((h) => `${h.days} · ${h.from}–${h.to}`)
    .join("\n");

  return (
    <div>
      {/* Filial seçimi */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
        {branches.map((x, i) => {
          const on = i === idx;
          return (
            <button
              key={x._id || i}
              onClick={() => setIdx(i)}
              style={{
                border: `1px solid ${on ? "var(--accent)" : "#E4E5EC"}`,
                background: on ? "var(--accent)" : "#fff",
                color: on ? "#fff" : "#4A4A57",
                borderRadius: 99,
                padding: "9px 18px",
                fontSize: 14.5,
                fontWeight: on ? 700 : 600,
                cursor: "pointer",
                transition: "all .2s",
              }}
            >
              {x.name}
            </button>
          );
        })}
      </div>

      <div className="split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "stretch" }}>
        {/* Xəritə — filiala görə dəyişir */}
        <MapPane b={b} t={t} />

        {/* Seçilmiş filialın məlumatları */}
        <div style={{ border: "1px solid #ECEDF2", borderRadius: 22, background: "#fff", padding: "8px 24px 20px" }}>
          <Row icon={MapPin} label={t("common.address")}>
            {b.address}
            {b.district ? `, ${b.district}` : ""}
          </Row>
          <Row icon={Train} label="Metro">{b.metro}</Row>
          <Row icon={Phone} label={t("common.phone")}>
            {b.phone ? <a href={`tel:${String(b.phone).replace(/[^\d+]/g, "")}`}>{b.phone}</a> : null}
          </Row>
          <Row icon={MessageCircle} label="WhatsApp">
            {b.whatsapp ? (
              <a href={`https://wa.me/${b.whatsapp}`} target="_blank" rel="noopener noreferrer">
                +{b.whatsapp}
              </a>
            ) : null}
          </Row>
          <Row icon={Mail} label={t("common.email")}>
            {b.email ? <a href={`mailto:${b.email}`}>{b.email}</a> : null}
          </Row>
          <Row icon={Clock} label={t("common.hours")}>
            {hours ? hours.split("\n").map((l) => <span key={l} style={{ display: "block" }}>{l}</span>) : null}
          </Row>
        </div>
      </div>
    </div>
  );
}

function MapPane({ b, t }) {
  const src = mapSrc(b);
  const link = mapLink(b);

  if (!src) {
    return (
      <div className="img-slot" style={{ minHeight: 340, borderRadius: 22 }}>
        <span>{t("common.mapSoon")}</span>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", minHeight: 340, borderRadius: 22, overflow: "hidden", border: "1px solid #ECEDF2" }}>
      <iframe
        // key — filial dəyişəndə iframe yenidən yüklənsin
        key={src}
        src={src}
        title={b?.name || "Xəritə"}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        style={{ width: "100%", height: "100%", minHeight: 340, border: 0, display: "block" }}
      />
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: "absolute", right: 12, bottom: 12,
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#fff", border: "1px solid #E4E5EC", borderRadius: 10,
            padding: "8px 12px", fontSize: 13, fontWeight: 700, color: "#33333D",
            boxShadow: "0 6px 18px rgba(20,20,45,.12)",
          }}
        >
          <ExternalLink size={14} /> {t("common.openMap")}
        </a>
      )}
    </div>
  );
}

/** Filial yoxdursa — ümumi əlaqə məlumatı. */
function SinglePane({ t, b, hours }) {
  return (
    <div className="split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "stretch" }}>
      <MapPane b={b} t={t} />
      <div style={{ border: "1px solid #ECEDF2", borderRadius: 22, background: "#fff", padding: "8px 24px 20px" }}>
        <Row icon={MapPin} label={t("common.address")}>{b.address}</Row>
        <Row icon={Phone} label={t("common.phone")}>{b.phone}</Row>
        <Row icon={Mail} label={t("common.email")}>{b.email}</Row>
        <Row icon={Clock} label={t("common.hours")}>{hours}</Row>
      </div>
    </div>
  );
}
