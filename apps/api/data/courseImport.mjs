/**
 * Müştəridən gələn kurs məlumatları (WhatsApp yazışmalarından strukturlaşdırılıb).
 *
 * Buradakı hər şey 3 dillidir. SEO mətnləri mənbədə yox idi — məzmuna uyğun
 * yazılıb (metaTitle ≤60, metaDescription ≤160 simvol tövsiyəsi ilə).
 *
 * Qiymət modeli qeydi: `Course.pricing[]` filial üzrə YALNIZ bir qrup və bir
 * fərdi dəyər saxlayır (gündüz/axşam). Mənbədə isə fərdi dərsin bir neçə
 * variantı var (2×90, 2×60, 3×60 dəq). Ona görə:
 *   individual.day/evening → ƏSAS variant (həftədə 2 dəfə 90 dəqiqə)
 *   note (3 dilli)         → qalan variantların tam açılışı
 *
 * Skript idempotentdir: təkrar işlədilə bilər, hər dəfə eyni nəticə verir.
 */

const B = {
  caspian: "merkez-caspian-plaza",
  nerimanov: "nerimanov-filiali",
  elmler: "elmler-akademiyasi-filiali",
};

/** Qısa yazılış: 3 dilli mətn. */
const L = (az, en, ru) => ({ az, en, ru });

