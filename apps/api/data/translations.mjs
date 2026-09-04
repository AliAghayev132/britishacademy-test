/**
 * Seed məzmununun EN/RU tərcümələri.
 *
 * Niyə ayrıca fayl: seed sətirlərinin içinə üç dili yazsaydıq, hər sətir
 * beş qat uzanardı və məlumatın özü oxunmaz olardı. Burada AZ mətn açardır —
 * seed onu görəndə tərcüməni tapıb {az,en,ru} qurur.
 *
 * Açar tapılmayanda mətn OLDUĞU KİMİ qalır (AZ üç dilə yayılır). Yəni yeni
 * sətir əlavə edən adam tərcüməni unutsa, sayt sınmır — sadəcə həmin sahə
 * azərbaycanca görünür.
 *
 * Bu fayl AI toplu tərcüməni ƏVƏZ ETMİR: o, admin panelindən əlavə olunan
 * məzmun üçündür. Bura yalnız seed-in gətirdiyi sabit mətnlərdir.
 */

// Kurs səhifələrinin uzun mətnləri ayrıca fayldadır — bu faylda qısa etiketlər
// (menyu, kateqoriya, üstünlük) qalır ki, axtarmaq asan olsun.
import { COURSE_T } from "./courseTranslations.mjs";

/** AZ mətn → { en, ru } */
export const T = {
  // ── Əlaqə (tənzimləmələr) ──
  "C.Cabbarlı 44, Caspian Plaza": {
    en: "44 J.Jabbarli St, Caspian Plaza",
    ru: "ул. Дж.Джаббарлы 44, Caspian Plaza",
  },
  "Həftə içi 09:00–21:00 · Şənbə 10:00–16:00": {
    en: "Weekdays 09:00–21:00 · Saturday 10:00–16:00",
    ru: "Будни 09:00–21:00 · Суббота 10:00–16:00",
  },

  // ── Kateqoriyalar ──
  "Xidmətlər": { en: "Services", ru: "Услуги" },
  "Dil Kursları": { en: "Language Courses", ru: "Языковые курсы" },
  "Danışıq Klubları və Praktika": { en: "Speaking Clubs & Practice", ru: "Разговорные клубы и практика" },
  "Beynəlxalq imtahanlara hazırlıq": { en: "International Exam Preparation", ru: "Подготовка к международным экзаменам" },
  "Peşəkar Sertifikat Proqramları": { en: "Professional Certificate Programmes", ru: "Профессиональные сертификационные программы" },
  "Kompüter Kursu": { en: "Computer Courses", ru: "Компьютерные курсы" },
  "Karyera kursları": { en: "Career Courses", ru: "Карьерные курсы" },
  "Uşaq Proqramları": { en: "Children's Programmes", ru: "Детские программы" },

  // ── Kurslar ──
  "İngilis dili kursu": { en: "English Language Course", ru: "Курс английского языка" },
  "Biznes İngilis dili kursu": { en: "Business English Course", ru: "Курс делового английского" },
  "Hüquqşünaslar üçün İngilis dili": { en: "English for Lawyers", ru: "Английский для юристов" },
  "Otel və Turizm üçün İngilis dili": { en: "English for Hotels & Tourism", ru: "Английский для гостиниц и туризма" },
  "Alman dili kursu": { en: "German Language Course", ru: "Курс немецкого языка" },
  "Beynəlxalq Sertifikatlı Alman dili": { en: "German with International Certificate", ru: "Немецкий с международным сертификатом" },
  "Rus dili kursu": { en: "Russian Language Course", ru: "Курс русского языка" },
  "İspan dili kursu": { en: "Spanish Language Course", ru: "Курс испанского языка" },
  "İtalyan dili kursu": { en: "Italian Language Course", ru: "Курс итальянского языка" },
  "Fransız dili kursu": { en: "French Language Course", ru: "Курс французского языка" },
  "Conversation Club": { en: "Conversation Club", ru: "Разговорный клуб" },
  "Workshop": { en: "Workshop", ru: "Воркшоп" },
  "IELTS & Pre-IELTS": { en: "IELTS & Pre-IELTS", ru: "IELTS и Pre-IELTS" },
  "TOEFL & Pre-TOEFL": { en: "TOEFL & Pre-TOEFL", ru: "TOEFL и Pre-TOEFL" },
  "OET (Tibb işçiləri üçün)": { en: "OET (for Healthcare Professionals)", ru: "OET (для медработников)" },
  "TOEIC (Rəsmi imtahan)": { en: "TOEIC (Official Exam)", ru: "TOEIC (официальный экзамен)" },
  "SAT & Pre-SAT": { en: "SAT & Pre-SAT", ru: "SAT и Pre-SAT" },
  "Duolingo": { en: "Duolingo", ru: "Duolingo" },
  "TOLES": { en: "TOLES", ru: "TOLES" },
  "TEFL Kursları": { en: "TEFL Courses", ru: "Курсы TEFL" },
  "MS Office proqramları": { en: "MS Office Programmes", ru: "Программы MS Office" },
  "Peşəkar Excel kursu": { en: "Professional Excel Course", ru: "Профессиональный курс Excel" },
  "Mühasibatlıq və 1C kursu": { en: "Accounting & 1C Course", ru: "Курс бухгалтерии и 1С" },
  "HR & Kargüzarlıq kursu": { en: "HR & Office Administration Course", ru: "Курс HR и делопроизводства" },
  "Uşaqlar üçün İngilis dili": { en: "English for Children", ru: "Английский для детей" },
  "Uşaqlar üçün Rus dili": { en: "Russian for Children", ru: "Русский для детей" },
  "Uşaqlar üçün Məntiq": { en: "Logic for Children", ru: "Логика для детей" },

  // ── Ölkələr ──
  "Almaniya": { en: "Germany", ru: "Германия" },
  "Türkiyə": { en: "Turkey", ru: "Турция" },
  "İngiltərə": { en: "United Kingdom", ru: "Великобритания" },
  "Kanada": { en: "Canada", ru: "Канада" },
  "Polşa": { en: "Poland", ru: "Польша" },
  "Latviya": { en: "Latvia", ru: "Латвия" },
  "Macarıstan": { en: "Hungary", ru: "Венгрия" },
  "Litva": { en: "Lithuania", ru: "Литва" },
  "Rusiya": { en: "Russia", ru: "Россия" },
  "Gürcüstan": { en: "Georgia", ru: "Грузия" },
  "Estoniya": { en: "Estonia", ru: "Эстония" },
  "Amerika": { en: "United States", ru: "США" },

  // Ölkə şüarları
  "Ödənişsiz universitetlər": { en: "Tuition-free universities", ru: "Бесплатные университеты" },
  "Bakalavr & master": { en: "Bachelor's & Master's", ru: "Бакалавриат и магистратура" },
  "Dünya səviyyəli təhsil": { en: "World-class education", ru: "Образование мирового уровня" },
  "Bakalavr, master, dil": { en: "Bachelor's, Master's, language", ru: "Бакалавриат, магистратура, язык" },
  "Sərfəli təhsil": { en: "Affordable education", ru: "Доступное образование" },
  "Avropa diplomu": { en: "European diploma", ru: "Европейский диплом" },
  "Sərfəli Avropa təhsili": { en: "Affordable European education", ru: "Доступное европейское образование" },
  "Aparıcı universitetlər": { en: "Leading universities", ru: "Ведущие университеты" },
  "Tibb & universitet": { en: "Medicine & university", ru: "Медицина и университет" },
  "Rəqəmsal ölkə": { en: "Digital nation", ru: "Цифровая страна" },
  "Təqaüd Proqramları": { en: "Scholarship Programmes", ru: "Стипендиальные программы" },
  "Tam & qismən təqaüd": { en: "Full & partial scholarships", ru: "Полные и частичные стипендии" },
  // «Stipendium Hungaricum» — proqramın rəsmi adıdır, tərcümə olunmur.

  // ── Regionlar ──
  "Avropa": { en: "Europe", ru: "Европа" },
  "Şimali Amerika": { en: "North America", ru: "Северная Америка" },
  "Region": { en: "Region", ru: "Регион" },
  "Proqram": { en: "Programme", ru: "Программа" },
  "Asiya": { en: "Asia", ru: "Азия" },

  // ── Üstünlüklər ──
  "Müəllimlər": { en: "Teachers", ru: "Преподаватели" },
  "IELTS 8.0–8.5 sertifikatlı, xaricdə təhsil almış, beynəlxalq təcrübəli müəllimlər.": {
    en: "Teachers with IELTS 8.0–8.5, educated abroad, with international experience.",
    ru: "Преподаватели с IELTS 8.0–8.5, обучавшиеся за рубежом, с международным опытом.",
  },
  "Kiçik qruplar": { en: "Small groups", ru: "Малые группы" },
  "3–6 tələbədən ibarət qruplar və ya tam fərdi dərs formatı.": {
    en: "Groups of 3–6 students, or fully individual lessons.",
    ru: "Группы по 3–6 студентов или полностью индивидуальные занятия.",
  },
  "Xüsusi metodika": { en: "Special methodology", ru: "Особая методика" },
  "Böyük Britaniyada hazırlanmış kitablarla 4 dəfə sürətli öyrənmə.": {
    en: "Learn four times faster with coursebooks developed in the UK.",
    ru: "Учитесь в четыре раза быстрее по учебникам, созданным в Великобритании.",
  },
  "Kampaniyalar": { en: "Special offers", ru: "Акции" },
  "Sərfəli qiymətlər, mövsüm və bayram endirimləri.": {
    en: "Affordable prices, seasonal and holiday discounts.",
    ru: "Доступные цены, сезонные и праздничные скидки.",
  },
  "Müasir siniflər": { en: "Modern classrooms", ru: "Современные классы" },
  "Bütün lazımi avadanlıqla təchiz olunmuş rahat sinif otaqları.": {
    en: "Comfortable classrooms equipped with everything needed.",
    ru: "Удобные классы, оснащённые всем необходимым.",
  },
  "Ödənişsiz vəsaitlər": { en: "Free materials", ru: "Бесплатные материалы" },
  "Dərs kitabları və hər gün təşkil olunan danışıq klubları ödənişsiz.": {
    en: "Coursebooks and daily speaking clubs at no extra cost.",
    ru: "Учебники и ежедневные разговорные клубы бесплатно.",
  },

  // ── Menyu ──
  "Haqqımızda": { en: "About us", ru: "О нас" },
  "Xaricdə təhsil": { en: "Study abroad", ru: "Обучение за рубежом" },
  "Filiallar": { en: "Branches", ru: "Филиалы" },
  "Tələbələrimiz": { en: "Our students", ru: "Наши студенты" },
  "Əlaqə": { en: "Contact", ru: "Контакты" },
};

