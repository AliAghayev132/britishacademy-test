/**
 * Kurs səhifələrinin məzmun tərcümələri (AZ → EN/RU).
 *
 * `translations.mjs`-dəki ümumi lüğətdən AYRI saxlanılır: kurs mətnləri uzun
 * abzaslardır və say etibarilə qalan hər şeydən çoxdur — bir faylda saxlansaydı
 * qısa etiketləri (menyu, kateqoriya) tapmaq çətinləşərdi.
 *
 * Açar AZ mətnin ÖZÜDÜR — `courseContent.mjs`-dəki sətirlə HƏRFİ olaraq üst-üstə
 * düşməlidir, yoxsa `tri()` onu tapmır və sahə AZ qalır. Mətn dəyişdirilərsə
 * buradakı açar da yenilənməlidir.
 *
 * Üslub:
 *   • EN — Britaniya orfoqrafiyası (programme, centre), rəsmi amma quru deyil.
 *   • RU — Bakıdakı rusdilli auditoriya üçün; kalka deyil, təbii formalar.
 *   • Rəqəmlər, səviyyə adları (A1–C2, CEFR) və brend adları dəyişmir.
 *   • Zəmanət və status iddiaları OLDUĞU KİMİ ötürülür — güclendirilmir.
 */

export const COURSE_T = {
  // ── İngilis dili kursu ──
  "Azərbaycanda Yeganə Beynəlxalq Statuslu İngilis Dili Kursu – British Academy": {
    en: "The Only Internationally Accredited English Course in Azerbaijan – British Academy",
    ru: "Единственные курсы английского языка с международным статусом в Азербайджане – British Academy",
  },
  "Böyük Britaniya mütəxəssislərinin hazırladığı metodika, rəsmi TOEIC imtahan mərkəzi statusu və 2 aya danışıq zəmanəti.": {
    en: "A methodology developed by UK specialists, official TOEIC test centre status, and a speaking guarantee in 2 months.",
    ru: "Методика, разработанная британскими специалистами, статус официального центра TOEIC и гарантия разговорной речи за 2 месяца.",
  },

  // Qısa məlumat kartı
  Müddət: { en: "Duration", ru: "Длительность" },
  "1,5–2 ay / səviyyə": { en: "1.5–2 months per level", ru: "1,5–2 месяца на уровень" },
  Dərs: { en: "Lessons", ru: "Занятия" },
  "Həftədə 2 dəfə · 90 dəq": { en: "Twice a week · 90 min", ru: "2 раза в неделю · 90 мин" },
  Səviyyə: { en: "Level", ru: "Уровень" },
  "A1 – C2 (CEFR)": { en: "A1 – C2 (CEFR)", ru: "A1 – C2 (CEFR)" },
  Qrup: { en: "Group size", ru: "Группа" },
  "3–5, maksimum 6 nəfər": { en: "3–5 students, 6 maximum", ru: "3–5 человек, максимум 6" },

  // Giriş abzasları
  "Azərbaycanda yeganə beynəlxalq statuslu ingilis dili mərkəzi olan British Academy ilə dil sədlərini aradan qaldırın! Peşəkar müəllim heyətimiz və Böyük Britaniyanın yerli mütəxəssisləri tərəfindən hazırlanmış xüsusi dərs metodologiyamızla hədəflərinizə daha sürətli çatacaqsınız.": {
    en: "Break through the language barrier with British Academy — the only internationally accredited English centre in Azerbaijan. With our professional teaching staff and a course methodology developed by specialists in the United Kingdom, you will reach your goals faster.",
    ru: "Преодолейте языковой барьер вместе с British Academy — единственным центром английского языка в Азербайджане с международным статусом. Профессиональный преподавательский состав и методика, разработанная специалистами из Великобритании, помогут вам достичь целей быстрее.",
  },
  "Rəsmi TOEIC imtahan mərkəzi olaraq, tələbələrimizə təkcə dil öyrətmirik, həm də onlara qlobal səviyyədə tanınan beynəlxalq ingilis dili sertifikatı əldə etmək şansı qazandırırıq. Artıq ümumi ingilis dili dərslərimizə qoşulan hər bir tələbəmiz bu beynəlxalq sertifikata sahib ola bilər.": {
    en: "As an official TOEIC test centre, we do more than teach the language — we give our students the opportunity to earn a globally recognised English certificate. Every student enrolled in our general English classes can now obtain this international certificate.",
    ru: "Как официальный центр тестирования TOEIC, мы не только обучаем языку, но и даём студентам возможность получить международно признанный сертификат по английскому. Теперь его может получить каждый, кто занимается на наших курсах общего английского.",
  },

  // Bölmə: metodika
  "4 Dəfə Daha Sürətli və Effektiv Öyrənmə Metodikası": {
    en: "A Method That Is Four Times Faster and More Effective",
    ru: "Методика обучения в 4 раза быстрее и эффективнее",
  },
  "İngilis dili dərslərimiz xüsusi dərsliklər əsasında tədris olunur. Bu metodika sayəsində siz ingilis dilini sadəcə qrammatik olaraq deyil, eyni zamanda real ünsiyyətdə tətbiq edərək öyrənirsiniz. Dinləmə, oxuma, yazma və danışıq olmaqla 4 əsas dil bacarığını paralel inkişaf etdirərək, ənənəvi metodlardan 4 dəfə daha sürətli nəticə əldə edəcəksiniz.": {
    en: "Our English lessons are built around specially selected coursebooks. This method teaches you the language not only as grammar, but through real communication. By developing all four core skills — listening, reading, writing and speaking — in parallel, you reach results four times faster than with traditional methods.",
    ru: "Занятия по английскому строятся на специально подобранных учебниках. Такая методика позволяет осваивать язык не только через грамматику, но и в реальном общении. Развивая параллельно все четыре навыка — аудирование, чтение, письмо и говорение — вы достигаете результата в 4 раза быстрее, чем при традиционных методах.",
  },
  "Bizim Zəmanətimiz: British Academy olaraq, dərslərimizə nizamlı davam edən hər bir tələbəmizin 2 aya danışıq bacarığının (speaking) inkişafına tam zəmanət veririk!": {
    en: "Our guarantee: British Academy fully guarantees that every student who attends regularly will develop their speaking skills within 2 months.",
    ru: "Наша гарантия: British Academy полностью гарантирует, что каждый студент, регулярно посещающий занятия, разовьёт разговорные навыки за 2 месяца.",
  },

  // Bölmə: CEFR
  "Beynəlxalq CEFR Standartları və Kiçik Qruplar": {
    en: "International CEFR Standards and Small Groups",
    ru: "Международные стандарты CEFR и малые группы",
  },
  "Dərslərimiz tamamilə beynəlxalq CEFR (Common European Framework of Reference for Languages) standartlarına uyğun olaraq A1, A2, B1, B2, C1 və C2 səviyyələri üzrə qruplaşdırılır. Effektivliyi qorumaq üçün qruplarımız minimal tərkibdə – 3-5 nəfər, maksimum isə 6 nəfər olmaqla təşkil edilir. Bu da müəllimin hər bir tələbəyə fərdi vaxt ayırmasını təmin edir.": {
    en: "Our classes follow the international CEFR (Common European Framework of Reference for Languages) standards and are grouped by the A1, A2, B1, B2, C1 and C2 levels. To keep lessons effective, groups are kept small — 3 to 5 students, 6 at most — so the teacher can give individual attention to everyone.",
    ru: "Занятия полностью соответствуют международным стандартам CEFR (Common European Framework of Reference for Languages) и делятся по уровням A1, A2, B1, B2, C1 и C2. Чтобы сохранить эффективность, группы небольшие — 3–5 человек, максимум 6, что позволяет преподавателю уделить время каждому.",
  },

  // Bölmə: təhsil paketi
  "Təhsil Paketinizə Daxil Olan Sosial Fəaliyyətlər və Üstünlüklər": {
    en: "Social Activities and Benefits Included in Your Package",
    ru: "Дополнительные занятия и преимущества в составе пакета",
  },
  "Dərslərimizə qoşulan tələbələr yalnız əsas proqramla kifayətlənmir, həm də dil mühitini tam yaşamaq və boşluqları doldurmaq üçün geniş təhsil paketi əldə edirlər. Paketimizə aşağıdakı ödənişsiz fəaliyyətlər daxildir:": {
    en: "Students who join our classes are not limited to the core programme — they receive a broader learning package that immerses them in the language and helps close any gaps. The package includes the following free activities:",
    ru: "Студенты наших курсов не ограничиваются основной программой: они получают расширенный пакет, который погружает в языковую среду и помогает закрыть пробелы. В пакет входят следующие бесплатные активности:",
  },
  "Workshops (Dəstək seminarları)": {
    en: "Workshops (support sessions)",
    ru: "Workshops (дополнительные семинары)",
  },
  "Proqram boyu tam başa düşülməyən və ya zəif qalan mövzuların təkrarı və yenidən öyrənilməsi üçün təşkil olunan xüsusi dəstək dərsləri.": {
    en: "Dedicated support lessons for revisiting and relearning topics that were not fully understood or remained weak during the programme.",
    ru: "Специальные занятия для повторения и повторного разбора тем, которые остались непонятыми или слабыми в ходе программы.",
  },
  "Conversation Days (Danışıq günləri)": {
    en: "Conversation Days",
    ru: "Conversation Days (разговорные дни)",
  },
  "Sərbəst ünsiyyət qurmaq və dil kompleksini qırmaq üçün təşkil olunan xüsusi danışıq klubları.": {
    en: "Dedicated conversation clubs for speaking freely and getting over the fear of making mistakes.",
    ru: "Разговорные клубы, где можно свободно общаться и преодолеть языковой барьер.",
  },
  "Listening Days (Dinləmə günləri)": {
    en: "Listening Days",
    ru: "Listening Days (дни аудирования)",
  },
  "İngilis dilində müxtəlif vurğuları və dialoqları daha yaxşı anlamaq üçün xüsusi dinləmə seansları.": {
    en: "Focused listening sessions for understanding different English accents and everyday dialogue.",
    ru: "Занятия по аудированию для понимания разных акцентов и живой английской речи.",
  },
  "Movie Days (Kino günləri)": {
    en: "Movie Days",
    ru: "Movie Days (кинодни)",
  },
  "Filmləri orijinal dildə izləyərək həm əylənmək, həm də real danışıq ifadələrini öyrənmək imkanı.": {
    en: "Watch films in the original language — enjoy yourself while picking up real conversational phrases.",
    ru: "Просмотр фильмов в оригинале: и удовольствие, и живые разговорные выражения.",
  },
  "Ödənişsiz PDF Vəsaitlər": {
    en: "Free PDF materials",
    ru: "Бесплатные PDF-материалы",
  },
  "Kurs müddətində keçiriləcək proqramın online PDF materialları tələbələrimizə tamamilə ödənişsiz olaraq verilir. (Qeyd: Fiziki dərslik kitabları isə ödənişlidir).": {
    en: "The online PDF materials for the whole programme are provided to our students free of charge. (Note: printed coursebooks are paid separately.)",
    ru: "Электронные PDF-материалы по всей программе предоставляются студентам бесплатно. (Печатные учебники оплачиваются отдельно.)",
  },
  "Dərs qrafiki: Əsas dərslərimiz həftədə 2 dəfə, hər dərs 90 dəqiqə olmaqla keçirilir.": {
    en: "Timetable: core lessons run twice a week, 90 minutes each.",
    ru: "Расписание: основные занятия проходят 2 раза в неделю по 90 минут.",
  },

  // FAQ
  "Dərslər hansı qrafiklə və neçə nəfərlik qruplarda keçirilir?": {
    en: "What is the timetable and how many students are in a group?",
    ru: "Каково расписание и сколько человек в группе?",
  },
  "Əsas dərslərimiz həftədə 2 dəfə, hər dərs 90 dəqiqə olmaqla tədris olunur. Qruplarımız fərdi yanaşmanı təmin etmək məqsədilə olduqca kiçik tutumludur: minimum 3-5, maksimum isə 6 nəfərdən ibarət olur.": {
    en: "Core lessons run twice a week, 90 minutes each. Groups are deliberately small so every student gets individual attention: 3 to 5 students, 6 at most.",
    ru: "Основные занятия проходят 2 раза в неделю по 90 минут. Группы намеренно небольшие, чтобы обеспечить индивидуальный подход: от 3–5 до 6 человек.",
  },
  "2 aya danışıq zəmanəti nə deməkdir?": {
    en: "What does the 2-month speaking guarantee mean?",
    ru: "Что означает гарантия разговорной речи за 2 месяца?",
  },
  "Böyük Britaniya mütəxəssislərinin hazırladığı xüsusi metodika sayəsində dərslərdə aktiv danışıq mühiti yaradılır. Dərslərə və tapşırıqlara məsuliyyətlə yanaşan hər bir tələbənin 2 ay ərzində ingilis dilində sərbəst ünsiyyət quracağına və danışığının gözəl şəkildə inkişaf edəcəyinə zəmanət veririk.": {
    en: "The methodology developed by UK specialists creates an active speaking environment in every lesson. We guarantee that any student who takes the lessons and homework seriously will be communicating freely in English and will see their speaking improve markedly within 2 months.",
    ru: "Методика, разработанная британскими специалистами, создаёт на занятиях активную разговорную среду. Мы гарантируем, что каждый студент, ответственно относящийся к занятиям и домашним заданиям, за 2 месяца начнёт свободно общаться на английском и заметно улучшит разговорную речь.",
  },
  "Kurs zamanı hər hansı bir mövzu mənə qaranlıq qalsa, əlavə dəstək göstərilirmi?": {
    en: "If a topic stays unclear during the course, is extra support available?",
    ru: "Если какая-то тема останется непонятной, будет ли дополнительная поддержка?",
  },
  "Bəli! Təhsil paketimizə daxil olan Workshop-lar məhz bu məqsədlə təşkil edilir. Keçilən dərslərdə tam başa düşmədiyiniz, çətinlik çəkdiyiniz və ya zəif qaldığınız mövzuları bu seminarlarda müəllimlərimizlə birlikdə yenidən öyrənib möhkəmləndirə bilərsiniz.": {
    en: "Yes. The Workshops included in your package exist for exactly this. In these sessions you can go back over any topic you found difficult or did not fully grasp and work through it again with our teachers.",
    ru: "Да. Workshops, входящие в пакет, созданы именно для этого. На этих занятиях вы вместе с преподавателями заново разбираете и закрепляете темы, которые оказались сложными или остались непонятыми.",
  },
  "Dərs materialları və kitablar ödənişlidir?": {
    en: "Are the course materials and books paid separately?",
    ru: "Учебные материалы и книги платные?",
  },
  "Kursumuzda tədris proqramının online PDF materialları tələbələrə tamamilə ödənişsiz olaraq təqdim edilir. Lakin dərsləri fiziki kitab üzərindən izləmək istəyənlər üçün dərsliklər ödənişlidir.": {
    en: "The online PDF materials for the programme are provided completely free of charge. Printed coursebooks, for students who prefer to work from a physical book, are paid separately.",
    ru: "Электронные PDF-материалы программы предоставляются полностью бесплатно. Печатные учебники — для тех, кто предпочитает заниматься по бумажной книге — оплачиваются отдельно.",
  },
  "Təhsil paketinə əsas dərslərdən əlavə hansı fəaliyyətlər daxildir?": {
    en: "What is included in the package besides the core lessons?",
    ru: "Что входит в пакет помимо основных занятий?",
  },
  "Tələbələrimizin dil bacarıqlarını hərtərəfli inkişaf etdirmək üçün təhsil paketinə əsas dərslərlə yanaşı ödənişsiz olaraq Workshop (mövzu təkrarı dərsləri), Conversation Days, Listening Days və Movie Days daxildir.": {
    en: "To develop every language skill, the package includes — free of charge, alongside the core lessons — Workshops (topic revision sessions), Conversation Days, Listening Days and Movie Days.",
    ru: "Для всестороннего развития языковых навыков в пакет бесплатно входят Workshops (занятия по повторению тем), Conversation Days, Listening Days и Movie Days.",
  },

  // ── Biznes İngilis dili kursu ──
  "Biznes İngilis Dili Kursları": {
    en: "Business English Courses",
    ru: "Курсы делового английского языка",
  },
  "İşgüzar yazışma, təqdimat və danışıqlar üçün peşəkar ingilis dili — Cambridge BEC hazırlığı daxil.": {
    en: "Professional English for business correspondence, presentations and negotiations — Cambridge BEC preparation included.",
    ru: "Профессиональный английский для деловой переписки, презентаций и переговоров — с подготовкой к Cambridge BEC.",
  },
  Format: { en: "Format", ru: "Формат" },
  "Qrup (3–6 nəfər) / Fərdi": {
    en: "Group (3–6 students) / One-to-one",
    ru: "Группа (3–6 человек) / Индивидуально",
  },
  "British Academy-də Biznes İngilis dili kursları iş mühitində peşəkar ünsiyyət qurmaq istəyən şəxslər üçün hazırlanmışdır. Tədris proqramı beynəlxalq biznes mühitində istifadə olunan ingilis dili bacarıqlarının inkişafına yönəlib. Kurs zamanı işgüzar yazışmalar, təqdimatlar, görüşlər, danışıqlar və peşəkar ünsiyyət üçün lazım olan dil bilikləri praktik şəkildə öyrədilir.": {
    en: "Business English courses at British Academy are designed for people who need to communicate professionally at work. The programme focuses on the English used in an international business environment. Throughout the course you practise the language needed for business correspondence, presentations, meetings, negotiations and professional communication.",
    ru: "Курсы делового английского в British Academy рассчитаны на тех, кому нужно профессионально общаться в рабочей среде. Программа сосредоточена на английском, который используется в международном бизнесе. В ходе курса вы на практике осваиваете язык деловой переписки, презентаций, встреч, переговоров и профессионального общения.",
  },
  "Niyə British Academy Biznes İngilis Dili Kursunu Seçməlisiniz?": {
    en: "Why Choose the British Academy Business English Course?",
    ru: "Почему стоит выбрать курс делового английского в British Academy?",
  },
  "İşgüzar ingilis dili üzrə xüsusi proqram": {
    en: "A dedicated business English programme",
    ru: "Специальная программа по деловому английскому",
  },
  "Peşəkar və təcrübəli müəllim heyəti": {
    en: "Professional and experienced teaching staff",
    ru: "Профессиональный и опытный преподавательский состав",
  },
  "Danışıq və praktika yönümlü interaktiv dərslər": {
    en: "Interactive lessons focused on speaking and practice",
    ru: "Интерактивные занятия с упором на речь и практику",
  },
  "İşgüzar yazışma və təqdimat bacarıqlarının inkişafı": {
    en: "Development of business writing and presentation skills",
    ru: "Развитие навыков деловой переписки и презентаций",
  },
  "Qrammatika və peşəkar terminologiyanın təkmilləşdirilməsi": {
    en: "Refinement of grammar and professional terminology",
    ru: "Совершенствование грамматики и профессиональной терминологии",
  },
  "Söz ehtiyatının genişləndirilməsi": {
    en: "Vocabulary expansion",
    ru: "Расширение словарного запаса",
  },
  "Fərdi və qrup dərsləri": {
    en: "One-to-one and group lessons",
    ru: "Индивидуальные и групповые занятия",
  },
  "Kurs Kimlər Üçün Uyğundur?": {
    en: "Who Is This Course For?",
    ru: "Кому подходит этот курс?",
  },
  "Biznes İngilis dili kursu aşağıdakılar üçün uyğundur:": {
    en: "The Business English course is suitable for:",
    ru: "Курс делового английского подходит для:",
  },
  "Şirkətlərdə və təşkilatlarda çalışan əməkdaşlar": {
    en: "Employees of companies and organisations",
    ru: "сотрудников компаний и организаций",
  },
  "Menecerlər və rəhbər vəzifədə çalışan şəxslər": {
    en: "Managers and people in leadership roles",
    ru: "менеджеров и руководителей",
  },
  "Beynəlxalq şirkətlərdə işləmək istəyən namizədlər": {
    en: "Candidates aiming to work in international companies",
    ru: "кандидатов, желающих работать в международных компаниях",
  },
  "Xarici tərəfdaşlarla işləyən mütəxəssislər": {
    en: "Specialists who work with foreign partners",
    ru: "специалистов, работающих с зарубежными партнёрами",
  },
  "İngilis dilində peşəkar ünsiyyət bacarıqlarını inkişaf etdirmək istəyən hər kəs": {
    en: "Anyone who wants to develop professional communication skills in English",
    ru: "всех, кто хочет развить навыки профессионального общения на английском",
  },
  "Cambridge Business English Certificate (BEC) imtahanına hazırlaşan namizədlər": {
    en: "Candidates preparing for the Cambridge Business English Certificate (BEC)",
    ru: "кандидатов, готовящихся к экзамену Cambridge Business English Certificate (BEC)",
  },
  "Kursun Müddəti və Dərs Cədvəli": {
    en: "Course Duration and Timetable",
    ru: "Длительность курса и расписание",
  },
  "Hər səviyyə orta hesabla 1,5–2 ay davam edir.": {
    en: "Each level takes 1.5–2 months on average.",
    ru: "Каждый уровень занимает в среднем 1,5–2 месяца.",
  },
  "Tələbənin inkişaf tempindən asılı olaraq bəzi hallarda bir səviyyənin müddəti 3 aya qədər uzana bilər.": {
    en: "Depending on the student's pace of progress, a level may in some cases take up to 3 months.",
    ru: "В зависимости от темпа продвижения студента уровень в отдельных случаях может занять до 3 месяцев.",
  },
  "Hər dərs 90 dəqiqə davam edir.": {
    en: "Each lesson lasts 90 minutes.",
    ru: "Каждое занятие длится 90 минут.",
  },
  "Dərs günləri və saatları tələbələrin uyğunluğuna əsasən müəyyən edilir.": {
    en: "Days and times are arranged to suit the students.",
    ru: "Дни и время занятий подбираются с учётом удобства студентов.",
  },
  "Fərdi və qrup dərsləri mövcuddur.": {
    en: "Both one-to-one and group lessons are available.",
    ru: "Доступны индивидуальные и групповые занятия.",
  },
  "Qeyd: Saat 17:00-dan sonra keçirilən dərslər üçün əlavə ödəniş tətbiq olunur: qrup dərsləri – 10 AZN, fərdi dərslər – 20 AZN.": {
    en: "Note: lessons held after 17:00 carry a surcharge — 10 AZN for group lessons and 20 AZN for one-to-one lessons.",
    ru: "Примечание: за занятия после 17:00 взимается доплата — 10 AZN за групповые и 20 AZN за индивидуальные.",
  },
  "Biznes İngilis dili kursu kimlər üçün uyğundur?": {
    en: "Who is the Business English course for?",
    ru: "Кому подходит курс делового английского?",
  },
  "Bu kurs iş mühitində ingilis dilindən istifadə edən və ya istifadə etməyi planlaşdıran şəxslər, şirkət əməkdaşları, rəhbərlər, tələbələr və Cambridge BEC imtahanına hazırlaşan namizədlər üçün uyğundur.": {
    en: "The course suits anyone who uses English at work or plans to: company employees, managers, students, and candidates preparing for the Cambridge BEC exam.",
    ru: "Курс подходит всем, кто использует английский в работе или планирует это делать: сотрудникам компаний, руководителям, студентам и кандидатам, готовящимся к экзамену Cambridge BEC.",
  },
  "Bir səviyyə nə qədər davam edir?": {
    en: "How long does one level take?",
    ru: "Сколько длится один уровень?",
  },
  "Hər səviyyə orta hesabla 1,5–2 ay davam edir. Tələbənin inkişaf tempindən asılı olaraq bu müddət bəzi hallarda 3 aya qədər uzana bilər.": {
    en: "Each level takes 1.5–2 months on average. Depending on the student's pace, this may extend to 3 months in some cases.",
    ru: "Каждый уровень занимает в среднем 1,5–2 месяца. В зависимости от темпа студента срок может увеличиться до 3 месяцев.",
  },
  "Dərslər neçə dəqiqə davam edir?": {
    en: "How long is each lesson?",
    ru: "Сколько длится занятие?",
  },
  "Hər dərs 90 dəqiqə davam edir. Dərs cədvəli tələbələrin uyğunluğuna əsasən hazırlanır.": {
    en: "Each lesson lasts 90 minutes. The timetable is arranged to suit the students.",
    ru: "Каждое занятие длится 90 минут. Расписание составляется с учётом удобства студентов.",
  },
  "Biznes İngilis dili kursunun sonunda sertifikat verilirmi?": {
    en: "Is a certificate awarded at the end of the Business English course?",
    ru: "Выдаётся ли сертификат по окончании курса делового английского?",
  },
  "Bəli. Sertifikat yalnız kursun sonunda keçirilən imtahanda uğur qazanan tələbələrə təqdim olunur.": {
    en: "Yes. The certificate is awarded only to students who pass the exam held at the end of the course.",
    ru: "Да. Сертификат вручается только студентам, успешно сдавшим экзамен в конце курса.",
  },
  "Axşam saatlarında dərslər üçün əlavə ödəniş varmı?": {
    en: "Is there a surcharge for evening lessons?",
    ru: "Есть ли доплата за вечерние занятия?",
  },
  "Bəli. 17:00-dan sonra keçirilən qrup dərsləri üçün 10 AZN, fərdi dərslər üçün isə 20 AZN əlavə ödəniş tətbiq edilir.": {
    en: "Yes. Group lessons after 17:00 carry a 10 AZN surcharge, and one-to-one lessons 20 AZN.",
    ru: "Да. За групповые занятия после 17:00 доплата 10 AZN, за индивидуальные — 20 AZN.",
  },
  "Saat 17:00-dan sonrakı dərslər üçün əlavə ödəniş: qrup 10 AZN, fərdi 20 AZN.": {
    en: "Surcharge for lessons after 17:00: 10 AZN for group, 20 AZN for one-to-one.",
    ru: "Доплата за занятия после 17:00: группа — 10 AZN, индивидуально — 20 AZN.",
  },

  // ── Alman dili kursu ──
  "Alman Dili Kursları": {
    en: "German Language Courses",
    ru: "Курсы немецкого языка",
  },
  "CEFR standartlarına uyğun proqram, danışıq yönümlü dərslər — yalnız Caspian Plaza filialında.": {
    en: "A CEFR-aligned programme with speaking-focused lessons — available only at the Caspian Plaza branch.",
    ru: "Программа по стандартам CEFR и занятия с упором на речь — только в филиале Caspian Plaza.",
  },
  Filial: { en: "Branch", ru: "Филиал" },
  "Caspian Plaza": { en: "Caspian Plaza", ru: "Caspian Plaza" },
  "British Academy-də Alman dili kursları beynəlxalq CEFR standartlarına uyğun proqram əsasında tədris olunur. Dərslər danışıq, dinləmə, oxu, yazı və qrammatika bacarıqlarının paralel inkişafına yönəlib. Proqram tələbənin mövcud bilik səviyyəsi, məqsədi və öyrənmə tempinə uyğun şəkildə hazırlanır. İstər alman dilini sıfırdan öyrənmək, istərsə də biliklərinizi inkişaf etdirmək istəyirsinizsə, sizin üçün uyğun proqram mövcuddur.": {
    en: "German courses at British Academy follow a programme aligned with the international CEFR standards. Lessons develop speaking, listening, reading, writing and grammar in parallel. The programme is built around each student's current level, goals and pace of learning. Whether you are starting German from scratch or building on what you already know, there is a suitable programme for you.",
    ru: "Курсы немецкого языка в British Academy построены на программе, соответствующей международным стандартам CEFR. Занятия развивают речь, аудирование, чтение, письмо и грамматику параллельно. Программа составляется с учётом текущего уровня, целей и темпа обучения студента. Начинаете ли вы немецкий с нуля или развиваете имеющиеся знания — подходящая программа найдётся.",
  },
  "Niyə British Academy Alman Dili Kursunu Seçməlisiniz?": {
    en: "Why Choose the British Academy German Course?",
    ru: "Почему стоит выбрать курс немецкого в British Academy?",
  },
  "CEFR standartlarına uyğun tədris proqramı": {
    en: "A curriculum aligned with CEFR standards",
    ru: "Учебная программа по стандартам CEFR",
  },
  "Müasir metodika və beynəlxalq dərs vəsaitləri": {
    en: "Modern methodology and international coursebooks",
    ru: "Современная методика и международные учебные пособия",
  },
  "Danışıq yönümlü interaktiv dərslər": {
    en: "Interactive, speaking-focused lessons",
    ru: "Интерактивные занятия с упором на разговорную речь",
  },
  "Qrammatikanın praktik şəkildə öyrədilməsi": {
    en: "Grammar taught through practice",
    ru: "Грамматика через практику",
  },
  "Oxu, yazı, dinləmə və danışıq bacarıqlarının kompleks inkişafı": {
    en: "Comprehensive development of reading, writing, listening and speaking",
    ru: "Комплексное развитие чтения, письма, аудирования и речи",
  },
  "Alman Dili Kursu Hansı Filialda Tədris Olunur?": {
    en: "Which Branch Runs the German Course?",
    ru: "В каком филиале проходят курсы немецкого?",
  },
  "Alman dili kursları yalnız British Academy-nin Caspian Plaza filialında keçirilir. Alman dili üzrə qeydiyyat və dərslər hazırda yalnız bu filialda təşkil olunur.": {
    en: "German courses run only at the British Academy Caspian Plaza branch. Enrolment and lessons for German are currently held at this branch only.",
    ru: "Курсы немецкого проходят только в филиале British Academy Caspian Plaza. Запись и занятия по немецкому языку в настоящее время организованы только там.",
  },
  "Tələbənin öyrənmə tempindən asılı olaraq bəzi hallarda bir səviyyənin müddəti 3 aya qədər uzana bilər.": {
    en: "Depending on the student's pace of learning, a level may in some cases take up to 3 months.",
    ru: "В зависимости от темпа обучения студента уровень в отдельных случаях может занять до 3 месяцев.",
  },
  "Yeni qruplar mütəmadi olaraq formalaşdırılır.": {
    en: "New groups are formed on a regular basis.",
    ru: "Новые группы формируются регулярно.",
  },
  "Kursu Bitirdikdən Sonra": {
    en: "After Completing the Course",
    ru: "После окончания курса",
  },
  "Kurs müddətində tələbələr:": {
    en: "During the course, students:",
    ru: "В течение курса студенты:",
  },
  "Alman dilində sərbəst ünsiyyət bacarıqlarını inkişaf etdirirlər.": {
    en: "develop the ability to communicate freely in German;",
    ru: "развивают навыки свободного общения на немецком языке;",
  },
  "Oxu, yazı, dinləmə və danışıq bacarıqlarını təkmilləşdirirlər.": {
    en: "improve their reading, writing, listening and speaking skills;",
    ru: "совершенствуют чтение, письмо, аудирование и разговорную речь;",
  },
  "Gündəlik, akademik və peşəkar mühitdə alman dilindən rahat istifadə edə bilirlər.": {
    en: "become comfortable using German in everyday, academic and professional settings.",
    ru: "начинают уверенно пользоваться немецким в повседневной, академической и профессиональной среде.",
  },
  "Sertifikat yalnız kursun sonunda keçirilən imtahanda uğur qazanan tələbələrə təqdim olunur.": {
    en: "The certificate is awarded only to students who pass the exam held at the end of the course.",
    ru: "Сертификат вручается только студентам, успешно сдавшим экзамен в конце курса.",
  },
  "Alman dili kursu kimlər üçün uyğundur?": {
    en: "Who is the German course for?",
    ru: "Кому подходит курс немецкого языка?",
  },
  "Alman dilini sıfırdan öyrənmək, mövcud biliklərini inkişaf etdirmək, Almaniyada təhsil almaq, işləmək və ya gündəlik ünsiyyət bacarıqlarını artırmaq istəyən hər kəs üçün uyğundur.": {
    en: "It suits anyone who wants to learn German from scratch, build on existing knowledge, study or work in Germany, or improve their everyday communication skills.",
    ru: "Подходит всем, кто хочет выучить немецкий с нуля, развить имеющиеся знания, учиться или работать в Германии либо улучшить навыки повседневного общения.",
  },
  "Alman dili kursunun müddəti nə qədərdir?": {
    en: "How long is the German course?",
    ru: "Сколько длится курс немецкого языка?",
  },
  "Hər dərs 90 dəqiqə davam edir. Dərs günləri və saatları tələbələrin uyğunluğuna əsasən müəyyən edilir.": {
    en: "Each lesson lasts 90 minutes. Days and times are arranged to suit the students.",
    ru: "Каждое занятие длится 90 минут. Дни и время подбираются с учётом удобства студентов.",
  },
  "Alman dili kursunun sonunda sertifikat verilirmi?": {
    en: "Is a certificate awarded at the end of the German course?",
    ru: "Выдаётся ли сертификат по окончании курса немецкого?",
  },
  "Alman dili kursu hansı filialda keçirilir?": {
    en: "Which branch runs the German course?",
    ru: "В каком филиале проходит курс немецкого?",
  },
  "Alman dili kursları yalnız British Academy Caspian Plaza filialında tədris olunur. Bu filialda qeydiyyatdan keçərək səviyyənizə uyğun qrupa qoşula bilərsiniz.": {
    en: "German courses are taught only at the British Academy Caspian Plaza branch. You can enrol there and join a group matching your level.",
    ru: "Курсы немецкого проводятся только в филиале British Academy Caspian Plaza. Записавшись там, вы сможете присоединиться к группе своего уровня.",
  },
  "Alman dili kursu yalnız Caspian Plaza filialında tədris olunur.": {
    en: "The German course is taught only at the Caspian Plaza branch.",
    ru: "Курс немецкого языка проводится только в филиале Caspian Plaza.",
  },

  // ── Rus dili kursu ──
  "Rus Dili Kursları": {
    en: "Russian Language Courses",
    ru: "Курсы русского языка",
  },
  "Danışıq yönümlü interaktiv dərslər, CEFR standartına uyğun 6 səviyyəli proqram və peşəkar müəllimlər.": {
    en: "Interactive, speaking-focused lessons, a six-level CEFR-aligned programme and professional teachers.",
    ru: "Интерактивные занятия с упором на речь, шестиуровневая программа по стандарту CEFR и профессиональные преподаватели.",
  },
  "British Academy-də Rus dili kursları müasir tədris metodikası, peşəkar müəllimlər və beynəlxalq standartlara uyğun hazırlanmış proqram əsasında keçirilir. Dərslər danışıq, dinləmə, oxu, yazı və qrammatika bacarıqlarının kompleks şəkildə inkişaf etdirilməsinə yönəlib. İstər rus dilini sıfırdan öyrənmək, istərsə də mövcud biliklərinizi təkmilləşdirmək istəyirsinizsə, səviyyənizə uyğun proqram təqdim olunur.": {
    en: "Russian courses at British Academy are built on a modern teaching methodology, professional teachers and a programme designed to international standards. Lessons develop speaking, listening, reading, writing and grammar together. Whether you are learning Russian from scratch or refining what you already know, there is a programme to match your level.",
    ru: "Курсы русского языка в British Academy построены на современной методике преподавания, работе профессиональных преподавателей и программе, разработанной по международным стандартам. Занятия комплексно развивают речь, аудирование, чтение, письмо и грамматику. Изучаете ли вы русский с нуля или совершенствуете имеющиеся знания — программа подбирается под ваш уровень.",
  },
  "Niyə British Academy Rus Dili Kursunu Seçməlisiniz?": {
    en: "Why Choose the British Academy Russian Course?",
    ru: "Почему стоит выбрать курс русского языка в British Academy?",
  },
  "Peşəkar və təcrübəli müəllimlər": {
    en: "Professional and experienced teachers",
    ru: "Профессиональные и опытные преподаватели",
  },
  "Müasir və beynəlxalq standartlara uyğun dərs vəsaitləri": {
    en: "Modern coursebooks meeting international standards",
    ru: "Современные учебные пособия международного стандарта",
  },
  "Qrammatikanın sadə və praktik şəkildə izahı": {
    en: "Grammar explained simply and practically",
    ru: "Простое и практичное объяснение грамматики",
  },
  "Gündəlik danışıq üçün söz ehtiyatının inkişafı": {
    en: "Vocabulary building for everyday conversation",
    ru: "Развитие словарного запаса для повседневного общения",
  },
  "CEFR standartına uyğun 6 səviyyəli proqram": {
    en: "A six-level programme aligned with the CEFR standard",
    ru: "Шестиуровневая программа по стандарту CEFR",
  },
  "Fərdi və qrup dərsləri seçimləri": {
    en: "One-to-one and group lesson options",
    ru: "Варианты индивидуальных и групповых занятий",
  },
  "Bəzi tələbələrdə inkişaf tempindən asılı olaraq bir səviyyənin müddəti 3 aya qədər uzana bilər.": {
    en: "For some students, depending on their pace of progress, a level may take up to 3 months.",
    ru: "У некоторых студентов, в зависимости от темпа продвижения, уровень может занять до 3 месяцев.",
  },
  "Rus dilində danışıq bacarıqlarını inkişaf etdirirlər;": {
    en: "develop their speaking skills in Russian;",
    ru: "развивают разговорные навыки на русском языке;",
  },
  "Qrammatikanı praktik şəkildə tətbiq etməyi öyrənirlər;": {
    en: "learn to apply grammar in practice;",
    ru: "учатся применять грамматику на практике;",
  },
  "Söz ehtiyatlarını zənginləşdirirlər;": {
    en: "enrich their vocabulary;",
    ru: "обогащают словарный запас;",
  },
  "Gündəlik və peşəkar ünsiyyətdə rus dilindən daha rahat istifadə edirlər.": {
    en: "use Russian more confidently in everyday and professional communication.",
    ru: "увереннее пользуются русским в повседневном и профессиональном общении.",
  },
  "Sertifikat kursun sonunda keçirilən imtahanda uğur qazanan tələbələrə verilir.": {
    en: "The certificate is issued to students who pass the exam held at the end of the course.",
    ru: "Сертификат выдаётся студентам, успешно сдавшим экзамен в конце курса.",
  },
  "Rus dili kursu kimlər üçün uyğundur?": {
    en: "Who is the Russian course for?",
    ru: "Кому подходит курс русского языка?",
  },
  "Rus dilini sıfırdan öyrənmək, danışıq bacarıqlarını inkişaf etdirmək və ya mövcud biliklərini təkmilləşdirmək istəyən hər kəs üçün uyğundur.": {
    en: "It suits anyone who wants to learn Russian from scratch, develop their speaking skills, or refine what they already know.",
    ru: "Подходит всем, кто хочет выучить русский с нуля, развить разговорные навыки или усовершенствовать имеющиеся знания.",
  },
  "Bir səviyyə neçə ay davam edir?": {
    en: "How many months does one level take?",
    ru: "Сколько месяцев занимает один уровень?",
  },
  "Hər dərs 90 dəqiqə davam edir və dərs günləri tələbələrin uyğunluğuna əsasən müəyyən edilir.": {
    en: "Each lesson lasts 90 minutes, and lesson days are arranged to suit the students.",
    ru: "Каждое занятие длится 90 минут, а дни занятий подбираются с учётом удобства студентов.",
  },
  "Rus dili kursunun sonunda sertifikat verilirmi?": {
    en: "Is a certificate awarded at the end of the Russian course?",
    ru: "Выдаётся ли сертификат по окончании курса русского языка?",
  },
  "Bəli. Sertifikat kursun sonunda keçirilən imtahanda uğur qazanan tələbələrə təqdim olunur.": {
    en: "Yes. The certificate is awarded to students who pass the exam held at the end of the course.",
    ru: "Да. Сертификат вручается студентам, успешно сдавшим экзамен в конце курса.",
  },
  "Rus dili kursunda hansı səviyyələr mövcuddur?": {
    en: "Which levels does the Russian course cover?",
    ru: "Какие уровни есть на курсе русского языка?",
  },
  "Kurs CEFR standartına uyğun olaraq A1, A2, B1, B2, C1 və C2 səviyyələrindən ibarətdir. İlkin səviyyə müəyyən edildikdən sonra tələbə uyğun qrupa yerləşdirilir.": {
    en: "In line with the CEFR standard, the course covers the A1, A2, B1, B2, C1 and C2 levels. Once the starting level is determined, the student joins the appropriate group.",
    ru: "В соответствии со стандартом CEFR курс охватывает уровни A1, A2, B1, B2, C1 и C2. После определения начального уровня студента зачисляют в подходящую группу.",
  },

  // ── İspan dili kursu ──
  "İspan Dili Kursları": {
    en: "Spanish Language Courses",
    ru: "Курсы испанского языка",
  },
  "Danışıq yönümlü interaktiv dərslər, bütün səviyyələr üçün proqram və ödənişsiz sınaq dərsi.": {
    en: "Interactive, speaking-focused lessons, a programme for every level and a free trial lesson.",
    ru: "Интерактивные занятия с упором на речь, программа для всех уровней и бесплатное пробное занятие.",
  },
  "British Academy-də İspan dili kursları beynəlxalq standartlara uyğun proqram əsasında tədris olunur. Dərslər danışıq, dinləmə, oxu, yazı və qrammatika bacarıqlarının kompleks şəkildə inkişaf etdirilməsinə yönəlib. Yeni başlayanlardan yüksək səviyyəli tələbələrə qədər hər kəs üçün uyğun proqramlar mövcuddur.": {
    en: "Spanish courses at British Academy follow a programme built to international standards. Lessons develop speaking, listening, reading, writing and grammar together. There are suitable programmes for everyone, from complete beginners to advanced students.",
    ru: "Курсы испанского языка в British Academy построены на программе, отвечающей международным стандартам. Занятия комплексно развивают речь, аудирование, чтение, письмо и грамматику. Подходящие программы есть для всех — от начинающих до продвинутых студентов.",
  },
  "Niyə British Academy İspan Dili Kursunu Seçməlisiniz?": {
    en: "Why Choose the British Academy Spanish Course?",
    ru: "Почему стоит выбрать курс испанского в British Academy?",
  },
  "Müasir və daim yenilənən tədris materialları": {
    en: "Modern, continually updated teaching materials",
    ru: "Современные и постоянно обновляемые учебные материалы",
  },
  "Bütün səviyyələr üçün uyğun proqram": {
    en: "A programme suitable for every level",
    ru: "Программа для всех уровней",
  },
  "Praktik qrammatika və zəngin söz ehtiyatının inkişafı": {
    en: "Practical grammar and rich vocabulary development",
    ru: "Практическая грамматика и развитие богатого словарного запаса",
  },
  "Rahat və effektiv öyrənmə mühiti": {
    en: "A comfortable and effective learning environment",
    ru: "Комфортная и эффективная среда обучения",
  },
  "Tələbənin inkişaf tempindən asılı olaraq bəzi hallarda bir səviyyə 3 aya qədər uzana bilər.": {
    en: "Depending on the student's pace of progress, a level may in some cases take up to 3 months.",
    ru: "В зависимости от темпа продвижения студента уровень в отдельных случаях может занять до 3 месяцев.",
  },
  "Ödənişsiz Sınaq Dərsi": {
    en: "Free Trial Lesson",
    ru: "Бесплатное пробное занятие",
  },
  "İspan dili kursuna başlamazdan əvvəl ödənişsiz sınaq dərsində iştirak edə bilərsiniz. Bu dərs vasitəsilə tədris metodikamız, müəllim heyətimiz və dərs mühiti ilə yaxından tanış olmaq imkanınız olacaq.": {
    en: "Before starting the Spanish course you can attend a free trial lesson. It gives you a close look at our teaching methodology, our teachers and the classroom environment.",
    ru: "Перед началом курса испанского вы можете посетить бесплатное пробное занятие. Оно позволит ближе познакомиться с нашей методикой, преподавателями и атмосферой занятий.",
  },
  "İspan dili kursu kimlər üçün uyğundur?": {
    en: "Who is the Spanish course for?",
    ru: "Кому подходит курс испанского языка?",
  },
  "İspan dilini sıfırdan öyrənmək və ya mövcud biliklərini inkişaf etdirmək istəyən bütün yaş qrupları üçün uyğundur.": {
    en: "It suits all age groups who want to learn Spanish from scratch or build on what they already know.",
    ru: "Подходит для всех возрастных групп, кто хочет выучить испанский с нуля или развить имеющиеся знания.",
  },
  "İspan dili kursunun müddəti nə qədərdir?": {
    en: "How long is the Spanish course?",
    ru: "Сколько длится курс испанского языка?",
  },
  "Hər səviyyə orta hesabla 1,5–2 ay davam edir. Tələbənin inkişaf tempindən asılı olaraq bu müddət 3 aya qədər uzana bilər.": {
    en: "Each level takes 1.5–2 months on average. Depending on the student's pace, it may extend to 3 months.",
    ru: "Каждый уровень занимает в среднем 1,5–2 месяца. В зависимости от темпа студента срок может увеличиться до 3 месяцев.",
  },
  "İspan dili kursunun sonunda sertifikat verilirmi?": {
    en: "Is a certificate awarded at the end of the Spanish course?",
    ru: "Выдаётся ли сертификат по окончании курса испанского?",
  },
  "İspan dili kursuna başlamazdan əvvəl sınaq dərsi mümkündürmü?": {
    en: "Is a trial lesson possible before starting the Spanish course?",
    ru: "Возможно ли пробное занятие перед началом курса испанского?",
  },
  "Bəli. British Academy-də İspan dili kursuna başlamazdan əvvəl ödənişsiz sınaq dərsində iştirak edə bilərsiniz. Bu, kursun tədris metodikası ilə tanış olmaq üçün yaxşı imkandır.": {
    en: "Yes. At British Academy you can attend a free trial lesson before starting the Spanish course — a good way to get to know the teaching methodology.",
    ru: "Да. В British Academy перед началом курса испанского можно посетить бесплатное пробное занятие — хорошая возможность познакомиться с методикой преподавания.",
  },

  // ── İtalyan dili kursu ──
  "İtalyan Dili Kursları": {
    en: "Italian Language Courses",
    ru: "Курсы итальянского языка",
  },
  "İtaliyada təhsil almış müəllimlər, danışıq yönümlü proqram — online və əyani format.": {
    en: "Teachers educated in Italy and a speaking-focused programme — available online and in person.",
    ru: "Преподаватели с образованием, полученным в Италии, и программа с упором на речь — онлайн и очно.",
  },
  "Online / Əyani · Qrup / Fərdi": {
    en: "Online / In person · Group / One-to-one",
    ru: "Онлайн / Очно · Группа / Индивидуально",
  },
  "British Academy-də İtalyan dili kursları beynəlxalq standartlara uyğun proqram əsasında tədris olunur. Dərslər danışıq, dinləmə, oxu, yazı və qrammatika bacarıqlarının paralel inkişafına yönəlib. Tədris prosesi praktik yanaşma ilə təşkil olunur ki, siz yalnız qrammatikanı öyrənməyəsiniz, eyni zamanda italyan dilində sərbəst ünsiyyət qurma bacarığı da əldə edəsiniz.": {
    en: "Italian courses at British Academy follow a programme built to international standards. Lessons develop speaking, listening, reading, writing and grammar in parallel. Teaching is organised around a practical approach, so you do not only study grammar — you also gain the ability to communicate freely in Italian.",
    ru: "Курсы итальянского языка в British Academy построены на программе, отвечающей международным стандартам. Занятия параллельно развивают речь, аудирование, чтение, письмо и грамматику. Обучение выстроено практично: вы не просто изучаете грамматику, но и приобретаете навык свободного общения на итальянском.",
  },
  "Niyə British Academy İtalyan Dili Kursunu Seçməlisiniz?": {
    en: "Why Choose the British Academy Italian Course?",
    ru: "Почему стоит выбрать курс итальянского в British Academy?",
  },
  "İtaliyada təhsil almış peşəkar və təcrübəli müəllimlər": {
    en: "Professional, experienced teachers educated in Italy",
    ru: "Профессиональные и опытные преподаватели с образованием, полученным в Италии",
  },
  "Müasir tədris metodikası və praktik yanaşma": {
    en: "Modern teaching methodology and a practical approach",
    ru: "Современная методика преподавания и практический подход",
  },
  "Online və əyani dərs seçimləri": {
    en: "Online and in-person lesson options",
    ru: "Варианты онлайн- и очных занятий",
  },
  "Online və əyani dərs formatları mövcuddur.": {
    en: "Both online and in-person formats are available.",
    ru: "Доступны онлайн- и очный форматы занятий.",
  },
  "Tədris Formatı": {
    en: "Study Format",
    ru: "Формат обучения",
  },
  "British Academy-də İtalyan dili kurslarına həm əyani, həm də online formatda qoşula bilərsiniz. Dərslər interaktiv şəkildə keçirilir və hər iki formatda eyni tədris keyfiyyəti təmin olunur.": {
    en: "You can join the Italian courses at British Academy either in person or online. Lessons are interactive, and the same teaching quality is maintained in both formats.",
    ru: "К курсам итальянского в British Academy можно присоединиться как очно, так и онлайн. Занятия проходят интерактивно, и качество преподавания одинаково в обоих форматах.",
  },
  "İtalyan dili kursu kimlər üçün uyğundur?": {
    en: "Who is the Italian course for?",
    ru: "Кому подходит курс итальянского языка?",
  },
  "İtalyan dilini sıfırdan öyrənmək, mövcud biliklərini inkişaf etdirmək, təhsil, iş və ya səyahət məqsədilə italyan dilini öyrənmək istəyən hər kəs üçün uyğundur.": {
    en: "It suits anyone who wants to learn Italian from scratch, build on existing knowledge, or study the language for education, work or travel.",
    ru: "Подходит всем, кто хочет выучить итальянский с нуля, развить имеющиеся знания или изучать язык для учёбы, работы либо путешествий.",
  },
  "İtalyan dili kursunun müddəti nə qədərdir?": {
    en: "How long is the Italian course?",
    ru: "Сколько длится курс итальянского языка?",
  },
  "Dərslər online keçirilirmi?": {
    en: "Are lessons held online?",
    ru: "Проводятся ли занятия онлайн?",
  },
  "Bəli. British Academy-də İtalyan dili kursları həm online, həm də əyani formatda təşkil olunur.": {
    en: "Yes. Italian courses at British Academy run both online and in person.",
    ru: "Да. Курсы итальянского в British Academy проводятся как онлайн, так и очно.",
  },
  "İtalyan dili kursunun sonunda sertifikat verilirmi?": {
    en: "Is a certificate awarded at the end of the Italian course?",
    ru: "Выдаётся ли сертификат по окончании курса итальянского?",
  },
  "İtalyan dili kursunda danışıq bacarığı inkişaf etdirilirmi?": {
    en: "Does the Italian course develop speaking skills?",
    ru: "Развивается ли на курсе итальянского разговорная речь?",
  },
  "Bəli. Tədris proqramı danışıq yönümlü olduğu üçün tələbələr qrammatika ilə yanaşı, gündəlik və real həyat vəziyyətlərində italyan dilində sərbəst ünsiyyət qurmaq bacarığı əldə edirlər.": {
    en: "Yes. Because the programme is speaking-focused, students gain not only grammar but also the ability to communicate freely in Italian in everyday, real-life situations.",
    ru: "Да. Программа ориентирована на речь, поэтому студенты осваивают не только грамматику, но и умение свободно общаться на итальянском в повседневных, реальных ситуациях.",
  },

  // ── Danışıq klubları (Conversation Club) ──
  // Klub adları (Speaking Club, Movie Club …) TƏRCÜMƏ OLUNMUR: onlar
  // proqramın öz adlarıdır və hər üç dildə eyni işlədilir.
  "İngilis Dili Danışıq Klubları": {
    en: "English Conversation Clubs",
    ru: "Разговорные клубы английского языка",
  },
  "Həftədə 4 dəfə, 8 fərqli klub formatı — British Academy tələbələri üçün tamamilə ödənişsiz.": {
    en: "Four times a week across eight different club formats — completely free for British Academy students.",
    ru: "4 раза в неделю, 8 разных форматов клубов — для студентов British Academy полностью бесплатно.",
  },
  Tezlik: { en: "Frequency", ru: "Периодичность" },
  "Həftədə 4 dəfə": { en: "Four times a week", ru: "4 раза в неделю" },
  "Bir dəfə": { en: "Single session", ru: "Разовое посещение" },
  "10 AZN": { en: "10 AZN", ru: "10 AZN" },
  Aylıq: { en: "Monthly", ru: "Ежемесячно" },
  "80 AZN": { en: "80 AZN", ru: "80 AZN" },
  "BA tələbəsi": { en: "BA students", ru: "Студенты BA" },
  Ödənişsiz: { en: "Free", ru: "Бесплатно" },
  "British Academy-də İngilis dili danışıq klubları ingilis dilində sərbəst danışıq bacarıqlarını inkişaf etdirmək istəyənlər üçün təşkil olunur. Danışıq klubları interaktiv metodlarla keçirilir və iştirakçılara real ünsiyyət mühitində ingilis dilindən istifadə etmək imkanı yaradır. Diskussiyalar, dialoqlar, oyunlar və müxtəlif praktik fəaliyyətlər sayəsində həm danışıq bacarıqları, həm də ümumi dil bilikləri inkişaf etdirilir.": {
    en: "The English conversation clubs at British Academy are for anyone who wants to develop the ability to speak English freely. The clubs run on interactive methods and give participants the chance to use English in a genuine communicative setting. Through discussions, dialogues, games and various practical activities, both speaking skills and general language knowledge improve.",
    ru: "Разговорные клубы английского языка в British Academy созданы для тех, кто хочет научиться свободно говорить по-английски. Клубы проходят по интерактивным методикам и дают участникам возможность использовать английский в реальной коммуникативной среде. Дискуссии, диалоги, игры и разнообразные практические задания развивают и разговорные навыки, и общий уровень языка.",
  },
  "Danışıq Klublarında Hansı Proqramlar Var?": {
    en: "What Programmes Do the Conversation Clubs Offer?",
    ru: "Какие программы есть в разговорных клубах?",
  },
  "British Academy-də həftə ərzində müxtəlif mövzular üzrə danışıq klubları təşkil olunur:": {
    en: "Throughout the week, British Academy runs conversation clubs on a range of themes:",
    ru: "В течение недели в British Academy проходят разговорные клубы по разным темам:",
  },
  "Speaking Club": { en: "Speaking Club", ru: "Speaking Club" },
  "Business English Club": { en: "Business English Club", ru: "Business English Club" },
  "Game Club": { en: "Game Club", ru: "Game Club" },
  "Vocabulary Club": { en: "Vocabulary Club", ru: "Vocabulary Club" },
  "Reading Club": { en: "Reading Club", ru: "Reading Club" },
  "Listening Club": { en: "Listening Club", ru: "Listening Club" },
  "Movie Club": { en: "Movie Club", ru: "Movie Club" },
  "Make Up Club": { en: "Make Up Club", ru: "Make Up Club" },
  "Dərsdə çətinlik çəkdiyiniz mövzuların təkrarı və Speaking müəllimi ilə əlavə dəstək imkanı.": {
    en: "A chance to revisit topics you found difficult in class and get extra support from a speaking teacher.",
    ru: "Возможность повторить сложные темы с занятий и получить дополнительную поддержку преподавателя по разговорной речи.",
  },
  "Danışıq Klublarının Üstünlükləri": {
    en: "Benefits of the Conversation Clubs",
    ru: "Преимущества разговорных клубов",
  },
  "Həftədə 4 dəfə keçirilir.": {
    en: "Held four times a week.",
    ru: "Проходят 4 раза в неделю.",
  },
  "İnteraktiv və danışıq yönümlü proqram.": {
    en: "An interactive, speaking-focused programme.",
    ru: "Интерактивная программа с упором на речь.",
  },
  "Diskussiyalar, dialoqlar və debatlar.": {
    en: "Discussions, dialogues and debates.",
    ru: "Дискуссии, диалоги и дебаты.",
  },
  "Söz ehtiyatının artırılması.": {
    en: "Vocabulary growth.",
    ru: "Расширение словарного запаса.",
  },
  "Dinləmə və tələffüz bacarıqlarının inkişafı.": {
    en: "Development of listening and pronunciation skills.",
    ru: "Развитие навыков аудирования и произношения.",
  },
  "Praktik ingilis dili mühiti.": {
    en: "A practical English-speaking environment.",
    ru: "Практическая англоязычная среда.",
  },
  "Fərqli mövzular üzrə ünsiyyət bacarıqlarının inkişafı.": {
    en: "Communication skills developed across a range of topics.",
    ru: "Развитие коммуникативных навыков на разные темы.",
  },
  "Danışıq Klubları Kimlər Üçün Uyğundur?": {
    en: "Who Are the Conversation Clubs For?",
    ru: "Кому подходят разговорные клубы?",
  },
  "Danışıq klubları:": { en: "The conversation clubs suit:", ru: "Разговорные клубы подходят:" },
  "İngilis dilində sərbəst danışmaq istəyənlər;": {
    en: "those who want to speak English fluently;",
    ru: "тем, кто хочет свободно говорить по-английски;",
  },
  "Söz ehtiyatını artırmaq istəyənlər;": {
    en: "those who want to build their vocabulary;",
    ru: "тем, кто хочет расширить словарный запас;",
  },
  "Tələffüzünü inkişaf etdirmək istəyənlər;": {
    en: "those who want to improve their pronunciation;",
    ru: "тем, кто хочет улучшить произношение;",
  },
  "Beynəlxalq imtahanlara hazırlaşanlar;": {
    en: "those preparing for international exams;",
    ru: "тем, кто готовится к международным экзаменам;",
  },
  "İş və gündəlik həyat üçün danışıq bacarıqlarını gücləndirmək istəyən hər kəs üçün uyğundur.": {
    en: "and anyone who wants stronger speaking skills for work and everyday life.",
    ru: "и всем, кто хочет укрепить разговорные навыки для работы и повседневной жизни.",
  },
  "İngilis dili danışıq klubları həftədə neçə dəfə keçirilir?": {
    en: "How often are the English conversation clubs held?",
    ru: "Как часто проходят разговорные клубы английского языка?",
  },
  "Danışıq klubları həftədə 4 dəfə təşkil olunur və müxtəlif mövzular üzrə keçirilir.": {
    en: "The conversation clubs are held four times a week and cover a range of topics.",
    ru: "Разговорные клубы проходят 4 раза в неделю и охватывают разные темы.",
  },
  "Danışıq klublarında hansı fəaliyyətlər olur?": {
    en: "What activities take place in the conversation clubs?",
    ru: "Какие активности проходят в разговорных клубах?",
  },
  "Speaking Club, Business English Club, Vocabulary Club, Reading Club, Listening Club, Movie Club, Game Club və Make Up Club çərçivəsində diskussiyalar, dialoqlar, oyunlar və praktik tapşırıqlar keçirilir.": {
    en: "Across Speaking Club, Business English Club, Vocabulary Club, Reading Club, Listening Club, Movie Club, Game Club and Make Up Club there are discussions, dialogues, games and practical tasks.",
    ru: "В рамках Speaking Club, Business English Club, Vocabulary Club, Reading Club, Listening Club, Movie Club, Game Club и Make Up Club проходят дискуссии, диалоги, игры и практические задания.",
  },
  "Danışıq klubunda iştirakın qiyməti nə qədərdir?": {
    en: "How much does it cost to attend a conversation club?",
    ru: "Сколько стоит участие в разговорном клубе?",
  },
  "Bir dəfə iştirak 10 AZN, aylıq iştirak isə 80 AZN təşkil edir.": {
    en: "A single session costs 10 AZN; monthly attendance costs 80 AZN.",
    ru: "Разовое посещение — 10 AZN, месячное — 80 AZN.",
  },
  "British Academy tələbələri danışıq klublarında ödəniş edirlərmi?": {
    en: "Do British Academy students pay for the conversation clubs?",
    ru: "Платят ли студенты British Academy за разговорные клубы?",
  },
  "Xeyr. British Academy tələbələri üçün bütün danışıq klublarında iştirak ödənişsizdir.": {
    en: "No. Attendance at all conversation clubs is free for British Academy students.",
    ru: "Нет. Для студентов British Academy участие во всех разговорных клубах бесплатное.",
  },
  "Danışıq klubuna necə qoşulmaq olar?": {
    en: "How do I join a conversation club?",
    ru: "Как присоединиться к разговорному клубу?",
  },
  "Danışıq klubunda iştirak etmək üçün ən azı 1 gün əvvəl qeydiyyatdan keçmək lazımdır. Bu, qrupların düzgün formalaşdırılması və iştirakçıların rahatlığı üçün vacibdir.": {
    en: "You need to register at least one day in advance. This helps us form the groups properly and keeps the sessions comfortable for everyone.",
    ru: "Записаться нужно минимум за один день. Это позволяет правильно сформировать группы и сделать занятия комфортными для всех.",
  },
  "Danışıq klubunda iştirak etmək üçün ən azı 1 gün əvvəl qeydiyyatdan keçmək mütləqdir.": {
    en: "Registering at least one day in advance is required to attend a conversation club.",
    ru: "Для участия в разговорном клубе обязательна запись минимум за один день.",
  },

  // ── Uşaqlar üçün İngilis dili ──
  "Uşaqlar Üçün İngilis Dili Kursları": {
    en: "English Courses for Children",
    ru: "Курсы английского языка для детей",
  },
  "6 yaş və yuxarı uşaqlar üçün oyun əsaslı, interaktiv və yaşa uyğun proqram.": {
    en: "A game-based, interactive and age-appropriate programme for children aged 6 and over.",
    ru: "Игровая, интерактивная программа для детей от 6 лет, соответствующая возрасту.",
  },
  Yaş: { en: "Age", ru: "Возраст" },
  "6 yaş və yuxarı": { en: "Age 6 and over", ru: "От 6 лет" },
  "British Academy-də uşaqlar üçün İngilis dili kursları 6 yaş və yuxarı uşaqların yaş xüsusiyyətlərinə uyğun hazırlanmış müasir proqram əsasında tədris olunur. Dərslər uşaqların ingilis dilini əylənərək öyrənməsinə, danışıq bacarıqlarını inkişaf etdirməsinə və dili gündəlik həyatda rahat istifadə etməsinə yönəlib. İnteraktiv metodlar, oyunlar və praktik tapşırıqlar sayəsində öyrənmə prosesi həm maraqlı, həm də effektiv olur.": {
    en: "English courses for children at British Academy follow a modern programme designed around the developmental needs of children aged 6 and over. Lessons help children learn English while enjoying themselves, develop their speaking skills and use the language comfortably in everyday life. Interactive methods, games and practical tasks keep the learning process both engaging and effective.",
    ru: "Курсы английского языка для детей в British Academy построены на современной программе, разработанной с учётом возрастных особенностей детей от 6 лет. Занятия помогают ребёнку учить английский с удовольствием, развивать разговорные навыки и свободно пользоваться языком в повседневной жизни. Интерактивные методы, игры и практические задания делают обучение одновременно интересным и результативным.",
  },
  "Niyə British Academy Uşaqlar Üçün İngilis Dili Kursunu Seçməlisiniz?": {
    en: "Why Choose the British Academy English Course for Children?",
    ru: "Почему стоит выбрать детский курс английского в British Academy?",
  },
  "6 yaş və yuxarı uşaqlar üçün xüsusi hazırlanmış proqram": {
    en: "A programme designed specifically for children aged 6 and over",
    ru: "Программа, специально разработанная для детей от 6 лет",
  },
  "Yaşa uyğun interaktiv tədris metodikası": {
    en: "Age-appropriate interactive teaching methodology",
    ru: "Интерактивная методика, соответствующая возрасту",
  },
  "Oyunlar, dialoqlar və praktik fəaliyyətlər": {
    en: "Games, dialogues and practical activities",
    ru: "Игры, диалоги и практические занятия",
  },
  "Danışıq, dinləmə, oxu və yazı bacarıqlarının kompleks inkişafı": {
    en: "Comprehensive development of speaking, listening, reading and writing",
    ru: "Комплексное развитие речи, аудирования, чтения и письма",
  },
  "Müasir tədris materialları": {
    en: "Modern teaching materials",
    ru: "Современные учебные материалы",
  },
  "Dərs günləri və saatları valideynin və uşağın uyğunluğuna əsasən müəyyən edilir.": {
    en: "Lesson days and times are arranged to suit the parent and the child.",
    ru: "Дни и время занятий подбираются с учётом удобства родителя и ребёнка.",
  },
  "Fərdi və qrup formatında dərslər təşkil olunur.": {
    en: "Lessons are offered in both one-to-one and group formats.",
    ru: "Занятия проводятся как индивидуально, так и в группе.",
  },
  "Kursun Üstünlükləri": {
    en: "Benefits of the Course",
    ru: "Преимущества курса",
  },
  "British Academy-də uşaqlar üçün İngilis dili dərsləri yalnız qrammatikanın öyrədilməsi ilə məhdudlaşmır. Tədris proqramı uşaqların ingilis dilində sərbəst ünsiyyət qurmasına, özünəinamla danışmasına və dili gündəlik həyatda tətbiq etməsinə kömək edir. Dərslərdə oyunlar, komanda tapşırıqları, dialoqlar və real həyat mövzuları geniş şəkildə istifadə olunur.": {
    en: "English lessons for children at British Academy go beyond teaching grammar. The programme helps children communicate freely in English, speak with confidence and apply the language in everyday life. Lessons make extensive use of games, team tasks, dialogues and real-life topics.",
    ru: "Детские занятия по английскому в British Academy не сводятся к грамматике. Программа помогает ребёнку свободно общаться на английском, говорить уверенно и применять язык в повседневной жизни. На занятиях широко используются игры, командные задания, диалоги и темы из реальной жизни.",
  },
  "Uşaqlar üçün İngilis dili kursu neçə yaşdan başlayır?": {
    en: "From what age does the children's English course start?",
    ru: "С какого возраста начинается детский курс английского?",
  },
  "Kurslar 6 yaş və yuxarı uşaqlar üçün nəzərdə tutulub. Uşaqlar səviyyələrinə uyğun qruplara yerləşdirilir.": {
    en: "The courses are intended for children aged 6 and over. Children are placed in groups matching their level.",
    ru: "Курсы рассчитаны на детей от 6 лет. Детей распределяют по группам в соответствии с уровнем.",
  },
  "Dərslər fərdi keçirilir, yoxsa qrup şəklində?": {
    en: "Are lessons one-to-one or in groups?",
    ru: "Занятия проходят индивидуально или в группе?",
  },
  "Valideynin seçiminə uyğun olaraq dərslər həm fərdi, həm də qrup formatında keçirilir.": {
    en: "Depending on the parent's preference, lessons are held either one-to-one or in groups.",
    ru: "По выбору родителя занятия проводятся как индивидуально, так и в группе.",
  },
  "Hər səviyyə orta hesabla 1,5–2 ay davam edir. Uşağın inkişaf tempindən asılı olaraq bu müddət bəzi hallarda 3 aya qədər uzana bilər.": {
    en: "Each level takes 1.5–2 months on average. Depending on the child's pace of progress, it may in some cases extend to 3 months.",
    ru: "Каждый уровень занимает в среднем 1,5–2 месяца. В зависимости от темпа развития ребёнка срок в отдельных случаях может увеличиться до 3 месяцев.",
  },
  "Uşaqlar üçün dərslər necə keçirilir?": {
    en: "How are the children's lessons run?",
    ru: "Как проходят занятия для детей?",
  },
  "Dərslər interaktiv metodlarla təşkil olunur. Oyunlar, dialoqlar, praktik tapşırıqlar və real həyat mövzuları vasitəsilə uşaqlar ingilis dilini maraqlı və effektiv şəkildə öyrənirlər.": {
    en: "Lessons are built on interactive methods. Through games, dialogues, practical tasks and real-life topics, children learn English in an engaging and effective way.",
    ru: "Занятия строятся на интерактивных методах. Через игры, диалоги, практические задания и темы из реальной жизни дети осваивают английский интересно и результативно.",
  },
  "Kursun sonunda sertifikat verilirmi?": {
    en: "Is a certificate awarded at the end of the course?",
    ru: "Выдаётся ли сертификат по окончании курса?",
  },
  "Bəli. Sertifikat yalnız kursun sonunda keçirilən imtahanda uğur qazanan şagirdlərə təqdim olunur.": {
    en: "Yes. The certificate is awarded only to pupils who pass the exam held at the end of the course.",
    ru: "Да. Сертификат вручается только ученикам, успешно сдавшим экзамен в конце курса.",
  },

  // ── Statik səhifələr ──
  Haqqımızda: { en: "About us", ru: "О нас" },
  "2014-cü ildən dünya dillərini Azərbaycana öyrədirik": {
    en: "Teaching the world's languages in Azerbaijan since 2014",
    ru: "С 2014 года обучаем языкам мира в Азербайджане",
  },
  "British Academy — “English UK” akkreditasiyasından keçmiş yeganə Azərbaycan şirkəti və rəsmi TOEFL beynəlxalq imtahan mərkəzidir.": {
    en: "British Academy is the only Azerbaijani company accredited by English UK and an official TOEFL international test centre.",
    ru: "British Academy — единственная азербайджанская компания с аккредитацией English UK и официальный международный центр тестирования TOEFL.",
  },
  "Sualların var? Bizimlə əlaqə saxla — komandamız kömək etməyə hazırdır.": {
    en: "Have questions? Get in touch — our team is ready to help.",
    ru: "Есть вопросы? Свяжитесь с нами — наша команда готова помочь.",
  },

  // ── Rəylər ──
  // Ad tərcümə olunmur (şəxs adıdır). Rəy mətni birinci şəxsdə saxlanılır —
  // hər dildə də tələbənin öz dilindən danışdığı kimi səslənməlidir.
  "IELTS Hazırlıq · 7.5 bal": {
    en: "IELTS preparation · Band 7.5",
    ru: "Подготовка к IELTS · 7.5 балла",
  },
  "Biznes İngilis dili": { en: "Business English", ru: "Деловой английский" },
  "İngilis dili · C1": { en: "English · C1", ru: "Английский · C1" },
  "Xaricdə təhsil · Almaniya": {
    en: "Study abroad · Germany",
    ru: "Обучение за рубежом · Германия",
  },
  "İngilis dili · B2": { en: "English · B2", ru: "Английский · B2" },
  "IELTS · 7.0 bal": { en: "IELTS · Band 7.0", ru: "IELTS · 7.0 балла" },
  "Uşaqlar üçün İngilis": { en: "English for children", ru: "Английский для детей" },
  "Alman dili · A2": { en: "German · A2", ru: "Немецкий · A2" },
  "Rus dili kursu": { en: "Russian course", ru: "Курс русского языка" },
  "Sıfırdan başladım, dörd ayda B2 səviyyəsinə çatdım. Ən çox xoşuma gələn danışıq klublarıdır — dərsdə öyrəndiyini elə həmin həftə real söhbətdə işlədirsən.": {
    en: "I started from zero and reached B2 in four months. My favourite part is the conversation clubs — you use what you learned in class in a real conversation the very same week.",
    ru: "Я начинала с нуля и за четыре месяца дошла до уровня B2. Больше всего нравятся разговорные клубы — то, что выучил на занятии, уже на той же неделе используешь в живой беседе.",
  },
  "İkinci cəhdimdə 7.0 aldım. Müəllim hər həftə yazı tapşırıqlarımı ayrıca yoxlayır, səhvlərimi bir-bir izah edirdi.": {
    en: "I got 7.0 on my second attempt. Every week the teacher checked my writing tasks separately and went through my mistakes one by one.",
    ru: "Со второй попытки я получил 7.0. Каждую неделю преподаватель отдельно проверял мои письменные задания и разбирал ошибки одну за другой.",
  },
  "Oğlum 8 yaşındadır, dərsə həvəslə gedir. Oyunlarla keçdikləri üçün onun üçün bu, dərs yox, əyləncədir.": {
    en: "My son is 8 and he goes to his lessons eagerly. Because everything is done through games, for him it is not a lesson but fun.",
    ru: "Моему сыну 8 лет, и он ходит на занятия с удовольствием. Всё проходит через игры, поэтому для него это не урок, а развлечение.",
  },
  "Xarici tərəfdaşlarla görüşlərdə özümü rahat hiss edirəm. Təqdimat hazırlamağı və işgüzar yazışmanı ayrıca öyrətdilər.": {
    en: "I feel comfortable in meetings with foreign partners. They taught presentation skills and business correspondence as separate topics.",
    ru: "На встречах с зарубежными партнёрами я чувствую себя уверенно. Подготовку презентаций и деловую переписку разбирали отдельно.",
  },
  "Almaniyada təhsil üçün hazırlaşıram. Qrup kiçik olduğuna görə müəllim hər kəsə ayrıca vaxt ayıra bilir.": {
    en: "I am preparing to study in Germany. The group is small, so the teacher can give time to each of us individually.",
    ru: "Готовлюсь к учёбе в Германии. Группа небольшая, поэтому преподаватель успевает уделить время каждому.",
  },
  "Uzun illər dili anlayırdım, amma danışa bilmirdim. Buradakı danışıq blokları məni bu kompleksdən qurtardı.": {
    en: "For years I understood the language but could not speak it. The speaking sessions here got me past that block.",
    ru: "Долгие годы я понимала язык, но не могла говорить. Разговорные блоки здесь помогли мне преодолеть этот барьер.",
  },

  // ── Ana səhifə hero ──
  //
  // `titlePrefix` fırlanan sözlə BİRLƏŞİR: «British Academy ilə ingiliscə danış».
  // Ona görə tərcümələr də birləşəndə düzgün oxunmalıdır, ayrılıqda yox:
  //   EN «With British Academy» + «speak English»
  //   RU «С British Academy»    + «заговори по-английски»
  "British Academy ilə": {
    en: "With British Academy",
    ru: "С British Academy",
  },
  "British Academy ilə top universitetlərə qəbul ol.": {
    en: "Get into a top university with British Academy.",
    ru: "Поступи в топовый университет вместе с British Academy.",
  },

  // Fırlanan sözlər — əmr formasında, qısa saxlanılır (ekranda tək sətir).
  "ingiliscə danış": { en: "speak English", ru: "заговори по-английски" },
  "IELTS 8.5 al": { en: "score 8.5 in IELTS", ru: "сдай IELTS на 8.5" },
  "rus dili öyrən": { en: "learn Russian", ru: "выучи русский" },
  "almanca danış": { en: "speak German", ru: "заговори по-немецки" },
  "top universitetlərə qəbul ol": {
    en: "get into a top university",
    ru: "поступи в топовый университет",
  },
  "Duolingo-ya hazırlaş": {
    en: "prepare for Duolingo",
    ru: "подготовься к Duolingo",
  },

  // Statistika
  "məzun tələbə": { en: "graduates", ru: "выпускников" },
  "20 000+": { en: "20,000+", ru: "20 000+" },
  "korporativ tərəfdaş": { en: "corporate partners", ru: "корпоративных партнёров" },
  "30+": { en: "30+", ru: "30+" },
  "filial · Bakı": { en: "branches · Baku", ru: "филиала · Баку" },
  "4": { en: "4", ru: "4" },

  // Hərəkət edən lent — böyük hərflərlə göstərilir, ona görə elə də yazılır.
  "İNGİLİS DİLİ": { en: "ENGLISH", ru: "АНГЛИЙСКИЙ" },
  "IELTS 8.5": { en: "IELTS 8.5", ru: "IELTS 8.5" },
  DUOLINGO: { en: "DUOLINGO", ru: "DUOLINGO" },
  "DANIŞIQ KLUBU": { en: "CONVERSATION CLUB", ru: "РАЗГОВОРНЫЙ КЛУБ" },
  "XARİCDƏ TƏHSİL": { en: "STUDY ABROAD", ru: "ОБУЧЕНИЕ ЗА РУБЕЖОМ" },
  "RUS DİLİ": { en: "RUSSIAN", ru: "РУССКИЙ" },
  "ALMAN DİLİ": { en: "GERMAN", ru: "НЕМЕЦКИЙ" },
  "BİZNES İNGİLİS": { en: "BUSINESS ENGLISH", ru: "ДЕЛОВОЙ АНГЛИЙСКИЙ" },

  // SEO — ana səhifənin defolt təsviri
  "British Academy — English UK akkreditasiyalı dil mərkəzi. İngilis, rus, alman dili kursları, IELTS · TOEFL hazırlığı və xaricdə təhsil.": {
    en: "British Academy — a language centre accredited by English UK. English, Russian and German courses, IELTS and TOEFL preparation, and study abroad.",
    ru: "British Academy — языковой центр с аккредитацией English UK. Курсы английского, русского и немецкого, подготовка к IELTS и TOEFL, обучение за рубежом.",
  },

  // ── Ölkə və filial sahələri ──
  Region: { en: "Region", ru: "Регион" },
  Yasamal: { en: "Yasamal", ru: "Ясамал" },
  // Təqaüd proqramının rəsmi adıdır — hər üç dildə dəyişmir.
  "Stipendium Hungaricum": {
    en: "Stipendium Hungaricum",
    ru: "Stipendium Hungaricum",
  },
};
