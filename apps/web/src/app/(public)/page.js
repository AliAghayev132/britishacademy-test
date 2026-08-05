// Next
import Link from "next/link";

// Data
import { apiGet } from "@/lib/api";

// Components
import { Hero } from "@/components/site/Hero";
import { CourseCard, DestinationCard, TestimonialCard, SectionHead } from "@/components/site/cards";
import { ApplyButton } from "@/components/site/ApplyButton";
import { HomeBodyClass } from "@/components/site/HomeBodyClass";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import Marquee from "@/components/site/Marquee";
import RevealOnScroll from "@/components/site/RevealOnScroll";

// Utils / SEO
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ path: "/" });

const wrap = { maxWidth: 1240, margin: "0 auto", padding: "0 28px" };

// Per-advantage icon (by index) so each of the 6 cards differs.
const ADV_ICONS = ["⚡", "🎯", "🎓", "🗣️", "📚", "🏆"];

// Homepage FAQ copy (mirrors the static index.html FAQ block).
const HOME_FAQ = [
  { question: "Digər mərkəzlərdən üstün cəhətləriniz nələrdir?", answer: "British Academy ingilis dilini xüsusi metodlarla standart üsullardan 4 dəfə daha sürətli və effektiv tədris edir. Dili sistemli şəkildə, ana diliniz kimi öyrənirsiniz." },
  { question: "Sınaq dərsi mövcuddur?", answer: "Bəli. İlk dərs sınaq dərsidir; davam etsəniz dərs saatı kimi qeydə alınır." },
  { question: "Müəllimlərin sertifikatı var?", answer: "British Academy müəllimləri xaricdə təhsil almış, beynəlxalq sertifikatlara malik (IELTS 8.0–8.5) müəllimlərdir." },
  { question: "Bir səviyyə nə qədər çəkir?", answer: "Hər dil səviyyəsi 1.5–2 ay müddətində tədris olunur, sonra növbəti səviyyəyə keçilir." },
  { question: "Dərsliklərlə təmin edirsinizmi?", answer: "Böyük Britaniyada hazırlanmış xüsusi tədris kitabları ilə tələbələr ödənişsiz təmin olunur." },
  { question: "Danışıq klubu üçün əlavə ödəniş var?", answer: "Xeyr. Conversation Club tələbələrimiz üçün ödənişsizdir — həftənin 3 günü, 8 fərqli klub formatında." },
];

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("az-AZ", { day: "numeric", month: "long", year: "numeric" }) : "";

// ── Subcomponents ──

function AdvantageCard({ advantage, index }) {
  const a = advantage;
  return (
    <div className="ba-adv2" style={{ position: "relative", background: "#F7F8FB", border: "1px solid #ECEDF2", borderRadius: 20, padding: "30px 26px", "--accent": a.color, "--accent-soft": `${a.color}1f` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="ba-adv2-ic" style={{ width: 50, height: 50, borderRadius: 13, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", fontSize: 24 }}>{ADV_ICONS[index % ADV_ICONS.length]}</div>
        <span className="ba-adv2-n" style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 34, color: "#E4E6EF" }}>{String(index + 1).padStart(2, "0")}</span>
      </div>
      <h3 className="ba-adv2-t" style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 19, margin: "22px 0 0", color: "#17171F" }}>{a.title}</h3>
      <p className="ba-adv2-d" style={{ fontSize: 14.5, color: "#63636F", margin: "10px 0 0", lineHeight: 1.55 }}>{a.text}</p>
    </div>
  );
}

function NewsCard({ post }) {
  return (
    <Link href={`/bloq/${post.slug}`} className="ba-news-card" style={{ display: "block", background: "#fff", border: "1px solid #ECEDF2", borderRadius: 20, overflow: "hidden", "--accent": post.category?.color || "var(--accent)" }}>
      <div style={{ position: "relative", aspectRatio: "16/10", overflow: "hidden", background: "#EEF0F6" }}>
        {post.cover && (/* eslint-disable-next-line @next/next/no-img-element */ <img className="ba-news-img" src={post.cover} alt={post.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .35s ease" }} />)}
        {post.category && <span style={{ position: "absolute", top: 12, left: 12, background: post.category.color || "var(--accent)", color: "#fff", fontSize: 11.5, fontWeight: 700, padding: "5px 11px", borderRadius: 99, zIndex: 2 }}>{post.category.name}</span>}
      </div>
      <div style={{ padding: "22px 22px 26px" }}>
        <div style={{ fontSize: 13, color: "#9A9AA6", fontWeight: 600 }}>{fmtDate(post.publishedAt)}</div>
        <h3 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 19, margin: "8px 0 0", lineHeight: 1.3, color: "#17171F" }}>{post.title}</h3>
        {post.excerpt && <p style={{ fontSize: 14.5, color: "#63636F", margin: "10px 0 0", lineHeight: 1.55 }}>{post.excerpt}</p>}
      </div>
    </Link>
  );
}

function PartnerCard({ partner }) {
  return (
    <div className="ba-partner" style={{ background: "#fff", border: "1px solid #ECEDF2", borderRadius: 14, height: 92, display: "grid", placeItems: "center", padding: 12 }}>
      <div className="ba-pov"></div>
      <span className="ba-partner-name" style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 15, color: "#54545F", textAlign: "center" }}>{partner.name}</span>
    </div>
  );
}

