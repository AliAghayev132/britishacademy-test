import Link from "next/link";

// 404 — Azerbaijani, brand-styled.
export default function NotFound() {
  return (
    <div style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, textAlign: "center" }}>
      <p style={{ fontFamily: "'Poppins'", fontWeight: 800, fontSize: 72, color: "var(--accent)", margin: 0, lineHeight: 1 }}>404</p>
      <h1 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 24, color: "#14141C", margin: 0 }}>Səhifə tapılmadı</h1>
      <p style={{ maxWidth: 420, fontSize: 15, color: "#63636F", margin: 0, lineHeight: 1.6 }}>
        Axtardığın səhifə mövcud deyil və ya köçürülüb.
      </p>
      <Link
        href="/"
        style={{ display: "inline-flex", alignItems: "center", background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 15, padding: "13px 26px", borderRadius: 99, marginTop: 8 }}
      >
        Ana səhifəyə qayıt
      </Link>
    </div>
  );
}
