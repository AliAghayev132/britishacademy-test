"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useApply } from "./SiteProvider";

const caret = (
  <svg className="ba-caret" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export function Header({ site, nav = [], services = [], destinations = [] }) {
  const pathname = usePathname();
  const { open } = useApply();
  const [mobile, setMobile] = useState(false);
  const isActive = (href) => href && href !== "/" && pathname.startsWith(href);

  return (
    <div className="ba-fixhead" style={{ position: "sticky", top: 0, zIndex: 60 }}>
      {/* top bar */}
      <div style={{ background: "#0F1020", color: "#C7C8DA", fontSize: 13 }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "8px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
            <span>✉ {site?.contact?.email}</span>
            <span>☎ {site?.contact?.phone}</span>
            <span style={{ opacity: 0.65 }}>{site?.contact?.hours}</span>
          </div>
        </div>
      </div>

      <header style={{ background: "rgba(255,255,255,.94)", backdropFilter: "blur(14px)", borderBottom: "1px solid #ECEDF2" }}>
        <div className="ba-headrow" style={{ maxWidth: 1240, margin: "0 auto", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
          <Link href="/" aria-label="British Academy — ana səhifə" style={{ display: "flex", alignItems: "center", flex: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={site?.brand?.logo || "/assets/logo.png"} alt="British Academy" style={{ height: 46, width: "auto", display: "block" }} />
          </Link>

          <nav className="ba-nav">
            {nav.map((item) => {
              const active = isActive(item.href);
              if (item.variant === "mega") {
                return (
                  <div key={item.label} className={`ba-nav-item has-mega${active ? " is-active" : ""}`}>
                    <Link href={item.href}>{item.label} {caret}</Link>
                    <div className="ba-mega"><div className="ba-mega-inner">
                      {services.map((g) => (
                        <div key={g.category._id} className="ba-mega-col">
                          <Link className="ba-mega-title" href={`/kurslar/${g.category.slug}`}>{g.category.name}</Link>
                          <div className="ba-mega-links">
                            {g.courses.map((c) => (
                              <Link key={c._id} href={`/kurslar/${c.slug}`}>{c.title}</Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div></div>
                  </div>
                );
              }
              if (item.variant === "destinations") {
                return (
                  <div key={item.label} className={`ba-nav-item${active ? " is-active" : ""}`}>
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
                <div key={item.label} className={`ba-nav-item${active ? " is-active" : ""}`}>
                  <Link href={item.href}>{item.label}</Link>
                </div>
              );
            })}
          </nav>

          <button
            className={`ba-burger${mobile ? " is-open" : ""}`}
            aria-label="Menyu"
            aria-expanded={mobile}
            onClick={() => setMobile((m) => !m)}
          >
            <span></span><span></span><span></span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
            <button
              onClick={() => open()}
              className="ba-apply-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 700, fontSize: 14.5, padding: "11px 20px", borderRadius: 99, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Müraciət et
            </button>
          </div>
        </div>
      </header>

      {/* mobile drawer */}
      <div className={`ba-mnav${mobile ? " open" : ""}`} onClick={() => setMobile(false)}>
        <div className="ba-mnav-inner" onClick={(e) => e.stopPropagation()}>
          {nav.map((item) =>
            item.variant ? (
              <details key={item.label} className="ba-macc">
                <summary>{item.label}</summary>
                <div className="ba-macc-body">
                  <Link className="ba-msub ba-msub--all" href={item.href} onClick={() => setMobile(false)}>{item.label} — hamısı</Link>
                  {item.variant === "mega" &&
                    services.flatMap((g) => [
                      <Link key={g.category._id} className="ba-msub ba-msub--head" href={`/kurslar/${g.category.slug}`} onClick={() => setMobile(false)}>{g.category.name}</Link>,
                      ...g.courses.map((c) => (
                        <Link key={c._id} className="ba-msub" href={`/kurslar/${c.slug}`} onClick={() => setMobile(false)}>{c.title}</Link>
                      )),
                    ])}
                  {item.variant === "destinations" &&
                    destinations.map((d) => (
                      <Link key={d._id} className="ba-msub" href={`/xaricde-tehsil/${d.slug}`} onClick={() => setMobile(false)}>{d.country}</Link>
                    ))}
                </div>
              </details>
            ) : (
              <Link key={item.label} className="ba-mrow" href={item.href} onClick={() => setMobile(false)}>{item.label}</Link>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
