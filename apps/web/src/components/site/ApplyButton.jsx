"use client";

import { useApply } from "./SiteProvider";

/** A "Müraciət et" button usable from any (server-rendered) page. */
export function ApplyButton({ interest, children = "Müraciət et", className, style }) {
  const { open } = useApply();
  return (
    <button onClick={() => open(interest)} className={className} style={style}>
      {children}
    </button>
  );
}
