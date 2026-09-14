// React
import { Fragment } from "react";

// Components
import {
  Hero,
  SectionHead,
  HomeBodyClass,
  Marquee,
  RevealOnScroll,
  ServicesShowcase,
  VideoSwiper,
  TeacherSwiper,
} from "@/components";

// Lib
import { apiGet, getT, getLocale, buildMetadata } from "@/lib/server";
import { resolveSections } from "@/lib";

// Local
import { wrap } from "./_home/wrap";
import AdvantagesSection from "./_home/AdvantagesSection";
import DestinationsSection from "./_home/DestinationsSection";
import ProjectsSection from "./_home/ProjectsSection";
import TestimonialsSection from "./_home/TestimonialsSection";
import BlogSection from "./_home/BlogSection";
import FaqSection from "./_home/FaqSection";
import PartnersSection from "./_home/PartnersSection";
import CtaSection from "./_home/CtaSection";

export async function generateMetadata() {
  return buildMetadata({ path: "/" });
}

export default async function HomePage() {
  const t = await getT();
  const locale = await getLocale();
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
  const videoTestimonials = home?.videoTestimonials || [];
  const partners = home?.partners || [];

  // FAQ — admin paneldən idarə olunan siyahı. Əvvəl burada tərcümə
  // faylındakı 6 sabit sual göstərilirdi: 3 dilli idi, amma admin onları
  // redaktə edə bilmirdi (FAQ resursu mövcud olsa da işlədilmirdi).
  // Admin heç nə əlavə etməyibsə köhnə mətnlərə düşürük ki, bölmə boş qalmasın.
  const adminFaqs = (home?.faqs || [])
    .map((f) => ({ question: f.question, answer: f.answer }))
    .filter((f) => f.question && f.answer);
  const faqItems = adminFaqs.length
    ? adminFaqs
    : [1, 2, 3, 4, 5, 6].map((n) => ({ question: t(`hfaq.q${n}`), answer: t(`hfaq.a${n}`) }));

  // Bölmələr açarla. Sıra və görünmə admin paneldən gəlir (Ana səhifə →
  // Bölmələr). Əvvəl JSX sabit ardıcıllıqla yazılmışdı: admin sıranı dəyişib
  // saxlayırdı, amma saytda heç nə dəyişmirdi — yalnız açıb-bağlama işləyirdi.
  const blocks = {
    hero: <Hero hero={s.hero} stats={s.stats} />,

    /* Marquee */
    marquee: <Marquee words={s.marquee} />,

    /* Courses / services — interaktiv Swiper (kliklə yuxarıda inline açılır) */
    courses: (
      <div id="kurslar">
        <ServicesShowcase courses={courses} />
      </div>
    ),

    /* Advantages */
    advantages: advantages.length > 0 && <AdvantagesSection advantages={advantages} t={t} />,

    /* Study abroad */
    destinations: destinations.length > 0 && <DestinationsSection destinations={destinations} t={t} />,

    /* Layihələr — seçilmişlər */
    projects: (home?.projects || []).length > 0 && <ProjectsSection projects={home.projects} t={t} />,

    /* Student videos — Swiper (loopsuz) */
    videos: videoTestimonials.length > 0 && (
      <section className="ba-reveal" style={{ ...wrap, padding: "84px 28px 0" }}>
        <SectionHead title={t("page.students.speak")} sub={t("page.students.speakSub")} />
        <VideoSwiper videos={videoTestimonials} />
      </section>
    ),

    /* Müəllimlər — seçilmişlər, sıra hər açılışda qarışır (TeacherSwiper) */
    teachers: (home?.teachers || []).length > 0 && (
      <section className="ba-reveal" style={{ ...wrap, padding: "84px 28px 0" }}>
        <SectionHead title={t("common.teachers")} sub={t("home.teachers.sub")} />
        <TeacherSwiper teachers={home.teachers} />
      </section>
    ),

    /* Testimonials */
    testimonials: testimonials.length > 0 && <TestimonialsSection testimonials={testimonials} t={t} />,

    /* Blog / news — yazı yoxdursa bloqa keçid zolağı */
    blog: <BlogSection posts={posts} locale={locale} t={t} />,

    /* FAQ */
    faq: <FaqSection items={faqItems} t={t} />,

    /* Partners */
    partners: partners.length > 0 && <PartnersSection partners={partners} t={t} />,

    /* CTA */
    cta: <CtaSection t={t} />,
  };

  // ── render ──
  return (
    <>
      <HomeBodyClass />
      <RevealOnScroll />
      {resolveSections(s.homeSections)
        .filter((sec) => sec.enabled)
        .map((sec) => <Fragment key={sec.key}>{blocks[sec.key]}</Fragment>)}
    </>
  );
}
