"use client";

// React
import { useEffect } from "react";

// Lib
import { trackVisit } from "@/lib";

/** Sayta girişi qeyd edir (sessiyada bir dəfə). Heç nə göstərmir. */
export function SiteTracker() {
  useEffect(() => {
    trackVisit();
  }, []);
  return null;
}
