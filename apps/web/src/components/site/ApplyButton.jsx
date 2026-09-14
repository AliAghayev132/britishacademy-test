"use client";

// Lib
import { useT } from "@/lib";

// Local
import { useApply } from "./SiteProvider";

/**
 * A "Müraciət et" button usable from any (server-rendered) page.
 * `destination` — ölkə səhifəsindən: maraq «Xaricdə təhsil» olur və həmin
 * ölkə seçilmiş gəlir.
 */
export function ApplyButton({ interest, project, destination, children, className, style }) {
  const { open } = useApply();
  const t = useT();
  return (
    <button onClick={() => open(interest, { project, destination })} className={className} style={style}>
      {children ?? t("cta.apply")}
    </button>
  );
}
