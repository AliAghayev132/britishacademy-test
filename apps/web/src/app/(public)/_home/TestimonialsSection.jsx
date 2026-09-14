// Components
import { LocaleLink as Link, TestimonialCard, SectionHead } from "@/components";

// Local
import { wrap } from "./wrap";

/** Mətn rəyləri divarı və tələbələr səhifəsinə keçid. */
export default function TestimonialsSection({ testimonials, t }) {
  return (
    <section className="ba-reveal" style={{ ...wrap, padding: "84px 28px 20px" }}>
      <SectionHead title={t("home.reviews.title")} sub={t("home.reviews.sub")} />
      <div className="ba-wall">
        {testimonials.map((item) => <TestimonialCard key={item._id} t={item} />)}
      </div>
      <div style={{ textAlign: "center", marginTop: 30 }}>
        <Link href="/telebelerimiz" style={{ color: "var(--accent)", fontWeight: 700, fontSize: 15 }}>{t("home.reviews.all")}</Link>
      </div>
    </section>
  );
}
