"use client";

import { useApply } from "./SiteProvider";
import { useT } from "@/lib/i18n/useT";

/** A "Müraciət et" button usable from any (server-rendered) page. */
export function ApplyButton({ interest, children, className, style }) {
  const { open } = useApply();
  const t = useT();
  return (
    <button onClick={() => open(interest)} className={className} style={style}>
      {children ?? t("cta.apply")}
    </button>
  );
}
