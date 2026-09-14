"use client";

// React
import { memo } from "react";

// Local
import { LocaleLink as Link } from "../LocaleLink";
import svcHref from "./svcHref";
import useNavLabel from "./useNavLabel";

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

/** Masaüstü nav bəndi — sadə link, sadə dropdown, istiqamətlər və ya mega menyu. */
const NavItem = memo(function DesktopNavItem({ item, active, services, destinations }) {
  const label = useNavLabel(item);
  if (item.variant === "mega") {
    // Nested dropdown (category → hover → sub-links) — matches the static site.
    return (
      <div className={`ba-nav-item${active ? " is-active" : ""}`}>
        <Link href={item.href}>{label} {caret}</Link>
        <div className="ba-dd ba-dd--nest">
          {services.map((g) => (
            <div key={g.category._id} className="ba-dd-item">
              <Link href={svcHref(g.category)}><span>{g.category.name}</span>{ddArrow}</Link>
              <div className="ba-dd-sub">
                {g.courses.map((c) => (
                  <Link key={c._id} href={svcHref(c)}>{c.title}</Link>
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
  // Sadə dropdown — menyu bəndinin öz uşaqları (məs. Haqqımızda → Müəllimlər,
  // Tələbələrimiz). Siyahı DB-dən gəlir, burada sabit yazılmır.
  if (item.variant === "links") {
    return (
      <div className={`ba-nav-item${active ? " is-active" : ""}`}>
        <Link href={item.href}>{label} {caret}</Link>
        <div className="ba-dd">
          {item.children.map((c) => (
            <Link key={c.href} href={c.href}>{c.label}</Link>
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

export default NavItem;
