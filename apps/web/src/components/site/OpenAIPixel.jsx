// ── OpenAI reklam pikseli ──
//
// OpenAI-ın öz parçasıdır, olduğu kimi — yalnız piksel ID-si sabitə çıxarılıb.
// GTM kimi SERVER tərəfdə, ilk HTML-in içinə düşür (bax GoogleTagManager.jsx):
// parça SDK-nı özü asinxron yükləyir, səhifənin açılmasını gözlətmir.
//
// YER: `(public)/layout.js` — kök layout DEYİL. Admin panelində və girişdə
// üçüncü tərəf skripti işləməməlidir.
//
// Razılıq gözlənilmir — qərar sahibinindir (2026-11-02): piksel hər
// ziyarətçidə yüklənir, məxfilik siyasətində bu yazılıb (mexfilik-siyaseti/content.js).

const PIXEL_ID = "Kb33tH92Gv6M2j1DttZxek";

/**
 * `debug: true` — OpenAI-ın verdiyi parçada belədir: brauzer konsolunda
 * hadisələr görünür, quraşdırmanı yoxlamaq üçündür. Yoxlama bitəndə `false`.
 */
const DEBUG = true;

export function OpenAIPixel() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `!function(w,d,s,u){if(w.oaiq)return;var q=function(){q.q.push(arguments)};q.q=[];w.oaiq=q;var j=d.createElement(s);j.async=1;j.src=u;var f=d.getElementsByTagName(s)[0];f.parentNode.insertBefore(j,f)}(window,document,"script","https://bzrcdn.openai.com/sdk/oaiq.min.js");oaiq("init",{pixelId:"${PIXEL_ID}",debug:${DEBUG}});`,
      }}
    />
  );
}
