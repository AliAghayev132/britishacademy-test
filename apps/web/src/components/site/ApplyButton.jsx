"use client";

import { useApply } from "./SiteProvider";
import { useT } from "@/lib/i18n/useT";

/** A "Müraciət et" button usable from any (server-rendered) page. */
export function ApplyButton({ interest, project, children, className, style }) {
  const { open } = useApply();
  const t = useT();
  return (
    <button onClick={() => open(interest, { project })} className={className} style={style}>
      {children ?? t("cta.apply")}
    </button>
  );
}
