import { apiGet } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";
import { Hero } from "@/components/site/Hero";
import { CourseCard, DestinationCard, TestimonialCard, SectionHead } from "@/components/site/cards";
import { ApplyButton } from "@/components/site/ApplyButton";
import Link from "next/link";

export const metadata = buildMetadata({ path: "/" });

const wrap = { maxWidth: 1240, margin: "0 auto", padding: "0 28px" };

export default async function HomePage() {
  const home = await apiGet("/home");
  const s = home?.settings || {};
  const courses = home?.courses || [];
  const advantages = home?.advantages || [];
  const destinations = home?.destinations || [];
  const testimonials = (home?.testimonials || []).filter((t) => t.type === "text");
  const partners = home?.partners || [];

  return (
    <>
      <Hero hero={s.hero} stats={s.stats} />

      {/* Courses */}
      <section style={{ ...wrap, padding: "84px 28px 20px" }}>
        <SectionHead title="Kurslarımız" sub="istiqamətini seç" />
        <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, marginTop: 42 }}>
          {courses.map((c, i) => <CourseCard key={c._id} course={c} index={i} />)}
        </div>
      </section>

      {/* Advantages */}
      <section style={{ ...wrap, padding: "84px 28px 20px" }}>
        <SectionHead title="Üstünlüklərimiz" sub="nəyə görə British Academy?" />
        <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {advantages.map((a, i) => (
            <div key={a._id} className="ba-adv2" style={{ position: "relative", background: "#F7F8FB", border: "1px solid #ECEDF2", borderRadius: 20, padding: "30px 26px", "--accent": a.color, "--accent-soft": `${a.color}1f` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div className="ba-adv2-ic" style={{ width: 50, height: 50, borderRadius: 13, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", fontSize: 24 }}>★</div>
                <span className="ba-adv2-n" style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 34, color: "#E4E6EF" }}>{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="ba-adv2-t" style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 19, margin: "22px 0 0", color: "#17171F" }}>{a.title}</h3>
              <p className="ba-adv2-d" style={{ fontSize: 14.5, color: "#63636F", margin: "10px 0 0", lineHeight: 1.55 }}>{a.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Study abroad */}
      {destinations.length > 0 && (
        <section style={{ background: "linear-gradient(165deg,#F4F7FF,#FDF6F0 55%,#F3FAF6)", marginTop: 84 }}>
          <div style={{ ...wrap, padding: "80px 28px" }}>
            <SectionHead title="Xaricdə təhsil" sub="arzuladığın ölkədə oxu" />
            <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
              {destinations.map((d) => <DestinationCard key={d._id} dest={d} />)}
              <Link href="/xaricde-tehsil" className="ba-fdest ba-fdest-all" style={{ "--cc": "#fff" }}>
                <span className="ba-fdest-body"><span className="ba-fdest-tag" style={{ display: "block" }}>XARİCDƏ TƏHSİL</span><span className="ba-fdest-name" style={{ display: "block" }}>Bütün ölkələr →</span></span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section style={{ ...wrap, padding: "84px 28px 20px" }}>
          <SectionHead title="Tələbə rəyləri" sub="real geri bildirimlər" />
          <div className="ba-wall">
            {testimonials.map((t) => <TestimonialCard key={t._id} t={t} />)}
          </div>
          <div style={{ textAlign: "center", marginTop: 30 }}>
            <Link href="/telebelerimiz" style={{ color: "var(--accent)", fontWeight: 700, fontSize: 15 }}>Bütün rəylərə bax →</Link>
          </div>
        </section>
      )}

      {/* Partners */}
      {partners.length > 0 && (
        <section className="ba-partners" style={{ background: "#F6F7FA", marginTop: 84, borderTop: "1px solid #ECEDF2", borderBottom: "1px solid #ECEDF2" }}>
          <div style={{ ...wrap, padding: "70px 28px" }}>
            <SectionHead title="Tərəfdaşlarımız" sub="bizə güvənənlər" />
            <div className="grid-6" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 16 }}>
              {partners.map((p) => (
                <div key={p._id} className="ba-partner" style={{ background: "#fff", border: "1px solid #ECEDF2", borderRadius: 14, height: 92, display: "grid", placeItems: "center", padding: 12 }}>
                  <div className="ba-pov"></div>
                  <span className="ba-partner-name" style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 15, color: "#54545F", textAlign: "center" }}>{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ ...wrap, padding: "80px 28px 20px" }}>
        <div style={{ background: "linear-gradient(115deg, var(--accent) 0%, #7C4DFF 52%, #C13DBF 115%)", borderRadius: 28, padding: "60px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(28px,4vw,40px)", color: "#fff", margin: 0, letterSpacing: "-.02em" }}>Pulsuz sınaq dərsinə bu gün yazıl</h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,.9)", margin: "14px auto 0", maxWidth: 520, lineHeight: 1.6 }}>Səviyyəni pulsuz təyin edək və sənə uyğun kurs planını təklif edək.</p>
          <ApplyButton style={{ marginTop: 26, background: "#fff", color: "var(--accent)", border: "none", fontWeight: 700, fontSize: 16, padding: "15px 30px", borderRadius: 13, cursor: "pointer" }} />
        </div>
      </section>
    </>
  );
}
