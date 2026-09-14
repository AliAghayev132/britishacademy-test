"use client";

// React
import { useCallback, useEffect, useState } from "react";

// Next
import { usePathname } from "next/navigation";

// Lib
import { useT, stripLocale } from "@/lib";

// Local
import { LocaleLink as Link } from "./LocaleLink";
import { useApply } from "./SiteProvider";
import { ScrollProgress } from "./ScrollProgress";
import { SearchOverlay } from "./SearchOverlay";
import LanguageSwitcher from "./header/LanguageSwitcher";
import LanguageMenu from "./header/LanguageMenu";
import NavItem from "./header/NavItem";
import MobileNav from "./header/MobileNav";

// Giriş pərdəsi (IntroLoader) silindi (audit #32): sessiyanın ilk ziyarətində
// 1.2–1.8 s qeyri-şəffaf pərdə məzmunu örtür və kliki bloklayırdı — reklamdan
// gələn ziyarətçinin ilk təəssüratı gözləmə idi.

export function Header({ site, nav = [], services = [], destinations = [] }) {
  // ── State / derived ──
  const t = useT();
  const pathname = usePathname();
  const { open } = useApply();
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  // pathname lokallaşdırılmışdır (/en/courses), href isə kanonik AZ (/kurslar).
  // Əvvəl birbaşa müqayisə olunurdu və EN/RU-da heç bir bənd işarələnmirdi (audit #54).
  const canonical = stripLocale(pathname);
  const isActive = (href) => {
    if (!href || href === "/") return false;
    const base = href.split(/[?#]/)[0];
    return canonical === base || canonical.startsWith(`${base}/`);
  };

  // ── Handlers ──
  const closeMobile = useCallback(() => setMobile(false), []);
  const openSearch = useCallback(() => setSearch(true), []);
  const closeSearch = useCallback(() => setSearch(false), []);

  // Close the mobile drawer whenever the route changes…
  // eslint-disable-next-line react-hooks/set-state-in-effect -- route dəyişəndə mobil menyu bağlanır (pathname asılılığına reaksiya)
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
    {/* site-wide scroll progress */}
    <ScrollProgress />

    <div className="ba-fixhead" style={{ position: "sticky", top: 0, zIndex: 60 }}>
      {/* Üst lent — mobildə gizlədilir (.ba-topbar, globals.css). Dar ekranda
          e-poçt/telefon/saat/dil alt-alta düşüb header-i ikiqat hündürlüyə
          çıxarırdı; dil seçimi hamburgerin yanına köçürüldü. */}
      <div className="ba-topbar" style={{ background: "#001452", color: "#C7C8DA", fontSize: 13 }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "8px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
            <span>✉ {site?.contact?.email}</span>
            <span>☎ {site?.contact?.phone}</span>
            <span style={{ opacity: 0.65 }}>{site?.contact?.hours}</span>
          </div>
          <LanguageSwitcher />
        </div>
      </div>

      <header style={{ background: "rgba(255,255,255,.94)", backdropFilter: "blur(14px)", borderBottom: "1px solid #ECEDF2" }}>
        <div className="ba-headrow" style={{ maxWidth: 1240, margin: "0 auto", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
          <Link href="/" aria-label={t("common.homeAria")} style={{ display: "flex", alignItems: "center", flex: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={site?.brand?.logo || "/assets/logo.png"} alt="British Academy" style={{ height: 46, width: "auto", display: "block" }} />
          </Link>

          <nav className="ba-nav">
            {nav.map((item) => (
              <NavItem
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
              aria-label={t("nav.search")}
              className="ba-search-btn"
              style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", background: "#F1F2F6", border: "1px solid #E7E8EE", color: "#4C4C58", fontWeight: 600, fontSize: 14, height: 42, padding: "0 13px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flex: "none" }} aria-hidden="true">
                <circle cx="11" cy="11" r="7"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
              <span className="ba-search-txt">{t("nav.search")}</span>
            </button>
            <button
              onClick={() => open()}
              className="ba-apply-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 700, fontSize: 14.5, padding: "11px 20px", borderRadius: 99, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {t("nav.apply")}
            </button>
          </div>

          {/* Mobil sağ küncdəki dəst: dil seçicisi + hamburger.
              Ayrıca sarğı lazımdır, çünki header sətri `space-between`-dir —
              sarğısız üç element (loqo, dil, hamburger) bərabər paylanıb dil
              ortada qalardı. */}
          <div className="ba-mobile-actions">
            <LanguageMenu />
            <button
              className={`ba-burger${mobile ? " is-open" : ""}`}
              aria-label={t("nav.menu")}
              aria-controls="ba-mobile-nav"
              aria-expanded={mobile}
              onClick={() => setMobile((m) => !m)}
            >
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </header>

      {/* mobile drawer */}
      <MobileNav
        mobile={mobile}
        nav={nav}
        services={services}
        destinations={destinations}
        onClose={closeMobile}
        onSearch={openSearch}
        onApply={() => open()}
      />
    </div>

    <SearchOverlay open={search} onClose={closeSearch} />
    </>
  );
}
