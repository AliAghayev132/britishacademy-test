"use client";

import { useEffect } from "react";

/**
 * Adds `ba-home` to <body> only while the homepage is mounted. A large block of
 * the ported design system (hero aurora, destination cards, marquee gradient,
 * course shine, staggered reveals) is scoped to `body.ba-home` in globals.css —
 * without this class those styles are dead on the Next homepage.
 */
export function HomeBodyClass() {
  useEffect(() => {
    document.body.classList.add("ba-home");
    return () => document.body.classList.remove("ba-home");
  }, []);
  return null;
}
