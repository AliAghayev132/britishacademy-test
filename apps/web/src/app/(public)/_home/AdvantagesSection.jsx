// Components
import { SectionHead } from "@/components";

// Local
import { wrap } from "./wrap";

// Per-advantage icon (by index) so each of the 6 cards differs.
const ADV_ICONS = ["⚡", "🎯", "🎓", "🗣️", "📚", "🏆"];

function AdvantageCard({ advantage, index }) {
  const a = advantage;
  return (
    <div className="ba-adv2" style={{ position: "relative", background: "#F7F8FB", border: "1px solid #ECEDF2", borderRadius: 20, padding: "30px 26px", "--accent": a.color, "--accent-soft": `${a.color}1f` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="ba-adv2-ic" style={{ width: 50, height: 50, borderRadius: 13, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", fontSize: 24 }}>{ADV_ICONS[index % ADV_ICONS.length]}</div>
        <span className="ba-adv2-n" style={{ fontFamily: "'Poppins'", fontWeight: 800, fontSize: 34, color: "#AAB0CC" }}>{String(index + 1).padStart(2, "0")}</span>
      </div>
      <h3 className="ba-adv2-t" style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 19, margin: "22px 0 0", color: "#17171F" }}>{a.title}</h3>
      <p className="ba-adv2-d" style={{ fontSize: 14.5, color: "#63636F", margin: "10px 0 0", lineHeight: 1.55 }}>{a.text}</p>
    </div>
  );
}

export default function AdvantagesSection({ advantages, t }) {
  return (
    <section className="ba-reveal" style={{ ...wrap, padding: "84px 28px 20px" }}>
      <SectionHead title={t("home.adv.title")} sub={t("home.adv.sub")} />
      <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {advantages.map((a, i) => <AdvantageCard key={a._id} advantage={a} index={i} />)}
      </div>
    </section>
  );
}
