// Data
import { apiGet } from "@/lib/api";

// Components
import { DestinationCard, SectionHead } from "@/components/site/cards";
import { PageBanner } from "@/components/site/PageBanner";

// Utils / SEO
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Xaricdə təhsil",
  description:
    "British Academy ilə xaricdə təhsil — Almaniya, Türkiyə, İngiltərə, Kanada və daha 7 ölkə. Universitet seçimi, sənədlər, viza dəstəyi.",
  path: "/xaricde-tehsil",
});

// ── Subcomponents ──

function DestinationGrid({ destinations }) {
  return (
    <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
      {destinations.map((d) => <DestinationCard key={d._id} dest={d} />)}
    </div>
  );
}

export default async function DestinationsPage() {
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
        title="Xaricdə təhsil"
        subtitle="Arzuladığın ölkədə oxu — universitet seçimindən vizaya qədər yanındayıq."
        mascot="destinations"
      />

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 28px 0" }}>
        <DestinationGrid destinations={countries} />
      </section>

      {scholarships.length > 0 && (
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 28px 0" }}>
          <SectionHead title="Təqaüd proqramları" />
          <DestinationGrid destinations={scholarships} />
        </section>
      )}
    </>
  );
}
