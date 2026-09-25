// Next
import { notFound } from "next/navigation";

// Components
import { LocaleLink as Link, BranchMapSwitcher, CtaBand, ApplyButton } from "@/components";
import { PageBanner } from "@/components/server";

// Lib
import { ldJson } from "@/lib";
import {
  apiGet,
  apiGetStatus,
  isMissing,
  metaFromApi,
  getT,
  getLocale,
  absUrl,
  SITE_NAME,
  SITE_URL,
} from "@/lib/server";

// Utils
import { addressLine, metroLabel, districtAdds } from "@/utils";

/**
 * /filiallar/<slug> — bir filialın öz səhifəsi.
 *
 * ── NİYƏ ──
 * API hər filial üçün `/filiallar/<slug>` ünvanı elan edirdi (Branch modelinin
 * `url` virtualı), amma Next-də belə marşrut yox idi — ünvan 404 verirdi və
 * sitemap-dan qəsdən çıxarılmışdı. Halbuki dörd filialın hər biri lokal
 * axtarış üçün ayrıca səhifədir: «Nizami metrosu yaxınlığında ingilis dili
 * kursu» tipli sorğuya bir siyahı səhifəsi deyil, məhz filialın öz səhifəsi
 * cavab verir (ünvan, metro, iş saatları, xəritə, həmin filialda keçilən
 * kurslar).
 *
 * ── MƏLUMAT ──
 * Kurslar əl ilə yazılmır: `/courses` cavabındakı qiymət matrisində bu
 * filiala aid sətri olan kurslar seçilir, yəni admin qiyməti dəyişəndə siyahı
 * da dəyişir.
 */

const CITY = { az: "Bakı", en: "Baku", ru: "Баку" };

/** Filialı slug ilə tap — API-nin detal ünvanı. */
const fetchBranch = (slug) => apiGetStatus(`/branches/${slug}`);

/** Meta təsvir: ünvan + metro + qısa quyruq. Admin `seo` yazıbsa o üstündür. */
function describe(b, tr, locale) {
  const where = [addressLine(b.address, b.district), b.metro ? metroLabel(b.metro, locale) : ""].filter(Boolean).join(", ");
  // Metro adı çox vaxt nöqtə ilə bitir («Nizami m.») — «Nizami m..» olmasın.
  return `${b.name} — ${where.replace(/\.+$/, "")}. ${tr("meta.branch.tail")}`;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { data } = await fetchBranch(slug);
  const b = data?.branch;
  if (!b) return {};
  const tr = await getT();
  const locale = await getLocale();
  return metaFromApi(b.seo, {
    title: b.name,
    description: describe(b, tr, locale),
    path: `/filiallar/${slug}`,
  });
}

// ── Subcomponents ──

