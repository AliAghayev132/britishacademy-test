import Link from "next/link";
import { ClipboardList, Clock, ChevronRight } from "lucide-react";

import { apiGet } from "@/lib/api";
import { getLocale, getT } from "@/lib/i18n/serverT";
import { buildPath } from "@/lib/i18n/routes";
import { buildMetadata } from "@/lib/seo";

/**
 * Testlərin siyahısı.
 *
 * Köhnə saytda testlər ayrı-ayrı ünvanlarda idi (/english-test, /rus-dili-test)
 * və bir-birinə keçid yox idi. Burada hamısı bir yerdədir — ingilis testini
 * həll edən adam rus testini də görsün.
 */

export async function generateMetadata() {
  const t = await getT();
  return buildMetadata({
    title: t("quiz.listTitle"),
    description: t("quiz.listSub"),
    path: "/testler",
  });
}

export const revalidate = 300;

export default async function QuizListPage() {
  const [data, t, locale] = await Promise.all([apiGet("/quizzes"), getT(), getLocale()]);
  const items = data?.items || [];

  // Testləri kateqoriya üzrə qrupla. Kateqoriyasızlar sonda «Digər»
  // altında toplanır — belə testlər siyahıdan düşməsin.
  const groups = [];
  const byId = new Map();
  for (const q of items) {
    const key = q.category?._id || "__other";
    if (!byId.has(key)) {
      const g = {
        key,
        name: q.category?.name || t("quiz.otherCategory"),
        color: q.category?.color || "#00157A",
        slug: q.category?.slug || null,
        order: q.category ? (q.category.order ?? 0) : 9999,
        items: [],
      };
      byId.set(key, g);
      groups.push(g);
    }
    byId.get(key).items.push(q);
  }
  groups.sort((a, b) => a.order - b.order);

  // Yalnız bir qrup varsa başlıq göstərmirik — lüzumsuz təkrar olardı.
  const showGroupTitles = groups.length > 1;

  return (
    // Bax yuxarıdakı qeyd: `container` sinfi mövcud deyil.
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "56px 28px 72px" }}>
      <header style={{ marginBottom: 30 }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: 1, color: "var(--accent)" }}>
          {t("quiz.listSub").toUpperCase()}
        </span>
        <h1
          style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontSize: 34,
            fontWeight: 800,
            color: "#14141C",
            margin: "6px 0 0",
          }}
        >
          {t("quiz.listTitle")}
        </h1>
      </header>

      {items.length === 0 ? (
        <p style={{ color: "#8A8A96" }}>{t("quiz.empty")}</p>
      ) : (
          <div style={{ display: "grid", gap: 34 }}>
            {groups.map((g) => (
              // Lövbər: «Xidmətlər» menyusundakı kateqoriya linkləri buraya düşür.
              <section key={g.key} id={g.slug || undefined} style={{ scrollMarginTop: 100 }}>
                {showGroupTitles && (
                  <h2
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontFamily: "'Poppins', system-ui, sans-serif",
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#14141C",
                      margin: "0 0 14px",
                    }}
                  >
                    <span style={{ width: 4, height: 20, borderRadius: 2, background: g.color }} />
                    {g.name}
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#9A9AA6" }}>
                      {g.items.length}
                    </span>
                  </h2>
                )}
                <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                  {g.items.map((q) => (
                  <Link
                    key={q._id}
                    href={buildPath(`/testler/${q.slug}`, locale)}
                    style={{
                      display: "block",
                      border: "1px solid #ECEDF2",
                      borderRadius: 20,
                      padding: "24px 22px",
                      background: "#fff",
                      transition: "border-color .2s, transform .2s",
                    }}
                  >
                    <span
                      style={{
                        display: "grid",
                        placeItems: "center",
                        width: 46,
                        height: 46,
                        borderRadius: 14,
                        background: "rgba(0,21,122,.06)",
                        color: "var(--accent)",
                      }}
                    >
                      <ClipboardList size={22} />
                    </span>
      
                    <h2
                      style={{
                        fontFamily: "'Poppins', system-ui, sans-serif",
                        fontSize: 19,
                        fontWeight: 700,
                        color: "#14141C",
                        margin: "14px 0 0",
                      }}
                    >
                      {q.title}
                    </h2>
      
                    {q.lead && (
                      <p style={{ margin: "7px 0 0", fontSize: 14.5, color: "#63636F", lineHeight: 1.6 }}>
                        {q.lead}
                      </p>
                    )}
      
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16, fontSize: 13, color: "#9A9AA6" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <ClipboardList size={13} /> {q.questionCount} {t("quiz.questions")}
                      </span>
                      {q.timeLimitMin > 0 && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <Clock size={13} /> {q.timeLimitMin} {t("quiz.minutes")}
                        </span>
                      )}
                    </div>
      
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        marginTop: 16,
                        color: "var(--accent)",
                        fontWeight: 700,
                        fontSize: 14.5,
                      }}
                    >
                      {t("quiz.start")} <ChevronRight size={15} />
                    </span>
                  </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
      )}
    </main>
  );
}