export default async function HomePage() {
  // ── data fetching ──
  const home = await apiGet("/home");

  let posts = [];
  try {
    const blog = await apiGet("/blog");
    posts = (blog?.posts || []).slice(0, 3);
  } catch {
    posts = [];
  }

  // ── derived values ──
  const s = home?.settings || {};
  const courses = home?.courses || [];
  const advantages = home?.advantages || [];
  const destinations = home?.destinations || [];
  const testimonials = (home?.testimonials || []).filter((t) => t.type === "text");
  const partners = home?.partners || [];

  // ── render ──
  return (
    <>
      <HomeBodyClass />
      <RevealOnScroll />
      <Hero hero={s.hero} stats={s.stats} />

      {/* Marquee */}
      <Marquee />

      {/* Courses */}
      <section className="ba-reveal" style={{ ...wrap, padding: "84px 28px 20px" }}>
        <SectionHead title="Kurslarımız" sub="istiqamətini seç" />
        <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, marginTop: 42 }}>
          {courses.map((c, i) => <CourseCard key={c._id} course={c} index={i} />)}
        </div>
      </section>

      {/* Advantages */}
      <section className="ba-reveal" style={{ ...wrap, padding: "84px 28px 20px" }}>
        <SectionHead title="Üstünlüklərimiz" sub="nəyə görə British Academy?" />
        <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {advantages.map((a, i) => <AdvantageCard key={a._id} advantage={a} index={i} />)}
        </div>
      </section>

      {/* Study abroad */}
      {destinations.length > 0 && (
        <section className="ba-reveal" style={{ background: "linear-gradient(165deg,#F4F7FF,#FDF6F0 55%,#F3FAF6)", marginTop: 84 }}>
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
        <section className="ba-reveal" style={{ ...wrap, padding: "84px 28px 20px" }}>
          <SectionHead title="Tələbə rəyləri" sub="real geri bildirimlər" />
          <div className="ba-wall">
            {testimonials.map((t) => <TestimonialCard key={t._id} t={t} />)}
          </div>
          <div style={{ textAlign: "center", marginTop: 30 }}>
            <Link href="/telebelerimiz" style={{ color: "var(--accent)", fontWeight: 700, fontSize: 15 }}>Bütün rəylərə bax →</Link>
          </div>
        </section>
      )}

      {/* Blog / news */}
      {posts.length > 0 && (
        <section className="ba-reveal" style={{ ...wrap, padding: "84px 28px 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 40 }}>
            <SectionHead title="Bloq" sub="son yazılar" />
            <Link href="/bloq" style={{ color: "var(--accent)", fontWeight: 700, fontSize: 15 }}>Hamısına bax →</Link>
          </div>
          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
            {posts.map((p) => <NewsCard key={p._id} post={p} />)}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="ba-reveal" style={{ ...wrap, padding: "84px 28px 20px" }}>
        <SectionHead title="Tez-tez verilən suallar" sub="ən çox soruşulanlar" />
        <FaqAccordion items={HOME_FAQ} />
      </section>

      {/* Partners */}
      {partners.length > 0 && (
        <section className="ba-reveal ba-partners" style={{ background: "#F6F7FA", marginTop: 84, borderTop: "1px solid #ECEDF2", borderBottom: "1px solid #ECEDF2" }}>
          <div style={{ ...wrap, padding: "70px 28px" }}>
            <SectionHead title="Tərəfdaşlarımız" sub="bizə güvənənlər" />
            <div className="grid-6" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 16 }}>
              {partners.map((p) => <PartnerCard key={p._id} partner={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="ba-reveal" style={{ ...wrap, padding: "80px 28px 20px" }}>
        <div style={{ background: "linear-gradient(115deg, var(--accent) 0%, #7C4DFF 52%, #C13DBF 115%)", borderRadius: 28, padding: "60px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(28px,4vw,40px)", color: "#fff", margin: 0, letterSpacing: "-.02em" }}>Pulsuz sınaq dərsinə bu gün yazıl</h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,.9)", margin: "14px auto 0", maxWidth: 520, lineHeight: 1.6 }}>Səviyyəni pulsuz təyin edək və sənə uyğun kurs planını təklif edək.</p>
          <ApplyButton style={{ marginTop: 26, background: "#fff", color: "var(--accent)", border: "none", fontWeight: 700, fontSize: 16, padding: "15px 30px", borderRadius: 13, cursor: "pointer" }} />
        </div>
      </section>
    </>
  );
}