const card = { border: "1px solid #ECEDF2", borderRadius: 20, background: "#fff", padding: 26 };
const wrap = { maxWidth: 1200, margin: "0 auto", padding: "0 28px" };
const h2 = { fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(22px,2.6vw,28px)", color: "#14141C", letterSpacing: "-.01em", margin: "0 0 20px" };

function Row({ icon, children }) {
  if (!children) return null;
  return (
    <div style={{ display: "flex", gap: 11, padding: "12px 0", borderBottom: "1px solid #ECEDF2", fontSize: 15, color: "#33333D", lineHeight: 1.5 }}>
      <span aria-hidden="true" style={{ flex: "none" }}>{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function ContactCard({ b, tr, locale }) {
  return (
    <div style={card}>
      <h2 style={{ ...h2, fontSize: 20, margin: "0 0 6px" }}>{tr("page.branch.contact")}</h2>
      <Row icon="📍">{addressLine(b.address, b.district)}</Row>
      {b.metro && <Row icon="🚇">{metroLabel(b.metro, locale)}</Row>}
      {/* Rayon yalnız ünvanda olmayanda ayrıca göstərilir — təkrar deyil. */}
      {districtAdds(b.address, b.district) && <Row icon="🏙">{b.district}</Row>}
      {b.phone && <Row icon="☎"><a href={`tel:${b.phone.replace(/[^+\d]/g, "")}`} style={{ color: "var(--accent)", fontWeight: 600 }}>{b.phone}</a></Row>}
      {b.email && <Row icon="✉"><a href={`mailto:${b.email}`} style={{ color: "var(--accent)", fontWeight: 600 }}>{b.email}</a></Row>}
      {(b.workingHours || []).length > 0 && (
        <div style={{ paddingTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#63636E", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>{tr("page.branch.hours")}</div>
          {b.workingHours.map((w, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 15, color: "#33333D", padding: "5px 0" }}>
              <span>{w.days}</span>
              <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{w.from}–{w.to}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
        {b.whatsapp && (
          <a href={`https://wa.me/${b.whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ flex: "1 1 140px", textAlign: "center", background: "#25D366", color: "#fff", fontWeight: 700, fontSize: 14, padding: 12, borderRadius: 12 }}>WhatsApp</a>
        )}
        <ApplyButton
          interest=""
          branch={b._id}
          className="ba-btn-primary"
          style={{ flex: "1 1 140px", background: "var(--accent)", color: "#fff", border: "none", fontWeight: 700, fontSize: 14, padding: 12, borderRadius: 12, cursor: "pointer" }}
        />
      </div>
    </div>
  );
}

/** Bu filialda qiyməti olan kurslar — matrisdən seçilir. */
function CoursesHere({ courses, tr }) {
  if (!courses.length) return null;
  return (
    <section style={{ ...wrap, padding: "60px 28px 0" }}>
      <h2 style={h2}>{tr("page.branch.courses")}</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {courses.map(({ course, from }) => (
          <Link
            key={course._id}
            href={`/kurslar/${course.slug}`}
            style={{ display: "inline-flex", alignItems: "baseline", gap: 8, border: "1px solid #E4E5EC", background: "#fff", borderRadius: 99, padding: "10px 18px", fontSize: 14.5, fontWeight: 600, color: "#33333D" }}
          >
            {course.title}
            {from ? <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 800, color: "var(--accent)" }}>{from} AZN</span> : null}
          </Link>
        ))}
      </div>
      <p style={{ fontSize: 13.5, color: "#63636E", margin: "16px 0 0" }}>
        <Link href="/kurslar/qiymetler" style={{ color: "var(--accent)", fontWeight: 700 }}>{tr("page.branch.allPrices")} →</Link>
      </p>
    </section>
  );
}

function OtherBranches({ others, tr }) {
  if (!others.length) return null;
  return (
    <section style={{ ...wrap, padding: "60px 28px 0" }}>
      <h2 style={h2}>{tr("page.branch.others")}</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {others.map((o) => (
          <Link key={o._id} href={`/filiallar/${o.slug}`} style={{ border: "1px solid #E4E5EC", background: "#fff", borderRadius: 99, padding: "10px 18px", fontSize: 14.5, fontWeight: 600, color: "#33333D" }}>
            📍 {o.name}
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Page ──

export default async function BranchPage({ params }) {
  const { slug } = await params;
  const res = await fetchBranch(slug);
  // Şəbəkə xətası 404 kimi oxunmamalıdır — `isMissing` ayırd edir.
  if (isMissing(res, "branch")) notFound();
  const b = res.data.branch;

  const tr = await getT();
  const locale = await getLocale();
  const [listData, courseData] = await Promise.all([apiGet("/branches"), apiGet("/courses")]);
  const others = (listData?.branches || []).filter((x) => String(x._id) !== String(b._id));

  // Bu filialda qiyməti olan kurslar; «-dan» qiyməti qrup/gündüz sətridir.
  const courses = (courseData?.courses || [])
    .map((course) => {
      const row = (course.pricing || []).find((p) => String(p?.branch?._id || p?.branch) === String(b._id));
      return row ? { course, from: row.group?.day || row.group?.evening || null } : null;
    })
    .filter(Boolean);

  // ── JSON-LD ── EducationalOrganization + Breadcrumb
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      name: `${SITE_NAME} — ${b.name}`,
      url: absUrl(`/filiallar/${b.slug}`, locale),
      telephone: b.phone || undefined,
      email: b.email || undefined,
      image: `${SITE_URL}/assets/og-cover.png`,
      address: {
        "@type": "PostalAddress",
        streetAddress: addressLine(b.address, b.district),
        addressLocality: CITY[locale] || CITY.az,
        addressCountry: "AZ",
      },
      geo: b.coords?.lat && b.coords?.lng
        ? { "@type": "GeoCoordinates", latitude: b.coords.lat, longitude: b.coords.lng }
        : undefined,
      openingHours: (b.workingHours || []).map((w) => `${w.days} ${w.from}-${w.to}`),
      parentOrganization: { "@type": "EducationalOrganization", name: SITE_NAME, url: absUrl("/", locale) },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: tr("common.home"), item: absUrl("/", locale) },
        { "@type": "ListItem", position: 2, name: tr("page.branches.title"), item: absUrl("/filiallar", locale) },
        { "@type": "ListItem", position: 3, name: b.name, item: absUrl(`/filiallar/${b.slug}`, locale) },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />

      <PageBanner
        title={b.name}
        subtitle={addressLine(b.address, b.district)}
        mascot="filiallar"
        breadcrumb={[
          { label: tr("common.home"), href: "/" },
          { label: tr("page.branches.title"), href: "/filiallar" },
          { label: b.name },
        ]}
      />

      <section style={{ ...wrap, padding: "60px 28px 0" }}>
        <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.25fr)", gap: 22, alignItems: "start" }}>
          <ContactCard b={b} tr={tr} locale={locale} />
          {/* Tək filial — seçim çipləri göstərilmir (komponent özü gizlədir). */}
          <BranchMapSwitcher branches={[b]} />
        </div>
      </section>

      <CoursesHere courses={courses} tr={tr} />
      <OtherBranches others={others} tr={tr} />

      <CtaBand />
    </>
  );
}
