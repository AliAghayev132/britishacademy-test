// Components
import { SectionHead, PartnersCarousel } from "@/components";

// Local
import { wrap } from "./wrap";

export default function PartnersSection({ partners, t }) {
  return (
    <section className="ba-reveal ba-partners" style={{ background: "#F6F7FA", marginTop: 84, borderTop: "1px solid #ECEDF2", borderBottom: "1px solid #ECEDF2" }}>
      <div style={{ ...wrap, padding: "70px 28px" }}>
        <SectionHead title={t("home.partners.title")} sub={t("home.partners.sub")} />
        <PartnersCarousel partners={partners} />
      </div>
    </section>
  );
}
