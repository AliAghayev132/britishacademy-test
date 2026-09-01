/**
 * Test məzmunu — İngilis və Rus dili səviyyə testləri.
 *
 * Köhnə statik saytda /english-test (ayda 1548 giriş) və /rus-dili-test
 * (468 giriş) ən çox açılan iki səhifə idi. Yeni saytda həmin ünvanlar
 * bu testlərə yönləndirilir, ona görə məzmun boş qala bilməz.
 *
 * SUAL MƏTNİ HƏDƏF DİLDƏDİR və üç dildə də eyni qalır: ingilis dili testində
 * sual ingiliscədir — onu azərbaycancaya çevirmək testin mənasını pozardı.
 * Lokallaşdırılan yalnız SAYT MƏTNİDİR (başlıq, təsvir, səviyyə izahı).
 *
 * Suallar CEFR sırası ilə asandan çətinə düzülüb (A1 → C1). Səviyyə
 * hesablanması faizə görədir, ona görə sual sayı dəyişsə də işləyir.
 *
 * Admin bu sualları paneldən redaktə edə, silə və yenisini əlavə edə bilər —
 * bu fayl yalnız başlanğıc dəstidir.
 */

/** Üç dildə eyni mətn — sual və variantlar üçün (hədəf dil dəyişmir). */
const same = (t) => ({ az: t, en: t, ru: t });

/** Üçdilli mətn. */
const tri = (az, en, ru) => ({ az, en, ru });

/**
 * Sual qısa yazılışı: [mətn, [variantlar], düzgün indeks, izah?]
 * Uzun obyekt yazılışı 40 sual üçün oxunmaz olardı.
 */
const q = (text, options, correctIndex, explanationAz) => ({
  text: same(text),
  options: options.map((o) => ({ text: same(o) })),
  correctIndex,
  explanation: explanationAz ? tri(explanationAz, "", "") : undefined,
});

/** CEFR səviyyələri — faiz aralığına görə. */
const CEFR_LEVELS = [
  {
    minPercent: 0,
    label: "A1",
    title: tri("A1 — Başlanğıc", "A1 — Beginner", "A1 — Начальный"),
    description: tri(
      "Əsas sözləri və sadə cümlələri tanıyırsan. Sıfırdan başlayan qrup sənin üçündür.",
      "You recognise basic words and simple sentences. A beginner group is right for you.",
      "Вы узнаёте базовые слова и простые фразы. Вам подойдёт группа для начинающих.",
    ),
  },
  {
    minPercent: 26,
    label: "A2",
    title: tri("A2 — Elementar", "A2 — Elementary", "A2 — Элементарный"),
    description: tri(
      "Gündəlik mövzularda sadə cümlələr qura bilirsən. Növbəti addım keçmiş zamanlar və danışıq praktikasıdır.",
      "You can build simple sentences on everyday topics. Next come past tenses and speaking practice.",
      "Вы строите простые предложения на бытовые темы. Далее — прошедшие времена и разговорная практика.",
    ),
  },
  {
    minPercent: 41,
    label: "B1",
    title: tri("B1 — Orta", "B1 — Intermediate", "B1 — Средний"),
    description: tri(
      "Tanış mövzularda sərbəst danışırsan. Bu səviyyədən beynəlxalq imtahanlara hazırlıq başlaya bilər.",
      "You speak freely on familiar topics. From here you can start preparing for international exams.",
      "Вы свободно говорите на знакомые темы. С этого уровня можно начинать подготовку к международным экзаменам.",
    ),
  },
  {
    minPercent: 61,
    label: "B2",
    title: tri("B2 — Orta-yuxarı", "B2 — Upper-Intermediate", "B2 — Выше среднего"),
    description: tri(
      "Mürəkkəb mətnləri başa düşür, fikrini əsaslandıra bilirsən. IELTS/TOEFL hazırlığı üçün uyğun səviyyədir.",
      "You understand complex texts and can justify your opinion. A good level to start IELTS/TOEFL preparation.",
      "Вы понимаете сложные тексты и умеете аргументировать. Подходящий уровень для подготовки к IELTS/TOEFL.",
    ),
  },
  {
    minPercent: 81,
    label: "C1",
    title: tri("C1 — Qabaqcıl", "C1 — Advanced", "C1 — Продвинутый"),
    description: tri(
      "Dili sərbəst və dəqiq işlədirsən. Sənə imtahan strategiyası və akademik yazı üzrə fərdi hazırlıq uyğundur.",
      "You use the language fluently and accurately. Exam strategy and academic writing suit you best.",
      "Вы владеете языком свободно и точно. Вам подойдёт экзаменационная стратегия и академическое письмо.",
    ),
  },
];

