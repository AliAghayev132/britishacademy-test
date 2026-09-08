// ── Google Tag Manager ──
//
// NİYƏ AYRICA KOMPONENT, «kod yerləşdirmə» sahəsinə yapışdırmaq əvəzinə:
//
//  1. `CodeInjection` kodu BRAUZERDƏ, səhifə yükləndikdən sonra əlavə edir.
//     GTM-in isə mümkün qədər erkən qalxması lazımdır.
//  2. GTM-in `<noscript>` hissəsi o üsulla ÜMUMİYYƏTLƏ işləmir: o, məhz
//     JavaScript SÖNÜLÜ olanlar üçündür, `CodeInjection` isə onu JavaScript
//     ilə əlavə edir. JS sönülüdürsə heç nə əlavə olunmur; JS açıqdırsa
//     brauzer `<noscript>` içindəkinə onsuz da baxmır. Yəni hər iki halda
//     faydasızdır.
//
// Burada snippet SERVER tərəfdə HTML-ə düşür: `<noscript>` real olaraq
// `<body>`-nin əvvəlindədir, skript isə `next/script` ilə `afterInteractive`
// strategiyası ilə qalxır (Next-in GTM üçün tövsiyə etdiyi yol).

import Script from "next/script";

// ID yoxlanışı ayrıca modulda — o, təhlükəsizlik sərhədidir (ID inline
// skriptin içinə yazılır) və öz testi var.
import { gtmIdOf } from "@/lib/gtm";

/** `<head>` üçün: konteyneri yükləyən skript. */
export function GtmScript({ id }) {
  const gtm = gtmIdOf(id);
  if (!gtm) return null;
  return (
    <Script id="gtm-init" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtm}');`}
    </Script>
  );
}

/** `<body>`-nin ƏVVƏLİ üçün: JavaScript sönülü ziyarətçilər. */
export function GtmNoScript({ id }) {
  const gtm = gtmIdOf(id);
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
