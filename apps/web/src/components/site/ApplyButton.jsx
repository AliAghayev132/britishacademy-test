"use client";

// Lib
import { useT } from "@/lib";

// Local
import { useApply } from "./SiteProvider";

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
