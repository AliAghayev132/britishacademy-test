// Components
import { SectionHead, FaqAccordion } from "@/components";

// Local
import { wrap } from "./wrap";

export default function FaqSection({ items, t }) {
  return (
    <section className="ba-reveal" style={{ ...wrap, padding: "84px 28px 20px" }}>
      <SectionHead title={t("home.faq.title")} sub={t("home.faq.sub")} />
      <FaqAccordion items={items} />
    </section>
  );
}
