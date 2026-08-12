// Data
import { apiGet } from "@/lib/api";

// Components
import { DestinationCard, SectionHead } from "@/components/site/cards";
import { PageBanner } from "@/components/site/PageBanner";
import { CtaBand } from "@/components/site/CtaBand";

// Utils / SEO
import { buildMetadata } from "@/lib/seo";
import { getT } from "@/lib/i18n/serverT";

export async function generateMetadata() {
  return buildMetadata({
    title: "Xaricdə təhsil",
    description:
      "British Academy ilə xaricdə təhsil — Almaniya, Türkiyə, İngiltərə, Kanada və daha 7 ölkə. Universitet seçimi, sənədlər, viza dəstəyi.",
    path: "/xaricde-tehsil",
  });
}

// ── Subcomponents ──

function DestinationGrid({ destinations }) {
  return (
    <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
      {destinations.map((d) => <DestinationCard key={d._id} dest={d} />)}
    </div>
  );
}

export default async function DestinationsPage() {
  const tr = await getT();
  // ── data fetching ──
  const data = await apiGet("/destinations");
  const all = data?.destinations || [];

  // ── derived values ──
  const countries = all.filter((d) => !d.isScholarship);
  const scholarships = all.filter((d) => d.isScholarship);

  // ── render ──
  return (
    <>
      <PageBanner
        title={tr("page.abroad.title")}
        subtitle={tr("page.abroad.sub")}
        mascot="destinations"
      />

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 28px 0" }}>
        <DestinationGrid destinations={countries} />
      </section>

      {scholarships.length > 0 && (
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 28px 0" }}>
          <SectionHead title={tr("page.scholarships")} />
          <DestinationGrid destinations={scholarships} />
        </section>
      )}

      <CtaBand interest="Xaricdə təhsil" />
    </>
  );
}
