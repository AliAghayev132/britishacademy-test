"use client";

// React
import { useSyncExternalStore } from "react";

// Lib
import { useT, getConsent, setConsent, CONSENT_EVENT } from "@/lib";

// Local
import { LocaleLink } from "./LocaleLink";

/**
 * Reklam ölçməsi üçün razılıq banneri.
 *
 * Yalnız BİR şeyə aiddir: istifadəçinin hansı reklamdan gəldiyini brauzerdə
 * 30 gün saxlamaq (bax lib/attribution.js). Seçim edilənə qədər görünür.
 * Rədd edilsə də sayt işləyir; sadəcə günlər sonra qayıdan istifadəçinin
 * müraciəti kampaniyaya bağlanmır.
 *
 * `useSyncExternalStore` — serverdə banner render olunmur ("ssr"), brauzerdə
 * isə seçim localStorage-dan oxunur. `useEffect` + `useState` ilə edilsəydi
 * ya hidrasiya uyğunsuzluğu, ya da ilk kadrda bannerin «sıçraması» olardı.
 */
const subscribe = (cb) => {
  window.addEventListener(CONSENT_EVENT, cb);
  window.addEventListener("storage", cb); // başqa vərəqdə seçim edilibsə
  return () => {
    window.removeEventListener(CONSENT_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};
const clientSnapshot = () => getConsent() ?? "none";
const serverSnapshot = () => "ssr";

export function ConsentBanner() {
  const t = useT();
  const choice = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  if (choice !== "none") return null;

  return (
    <div className="ba-consent" role="region" aria-label={t("consent.title")}>
      <p className="ba-consent-text">
        {t("consent.text")}{" "}
        <LocaleLink href="/mexfilik-siyaseti" className="ba-consent-link">
          {t("consent.more")}
        </LocaleLink>
      </p>
      <div className="ba-consent-actions">
        <button type="button" className="ba-consent-btn ba-consent-btn--ghost" onClick={() => setConsent("denied")}>
          {t("consent.decline")}
        </button>
        <button type="button" className="ba-consent-btn" onClick={() => setConsent("granted")}>
          {t("consent.accept")}
        </button>
      </div>
    </div>
  );
}