// ─────────────────────────────────────────────────────────────
// Ofis proqramları — MS Office
// ─────────────────────────────────────────────────────────────
const msOffice = {
  slug: "ms-office",
  lead: L(
    "Windows, Microsoft Word, Excel və PowerPoint — 3 aylıq praktik proqram. Dərslər həftədə 2 dəfə, 90 dəqiqə.",
    "Windows, Microsoft Word, Excel and PowerPoint — a practical 3-month programme. Classes twice a week, 90 minutes each.",
    "Windows, Microsoft Word, Excel и PowerPoint — практическая 3-месячная программа. Занятия дважды в неделю по 90 минут.",
  ),
  excerpt: L(
    "3 aylıq ofis proqramları kursu — Word, Excel, PowerPoint və Windows.",
    "A 3-month office software course — Word, Excel, PowerPoint and Windows.",
    "3-месячный курс офисных программ — Word, Excel, PowerPoint и Windows.",
  ),
  contentHtml: L(
    `<p>Ofis proqramları kursu <strong>Windows, Microsoft Word, Excel və PowerPoint</strong> proqramlarını əhatə edir və <strong>3 ay</strong> davam edir.</p>
<p>Dərslər <strong>həftədə 2 dəfə, hər biri 90 dəqiqə</strong> olmaqla keçirilir. Qrup dərsləri kiçik qruplarda aparılır ki, hər iştirakçıya kifayət qədər diqqət ayrılsın.</p>
<p>Kurs boyunca real iş tapşırıqları üzərində işləyirsiniz — sənəd hazırlama, cədvəl və hesabatlar, təqdimat qurulması.</p>`,
    `<p>The office software course covers <strong>Windows, Microsoft Word, Excel and PowerPoint</strong> and runs for <strong>3 months</strong>.</p>
<p>Classes are held <strong>twice a week, 90 minutes each</strong>. Group classes are kept small so every participant gets enough attention.</p>
<p>Throughout the course you work on real workplace tasks — document preparation, spreadsheets and reports, building presentations.</p>`,
    `<p>Курс офисных программ охватывает <strong>Windows, Microsoft Word, Excel и PowerPoint</strong> и длится <strong>3 месяца</strong>.</p>
<p>Занятия проходят <strong>дважды в неделю по 90 минут</strong>. Группы небольшие, чтобы каждому участнику уделялось достаточно внимания.</p>
<p>В течение курса вы работаете над реальными рабочими задачами — подготовка документов, таблицы и отчёты, создание презентаций.</p>`,
  ),
  info: [
    { label: L("Müddət", "Duration", "Длительность"), value: L("3 ay", "3 months", "3 месяца") },
    { label: L("Dərs rejimi", "Schedule", "Режим занятий"), value: L("Həftədə 2 dəfə · 90 dəq", "Twice a week · 90 min", "2 раза в неделю · 90 мин") },
    { label: L("Proqramlar", "Software", "Программы"), value: L("Windows, Word, Excel, PowerPoint", "Windows, Word, Excel, PowerPoint", "Windows, Word, Excel, PowerPoint") },
    { label: L("Qrup ölçüsü", "Group size", "Размер группы"), value: L("3–6 nəfər", "3–6 people", "3–6 человек") },
  ],
  seo: {
    metaTitle: L("MS Office kursu — Word, Excel, PowerPoint", "MS Office course — Word, Excel, PowerPoint", "Курс MS Office — Word, Excel, PowerPoint"),
    metaDescription: L(
      "British Academy-də 3 aylıq ofis proqramları kursu: Windows, Word, Excel, PowerPoint. Həftədə 2 dəfə 90 dəqiqə, qrup və fərdi dərslər.",
      "A 3-month office software course at British Academy: Windows, Word, Excel, PowerPoint. Twice a week, 90 minutes, group and individual classes.",
      "3-месячный курс офисных программ в British Academy: Windows, Word, Excel, PowerPoint. Дважды в неделю по 90 минут, групповые и индивидуальные занятия.",
    ),
    keywords: L(
      "MS Office kursu, Excel kursu, Word kursu, PowerPoint kursu, kompüter kursu Bakı",
      "MS Office course, Excel course, Word course, PowerPoint course, computer course Baku",
      "курс MS Office, курс Excel, курс Word, курс PowerPoint, компьютерные курсы Баку",
    ),
  },
  pricing: [
    {
      branch: B.caspian,
      group: { day: 80, evening: 100 },
      individual: { day: 200, evening: 280 },
      note: L(
        "Qrup 3–6 nəfər. Fərdi: 90 dəq 200 AZN, 60 dəq 135 AZN; 17:00-dan sonra 90 dəq 280 AZN, 60 dəq 190 AZN.",
        "Groups of 3–6. Individual: 90 min 200 AZN, 60 min 135 AZN; after 17:00 — 90 min 280 AZN, 60 min 190 AZN.",
        "Группы 3–6 человек. Индивидуально: 90 мин 200 AZN, 60 мин 135 AZN; после 17:00 — 90 мин 280 AZN, 60 мин 190 AZN.",
      ),
    },
    {
      branch: B.nerimanov,
      group: { day: 70, evening: 90 },
      individual: { day: 160, evening: 260 },
      note: L(
        "Qrup 3–5 nəfər. Fərdi: həftədə 2×90 dəq 160 AZN, 2×60 dəq 110 AZN, 3×60 dəq 160 AZN; 17:00-dan sonra 2×90 dəq 260 AZN, 2×60 dəq 180 AZN, 3×60 dəq 260 AZN.",
        "Groups of 3–5. Individual: 2×90 min 160 AZN, 2×60 min 110 AZN, 3×60 min 160 AZN per week; after 17:00 — 2×90 min 260 AZN, 2×60 min 180 AZN, 3×60 min 260 AZN.",
        "Группы 3–5 человек. Индивидуально: 2×90 мин 160 AZN, 2×60 мин 110 AZN, 3×60 мин 160 AZN в неделю; после 17:00 — 2×90 мин 260 AZN, 2×60 мин 180 AZN, 3×60 мин 260 AZN.",
      ),
    },
    {
      branch: B.elmler,
      group: { day: 100, evening: 120 },
      individual: { day: 250, evening: 350 },
      note: L(
        "Qrup 3–5 nəfər. Fərdi: 2×60 dəq 165 AZN (17:00-dan sonra 235 AZN), 2×90 dəq 250 AZN (17:00-dan sonra 350 AZN).",
        "Groups of 3–5. Individual: 2×60 min 165 AZN (after 17:00 — 235 AZN), 2×90 min 250 AZN (after 17:00 — 350 AZN).",
        "Группы 3–5 человек. Индивидуально: 2×60 мин 165 AZN (после 17:00 — 235 AZN), 2×90 мин 250 AZN (после 17:00 — 350 AZN).",
      ),
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// İngilis dili
// ─────────────────────────────────────────────────────────────
const english = {
  slug: "ingilis-dili-kursu",
  lead: L(
    "11 illik təcrübə, 4 filial və rəsmi TOEIC/TOEFL imtahan mərkəzi. Dərslər həftədə 2 dəfə, 90 dəqiqə.",
    "11 years of experience, 4 branches and an official TOEIC/TOEFL test centre. Classes twice a week, 90 minutes.",
    "11 лет опыта, 4 филиала и официальный центр экзаменов TOEIC/TOEFL. Занятия дважды в неделю по 90 минут.",
  ),
  excerpt: L(
    "Rəsmi TOEIC/TOEFL mərkəzində beynəlxalq sertifikatlı ingilis dili kursu.",
    "English course at an official TOEIC/TOEFL centre, with an internationally valid certificate.",
    "Курс английского языка в официальном центре TOEIC/TOEFL с международным сертификатом.",
  ),
  contentHtml: L(
    `<p>📚 <strong>British Academy</strong> 11 illik təcrübə və 4 filialı ilə Azərbaycanda <strong>rəsmi TOEIC və TOEFL imtahan mərkəzi</strong> olaraq fəaliyyət göstərir. Tələbələrimiz bütün dünyada keçərli beynəlxalq ingilis dili sertifikatı əldə etmək imkanı qazanır.</p>
<p>📣 Dərslərə qoşularaq <strong>Workshop</strong>, <strong>Movie &amp; Listening Day</strong> və <strong>Danışıq Klubları</strong>ndan istifadə edə bilərsiniz (filialdan asılı olaraq həftədə 4–20 saat).</p>
<p>🔔 Əsas dərslər <strong>həftədə 2 dəfə, 90 dəqiqə</strong> tədris olunur. Bütün səviyyələr beynəlxalq <strong>CEFR</strong> (A1–C2) standartına uyğun aparılır, dərsliklər PDF formasında ödənişsiz verilir.</p>`,
    `<p>📚 <strong>British Academy</strong>, with 11 years of experience and 4 branches, operates as an <strong>official TOEIC and TOEFL test centre</strong> in Azerbaijan. Our students earn an internationally recognised English certificate valid worldwide.</p>
<p>📣 Alongside your classes you can join <strong>Workshops</strong>, <strong>Movie &amp; Listening Days</strong> and <strong>Speaking Clubs</strong> (4–20 hours a week depending on the branch).</p>
<p>🔔 Core classes run <strong>twice a week for 90 minutes</strong>. All levels follow the international <strong>CEFR</strong> standard (A1–C2), and course books are provided free of charge in PDF format.</p>`,
    `<p>📚 <strong>British Academy</strong> с 11-летним опытом и 4 филиалами работает как <strong>официальный центр экзаменов TOEIC и TOEFL</strong> в Азербайджане. Наши студенты получают международный сертификат по английскому языку, действительный во всём мире.</p>
<p>📣 Вместе с занятиями вы можете посещать <strong>воркшопы</strong>, <strong>Movie &amp; Listening Day</strong> и <strong>разговорные клубы</strong> (4–20 часов в неделю в зависимости от филиала).</p>
<p>🔔 Основные занятия проходят <strong>дважды в неделю по 90 минут</strong>. Все уровни преподаются по международному стандарту <strong>CEFR</strong> (A1–C2), учебники предоставляются бесплатно в формате PDF.</p>`,
  ),
  info: [
    { label: L("Dərs rejimi", "Schedule", "Режим занятий"), value: L("Həftədə 2 dəfə · 90 dəq", "Twice a week · 90 min", "2 раза в неделю · 90 мин") },
    { label: L("Səviyyələr", "Levels", "Уровни"), value: L("CEFR A1–C2", "CEFR A1–C2", "CEFR A1–C2") },
    { label: L("Sertifikat", "Certificate", "Сертификат"), value: L("Rəsmi TOEIC / TOEFL", "Official TOEIC / TOEFL", "Официальный TOEIC / TOEFL") },
    { label: L("Əlavə", "Included", "Дополнительно"), value: L("Workshop, Danışıq Klubu, PDF dərsliklər", "Workshops, Speaking Club, PDF books", "Воркшопы, разговорный клуб, PDF-учебники") },
  ],
  seo: {
    metaTitle: L("İngilis dili kursu — rəsmi TOEIC/TOEFL mərkəzi", "English course — official TOEIC/TOEFL centre", "Курс английского — центр TOEIC/TOEFL"),
    metaDescription: L(
      "British Academy-də ingilis dili kursu: CEFR A1–C2, həftədə 2 dəfə 90 dəqiqə, ödənişsiz danışıq klubu və PDF dərsliklər. Rəsmi TOEIC/TOEFL mərkəzi.",
      "English course at British Academy: CEFR A1–C2, twice a week for 90 minutes, free speaking club and PDF books. Official TOEIC/TOEFL centre.",
      "Курс английского в British Academy: CEFR A1–C2, дважды в неделю по 90 минут, бесплатный разговорный клуб и PDF-учебники. Официальный центр TOEIC/TOEFL.",
    ),
    keywords: L(
      "ingilis dili kursu, TOEIC, TOEFL, ingilis dili Bakı, danışıq klubu, CEFR",
      "English course, TOEIC, TOEFL, English in Baku, speaking club, CEFR",
      "курс английского, TOEIC, TOEFL, английский Баку, разговорный клуб, CEFR",
    ),
  },
  pricing: [
    {
      branch: B.caspian,
      group: { day: 109, evening: 129 },
      individual: { day: 320, evening: 420 },
      note: L(
        "Qrup 3–7 nəfər. Workshop, Movie & Listening Day və Danışıq Klubu həftədə 20 saat. Fərdi: 90 dəq 320 AZN, 60 dəq 215 AZN; 17:00-dan sonra 90 dəq 420 AZN, 60 dəq 280 AZN.",
        "Groups of 3–7. Workshops, Movie & Listening Day and Speaking Club — 20 hours a week. Individual: 90 min 320 AZN, 60 min 215 AZN; after 17:00 — 90 min 420 AZN, 60 min 280 AZN.",
        "Группы 3–7 человек. Воркшопы, Movie & Listening Day и разговорный клуб — 20 часов в неделю. Индивидуально: 90 мин 320 AZN, 60 мин 215 AZN; после 17:00 — 90 мин 420 AZN, 60 мин 280 AZN.",
      ),
    },
    {
      branch: B.nerimanov,
      group: { day: 99, evening: 119 },
      individual: { day: 320, evening: 420 },
      note: L(
        "Qrup 3–7 nəfər. Workshop və Danışıq Klubu həftədə 4 saat; Movie + Listening Day ödənişə daxildir. Fərdi: 2×90 dəq 320 AZN, 2×60 dəq 220 AZN, 3×60 dəq 320 AZN; 17:00-dan sonra 2×90 dəq 420 AZN, 2×60 dəq 280 AZN, 3×60 dəq 420 AZN.",
        "Groups of 3–7. Workshops and Speaking Club — 4 hours a week; Movie + Listening Day is included. Individual: 2×90 min 320 AZN, 2×60 min 220 AZN, 3×60 min 320 AZN; after 17:00 — 2×90 min 420 AZN, 2×60 min 280 AZN, 3×60 min 420 AZN.",
        "Группы 3–7 человек. Воркшопы и разговорный клуб — 4 часа в неделю; Movie + Listening Day включён. Индивидуально: 2×90 мин 320 AZN, 2×60 мин 220 AZN, 3×60 мин 320 AZN; после 17:00 — 2×90 мин 420 AZN, 2×60 мин 280 AZN, 3×60 мин 420 AZN.",
      ),
    },
    {
      branch: B.elmler,
      group: { day: 129, evening: 149 },
      individual: { day: 370, evening: 470 },
      note: L(
        "Qrup 3–6 nəfər. LİMİTSİZ və ödənişsiz Danışıq Klubu, PDF dərsliklər ödənişsizdir. Fərdi: 2×90 dəq 370 AZN (17:00-dan sonra 470 AZN), 2×60 dəq 250 AZN (17:00-dan sonra 315 AZN). Qapalı qrup (2 nəfər): 220 AZN, 17:00-dan sonra 250 AZN.",
        "Groups of 3–6. Unlimited free Speaking Club; PDF course books included. Individual: 2×90 min 370 AZN (after 17:00 — 470 AZN), 2×60 min 250 AZN (after 17:00 — 315 AZN). Closed group of 2: 220 AZN, after 17:00 — 250 AZN.",
        "Группы 3–6 человек. Безлимитный бесплатный разговорный клуб; PDF-учебники включены. Индивидуально: 2×90 мин 370 AZN (после 17:00 — 470 AZN), 2×60 мин 250 AZN (после 17:00 — 315 AZN). Закрытая группа на 2 человека: 220 AZN, после 17:00 — 250 AZN.",
      ),
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// Rus dili
// ─────────────────────────────────────────────────────────────
const russian = {
  slug: "rus-dili-kursu",
  lead: L(
    "Sırf danışıq üzərində qurulmuş dərslər — qısa zamanda nitqinizdə irəliləyiş görəcəksiniz.",
    "Lessons built around speaking — you will see progress in your fluency within a short time.",
    "Занятия построены вокруг разговорной практики — вы увидите прогресс в речи за короткое время.",
  ),
  excerpt: L(
    "Danışıq yönümlü rus dili kursu — həftədə 2 dəfə, 90 dəqiqə.",
    "A speaking-focused Russian course — twice a week, 90 minutes.",
    "Курс русского языка с упором на разговорную речь — дважды в неделю по 90 минут.",
  ),
  contentHtml: L(
    `<p>Rus dili dərslərimiz <strong>sırf danışıq üzərində</strong> qurulub — qısa zamanda nitqinizdə irəliləyişi görəcəksiniz.</p>
<p>Dərslər qrup və ya fərdi şəkildə, <strong>həftədə 2 dəfə, 90 dəqiqə</strong> keçirilir. Qruplarımız <strong>3–6 nəfərdən</strong> ibarətdir.</p>
<p>Nərimanov filialında həftədə 2 dəfə nəzəri dərs və həftə sonu danışıq klubu təşkil olunur.</p>`,
    `<p>Our Russian lessons are built <strong>entirely around speaking</strong> — you will see progress in your fluency within a short time.</p>
<p>Classes are held in groups or one-to-one, <strong>twice a week for 90 minutes</strong>. Groups consist of <strong>3–6 people</strong>.</p>
<p>At the Narimanov branch there are two theory classes a week plus a weekend speaking club.</p>`,
    `<p>Наши занятия по русскому языку построены <strong>полностью вокруг разговорной практики</strong> — вы увидите прогресс в речи за короткое время.</p>
<p>Занятия проходят в группе или индивидуально, <strong>дважды в неделю по 90 минут</strong>. Группы состоят из <strong>3–6 человек</strong>.</p>
<p>В филиале Нариманов проводятся два теоретических занятия в неделю и разговорный клуб по выходным.</p>`,
  ),
  info: [
    { label: L("Dərs rejimi", "Schedule", "Режим занятий"), value: L("Həftədə 2 dəfə · 90 dəq", "Twice a week · 90 min", "2 раза в неделю · 90 мин") },
    { label: L("Qrup ölçüsü", "Group size", "Размер группы"), value: L("3–6 nəfər", "3–6 people", "3–6 человек") },
    { label: L("Yanaşma", "Approach", "Подход"), value: L("Danışıq yönümlü", "Speaking-focused", "Упор на разговор") },
  ],
  seo: {
    metaTitle: L("Rus dili kursu — danışıq yönümlü", "Russian course — speaking focused", "Курс русского языка — разговорный"),
    metaDescription: L(
      "British Academy-də danışıq üzərində qurulmuş rus dili kursu. Həftədə 2 dəfə 90 dəqiqə, 3–6 nəfərlik qruplar, qrup və fərdi dərslər.",
      "A speaking-focused Russian course at British Academy. Twice a week for 90 minutes, groups of 3–6, group and individual classes.",
      "Разговорный курс русского языка в British Academy. Дважды в неделю по 90 минут, группы 3–6 человек, групповые и индивидуальные занятия.",
    ),
    keywords: L(
      "rus dili kursu, rus dili Bakı, danışıq kursu, rusca öyrənmək",
      "Russian course, Russian in Baku, speaking course, learn Russian",
      "курс русского языка, русский Баку, разговорный курс, выучить русский",
    ),
  },
  pricing: [
    {
      branch: B.caspian,
      group: { day: 80, evening: 100 },
      individual: { day: 200, evening: 280 },
      note: L(
        "Qrup 3–6 nəfər. Fərdi: 90 dəq 200 AZN, 60 dəq 135 AZN; 17:00-dan sonra 90 dəq 280 AZN, 60 dəq 190 AZN.",
        "Groups of 3–6. Individual: 90 min 200 AZN, 60 min 135 AZN; after 17:00 — 90 min 280 AZN, 60 min 190 AZN.",
        "Группы 3–6 человек. Индивидуально: 90 мин 200 AZN, 60 мин 135 AZN; после 17:00 — 90 мин 280 AZN, 60 мин 190 AZN.",
      ),
    },
    {
      branch: B.nerimanov,
      group: { day: 70, evening: 90 },
      individual: { day: 200, evening: 300 },
      note: L(
        "Həftədə 2 dəfə nəzəri + həftə sonu danışıq klubu. Fərdi: 2×90 dəq 200 AZN, 2×60 dəq 140 AZN, 3×60 dəq 200 AZN; 17:00-dan sonra 2×90 dəq 300 AZN, 2×60 dəq 200 AZN, 3×60 dəq 300 AZN. Qapalı qrup: 130 AZN.",
        "Two theory classes a week plus a weekend speaking club. Individual: 2×90 min 200 AZN, 2×60 min 140 AZN, 3×60 min 200 AZN; after 17:00 — 2×90 min 300 AZN, 2×60 min 200 AZN, 3×60 min 300 AZN. Closed group: 130 AZN.",
        "Два теоретических занятия в неделю плюс разговорный клуб по выходным. Индивидуально: 2×90 мин 200 AZN, 2×60 мин 140 AZN, 3×60 мин 200 AZN; после 17:00 — 2×90 мин 300 AZN, 2×60 мин 200 AZN, 3×60 мин 300 AZN. Закрытая группа: 130 AZN.",
      ),
    },
    {
      branch: B.elmler,
      group: { day: 100, evening: 120 },
      individual: { day: 250, evening: 350 },
      note: L(
        "Qrup 3–6 nəfər. Fərdi: 2×60 dəq 165 AZN (17:00-dan sonra 235 AZN), 2×90 dəq 250 AZN (17:00-dan sonra 350 AZN). Qapalı qrup (2 nəfər): 130 AZN.",
        "Groups of 3–6. Individual: 2×60 min 165 AZN (after 17:00 — 235 AZN), 2×90 min 250 AZN (after 17:00 — 350 AZN). Closed group of 2: 130 AZN.",
        "Группы 3–6 человек. Индивидуально: 2×60 мин 165 AZN (после 17:00 — 235 AZN), 2×90 мин 250 AZN (после 17:00 — 350 AZN). Закрытая группа на 2 человека: 130 AZN.",
      ),
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// IELTS — filial fərqi göstərilməyib, hər 3 filiala eyni qiymət
// ─────────────────────────────────────────────────────────────
const IELTS_NOTE = L(
  "Qrup 3–6, maksimum 7 nəfər. Qoşulmaq üçün minimum Intermediate (B2) səviyyə tələb olunur. Fərdi: 90 dəq 450 AZN, 60 dəq 300 AZN; 17:00-dan sonra 90 dəq 550 AZN, 60 dəq 370 AZN.",
  "Groups of 3–6, maximum 7. A minimum Intermediate (B2) level is required to join. Individual: 90 min 450 AZN, 60 min 300 AZN; after 17:00 — 90 min 550 AZN, 60 min 370 AZN.",
  "Группы 3–6, максимум 7 человек. Для участия требуется минимум уровень Intermediate (B2). Индивидуально: 90 мин 450 AZN, 60 мин 300 AZN; после 17:00 — 90 мин 550 AZN, 60 мин 370 AZN.",
);

const ielts = {
  slug: "ielts",
  lead: L(
    "10 illik təcrübəsi və 8.0 IELTS dərəcəsi olan müəllimlərlə 3 aylıq hazırlıq proqramı.",
    "A 3-month preparation programme with teachers who have 10 years of experience and an IELTS score of 8.0.",
    "3-месячная программа подготовки с преподавателями с 10-летним опытом и баллом IELTS 8.0.",
  ),
  excerpt: L(
    "3 aylıq IELTS hazırlığı — 8.0 bal sahibi müəllimlərlə, əlavə Practice ilə.",
    "3-month IELTS preparation with 8.0-scoring teachers and extra practice sessions.",
    "3-месячная подготовка к IELTS с преподавателями с баллом 8.0 и дополнительной практикой.",
  ),
  contentHtml: L(
    `<p>IELTS dərslərimiz <strong>10 illik iş təcrübəsi və 8.0 IELTS dərəcəsi</strong> olan müəllimlər tərəfindən <strong>3 ay</strong> müddətinə tədris olunur.</p>
<p>🔔 Həftədə <strong>2 dəfə 90 dəqiqə</strong> dərs, dərsdən asılı olaraq <strong>əlavə Practice</strong> sessiyaları keçirilir.</p>
<p>⚠️ IELTS proqramına qoşulmaq üçün minimum <strong>Intermediate (B2)</strong> səviyyə tələb olunur. Qruplarımız 3–6, maksimum 7 nəfərdən ibarətdir.</p>`,
    `<p>Our IELTS classes are taught over <strong>3 months</strong> by teachers with <strong>10 years of experience and an IELTS score of 8.0</strong>.</p>
<p>🔔 Classes run <strong>twice a week for 90 minutes</strong>, with <strong>additional practice</strong> sessions depending on the lesson.</p>
<p>⚠️ A minimum <strong>Intermediate (B2)</strong> level is required to join the IELTS programme. Groups have 3–6 students, maximum 7.</p>`,
    `<p>Наши занятия IELTS проводятся в течение <strong>3 месяцев</strong> преподавателями с <strong>10-летним опытом и баллом IELTS 8.0</strong>.</p>
<p>🔔 Занятия проходят <strong>дважды в неделю по 90 минут</strong>, с <strong>дополнительной практикой</strong> в зависимости от урока.</p>
<p>⚠️ Для участия в программе IELTS требуется минимум уровень <strong>Intermediate (B2)</strong>. Группы 3–6 человек, максимум 7.</p>`,
  ),
  info: [
    { label: L("Müddət", "Duration", "Длительность"), value: L("3 ay", "3 months", "3 месяца") },
    { label: L("Dərs rejimi", "Schedule", "Режим занятий"), value: L("Həftədə 2 dəfə · 90 dəq + Practice", "Twice a week · 90 min + practice", "2 раза в неделю · 90 мин + практика") },
    { label: L("Tələb olunan səviyyə", "Required level", "Требуемый уровень"), value: L("Minimum Intermediate (B2)", "Minimum Intermediate (B2)", "Минимум Intermediate (B2)") },
    { label: L("Müəllim", "Teacher", "Преподаватель"), value: L("IELTS 8.0 · 10 il təcrübə", "IELTS 8.0 · 10 years of experience", "IELTS 8.0 · 10 лет опыта") },
  ],
  seo: {
    metaTitle: L("IELTS hazırlıq kursu — 8.0 bal müəllimlərlə", "IELTS preparation course — 8.0 teachers", "Курс подготовки к IELTS — преподаватели 8.0"),
    metaDescription: L(
      "British Academy-də 3 aylıq IELTS hazırlığı: 8.0 bal sahibi müəllimlər, həftədə 2 dəfə 90 dəqiqə və əlavə Practice. Minimum B2 səviyyə.",
      "3-month IELTS preparation at British Academy: teachers scoring 8.0, twice a week for 90 minutes plus extra practice. Minimum B2 level.",
      "3-месячная подготовка к IELTS в British Academy: преподаватели с баллом 8.0, дважды в неделю по 90 минут плюс практика. Минимум уровень B2.",
    ),
    keywords: L(
      "IELTS hazırlıq, IELTS kursu Bakı, IELTS 7, ingilis dili imtahanı",
      "IELTS preparation, IELTS course Baku, IELTS 7, English exam",
      "подготовка к IELTS, курс IELTS Баку, IELTS 7, экзамен по английскому",
    ),
  },
  pricing: [B.caspian, B.nerimanov, B.elmler].map((branch) => ({
    branch,
    group: { day: 180, evening: 200 },
    individual: { day: 450, evening: 550 },
    note: IELTS_NOTE,
  })),
};

export const COURSE_IMPORT = [msOffice, english, russian, ielts];
