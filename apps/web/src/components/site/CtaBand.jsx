import { ApplyButton } from "./ApplyButton";

/**
 * Shared "Hazırsan? Elə bu gün başla." dark CTA band (mirrors the static
 * ctaBand()). Dropped at the bottom of most content pages.
 */
export function CtaBand({
  interest,
  title = "Hazırsan? Elə bu gün başla.",
  text = "Pulsuz səviyyə təyini və məsləhət üçün müraciət et — komandamız səninlə əlaqə saxlayacaq.",
}) {
  return (
    <section style={{ maxWidth: 1240, margin: "0 auto", padding: "64px 28px 0" }}>
      <div style={{ position: "relative", overflow: "hidden", background: "#0C0D1A", borderRadius: 28, padding: "52px 40px", textAlign: "center" }}>
        <div style={{ position: "absolute", top: -60, left: -30, width: 220, height: 220, borderRadius: "50%", background: "var(--accent-wm)", filter: "blur(10px)", pointerEvents: "none" }} />
        <span
          aria-hidden="true"
          className="ba-cta-mascot"
          style={{ position: "absolute", right: 22, bottom: 0, width: 150, height: "86%", maxHeight: 200, backgroundImage: "url(/assets/mascot/hero.png)", backgroundRepeat: "no-repeat", backgroundPosition: "bottom center", backgroundSize: "contain", filter: "drop-shadow(0 16px 26px rgba(0,0,0,.42))", pointerEvents: "none" }}
        />
        <style>{`@media(max-width:680px){.ba-cta-mascot{display:none}}`}</style>
        <div style={{ position: "relative" }}>
          <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(26px,3.4vw,36px)", color: "#fff", margin: 0, letterSpacing: "-.02em" }}>{title}</h2>
          <p style={{ fontSize: 16, color: "#B9BAD0", margin: "14px auto 26px", maxWidth: 520, lineHeight: 1.6 }}>{text}</p>
          <ApplyButton interest={interest} style={{ background: "var(--accent)", color: "#fff", border: "none", fontWeight: 700, fontSize: 16, padding: "15px 30px", borderRadius: 99, cursor: "pointer" }} />
        </div>
      </div>
    </section>
  );
}
