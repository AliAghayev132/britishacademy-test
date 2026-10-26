// Components
import { LocaleLink as Link, TestimonialPhotoCard, SectionHead } from "@/components";

// Local
import { wrap } from "./wrap";

/**
 * Tələbə rəyləri — portret foto kartları, mətn şəklin üstündə.
 * «Tələbələrimiz» səhifəsi bütöv mətn divarını (TestimonialCard) saxlayır:
 * orada bütün rəylər sıx oxunmalıdır, burada isə seçilmiş bir neçəsi önə çıxır.
 */
export default function TestimonialsSection({ testimonials, t }) {
  return (
    <section className="ba-reveal" style={{ ...wrap, padding: "84px 28px 20px" }}>
      <SectionHead title={t("home.reviews.title")} sub={t("home.reviews.sub")} />
      <div className="ba-tpwall">
        {testimonials.map((item) => <TestimonialPhotoCard key={item._id} t={item} />)}
      </div>
      <div style={{ textAlign: "center", marginTop: 30 }}>
        <Link href="/telebelerimiz" style={{ color: "var(--accent)", fontWeight: 700, fontSize: 15 }}>{t("home.reviews.all")}</Link>
      </div>
    </section>
  );
}
