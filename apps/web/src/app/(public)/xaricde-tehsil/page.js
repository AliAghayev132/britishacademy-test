import { apiGet } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";
import { DestinationCard, SectionHead } from "@/components/site/cards";

export const metadata = buildMetadata({
  title: "Xaricdə təhsil",
  description:
    "British Academy ilə xaricdə təhsil — Almaniya, Türkiyə, İngiltərə, Kanada və daha 7 ölkə. Universitet seçimi, sənədlər, viza dəstəyi.",
  path: "/xaricde-tehsil",
});

export default async function DestinationsPage() {
  const data = await apiGet("/destinations");
  const all = data?.destinations || [];
  const countries = all.filter((d) => !d.isScholarship);
  const scholarships = all.filter((d) => d.isScholarship);

  return (
    <>
      <section style={{ position: "relative", background: "var(--accent)", overflow: "hidden" }}>
        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "56px 28px 60px" }}>
          <h1 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(32px,4.6vw,50px)", letterSpacing: "-.025em", margin: 0, color: "#fff" }}>Xaricdə təhsil</h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,.92)", margin: "16px 0 0", maxWidth: 640, lineHeight: 1.6 }}>
            Arzuladığın ölkədə oxu — universitet seçimindən vizaya qədər yanındayıq.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 28px 0" }}>
        <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {countries.map((d) => <DestinationCard key={d._id} dest={d} />)}
        </div>
      </section>

      {scholarships.length > 0 && (
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 28px 0" }}>
          <SectionHead title="Təqaüd proqramları" />
          <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            {scholarships.map((d) => <DestinationCard key={d._id} dest={d} />)}
          </div>
        </section>
      )}
    </>
  );
}
