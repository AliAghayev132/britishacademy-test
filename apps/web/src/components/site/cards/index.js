// Kartlar ayrı-ayrı fayllardadır; köhnə `./cards` importları işləsin deyə adlar
// burada eyni cür ixrac olunur. Fayl `cards.jsx` yox, `cards/index.js`-dir:
// barrel generatoru index fayllarını ötürür, `cards.jsx` isə eyni adları
// kart fayllarının default ixracları ilə toqquşdurardı.
export { default as CourseCard } from "./CourseCard";
export { default as DestinationCard } from "./DestinationCard";
export { default as TestimonialCard } from "./TestimonialCard";
export { default as SectionHead } from "./SectionHead";
