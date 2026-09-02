// React
import { Suspense } from "react";
import { headers } from "next/headers";

// Data
import { apiGet } from "@/lib/api";

// Components
import { SiteProvider } from "@/components/site/SiteProvider";
import { LocaleProvider } from "@/components/site/LocaleProvider";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { RouteLoader } from "@/components/site/RouteLoader";

/**
 * Public marketing shell. Fetches the site chrome data server-side (SSR nav +
 * SEO-visible links) and wraps every public page with header/footer + the
 * client apply-modal/WhatsApp overlays.
 */
export default async function PublicLayout({ children }) {
  // ── cari dil (middleware x-lang) ──
  const locale = (await headers()).get("x-lang") || "az";

  // ── data fetching ──
  const [site, cats, coursesData, destData, branchData] = await Promise.all([
    apiGet("/site"),
    apiGet("/categories"),
    apiGet("/courses"),
    apiGet("/destinations"),
    apiGet("/branches"),
  ]);

  const settings = site?.settings || {};
  const menu = site?.menu?.header || [];
  const categories = cats?.categories || [];
  const courses = coursesData?.courses || [];
  const destinations = destData?.destinations || [];
  const branches = branchData?.branches || [];

  // ── derived values ──
  // Build the mega-menu: each course category with its courses.
  const coursesByCat = {};
  for (const c of courses) {
    const id = String(c.category?._id || c.category);
    (coursesByCat[id] ||= []).push(c);
  }
  const xidmetler = categories.find((c) => c.slug === "xidmetler");
  const usaq = categories.find((c) => c.slug === "usaq");
  const serviceCats = [...(xidmetler?.children || []), ...(usaq ? [usaq] : [])];
  const services = serviceCats.map((cat) => ({
    category: cat,
    courses: coursesByCat[String(cat._id)] || [],
  }));

  // Map API menu items to header nav variants.
  //
  // `children` olan adi bənd sadə dropdown olur (variant: "links") — məsələn
  // «Haqqımızda» altında Müəllimlər və Tələbələrimiz. Uşaqlar admin paneldən
  // idarə olunur, ona görə burada sabit siyahı yazılmır.
  const nav = menu.map((m) => {
    if (m.type === "mega") return { label: m.label, href: "/kurslar", variant: "mega" };
    if (m.type === "dropdown") return { label: m.label, href: "/xaricde-tehsil", variant: "destinations" };
    const children = (m.children || [])
      .filter((c) => c.label && c.href)
      .map((c) => ({ label: c.label, href: c.href }));
    if (children.length) {
      return { label: m.label, href: m.href || "/", variant: "links", children };
    }
    return { label: m.label, href: m.href || "/" };
  });

  // ── render ──
  return (
    <LocaleProvider locale={locale}>
      <SiteProvider branches={branches} destinations={destinations}>
        <Suspense fallback={null}>
          <RouteLoader />
        </Suspense>
        <Header site={settings} nav={nav} services={services} destinations={destinations} />
        <main>{children}</main>
        <Footer site={settings} />
      </SiteProvider>
    </LocaleProvider>
  );
}
