import { apiGet } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";
import { TestimonialCard, SectionHead } from "@/components/site/cards";

export const metadata = buildMetadata({
  title: "Tələbələrimiz",
  description:
    "British Academy məzunlarının rəyləri — video təcrübələr, qiymətləndirmələr və real geri bildirimlər.",
  path: "/telebelerimiz",
});

const wrap = { maxWidth: 1200, margin: "0 auto", padding: "0 28px" };

export default async function StudentsPage() {
  const data = await apiGet("/testimonials");
  const all = data?.testimonials || [];
  const videos = all.filter((t) => t.type === "video");
  const texts = all.filter((t) => t.type === "text");

  return (
    <>
      <section style={{ position: "relative", background: "var(--accent)", overflow: "hidden" }}>
        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "56px 28px 60px" }}>
          <h1 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(32px,4.6vw,50px)", letterSpacing: "-.025em", margin: 0, color: "#fff" }}>Tələbələrimiz</h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,.92)", margin: "16px 0 0", maxWidth: 640, lineHeight: 1.6 }}>
            Məzunlarımız British Academy təcrübəsini öz sözləri ilə danışır.
          </p>
        </div>
      </section>

      {videos.length > 0 && (
        <section style={{ ...wrap, padding: "64px 28px 0" }}>
          <SectionHead title="Onlar danışır" />
          <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
            {videos.map((v) => (
              <div key={v._id} style={{ position: "relative", aspectRatio: "3/4", borderRadius: 20, overflow: "hidden", background: "#0F1020" }}>
                {v.video?.poster && (/* eslint-disable-next-line @next/next/no-img-element */ <img src={v.video.poster} alt={v.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />)}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,.42), transparent 30%, transparent 55%, rgba(0,0,0,.82))" }} />
                <div style={{ position: "absolute", top: 12, left: 12, right: 12 }}>
                  <span style={{ display: "inline-block", background: "rgba(0,0,0,.55)", color: "#fff", fontSize: 12.5, fontWeight: 600, padding: "5px 10px", borderRadius: 8 }}>{v.name}</span>
                  {v.achievement && <span style={{ display: "block", marginTop: 6, fontSize: 11.5, fontWeight: 700, color: "#fff", background: "var(--accent)", padding: "4px 9px", borderRadius: 7, width: "fit-content" }}>{v.achievement}</span>}
                </div>
                {v.video?.url ? (
                  <a href={v.video.url} target="_blank" rel="noopener noreferrer" aria-label={`${v.name} — videonu izlə`} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 64, height: 64, borderRadius: 20, background: "var(--accent)", display: "grid", placeItems: "center", boxShadow: "0 12px 28px rgba(0,0,0,.45)" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" style={{ fill: "#fff", marginLeft: 2 }}><path d="M8 5.14v13.72a1 1 0 0 0 1.53.85l10.79-6.86a1 1 0 0 0 0-1.7L9.53 4.29A1 1 0 0 0 8 5.14z" /></svg>
                  </a>
                ) : (
                  <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 64, height: 64, borderRadius: 20, background: "var(--accent)", display: "grid", placeItems: "center", opacity: 0.85 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" style={{ fill: "#fff", marginLeft: 2 }}><path d="M8 5.14v13.72a1 1 0 0 0 1.53.85l10.79-6.86a1 1 0 0 0 0-1.7L9.53 4.29A1 1 0 0 0 8 5.14z" /></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {texts.length > 0 && (
        <section style={{ ...wrap, padding: "70px 28px 0" }}>
          <SectionHead title="Tələbə rəyləri" />
          <div className="ba-wall">
            {texts.map((t) => <TestimonialCard key={t._id} t={t} />)}
          </div>
        </section>
      )}
    </>
  );
}