/* ────────────────────────── İNGİLİS DİLİ ────────────────────────── */

const ENGLISH_QUESTIONS = [
  // A1
  q("___ name is Ali.", ["My", "I", "Me", "Mine"], 0, "Sahiblik sifəti: My name."),
  q("She ___ a teacher.", ["are", "is", "am", "be"], 1, "3-cü şəxs tək — is."),
  q("They ___ to school every day.", ["goes", "going", "go", "gone"], 2, "Present Simple, cəm — go."),
  q("There ___ two books on the table.", ["is", "was", "are", "be"], 2, "Cəm isim — there are."),
  q("What is the opposite of “big”?", ["small", "tall", "long", "wide"], 0),
  q("I ___ coffee every morning.", ["drinks", "drink", "drinking", "drank"], 1),
  // A2
  q("I ___ TV when he called.", ["watched", "was watching", "watch", "have watched"], 1, "Davam edən keçmiş — Past Continuous."),
  q("He has lived here ___ 2015.", ["for", "from", "since", "during"], 2, "Konkret başlanğıc nöqtəsi — since."),
  q("This book is ___ than that one.", ["interesting", "most interesting", "more interesting", "interestinger"], 2),
  q("If it rains, we ___ at home.", ["stay", "stayed", "will stay", "would stay"], 2, "First Conditional."),
  q("I'm looking ___ my keys.", ["at", "for", "after", "on"], 1, "look for — axtarmaq."),
  q("How ___ money do you need?", ["many", "much", "long", "far"], 1, "money sayılmayan isimdir."),
  // B1
  q("I wish I ___ more time.", ["have", "had", "will have", "having"], 1, "wish + Past Simple — indiki arzu."),
  q("The letter ___ yesterday.", ["sent", "was sent", "has sent", "is sending"], 1, "Passive: Past Simple."),
  q("He asked me where I ___.", ["live", "lived", "am living", "will live"], 1, "Dolayı nitqdə zaman geri çəkilir."),
  q("By the time we arrived, the film ___.", ["started", "has started", "had started", "was starting"], 2, "Past Perfect — daha əvvəlki hərəkət."),
  q("She's used to ___ up early.", ["get", "getting", "got", "gets"], 1, "be used to + -ing."),
  q("You ___ smoke here. It's forbidden.", ["mustn't", "don't have to", "needn't", "shouldn't"], 0),
  // B2
  q("___ harder, he would have passed the exam.", ["If he studied", "Had he studied", "Has he studied", "Did he study"], 1, "Third Conditional — inversiya."),
  q("I'd rather you ___ smoke in here.", ["don't", "didn't", "won't", "not"], 1, "would rather + Past Simple."),
  q("Not only ___ late, but he also forgot the tickets.", ["he was", "was he", "he is", "did he"], 1, "Not only ilə inversiya."),
  q("The project, ___ completion is near, has cost millions.", ["which", "that", "whose", "who"], 2),
  q("He denied ___ the money.", ["to take", "taking", "take", "taken"], 1, "deny + -ing."),
  q("The meeting was put ___ until next week.", ["off", "on", "up", "away"], 0, "put off — təxirə salmaq."),
  // C1
  q("Little ___ that he was being watched.", ["he knew", "did he know", "he did know", "knew he"], 1, "Mənfi zərflə inversiya."),
  q("Were it not ___ your help, we would have failed.", ["of", "to", "for", "with"], 2),
  q("No sooner ___ the door than the phone rang.", ["I had opened", "had I opened", "I opened", "did I open"], 1),
  q("His argument doesn't hold ___.", ["water", "air", "ground", "fire"], 0, "hold water — inandırıcı olmaq."),
];

/* ────────────────────────── RUS DİLİ ────────────────────────── */

