"use client";

// React
import { useEffect } from "react";

// Lib
import { trackVisit, captureAttribution } from "@/lib";

/**
 * Sayta girişi qeyd edir (sessiyada bir dəfə) və reklam mənbəyini tutur
 * (hər tam yüklənmədə — reklam klikləri həmişə tam yüklənmədir). Heç nə
 * göstərmir.
 */
export function SiteTracker() {
  useEffect(() => {
    captureAttribution();
    trackVisit();
  }, []);
  return null;
}
