/**
 * Xidmətlər menyusundakı bəndin ünvanı.
 *
 * Standart bəndlər kurs kateqoriyası/kursudur və /kurslar/<slug> naxışını
 * izləyir. «Onlayn Testlər» qrupu isə kurs deyil — o, açıq `href` verir
 * (bax (public)/layout.js).
 */
const svcHref = (x) => x.href || `/kurslar/${x.slug}`;

export default svcHref;
