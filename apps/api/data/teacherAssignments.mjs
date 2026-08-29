/**
 * Müəllim → filial → dərs təyinatları (müştəridən gələn siyahı).
 *
 * Dərs SAATI qəsdən yoxdur: yalnız «hansı filialda hansı dərsi keçir».
 *
 * Kurs adları müştərinin işlətdiyi adlardır; COURSE_ALIASES onları bazadakı
 * kurs slug-larına çevirir. Uyğunluğu olmayan adlar import hesabatında
 * «xəbərdarlıq» kimi göstərilir — səssizcə atılmır.
 */

/** Müştəri adı → bazadakı kurs slug-ı. */
export const COURSE_ALIASES = {
  "general english": "ingilis-dili-kursu",
  "business english": "biznes-ingilis-dili-kursu",
  "english for kids": "usaq-ingilis-dili",
  "rus dili": "rus-dili-kursu",
  "ielts": "ielts",
  "pre-ielts": "ielts", // eyni kurs — «IELTS & Pre-IELTS»
  "toefl": "toefl",
  "toeic": "toeic",
  "oet": "oet",
  "toles": "toles",
  "duolingo": "duolingo",
  "sat verbal": "sat", // hər ikisi «SAT & Pre-SAT»
  "sat math": "sat",
  "conversation moderator": "conversation-club",
  "ofis proqramları": "ms-office",
  // Yazılış səhvi müştəri mesajında: "Camridge English"
  "camridge english": "__UNMAPPED_CAMBRIDGE__",
  "cambridge english": "__UNMAPPED_CAMBRIDGE__",
  "aptis": "__UNMAPPED_APTIS__",
};

/**
 * Müştəri filial adı → bazadakı filial adında axtarılacaq açar söz.
 *
 * Slug işlətmirik: seed ilə canlı bazada slug-lar fərqlənə bilər
 * («nerimanov-filiali» vs «neriman-nerimanov-filiali»). Normallaşdırılmış
 * ad daxilində açar söz axtarmaq hər iki halda işləyir.
 */
export const BRANCH_KEYWORDS = {
  "nərimanov": "nerimanov",
  "caspian": "caspian",
  "elmlər": "elmler",
};

export const TEACHERS = [
  // ── Nəriman Nərimanov filialı ──
  { branch: "nərimanov", name: "Şirinnaz Kərimova", courses: ["General English"] },
  { branch: "nərimanov", name: "Xədicə Əsədzadə", courses: ["General English", "English for Kids"] },
  { branch: "nərimanov", name: "Jasmin Vəlixanova", courses: ["General English", "English for Kids"] },
  { branch: "nərimanov", name: "Aytac İsmaylova", courses: ["General English"] },
  { branch: "nərimanov", name: "Gözəl Məhərrəmova", courses: ["General English"] },
  { branch: "nərimanov", name: "Ülkər İsmayılzadə", courses: ["General English"] },
  { branch: "nərimanov", name: "Səkinə Məmmədova", courses: ["General English"] },
  { branch: "nərimanov", name: "Mahirə Əzizova", courses: ["Rus dili"] },

  // ── Mərkəz — Caspian Plaza ──
  { branch: "caspian", name: "Səbinə Əliyeva", courses: ["General English", "Business English", "Duolingo", "TOEFL", "TOEIC", "OET", "TOLES"] },
  // Mənbədə "TOEIC" iki dəfə yazılıb, "Camridge" yazılış səhvidir.
  { branch: "caspian", name: "Esmira Rzayeva", courses: ["General English", "Business English", "OET", "IELTS", "TOEIC", "TOEFL", "Cambridge English"] },
  { branch: "caspian", name: "Türkan Bəşirova", courses: ["General English", "Pre-IELTS"] },
  { branch: "caspian", name: "Gülnar Əliyeva", courses: ["General English", "IELTS", "Duolingo"] },
  { branch: "caspian", name: "Günel Yaşar", courses: ["General English"] },
  { branch: "caspian", name: "Ülviyyə Mehdizadə", courses: ["General English", "Duolingo"] },
  { branch: "caspian", name: "Müşəfərim Bürcalıyeva", courses: ["General English", "Pre-IELTS", "IELTS", "Aptis"] },
  { branch: "caspian", name: "Fidan Qurbanova", courses: ["General English"] },
  { branch: "caspian", name: "Səbinə Rufullayeva", courses: ["General English", "English for Kids"] },
  { branch: "caspian", name: "Banu Allahverdiyeva", courses: ["General English"] },
  { branch: "caspian", name: "Nəzrin Məstiyeva", courses: ["General English", "English for Kids", "Cambridge English"] },
  { branch: "caspian", name: "Nərgiz Yusifli", courses: ["General English", "Conversation Moderator"] },
  { branch: "caspian", name: "Vidadi Oruczadə", courses: ["General English"] },
  // ⚠️ Mənbə mesajı burada KƏSİLİB: "Aytac Qurbanova-General English, G…"
  // İkinci kurs naməlumdur; yalnız təsdiqlənmiş hissə yazılır.
  { branch: "caspian", name: "Aytac Qurbanova", courses: ["General English"], incomplete: true },

  // ── Elmlər Akademiyası filialı ──
  { branch: "elmlər", name: "Ramiz Səmədov", courses: ["IELTS"] },
  { branch: "elmlər", name: "Gülnar Xəlilzadə", courses: ["General English", "Pre-IELTS"] },
  { branch: "elmlər", name: "Renat İmamov", courses: ["SAT Verbal", "Duolingo", "IELTS"] },
  { branch: "elmlər", name: "Nigar Əhmədova", courses: ["SAT Math"] },
  { branch: "elmlər", name: "Safura Kərimova", courses: ["General English", "Business English", "Pre-IELTS", "IELTS", "SAT Verbal", "Duolingo"] },
  { branch: "elmlər", name: "Sabrina Kazımzadə", courses: ["General English", "Duolingo", "Pre-IELTS", "IELTS", "Cambridge English"] },
  { branch: "elmlər", name: "Aysu İbrahimli", courses: ["General English", "English for Kids"] },
  { branch: "elmlər", name: "Fidan İbrahimli", courses: ["General English", "Pre-IELTS"] },
  { branch: "elmlər", name: "Vanilla Abdoun", courses: ["General English", "English for Kids"] },
  { branch: "elmlər", name: "Məryəm Əhmədova", courses: ["General English", "Pre-IELTS", "English for Kids"] },
  { branch: "elmlər", name: "Rəşad Quliyev", courses: ["IELTS"] },
  { branch: "elmlər", name: "Həvva Əlizadə", courses: ["General English", "Pre-IELTS"] },
  { branch: "elmlər", name: "Aytac Soltanova", courses: ["General English"] },
  { branch: "elmlər", name: "Bahar Baxışlı", courses: ["Rus dili"] },
  { branch: "elmlər", name: "Günay Kərimova", courses: ["Ofis proqramları"] },
  { branch: "elmlər", name: "Aysel Ağarzayeva", courses: ["General English"] },
  { branch: "elmlər", name: "Zöhrə Əhmədova", courses: ["English for Kids"] },
];
