import { apiGet } from "@/lib/api";
import { SiteProvider } from "@/components/site/SiteProvider";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

/**
 * Public marketing shell. Fetches the site chrome data server-side (SSR nav +
 * SEO-visible links) and wraps every public page with header/footer + the
 * client apply-modal/WhatsApp overlays.
 */
export default async function PublicLayout({ children }) {
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
  const nav = menu.map((m) => {
    if (m.type === "mega") return { label: m.label, href: "/kurslar", variant: "mega" };
    if (m.type === "dropdown") return { label: m.label, href: "/xaricde-tehsil", variant: "destinations" };
    return { label: m.label, href: m.href || "/" };
  });

  return (
    <SiteProvider branches={branches}>
      <Header site={settings} nav={nav} services={services} destinations={destinations} />
      <main>{children}</main>
      <Footer site={settings} />
    </SiteProvider>
  );
}
