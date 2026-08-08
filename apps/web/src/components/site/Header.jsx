"use client";

// React
import { memo, useCallback, useEffect, useState } from "react";
// Next
import Link from "next/link";
import { usePathname } from "next/navigation";
// Local
import { useApply } from "./SiteProvider";
import { ScrollProgress } from "./ScrollProgress";
import { SearchOverlay } from "./SearchOverlay";

// ── Constants ──
const caret = (
  <svg className="ba-caret" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const ddArrow = (
  <svg className="ba-dd-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

// ── Subcomponents ──
const DesktopNavItem = memo(function DesktopNavItem({ item, active, services, destinations }) {
  if (item.variant === "mega") {
    // Nested dropdown (category → hover → sub-links) — matches the static site.
    return (
      <div className={`ba-nav-item${active ? " is-active" : ""}`}>
        <Link href={item.href}>{item.label} {caret}</Link>
        <div className="ba-dd ba-dd--nest">
          {services.map((g) => (
            <div key={g.category._id} className="ba-dd-item">
              <Link href={`/kurslar/${g.category.slug}`}><span>{g.category.name}</span>{ddArrow}</Link>
              <div className="ba-dd-sub">
                {g.courses.map((c) => (
                  <Link key={c._id} href={`/kurslar/${c.slug}`}>{c.title}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (item.variant === "destinations") {
    return (
      <div className={`ba-nav-item${active ? " is-active" : ""}`}>
        <Link href={item.href}>{item.label} {caret}</Link>
        <div className="ba-dd ba-dd--right ba-dd--2col">
          {destinations.map((d) => (
            <Link key={d._id} href={`/xaricde-tehsil/${d.slug}`}>{d.country}</Link>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className={`ba-nav-item${active ? " is-active" : ""}`}>
      <Link href={item.href}>{item.label}</Link>
    </div>
  );
});

const MobileNavItem = memo(function MobileNavItem({ item, services, destinations, onClose }) {
  if (item.variant) {
    return (
      <details className="ba-macc">
        <summary>{item.label}</summary>
        <div className="ba-macc-body">
          <Link className="ba-msub ba-msub--all" href={item.href} onClick={onClose}>{item.label} — hamısı</Link>

          {/* Xidmətlər — iç-içə açılan: kateqoriya → kliklə → kursları açılır */}
          {item.variant === "mega" &&
            services.map((g) => (
              <details key={g.category._id} className="ba-macc ba-macc--sub">
                <summary>{g.category.name}</summary>
                <div className="ba-macc-body">
                  <Link className="ba-msub ba-msub--all" href={`/kurslar/${g.category.slug}`} onClick={onClose}>{g.category.name} — hamısı</Link>
                  {g.courses.map((c) => (
                    <Link key={c._id} className="ba-msub" href={`/kurslar/${c.slug}`} onClick={onClose}>{c.title}</Link>
                  ))}
                </div>
              </details>
            ))}

          {item.variant === "destinations" &&
            destinations.map((d) => (
              <Link key={d._id} className="ba-msub" href={`/xaricde-tehsil/${d.slug}`} onClick={onClose}>{d.country}</Link>
            ))}
        </div>
      </details>
    );
  }
  return (
    <Link className="ba-mrow" href={item.href} onClick={onClose}>{item.label}</Link>
  );
});

// First-load intro overlay: the logo "walks" (reuses the ba-walk keyframe) with
// a short progress fill, then fades out ~1.2s in. Shows once per session so it
// doesn't reappear on client navigation (RouteLoader covers those). Lightweight
// and non-blocking after the fade.
function IntroLoader() {
  const [show, setShow] = useState(false);
  const [hide, setHide] = useState(false);
  const [bar, setBar] = useState(8);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("ba-intro-shown")) return;
    setShow(true);
    const start = setTimeout(() => setBar(100), 60);
    const fade = setTimeout(() => setHide(true), 1200);
    const done = setTimeout(() => {
      setShow(false);
      sessionStorage.setItem("ba-intro-shown", "1");
    }, 1780);
    return () => {
      clearTimeout(start);
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className="ba-loader"
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "#0C0D1A",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 26,
        opacity: hide ? 0 : 1,
        transition: "opacity .55s ease",
        pointerEvents: hide ? "none" : "auto",
      }}
    >
      <div
        className="ba-loader-walk"
        style={{ background: "#fff", borderRadius: 16, padding: "16px 22px", animation: "ba-walk 1.05s ease-in-out infinite", transformOrigin: "50% 90%" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-stack.png" alt="British Academy" width={377} height={200} style={{ height: 88, width: "auto", display: "block" }} />
      </div>
      <div style={{ width: 210, height: 4, borderRadius: 99, background: "rgba(255,255,255,.14)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${bar}%`, background: "var(--accent)", borderRadius: 99, transition: "width 1.1s cubic-bezier(.4,.1,.2,1)" }} />
      </div>
    </div>
  );
}

export function Header({ site, nav = [], services = [], destinations = [] }) {
  // ── State / derived ──
  const pathname = usePathname();
  const { open } = useApply();
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const isActive = (href) => href && href !== "/" && pathname.startsWith(href);

  // ── Handlers ──
  const closeMobile = useCallback(() => setMobile(false), []);
  const openSearch = useCallback(() => setSearch(true), []);
  const closeSearch = useCallback(() => setSearch(false), []);

  // Close the mobile drawer whenever the route changes…
  useEffect(() => { setMobile(false); }, [pathname]);

  // …and when the viewport grows back to the desktop nav breakpoint (1000px).
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 1000) setMobile(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Render ──
  return (
    <>
    {/* first-load intro + site-wide scroll progress */}
    <IntroLoader />
    <ScrollProgress />

    <div className="ba-fixhead" style={{ position: "sticky", top: 0, zIndex: 60 }}>
      {/* top bar */}
      <div style={{ background: "#0F1020", color: "#C7C8DA", fontSize: 13 }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "8px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
            <span>✉ {site?.contact?.email}</span>
            <span>☎ {site?.contact?.phone}</span>
            <span style={{ opacity: 0.65 }}>{site?.contact?.hours}</span>
          </div>
          {/* language switcher hidden for now (single-language site) */}
        </div>
      </div>

      <header style={{ background: "rgba(255,255,255,.94)", backdropFilter: "blur(14px)", borderBottom: "1px solid #ECEDF2" }}>
        <div className="ba-headrow" style={{ maxWidth: 1240, margin: "0 auto", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
          <Link href="/" aria-label="British Academy — ana səhifə" style={{ display: "flex", alignItems: "center", flex: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={site?.brand?.logo || "/assets/logo.png"} alt="British Academy" style={{ height: 46, width: "auto", display: "block" }} />
          </Link>

          <nav className="ba-nav">
            {nav.map((item) => (
              <DesktopNavItem
                key={item.label}
                item={item}
                active={isActive(item.href)}
                services={services}
                destinations={destinations}
              />
            ))}
          </nav>

          <div className="ba-head-actions" style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
            <button
              type="button"
              onClick={openSearch}
              aria-label="Axtar"
              className="ba-search-btn"
              style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", background: "#F1F2F6", border: "1px solid #E7E8EE", color: "#4C4C58", fontWeight: 600, fontSize: 14, height: 42, padding: "0 13px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flex: "none" }} aria-hidden="true">
                <circle cx="11" cy="11" r="7"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
              <span className="ba-search-txt">Axtar</span>
            </button>
            <button
              onClick={() => open()}
              className="ba-apply-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 700, fontSize: 14.5, padding: "11px 20px", borderRadius: 99, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Müraciət et
            </button>
          </div>

          {/* Hamburger — far right on mobile */}
          <button
            className={`ba-burger${mobile ? " is-open" : ""}`}
            aria-label="Menyu"
            aria-expanded={mobile}
            onClick={() => setMobile((m) => !m)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </header>

      {/* mobile drawer */}
      <div className={`ba-mnav${mobile ? " open" : ""}`} onClick={() => setMobile(false)}>
        <div className="ba-mnav-inner" onClick={(e) => e.stopPropagation()}>
          {nav.map((item) => (
            <MobileNavItem
              key={item.label}
              item={item}
              services={services}
              destinations={destinations}
              onClose={closeMobile}
            />
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button
              type="button"
              onClick={() => { setMobile(false); openSearch(); }}
              style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#F1F2F6", border: "1px solid #E7E8EE", color: "#4C4C58", fontWeight: 700, fontSize: 14.5, padding: "12px 16px", borderRadius: 12, cursor: "pointer" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
              Axtar
            </button>
            <button
              type="button"
              onClick={() => { setMobile(false); open(); }}
              className="ba-apply-btn"
              style={{ flex: 1, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 700, fontSize: 14.5, padding: "12px 16px", borderRadius: 12, cursor: "pointer" }}
            >
              Müraciət et
            </button>
          </div>
        </div>
      </div>
    </div>

    <SearchOverlay open={search} onClose={closeSearch} />
    </>
  );
}
