"use client";

// ── Xaricdə təhsil müraciətləri ──
//
// Sidebar-da ayrıca bənddir, çünki bu müraciətlərin axını fərqlidir: kurs
// deyil, ölkə seçilir və onlarla ayrıca işlənir. Siyahı, filtrlər və status
// dəyişdirmə ümumi müraciətlərlə eynidir, ona görə komponent təkrar yazılmır —
// `LeadsView` sabit süzgəclə render olunur.

import { LeadsView } from "../page";

export default function AbroadLeadsPage() {
  return <LeadsView abroadOnly />;
}
