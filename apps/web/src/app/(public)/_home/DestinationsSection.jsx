// Components
import { LocaleLink as Link, DestinationCard, SectionHead } from "@/components";

// Local
import { wrap } from "./wrap";

/** Xaricdə təhsil — ölkə kartları və «hamısı» keçidi. */
export default function DestinationsSection({ destinations, t }) {
  return (
    <section className="ba-reveal" style={{ background: "linear-gradient(165deg,#F4F7FF,#FDF6F0 55%,#F3FAF6)", marginTop: 84 }}>
      <div style={{ ...wrap, padding: "80px 28px" }}>
        <SectionHead title={t("home.abroad.title")} sub={t("home.abroad.sub")} />
        <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {destinations.map((d) => <DestinationCard key={d._id} dest={d} />)}
          <Link href="/xaricde-tehsil" className="ba-fdest ba-fdest-all" style={{ "--cc": "#fff" }}>
            <span className="ba-fdest-body"><span className="ba-fdest-tag" style={{ display: "block" }}>{t("home.abroad.tag")}</span><span className="ba-fdest-name" style={{ display: "block" }}>{t("home.abroad.all")}</span></span>
          </Link>
        </div>
      </div>
    </section>
  );
}