// Kurs mətnləri əsas lüğətə əlavə olunur. Yayma İSTİQAMƏTİ vacibdir: kurs
// faylı sonra gəlir, yəni eyni açar hər iki yerdə olsa kurs versiyası qalib
// gəlir — uzun mətn üçün kontekst daha dəqiqdir.
Object.assign(T, COURSE_T);

/**
 * Sayt üzrə FAQ — ana səhifədəki bölmə.
 *
 * Əvvəl bu suallar tərcümə faylında SABİT idi: üç dilli, amma admin onları
 * redaktə edə bilmirdi. İndi baza qeydi kimi gəlir — həm redaktə olunur,
 * həm üç dillidir.
 */
export const FAQS = [
  {
    question: {
      az: "Dərslər həftədə neçə dəfə olur?",
      en: "How many times a week are the lessons?",
      ru: "Сколько раз в неделю проходят занятия?",
    },
    answer: {
      az: "Standart qrafik həftədə 2 və ya 3 dəfədir. Intensiv qruplar həftədə 4–5 dəfə keçirilir.",
      en: "The standard schedule is two or three times a week. Intensive groups meet four to five times a week.",
      ru: "Стандартный график — два или три раза в неделю. Интенсивные группы занимаются четыре–пять раз в неделю.",
    },
    group: "general",
    order: 0,
  },
  {
    question: {
      az: "Sınaq dərsi mövcuddur?",
      en: "Is there a trial lesson?",
      ru: "Есть ли пробный урок?",
    },
    answer: {
      az: "Bəli. İlk dərs sınaq dərsidir; davam etsəniz dərs saatı kimi qeydə alınır.",
      en: "Yes. The first lesson is a trial; if you continue, it counts towards your course hours.",
      ru: "Да. Первое занятие пробное; если вы продолжите, оно засчитывается в учебные часы.",
    },
    group: "general",
    order: 1,
  },
  {
    question: {
      az: "Səviyyəm necə müəyyən olunur?",
      en: "How is my level determined?",
      ru: "Как определяется мой уровень?",
    },
    answer: {
      az: "Ödənişsiz yazılı test və müəllimlə qısa danışıq müsahibəsi ilə. Nəticəyə görə uyğun qrupa yönləndirilirsiniz.",
      en: "With a free written test and a short speaking interview with a teacher. Based on the result you are placed in a suitable group.",
      ru: "С помощью бесплатного письменного теста и короткого устного собеседования с преподавателем. По результату вас определяют в подходящую группу.",
    },
    group: "general",
    order: 2,
  },
  {
    question: {
      az: "Qrupda neçə nəfər olur?",
      en: "How many students are in a group?",
      ru: "Сколько человек в группе?",
    },
    answer: {
      az: "Qruplar 3–6 nəfərdən ibarətdir. Fərdi dərs formatı da mövcuddur.",
      en: "Groups have three to six students. Individual lessons are also available.",
      ru: "В группах от трёх до шести студентов. Также доступны индивидуальные занятия.",
    },
    group: "general",
    order: 3,
  },
  {
    question: {
      az: "Sertifikat verilirmi?",
      en: "Do you issue a certificate?",
      ru: "Выдаётся ли сертификат?",
    },
    answer: {
      az: "Kursu bitirdikdə British Academy sertifikatı verilir. Beynəlxalq imtahanlar (IELTS, TOEFL, TOEIC) üçün sertifikatı müvafiq təşkilat verir.",
      en: "On completing the course you receive a British Academy certificate. For international exams (IELTS, TOEFL, TOEIC) the certificate is issued by the awarding body.",
      ru: "По окончании курса выдаётся сертификат British Academy. Сертификаты международных экзаменов (IELTS, TOEFL, TOEIC) выдаёт соответствующая организация.",
    },
    group: "general",
    order: 4,
  },
  {
    question: {
      az: "Dərsi buraxsam nə olur?",
      en: "What happens if I miss a lesson?",
      ru: "Что будет, если я пропущу занятие?",
    },
    answer: {
      az: "Əvvəlcədən xəbər versəniz, dərsi başqa qrupla və ya əlavə vaxtda bərpa etmək mümkündür.",
      en: "If you let us know in advance, the lesson can be made up with another group or at an additional time.",
      ru: "Если предупредить заранее, занятие можно отработать с другой группой или в дополнительное время.",
    },
    group: "general",
    order: 5,
  },
];

/**
 * Mətni {az,en,ru} formasına çevir.
 *
 * Tərcümə tapılmayanda AZ hər üç dilə yazılır — sayt sınmır, sahə sadəcə
 * azərbaycanca görünür və AI toplu tərcümə sonradan onu doldura bilir.
 */
export const tri = (azText) => {
  const t = T[azText];
  return { az: azText, en: t?.en || azText, ru: t?.ru || azText };
};
