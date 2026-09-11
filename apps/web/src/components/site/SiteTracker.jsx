"use client";

import { useEffect } from "react";
import { trackVisit } from "@/lib/track";

/** Sayta girişi qeyd edir (sessiyada bir dəfə). Heç nə göstərmir. */
export function SiteTracker() {
  useEffect(() => {
    trackVisit();
  }, []);
  return null;
}
