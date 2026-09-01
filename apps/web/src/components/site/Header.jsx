"use client";

// React
import { memo, useCallback, useEffect, useRef, useState } from "react";
// Next
import { usePathname } from "next/navigation";
// Local
import { LocaleLink as Link } from "./LocaleLink";
import { useLocale, stripLocale, withLocale } from "./LocaleProvider";
import { useApply } from "./SiteProvider";
import { ScrollProgress } from "./ScrollProgress";
import { SearchOverlay } from "./SearchOverlay";
import { useT } from "@/lib/i18n/useT";

// ── Dillər ──
// Ad öz dilində yazılır (endonim): rus dilli ziyarətçi «Rus dili» yox,
// «Русский» axtarır.
const LANGS = [
  { code: "az", label: "AZ", name: "Azərbaycan" },
  { code: "en", label: "EN", name: "English" },
  { code: "ru", label: "RU", name: "Русский" },
];

/**
 * Dil dəyişdirmə məntiqi — iki fərqli görünüş (masaüstü lent, mobil dropdown)
 * eyni davranışı paylaşsın deyə ayrıca hook-dur.
 */
function useLangSwitch() {
  const locale = useLocale();
  const pathname = usePathname();
  const base = stripLocale(pathname);
  const go = useCallback(
    (l) => {
      if (l === locale) return;
      document.cookie = `lang=${l}; path=/; max-age=${60 * 60 * 24 * 365}`;
      // withLocale həm prefiksi qoyur, həm slug-u hədəf dilə çevirir
      // (/en/contact → /ru/kontakty).
      const target = withLocale(l, base);
      // Hard reload — serverdən tam yenidən render (nav/menyu daxil) yeni dildə.
      window.location.assign(target || "/");
    },
    [locale, base],
  );
  return { locale, go };
}

// ── Dil seçicisi (AZ/EN/RU) — üst lentdə, yalnız masaüstü ──
const LanguageSwitcher = memo(function LanguageSwitcher() {
  const { locale, go } = useLangSwitch();
  return (
    <div style={{ display: "inline-flex", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 99, padding: 2 }}>
      {["az", "en", "ru"].map((l) => {
        const on = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => go(l)}
            style={{ border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 99, background: on ? "var(--accent)" : "transparent", color: on ? "#fff" : "rgba(255,255,255,.65)" }}
          >
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
});

/**
 * Mobil dil seçicisi — hamburger düyməsinin yanında dropdown.
 *
 * Masaüstündə dil üst lentdədir, lakin o lent mobildə gizlədilir: e-poçt,
 * telefon, iş saatı və üç dil düyməsi dar ekranda alt-alta düşüb header-i
 * ikiqat hündürlüyə çıxarırdı. Dil seçimi isə lazımdır, ona görə bura
 * yığcam dropdown kimi köçürüldü.
 */
const LanguageMenu = memo(function LanguageMenu() {
  const { locale, go } = useLangSwitch();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Kənara toxunanda və Escape-də bağlan.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    // `pointerdown` — `click` gec işləyir və menyu açıq qalmış görünür.
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = LANGS.find((l) => l.code === locale) || LANGS[0];

  return (
    <div className="ba-langmenu" ref={ref}>
      <button
        type="button"
        className="ba-langmenu-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Dil: ${current.name}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{current.label}</span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="ba-langmenu-pop" role="menu">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              role="menuitem"
              className={`ba-langmenu-item${l.code === locale ? " is-on" : ""}`}
              onClick={() => { setOpen(false); go(l.code); }}
            >
              <b>{l.label}</b>
              <span>{l.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

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

// Standart nav bəndləri üçün tərcümə açarı (menyu EN/RU boş olsa belə tərcümə olsun).
const NAV_KEY_BY_HREF = {
  "/": "common.home",
  "/kurslar": "common.courses",
  "/muellimler": "common.teachers",
  "/filiallar": "page.branches.title",
  "/bloq": "home.blog.title",
  "/elaqe": "footer.link.contact",
  "/haqqimizda": "about.eyebrow",
  "/telebelerimiz": "page.students.title",
  "/xaricde-tehsil": "home.abroad.title",
};
function navKey(item) {
  if (item.variant === "mega") return "nav.services";
  if (item.variant === "destinations") return "home.abroad.title";
  return NAV_KEY_BY_HREF[item.href] || null;
}
/** Nav bəndinin göstəriləcək adı: tanınan standart bənd → t(); əks halda DB label. */
function useNavLabel(item) {
  const t = useT();
  const k = navKey(item);
  return k ? t(k) : item.label;
}

// ── Subcomponents ──
const DesktopNavItem = memo(function DesktopNavItem({ item, active, services, destinations }) {
  const label = useNavLabel(item);
  if (item.variant === "mega") {
    // Nested dropdown (category → hover → sub-links) — matches the static site.
    return (
      <div className={`ba-nav-item${active ? " is-active" : ""}`}>
        <Link href={item.href}>{label} {caret}</Link>
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
        <Link href={item.href}>{label} {caret}</Link>
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
      <Link href={item.href}>{label}</Link>
    </div>
  );
});

const MobileNavItem = memo(function MobileNavItem({ item, services, destinations, onClose }) {
  const t = useT();
  const label = useNavLabel(item);
  if (item.variant) {
    return (
      <details className="ba-macc">
        <summary>{label}</summary>
        <div className="ba-macc-body">
          <Link className="ba-msub ba-msub--all" href={item.href} onClick={onClose}>{label} — {t("common.all")}</Link>

          {/* Xidmətlər — iç-içə açılan: kateqoriya → kliklə → kursları açılır */}
          {item.variant === "mega" &&
            services.map((g) => (
              <details key={g.category._id} className="ba-macc ba-macc--sub">
                <summary>{g.category.name}</summary>
                <div className="ba-macc-body">
                  <Link className="ba-msub ba-msub--all" href={`/kurslar/${g.category.slug}`} onClick={onClose}>{g.category.name} — {t("common.all")}</Link>
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
    <Link className="ba-mrow" href={item.href} onClick={onClose}>{label}</Link>
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- giriş animasiyası yalnız brauzerdə, sessionStorage yoxlanışından sonra başlaya bilər
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
        background: "#00103D",
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
  const t = useT();
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
    {/* first-load intro + site-wide scroll progress */}
    <IntroLoader />
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
              aria-label="Menyu"
              aria-expanded={mobile}
              onClick={() => setMobile((m) => !m)}
            >
              <span></span><span></span><span></span>
            </button>
          </div>
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
              {t("nav.search")}
            </button>
            <button
              type="button"
              onClick={() => { setMobile(false); open(); }}
              className="ba-apply-btn"
              style={{ flex: 1, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 700, fontSize: 14.5, padding: "12px 16px", borderRadius: 12, cursor: "pointer" }}
            >
              {t("nav.apply")}
            </button>
          </div>
        </div>
      </div>
    </div>

    <SearchOverlay open={search} onClose={closeSearch} />
    </>
  );
}
