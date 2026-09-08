// ── Google Tag Manager ──
//
// NİYƏ AYRICA KOMPONENT, «kod yerləşdirmə» sahəsinə yapışdırmaq əvəzinə:
// paneldəki `codeInjection.head` kodu brauzerdə, səhifə yükləndikdən SONRA
// əlavə olunur (bax: CodeInjection.jsx). GTM üçün bunun iki qüsuru var —
//
//   1. GTM gec qalxır, ilk səhifə baxışının vaxtı sürüşür;
//   2. GTM-in `<noscript>` hissəsi belə üsulla ÜMUMİYYƏTLƏ işləmir. O, məhz
//      JavaScript SÖNÜLÜ olanlar üçündür; JavaScript ilə əlavə olunan
//      `<noscript>` isə mənasızdır (JS sönülüdürsə heç nə əlavə olunmur,
//      açıqdırsa brauzer onun içinə onsuz da baxmır).
//
// Burada isə hər ikisi SERVER tərəfdə, ilk HTML-in içinə düşür — Google-un
// göstərdiyi yerlərə: skript `<head>`-in başına, iframe `<body>`-nin əvvəlinə.
//
// ID paneldən gəlir (Tənzimləmələr → SEO / Texniki). Boşdursa heç nə render
// olunmur — yəni test mühitində təsadüfən statistika toplanmır.

/**
 * Konteyner ID-si `GTM-XXXXXXX` formasındadır.
 *
 * Yoxlama VACİBDİR: ID aşağıda sətir kimi skriptin İÇİNƏ yazılır. Yoxlanmasa
 * sahəyə dırnaq/nöqtəli vergül düşən dəyər skripti sındırar (və ya ixtiyari
 * JS-ə çevrilər). Panel yalnız `admin` roluna açıqdır, amma səhv yazı da
 * bunu edə bilər.
 */
const VALID = /^GTM-[A-Z0-9]{4,}$/;

const clean = (id) => {
  const v = String(id || "").trim().toUpperCase();
  return VALID.test(v) ? v : null;
};

/** `<head>`-ə düşən əsas GTM skripti. */
export function GtmScript({ id }) {
  const gtm = clean(id);
  if (!gtm) return null;
  return (
    <script
      // Google-un öz parçası, yalnız ID yerinə qoyulub.
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtm}');`,
      }}
    />
  );
}

/** `<body>`-nin ƏVVƏLİNƏ düşən ehtiyat iframe (JavaScript sönülü olanlar üçün). */
export function GtmNoScript({ id }) {
  const gtm = clean(id);
  if (!gtm) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtm}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
