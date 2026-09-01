import Link from "next/link";
import { getLocale, getT } from "@/lib/i18n/serverT";
import { buildPath } from "@/lib/i18n/routes";

/**
 * 404 — tapılmayan səhifə.
 *
 * Köhnə statik saytdan çoxlu ünvan indekslənib. Tanınanlar proxy-də 301 ilə
 * yönləndirilir (bax lib/legacyRoutes.js), qalanları buraya düşür. Ziyarətçini
 * boş bir mesajla buraxmaq həmin trafiki itirmək deməkdir, ona görə səhifə
 * ƏSAS BÖLMƏLƏRƏ keçid verir — insan axtardığını əl ilə tapa bilsin.
 *
 * Dil `x-lang` header-indən gəlir (proxy qoyur), linklər isə həmin dilin
 * ünvanları ilə qurulur: RU ziyarətçi /ru/kursy görsün, /kurslar yox.
 */
export default async function NotFound() {
  const [locale, t] = await Promise.all([getLocale(), getT()]);

  const links = [
    { path: "/", key: "nf.home" },
    { path: "/kurslar", key: "nf.courses" },
    { path: "/muellimler", key: "nf.teachers" },
    { path: "/filiallar", key: "nf.branches" },
    { path: "/elaqe", key: "nf.contact" },
  ];

  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: "48px 24px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: "'Poppins', system-ui, sans-serif",
          fontWeight: 800,
          fontSize: 84,
          color: "var(--accent)",
          margin: 0,
          lineHeight: 1,
          letterSpacing: -2,
        }}
      >
        {t("nf.code")}
      </p>

      <h1
        style={{
          fontFamily: "'Poppins', system-ui, sans-serif",
          fontWeight: 700,
          fontSize: 26,
          color: "#14141C",
          margin: 0,
        }}
      >
        {t("nf.title")}
      </h1>

      <p style={{ maxWidth: 460, fontSize: 15.5, color: "#63636F", margin: 0, lineHeight: 1.65 }}>
        {t("nf.text")}
      </p>

      <nav
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 10,
          marginTop: 18,
        }}
      >
        {links.map(({ path, key }, i) => (
          <Link
            key={path}
            href={buildPath(path, locale)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              // Ana səhifə əsas hərəkətdir — qalanları ikinci dərəcəli.
              background: i === 0 ? "var(--accent)" : "#fff",
              color: i === 0 ? "#fff" : "#33333D",
              border: i === 0 ? "1px solid var(--accent)" : "1px solid #E4E5EC",
              fontWeight: 700,
              fontSize: 14.5,
              padding: "12px 22px",
              borderRadius: 99,
            }}
          >
            {t(key)}
          </Link>
        ))}
      </nav>

      <p style={{ maxWidth: 420, fontSize: 13.5, color: "#9A9AA6", margin: "14px 0 0", lineHeight: 1.6 }}>
        {t("nf.help")}
      </p>
    </div>
  );
}
