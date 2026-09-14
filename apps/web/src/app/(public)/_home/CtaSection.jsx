// Components
import { ApplyButton } from "@/components";

// Local
import { wrap } from "./wrap";

export default function CtaSection({ t }) {
  return (
    <section className="ba-reveal" style={{ ...wrap, padding: "80px 28px 20px" }}>
      <div style={{ background: "linear-gradient(115deg, var(--accent) 0%, #7C4DFF 52%, #C13DBF 115%)", borderRadius: 28, padding: "60px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(28px,4vw,40px)", color: "#fff", margin: 0, letterSpacing: "-.02em" }}>{t("home.cta.title")}</h2>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,.9)", margin: "14px auto 0", maxWidth: 520, lineHeight: 1.6 }}>{t("home.cta.text")}</p>
        <ApplyButton style={{ marginTop: 26, background: "#fff", color: "var(--accent)", border: "none", fontWeight: 700, fontSize: 16, padding: "15px 30px", borderRadius: 13, cursor: "pointer" }} />
      </div>
    </section>
  );
}