const RUSSIAN_QUESTIONS = [
  // A1
  q("Меня ___ Али.", ["зовут", "зовёт", "звать", "зовите"], 0),
  q("Это ___ книга.", ["мой", "моя", "моё", "мои"], 1, "книга — qadın cinsi."),
  q("Я ___ в Баку.", ["живу", "живёт", "жить", "живём"], 0),
  q("Как ___ дела?", ["твой", "твоя", "твои", "твоё"], 2, "дела — cəm."),
  q("Что означает «спасибо»?", ["təşəkkür", "salam", "sağ ol demək deyil", "xahiş edirəm"], 0),
  q("Сколько тебе ___?", ["год", "года", "лет", "летом"], 2),
  // A2
  q("Вчера я ___ в кино.", ["иду", "ходил", "пойду", "идти"], 1, "Keçmiş zaman."),
  q("Я иду ___ школу.", ["в", "на", "к", "из"], 0),
  q("У меня ___ брат.", ["есть", "нет", "был", "будет"], 0),
  q("Она говорит по-русски очень ___.", ["хорошо", "хороший", "хорошая", "лучший"], 0, "Feli zərf tələb edir."),
  q("Мы живём ___ третьем этаже.", ["в", "на", "под", "за"], 1),
  q("Я не люблю ___ кофе.", ["пить", "пью", "пил", "пьёт"], 0),
  // B1
  q("Он сказал, что ___ занят.", ["есть", "был", "будет быть", "бывал"], 1),
  q("Книга, ___ я читаю, очень интересная.", ["который", "которая", "которую", "которой"], 2, "Təsirlik hal — которую."),
  q("Если бы я знал, я ___ пришёл.", ["бы", "буду", "был", "бы не"], 0),
  q("Мне нужно ___ домой.", ["идти", "иду", "шёл", "пойдёт"], 0),
  q("Он читает ___ меня быстрее.", ["как", "чем", "что", "то"], 1),
  // B2
  q("Работа ___ выполнена вовремя.", ["была", "был", "были", "быть"], 0, "работа — qadın cinsi, məchul növ."),
  q("Несмотря ___ дождь, мы пошли гулять.", ["на", "в", "за", "под"], 0),
  q("___ бы он ни говорил, я не верю.", ["Кто", "Что", "Как", "Где"], 1),
  q("Он вернулся, ___ закончил работу.", ["потому что", "чтобы", "хотя", "если"], 0),
  q("Ему ___ тридцать лет.", ["около", "почти что", "примерно к", "вокруг"], 0),
];

/* ────────────────────────── TESTLƏR ────────────────────────── */

export const QUIZZES = [
  {
    slug: "english-test",
    title: tri(
      "İngilis dili səviyyə testi",
      "English Level Test",
      "Тест на уровень английского",
    ),
    lead: tri(
      "28 sual · təxminən 10 dəqiqə · nəticəni dərhal görəcəksən",
      "28 questions · about 10 minutes · instant result",
      "28 вопросов · около 10 минут · результат сразу",
    ),
    description: tri(
      "Test CEFR şkalası üzrə (A1–C1) səviyyəni müəyyən edir. Hər sualın bir düzgün cavabı var. Nəticədə hansı sualı səhv cavabladığını və düzgün variantı görəcəksən.",
      "The test measures your level on the CEFR scale (A1–C1). Each question has one correct answer. At the end you will see which questions you answered incorrectly and the correct option.",
      "Тест определяет уровень по шкале CEFR (A1–C1). У каждого вопроса один правильный ответ. В конце вы увидите свои ошибки и правильные варианты.",
    ),
    questions: ENGLISH_QUESTIONS,
    levels: CEFR_LEVELS,
    questionOrder: "sequential",
    questionCount: 0,
    shuffleOptions: false,
    timeLimitMin: 0,
    ctaLabel: tri("İngilis dili kurslarına bax", "See our English courses", "Посмотреть курсы английского"),
    ctaHref: "/kurslar/ingilis-dili-kurslari",
    order: 1,
  },
  {
    slug: "rus-dili-test",
    title: tri(
      "Rus dili səviyyə testi",
      "Russian Level Test",
      "Тест на уровень русского",
    ),
    lead: tri(
      "22 sual · təxminən 8 dəqiqə · nəticəni dərhal görəcəksən",
      "22 questions · about 8 minutes · instant result",
      "22 вопроса · около 8 минут · результат сразу",
    ),
    description: tri(
      "Test rus dili biliyini A1–B2 aralığında qiymətləndirir. Hər sualın bir düzgün cavabı var.",
      "The test assesses your Russian between A1 and B2. Each question has one correct answer.",
      "Тест оценивает знание русского языка в диапазоне A1–B2. У каждого вопроса один правильный ответ.",
    ),
    questions: RUSSIAN_QUESTIONS,
    levels: CEFR_LEVELS,
    questionOrder: "sequential",
    questionCount: 0,
    shuffleOptions: false,
    timeLimitMin: 0,
    ctaLabel: tri("Rus dili kurslarına bax", "See our Russian courses", "Посмотреть курсы русского"),
    ctaHref: "/kurslar/rus-dili-kursu",
    order: 2,
  },
];
