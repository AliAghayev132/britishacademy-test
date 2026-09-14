"use client";

// React
import { memo } from "react";

// Lib
import { useT } from "@/lib";

// Local
import { LocaleLink as Link } from "../LocaleLink";
import { Disclosure } from "../Disclosure";
import svcHref from "./svcHref";
import useNavLabel from "./useNavLabel";

const MobileNavItem = memo(function MobileNavItem({ item, services, destinations, onClose }) {
  const t = useT();
  const label = useNavLabel(item);
  if (item.variant) {
    return (
      <Disclosure label={label}>
        <Link className="ba-msub ba-msub--all" href={item.href} onClick={onClose}>{label} — {t("common.all")}</Link>

        {/* Xidmətlər — iç-içə açılan: kateqoriya → kliklə → kursları açılır */}
        {item.variant === "mega" &&
          services.map((g) => (
            <Disclosure key={g.category._id} className="ba-macc--sub" label={g.category.name}>
              <Link className="ba-msub ba-msub--all" href={svcHref(g.category)} onClick={onClose}>{g.category.name} — {t("common.all")}</Link>
              {g.courses.map((c) => (
                <Link key={c._id} className="ba-msub" href={svcHref(c)} onClick={onClose}>{c.title}</Link>
              ))}
            </Disclosure>
          ))}

        {item.variant === "destinations" &&
          destinations.map((d) => (
            <Link key={d._id} className="ba-msub" href={`/xaricde-tehsil/${d.slug}`} onClick={onClose}>{d.country}</Link>
          ))}

        {item.variant === "links" &&
          (item.children || []).map((c) => (
            <Link key={c.href} className="ba-msub" href={c.href} onClick={onClose}>{c.label}</Link>
          ))}
      </Disclosure>
    );
  }
  return (
    <Link className="ba-mrow" href={item.href} onClick={onClose}>{label}</Link>
  );
});

export default MobileNavItem;
