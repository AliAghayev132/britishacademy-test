"use client";

// Lib
import { useT, getImageUrl } from "@/lib";

const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);

/**
 * Ana səhifənin rəy kartı — portret (3:4), rəy mətni şəklin ÜSTÜNDƏ.
 *
 * Əvvəl ağ kartın altında 46px-lik dairəvi avatar vardı: tələbənin üzü
 * demək olar görünmürdü, bölmə isə mətn divarı kimi qalırdı. İndi şəkil
 * kartın özüdür, mətn aşağıdakı tünd keçidin üzərində oxunur.
 *
 * ŞƏKİLSİZ HAL əsas haldır, ehtiyat variant deyil: canlıda ana səhifənin 6
 * rəyinin heç birində şəkil yox idi. Ona görə şəkil olmayanda kart rəyin öz
 * rəngindən (`color`) qradiyent və arxada iri baş hərflə qurulur — altı
 * fərqli rəng altı fərqli kart verir, boşluq kimi görünmür.
 *
 * Şəkil `getImageUrl`-dan keçir: API nisbi yol (`/uploads/…`) qaytarır,
 * xam işlədiləndə dev mühitində saytın öz originine həll olunub 404 verirdi.
 */
export default function TestimonialPhotoCard({ t }) {
  const tr = useT();
  const rating = t.rating || 5;
  const photo = getImageUrl(t.photo);
  const initial = (t.name || "?").trim().charAt(0).toUpperCase();

  return (
    <figure className="ba-tpc" style={{ "--c": t.color || "#2E6BE6" }}>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="ba-tpc-img" src={photo} alt="" loading="lazy" />
      ) : (
        <span className="ba-tpc-mono" aria-hidden="true">{initial}</span>
      )}

      <div className="ba-tpc-top">
        <span className="ba-tpc-stars" role="img" aria-label={tr("review.rating").replace("{n}", rating)}>
          {stars(rating)}
        </span>
        <span className="ba-tpc-mark" aria-hidden="true">”</span>
      </div>

      <div className="ba-tpc-body">
        <blockquote className="ba-tpc-quote">{t.quote}</blockquote>
        <figcaption className="ba-tpc-who">
          <span className="ba-tpc-name">{t.name}</span>
          {t.achievement && <span className="ba-tpc-ach">{t.achievement}</span>}
        </figcaption>
      </div>
    </figure>
  );
}
