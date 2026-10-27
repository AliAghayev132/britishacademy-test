// Components
import { ConsentControl } from "@/components";
import { PageBanner } from "@/components/server";

// Lib
import { apiGetStatus, apiGet, metaFromApi, getLocale } from "@/lib/server";

// Utils
import { sanitizeHtml } from "@/utils";

// Local
import { PRIVACY } from "./content";

/**
 * Məxfilik siyasəti.
 *
 * Mətn admin paneldən idarə olunur: «Səhifələr»-də slug-ı `mexfilik-siyaseti`
 * olan səhifənin mətni (contentHtml) doldurulubsa o göstərilir. Yoxdursa
 * content.js-dəki defolt mətn — saytın real işləməsini təsvir edir.
 *
 * Reklam ölçməsi seçimini dəyişmək düyməsi HƏR İKİ halda görünür: razılıq
 * banneri «geri götürmək» imkanı verməlidir.
 */

async function load() {
  const [{ data }, locale] = await Promise.all([apiGetStatus("/pages/mexfilik-siyaseti"), getLocale()]);
  return { page: data?.page || null, d: PRIVACY[locale] || PRIVACY.az };
}

export async function generateMetadata() {
  const { page, d } = await load();
  return metaFromApi(page?.seo || {}, {
    title: page?.title || d.title,
    description: page?.lead || d.lead,
    path: "/mexfilik-siyaseti",
  });
}

export default async function PrivacyPage() {
  const [{ page, d }, siteData] = await Promise.all([load(), apiGet("/site")]);
  const c = siteData?.settings?.contact || {};
  const fill = (s) =>
    s.replace("{email}", c.email || "office@britishacademy.az").replace("{phone}", c.phone || "");

  return (
    <>
      <PageBanner title={page?.h1 || d.title} subtitle={page?.lead || d.lead} />

      <section style={{ maxWidth: 820, margin: "0 auto", padding: "56px 28px 80px" }}>
        {page?.contentHtml ? (
          <article className="bz-body" dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.contentHtml) }} />
        ) : (
          <article className="bz-body">
            <p style={{ color: "#7C7D8C", fontSize: 14 }}>{d.updated}</p>
            {d.sections.map((s) => (
              <div key={s.h}>
                <h2>{s.h}</h2>
                {s.p.map((t) => (
                  <p key={t.slice(0, 40)}>{fill(t)}</p>
                ))}
              </div>
            ))}
          </article>
        )}

        <ConsentControl
          title={d.consentTitle}
          granted={d.consentGranted}
          denied={d.consentDenied}
          none={d.consentNone}
          reset={d.consentReset}
        />
      </section>
    </>
  );
}
