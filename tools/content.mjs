/* ============================================================
   Kurs səhifələrinin SEO məzmunu — müştəri mətnləri.
   Yeni mətn əlavə etmək: slug üzrə obyekt yaz, sonra
   `node tools/build.mjs` işə sal.

   Sahələr:
     h1        — hero başlığı (yoxdursa kursun adı işlənir)
     lead      — hero altındakı qısa cümlə
     info      — sağdakı "Qısa məlumat" kartı [[ad, dəyər], ...]
     intro     — giriş abzasları (H1-dən sonra)
     sections  — [{ h:2|3, t, p:[], ul:[], dl:[[ad,izah]], highlight, note }]
     faq       — [[sual, cavab], ...]
     pricing   — { only:[filial indeksləri] | custom:[[ad,dəyər]], note }
   ============================================================ */

const SCHEDULE = ['Müddət', '1,5–2 ay / səviyyə'];
const LESSON = ['Dərs', 'Həftədə 2 dəfə · 90 dəq'];
const LEVELS = ['Səviyyə', 'A1 – C2 (CEFR)'];
const FORMAT = ['Format', 'Qrup (3–6 nəfər) / Fərdi'];

export const COURSE_CONTENT = {
  /* ---------------------------------------------------------- */
  'ingilis-dili-kursu.html': {
    h1: 'Azərbaycanda Yeganə Beynəlxalq Statuslu İngilis Dili Kursu – British Academy',
    lead: 'Böyük Britaniya mütəxəssislərinin hazırladığı metodika, rəsmi TOEIC imtahan mərkəzi statusu və 2 aya danışıq zəmanəti.',
    info: [SCHEDULE, LESSON, LEVELS, ['Qrup', '3–5, maksimum 6 nəfər']],
    intro: [
      'Azərbaycanda yeganə beynəlxalq statuslu ingilis dili mərkəzi olan British Academy ilə dil sədlərini aradan qaldırın! Peşəkar müəllim heyətimiz və Böyük Britaniyanın yerli mütəxəssisləri tərəfindən hazırlanmış xüsusi dərs metodologiyamızla hədəflərinizə daha sürətli çatacaqsınız.',
      'Rəsmi TOEIC imtahan mərkəzi olaraq, tələbələrimizə təkcə dil öyrətmirik, həm də onlara qlobal səviyyədə tanınan beynəlxalq ingilis dili sertifikatı əldə etmək şansı qazandırırıq. Artıq ümumi ingilis dili dərslərimizə qoşulan hər bir tələbəmiz bu beynəlxalq sertifikata sahib ola bilər.',
    ],
    sections: [
      {
        h: 2, t: '4 Dəfə Daha Sürətli və Effektiv Öyrənmə Metodikası',
        p: ['İngilis dili dərslərimiz xüsusi dərsliklər əsasında tədris olunur. Bu metodika sayəsində siz ingilis dilini sadəcə qrammatik olaraq deyil, eyni zamanda real ünsiyyətdə tətbiq edərək öyrənirsiniz. Dinləmə, oxuma, yazma və danışıq olmaqla 4 əsas dil bacarığını paralel inkişaf etdirərək, ənənəvi metodlardan 4 dəfə daha sürətli nəticə əldə edəcəksiniz.'],
        highlight: 'Bizim Zəmanətimiz: British Academy olaraq, dərslərimizə nizamlı davam edən hər bir tələbəmizin 2 aya danışıq bacarığının (speaking) inkişafına tam zəmanət veririk!',
      },
      {
        h: 3, t: 'Beynəlxalq CEFR Standartları və Kiçik Qruplar',
        p: ['Dərslərimiz tamamilə beynəlxalq CEFR (Common European Framework of Reference for Languages) standartlarına uyğun olaraq A1, A2, B1, B2, C1 və C2 səviyyələri üzrə qruplaşdırılır. Effektivliyi qorumaq üçün qruplarımız minimal tərkibdə – 3-5 nəfər, maksimum isə 6 nəfər olmaqla təşkil edilir. Bu da müəllimin hər bir tələbəyə fərdi vaxt ayırmasını təmin edir.'],
      },
      {
        h: 3, t: 'Təhsil Paketinizə Daxil Olan Sosial Fəaliyyətlər və Üstünlüklər',
        p: ['Dərslərimizə qoşulan tələbələr yalnız əsas proqramla kifayətlənmir, həm də dil mühitini tam yaşamaq və boşluqları doldurmaq üçün geniş təhsil paketi əldə edirlər. Paketimizə aşağıdakı ödənişsiz fəaliyyətlər daxildir:'],
        dl: [
          ['Workshops (Dəstək seminarları)', 'Proqram boyu tam başa düşülməyən və ya zəif qalan mövzuların təkrarı və yenidən öyrənilməsi üçün təşkil olunan xüsusi dəstək dərsləri.'],
          ['Conversation Days (Danışıq günləri)', 'Sərbəst ünsiyyət qurmaq və dil kompleksini qırmaq üçün təşkil olunan xüsusi danışıq klubları.'],
          ['Listening Days (Dinləmə günləri)', 'İngilis dilində müxtəlif vurğuları və dialoqları daha yaxşı anlamaq üçün xüsusi dinləmə seansları.'],
          ['Movie Days (Kino günləri)', 'Filmləri orijinal dildə izləyərək həm əylənmək, həm də real danışıq ifadələrini öyrənmək imkanı.'],
          ['Ödənişsiz PDF Vəsaitlər', 'Kurs müddətində keçiriləcək proqramın online PDF materialları tələbələrimizə tamamilə ödənişsiz olaraq verilir. (Qeyd: Fiziki dərslik kitabları isə ödənişlidir).'],
        ],
        note: 'Dərs qrafiki: Əsas dərslərimiz həftədə 2 dəfə, hər dərs 90 dəqiqə olmaqla keçirilir.',
      },
    ],
    faq: [
      ['Dərslər hansı qrafiklə və neçə nəfərlik qruplarda keçirilir?', 'Əsas dərslərimiz həftədə 2 dəfə, hər dərs 90 dəqiqə olmaqla tədris olunur. Qruplarımız fərdi yanaşmanı təmin etmək məqsədilə olduqca kiçik tutumludur: minimum 3-5, maksimum isə 6 nəfərdən ibarət olur.'],
      ['2 aya danışıq zəmanəti nə deməkdir?', 'Böyük Britaniya mütəxəssislərinin hazırladığı xüsusi metodika sayəsində dərslərdə aktiv danışıq mühiti yaradılır. Dərslərə və tapşırıqlara məsuliyyətlə yanaşan hər bir tələbənin 2 ay ərzində ingilis dilində sərbəst ünsiyyət quracağına və danışığının gözəl şəkildə inkişaf edəcəyinə zəmanət veririk.'],
      ['Kurs zamanı hər hansı bir mövzu mənə qaranlıq qalsa, əlavə dəstək göstərilirmi?', 'Bəli! Təhsil paketimizə daxil olan Workshop-lar məhz bu məqsədlə təşkil edilir. Keçilən dərslərdə tam başa düşmədiyiniz, çətinlik çəkdiyiniz və ya zəif qaldığınız mövzuları bu seminarlarda müəllimlərimizlə birlikdə yenidən öyrənib möhkəmləndirə bilərsiniz.'],
      ['Dərs materialları və kitablar ödənişlidir?', 'Kursumuzda tədris proqramının online PDF materialları tələbələrə tamamilə ödənişsiz olaraq təqdim edilir. Lakin dərsləri fiziki kitab üzərindən izləmək istəyənlər üçün dərsliklər ödənişlidir.'],
      ['Təhsil paketinə əsas dərslərdən əlavə hansı fəaliyyətlər daxildir?', 'Tələbələrimizin dil bacarıqlarını hərtərəfli inkişaf etdirmək üçün təhsil paketinə əsas dərslərlə yanaşı ödənişsiz olaraq Workshop (mövzu təkrarı dərsləri), Conversation Days, Listening Days və Movie Days daxildir.'],
    ],
  },

  /* ---------------------------------------------------------- */
  'rus-dili-kursu.html': {
    h1: 'Rus Dili Kursları',
    lead: 'Danışıq yönümlü interaktiv dərslər, CEFR standartına uyğun 6 səviyyəli proqram və peşəkar müəllimlər.',
    info: [SCHEDULE, LESSON, LEVELS, FORMAT],
    intro: ['British Academy-də Rus dili kursları müasir tədris metodikası, peşəkar müəllimlər və beynəlxalq standartlara uyğun hazırlanmış proqram əsasında keçirilir. Dərslər danışıq, dinləmə, oxu, yazı və qrammatika bacarıqlarının kompleks şəkildə inkişaf etdirilməsinə yönəlib. İstər rus dilini sıfırdan öyrənmək, istərsə də mövcud biliklərinizi təkmilləşdirmək istəyirsinizsə, səviyyənizə uyğun proqram təqdim olunur.'],
    sections: [
      {
        h: 2, t: 'Niyə British Academy Rus Dili Kursunu Seçməlisiniz?',
        ul: ['Danışıq yönümlü interaktiv dərslər', 'Peşəkar və təcrübəli müəllimlər', 'Müasir və beynəlxalq standartlara uyğun dərs vəsaitləri', 'Qrammatikanın sadə və praktik şəkildə izahı', 'Gündəlik danışıq üçün söz ehtiyatının inkişafı', 'CEFR standartına uyğun 6 səviyyəli proqram', 'Fərdi və qrup dərsləri seçimləri'],
      },
      {
        h: 2, t: 'Kursun Müddəti və Dərs Cədvəli',
        ul: ['Hər səviyyə orta hesabla 1,5–2 ay davam edir.', 'Bəzi tələbələrdə inkişaf tempindən asılı olaraq bir səviyyənin müddəti 3 aya qədər uzana bilər.', 'Hər dərs 90 dəqiqə davam edir.', 'Yeni qruplar mütəmadi olaraq formalaşdırılır.', 'Dərs günləri və saatları tələbələrin uyğunluğuna əsasən müəyyən edilir.'],
      },
      {
        h: 2, t: 'Kursu Bitirdikdən Sonra',
        p: ['Kurs müddətində tələbələr:'],
        ul: ['Rus dilində danışıq bacarıqlarını inkişaf etdirirlər;', 'Qrammatikanı praktik şəkildə tətbiq etməyi öyrənirlər;', 'Söz ehtiyatlarını zənginləşdirirlər;', 'Gündəlik və peşəkar ünsiyyətdə rus dilindən daha rahat istifadə edirlər.'],
        note: 'Sertifikat kursun sonunda keçirilən imtahanda uğur qazanan tələbələrə verilir.',
      },
    ],
    faq: [
      ['Rus dili kursu kimlər üçün uyğundur?', 'Rus dilini sıfırdan öyrənmək, danışıq bacarıqlarını inkişaf etdirmək və ya mövcud biliklərini təkmilləşdirmək istəyən hər kəs üçün uyğundur.'],
      ['Bir səviyyə neçə ay davam edir?', 'Hər səviyyə orta hesabla 1,5–2 ay davam edir. Tələbənin inkişaf tempindən asılı olaraq bu müddət bəzi hallarda 3 aya qədər uzana bilər.'],
      ['Dərslər neçə dəqiqə davam edir?', 'Hər dərs 90 dəqiqə davam edir və dərs günləri tələbələrin uyğunluğuna əsasən müəyyən edilir.'],
      ['Rus dili kursunun sonunda sertifikat verilirmi?', 'Bəli. Sertifikat kursun sonunda keçirilən imtahanda uğur qazanan tələbələrə təqdim olunur.'],
      ['Rus dili kursunda hansı səviyyələr mövcuddur?', 'Kurs CEFR standartına uyğun olaraq A1, A2, B1, B2, C1 və C2 səviyyələrindən ibarətdir. İlkin səviyyə müəyyən edildikdən sonra tələbə uyğun qrupa yerləşdirilir.'],
    ],
  },

  /* ---------------------------------------------------------- */
  'alman-dili-kursu.html': {
    h1: 'Alman Dili Kursları',
    lead: 'CEFR standartlarına uyğun proqram, danışıq yönümlü dərslər — yalnız Caspian Plaza filialında.',
    info: [SCHEDULE, LESSON, LEVELS, ['Filial', 'Caspian Plaza']],
    intro: ['British Academy-də Alman dili kursları beynəlxalq CEFR standartlarına uyğun proqram əsasında tədris olunur. Dərslər danışıq, dinləmə, oxu, yazı və qrammatika bacarıqlarının paralel inkişafına yönəlib. Proqram tələbənin mövcud bilik səviyyəsi, məqsədi və öyrənmə tempinə uyğun şəkildə hazırlanır. İstər alman dilini sıfırdan öyrənmək, istərsə də biliklərinizi inkişaf etdirmək istəyirsinizsə, sizin üçün uyğun proqram mövcuddur.'],
    sections: [
      {
        h: 2, t: 'Niyə British Academy Alman Dili Kursunu Seçməlisiniz?',
        ul: ['Peşəkar və təcrübəli müəllim heyəti', 'CEFR standartlarına uyğun tədris proqramı', 'Müasir metodika və beynəlxalq dərs vəsaitləri', 'Danışıq yönümlü interaktiv dərslər', 'Qrammatikanın praktik şəkildə öyrədilməsi', 'Oxu, yazı, dinləmə və danışıq bacarıqlarının kompleks inkişafı', 'Fərdi və qrup dərsləri'],
      },
      {
        h: 2, t: 'Alman Dili Kursu Hansı Filialda Tədris Olunur?',
        p: ['Alman dili kursları yalnız British Academy-nin Caspian Plaza filialında keçirilir. Alman dili üzrə qeydiyyat və dərslər hazırda yalnız bu filialda təşkil olunur.'],
      },
      {
        h: 2, t: 'Kursun Müddəti və Dərs Cədvəli',
        ul: ['Hər səviyyə orta hesabla 1,5–2 ay davam edir.', 'Tələbənin öyrənmə tempindən asılı olaraq bəzi hallarda bir səviyyənin müddəti 3 aya qədər uzana bilər.', 'Hər dərs 90 dəqiqə davam edir.', 'Dərs günləri və saatları tələbələrin uyğunluğuna əsasən müəyyən edilir.', 'Yeni qruplar mütəmadi olaraq formalaşdırılır.'],
      },
      {
        h: 2, t: 'Kursu Bitirdikdən Sonra',
        p: ['Kurs müddətində tələbələr:'],
        ul: ['Alman dilində sərbəst ünsiyyət bacarıqlarını inkişaf etdirirlər.', 'Oxu, yazı, dinləmə və danışıq bacarıqlarını təkmilləşdirirlər.', 'Gündəlik, akademik və peşəkar mühitdə alman dilindən rahat istifadə edə bilirlər.'],
        note: 'Sertifikat yalnız kursun sonunda keçirilən imtahanda uğur qazanan tələbələrə təqdim olunur.',
      },
    ],
    faq: [
      ['Alman dili kursu kimlər üçün uyğundur?', 'Alman dilini sıfırdan öyrənmək, mövcud biliklərini inkişaf etdirmək, Almaniyada təhsil almaq, işləmək və ya gündəlik ünsiyyət bacarıqlarını artırmaq istəyən hər kəs üçün uyğundur.'],
      ['Alman dili kursunun müddəti nə qədərdir?', 'Hər səviyyə orta hesabla 1,5–2 ay davam edir. Tələbənin inkişaf tempindən asılı olaraq bu müddət bəzi hallarda 3 aya qədər uzana bilər.'],
      ['Dərslər neçə dəqiqə davam edir?', 'Hər dərs 90 dəqiqə davam edir. Dərs günləri və saatları tələbələrin uyğunluğuna əsasən müəyyən edilir.'],
      ['Alman dili kursunun sonunda sertifikat verilirmi?', 'Bəli. Sertifikat yalnız kursun sonunda keçirilən imtahanda uğur qazanan tələbələrə təqdim olunur.'],
      ['Alman dili kursu hansı filialda keçirilir?', 'Alman dili kursları yalnız British Academy Caspian Plaza filialında tədris olunur. Bu filialda qeydiyyatdan keçərək səviyyənizə uyğun qrupa qoşula bilərsiniz.'],
    ],
    pricing: { only: [0], note: 'Alman dili kursu yalnız Caspian Plaza filialında tədris olunur.' },
  },

  /* ---------------------------------------------------------- */
  'ispan-dili-kursu.html': {
    h1: 'İspan Dili Kursları',
    lead: 'Danışıq yönümlü interaktiv dərslər, bütün səviyyələr üçün proqram və ödənişsiz sınaq dərsi.',
    info: [SCHEDULE, LESSON, LEVELS, FORMAT],
    intro: ['British Academy-də İspan dili kursları beynəlxalq standartlara uyğun proqram əsasında tədris olunur. Dərslər danışıq, dinləmə, oxu, yazı və qrammatika bacarıqlarının kompleks şəkildə inkişaf etdirilməsinə yönəlib. Yeni başlayanlardan yüksək səviyyəli tələbələrə qədər hər kəs üçün uyğun proqramlar mövcuddur.'],
    sections: [
      {
        h: 2, t: 'Niyə British Academy İspan Dili Kursunu Seçməlisiniz?',
        ul: ['Peşəkar və təcrübəli müəllim heyəti', 'Danışıq yönümlü interaktiv dərslər', 'Müasir və daim yenilənən tədris materialları', 'Bütün səviyyələr üçün uyğun proqram', 'Praktik qrammatika və zəngin söz ehtiyatının inkişafı', 'Fərdi və qrup dərsləri', 'Rahat və effektiv öyrənmə mühiti'],
      },
      {
        h: 2, t: 'Kursun Müddəti və Dərs Cədvəli',
        ul: ['Hər səviyyə orta hesabla 1,5–2 ay davam edir.', 'Tələbənin inkişaf tempindən asılı olaraq bəzi hallarda bir səviyyə 3 aya qədər uzana bilər.', 'Hər dərs 90 dəqiqə davam edir.', 'Dərs günləri və saatları tələbələrin uyğunluğuna əsasən müəyyən edilir.', 'Yeni qruplar mütəmadi olaraq formalaşdırılır.'],
      },
      {
        h: 2, t: 'Ödənişsiz Sınaq Dərsi',
        p: ['İspan dili kursuna başlamazdan əvvəl ödənişsiz sınaq dərsində iştirak edə bilərsiniz. Bu dərs vasitəsilə tədris metodikamız, müəllim heyətimiz və dərs mühiti ilə yaxından tanış olmaq imkanınız olacaq.'],
      },
    ],
    faq: [
      ['İspan dili kursu kimlər üçün uyğundur?', 'İspan dilini sıfırdan öyrənmək və ya mövcud biliklərini inkişaf etdirmək istəyən bütün yaş qrupları üçün uyğundur.'],
      ['İspan dili kursunun müddəti nə qədərdir?', 'Hər səviyyə orta hesabla 1,5–2 ay davam edir. Tələbənin inkişaf tempindən asılı olaraq bu müddət 3 aya qədər uzana bilər.'],
      ['Dərslər neçə dəqiqə davam edir?', 'Hər dərs 90 dəqiqə davam edir. Dərs günləri və saatları tələbələrin uyğunluğuna əsasən müəyyən edilir.'],
      ['İspan dili kursunun sonunda sertifikat verilirmi?', 'Bəli. Sertifikat yalnız kursun sonunda keçirilən imtahanda uğur qazanan tələbələrə təqdim olunur.'],
      ['İspan dili kursuna başlamazdan əvvəl sınaq dərsi mümkündürmü?', 'Bəli. British Academy-də İspan dili kursuna başlamazdan əvvəl ödənişsiz sınaq dərsində iştirak edə bilərsiniz. Bu, kursun tədris metodikası ilə tanış olmaq üçün yaxşı imkandır.'],
    ],
  },

  /* ---------------------------------------------------------- */
  'italyan-dili-kursu.html': {
    h1: 'İtalyan Dili Kursları',
    lead: 'İtaliyada təhsil almış müəllimlər, danışıq yönümlü proqram — online və əyani format.',
    info: [SCHEDULE, LESSON, LEVELS, ['Format', 'Online / Əyani · Qrup / Fərdi']],
    intro: ['British Academy-də İtalyan dili kursları beynəlxalq standartlara uyğun proqram əsasında tədris olunur. Dərslər danışıq, dinləmə, oxu, yazı və qrammatika bacarıqlarının paralel inkişafına yönəlib. Tədris prosesi praktik yanaşma ilə təşkil olunur ki, siz yalnız qrammatikanı öyrənməyəsiniz, eyni zamanda italyan dilində sərbəst ünsiyyət qurma bacarığı da əldə edəsiniz.'],
    sections: [
      {
        h: 2, t: 'Niyə British Academy İtalyan Dili Kursunu Seçməlisiniz?',
        ul: ['İtaliyada təhsil almış peşəkar və təcrübəli müəllimlər', 'Danışıq yönümlü interaktiv dərslər', 'Müasir tədris metodikası və praktik yanaşma', 'Oxu, yazı, dinləmə və danışıq bacarıqlarının kompleks inkişafı', 'Online və əyani dərs seçimləri', 'Fərdi və qrup dərsləri', 'Bütün səviyyələr üçün uyğun proqram'],
      },
      {
        h: 2, t: 'Kursun Müddəti və Dərs Cədvəli',
        ul: ['Hər səviyyə orta hesabla 1,5–2 ay davam edir.', 'Tələbənin öyrənmə tempindən asılı olaraq bəzi hallarda bir səviyyənin müddəti 3 aya qədər uzana bilər.', 'Hər dərs 90 dəqiqə davam edir.', 'Dərs günləri və saatları tələbələrin uyğunluğuna əsasən müəyyən edilir.', 'Online və əyani dərs formatları mövcuddur.'],
      },
      {
        h: 2, t: 'Tədris Formatı',
        p: ['British Academy-də İtalyan dili kurslarına həm əyani, həm də online formatda qoşula bilərsiniz. Dərslər interaktiv şəkildə keçirilir və hər iki formatda eyni tədris keyfiyyəti təmin olunur.'],
      },
    ],
    faq: [
      ['İtalyan dili kursu kimlər üçün uyğundur?', 'İtalyan dilini sıfırdan öyrənmək, mövcud biliklərini inkişaf etdirmək, təhsil, iş və ya səyahət məqsədilə italyan dilini öyrənmək istəyən hər kəs üçün uyğundur.'],
      ['İtalyan dili kursunun müddəti nə qədərdir?', 'Hər səviyyə orta hesabla 1,5–2 ay davam edir. Tələbənin inkişaf tempindən asılı olaraq bu müddət bəzi hallarda 3 aya qədər uzana bilər.'],
      ['Dərslər online keçirilirmi?', 'Bəli. British Academy-də İtalyan dili kursları həm online, həm də əyani formatda təşkil olunur.'],
      ['İtalyan dili kursunun sonunda sertifikat verilirmi?', 'Bəli. Sertifikat yalnız kursun sonunda keçirilən imtahanda uğur qazanan tələbələrə təqdim olunur.'],
      ['İtalyan dili kursunda danışıq bacarığı inkişaf etdirilirmi?', 'Bəli. Tədris proqramı danışıq yönümlü olduğu üçün tələbələr qrammatika ilə yanaşı, gündəlik və real həyat vəziyyətlərində italyan dilində sərbəst ünsiyyət qurmaq bacarığı əldə edirlər.'],
    ],
  },

  /* ---------------------------------------------------------- */
  'usaq-ingilis-dili.html': {
    h1: 'Uşaqlar Üçün İngilis Dili Kursları',
    lead: '6 yaş və yuxarı uşaqlar üçün oyun əsaslı, interaktiv və yaşa uyğun proqram.',
    info: [['Yaş', '6 yaş və yuxarı'], SCHEDULE, LESSON, FORMAT],
    intro: ['British Academy-də uşaqlar üçün İngilis dili kursları 6 yaş və yuxarı uşaqların yaş xüsusiyyətlərinə uyğun hazırlanmış müasir proqram əsasında tədris olunur. Dərslər uşaqların ingilis dilini əylənərək öyrənməsinə, danışıq bacarıqlarını inkişaf etdirməsinə və dili gündəlik həyatda rahat istifadə etməsinə yönəlib. İnteraktiv metodlar, oyunlar və praktik tapşırıqlar sayəsində öyrənmə prosesi həm maraqlı, həm də effektiv olur.'],
    sections: [
      {
        h: 2, t: 'Niyə British Academy Uşaqlar Üçün İngilis Dili Kursunu Seçməlisiniz?',
        ul: ['6 yaş və yuxarı uşaqlar üçün xüsusi hazırlanmış proqram', 'Yaşa uyğun interaktiv tədris metodikası', 'Oyunlar, dialoqlar və praktik fəaliyyətlər', 'Danışıq, dinləmə, oxu və yazı bacarıqlarının kompleks inkişafı', 'Peşəkar və təcrübəli müəllim heyəti', 'Fərdi və qrup dərsləri', 'Müasir tədris materialları'],
      },
      {
        h: 2, t: 'Kursun Müddəti və Dərs Cədvəli',
        ul: ['Hər səviyyə orta hesabla 1,5–2 ay davam edir.', 'Tələbənin inkişaf tempindən asılı olaraq bəzi hallarda bir səviyyənin müddəti 3 aya qədər uzana bilər.', 'Hər dərs 90 dəqiqə davam edir.', 'Dərs günləri və saatları valideynin və uşağın uyğunluğuna əsasən müəyyən edilir.', 'Fərdi və qrup formatında dərslər təşkil olunur.'],
      },
      {
        h: 2, t: 'Kursun Üstünlükləri',
        p: ['British Academy-də uşaqlar üçün İngilis dili dərsləri yalnız qrammatikanın öyrədilməsi ilə məhdudlaşmır. Tədris proqramı uşaqların ingilis dilində sərbəst ünsiyyət qurmasına, özünəinamla danışmasına və dili gündəlik həyatda tətbiq etməsinə kömək edir. Dərslərdə oyunlar, komanda tapşırıqları, dialoqlar və real həyat mövzuları geniş şəkildə istifadə olunur.'],
      },
    ],
    faq: [
      ['Uşaqlar üçün İngilis dili kursu neçə yaşdan başlayır?', 'Kurslar 6 yaş və yuxarı uşaqlar üçün nəzərdə tutulub. Uşaqlar səviyyələrinə uyğun qruplara yerləşdirilir.'],
      ['Dərslər fərdi keçirilir, yoxsa qrup şəklində?', 'Valideynin seçiminə uyğun olaraq dərslər həm fərdi, həm də qrup formatında keçirilir.'],
      ['Bir səviyyə nə qədər davam edir?', 'Hər səviyyə orta hesabla 1,5–2 ay davam edir. Uşağın inkişaf tempindən asılı olaraq bu müddət bəzi hallarda 3 aya qədər uzana bilər.'],
      ['Uşaqlar üçün dərslər necə keçirilir?', 'Dərslər interaktiv metodlarla təşkil olunur. Oyunlar, dialoqlar, praktik tapşırıqlar və real həyat mövzuları vasitəsilə uşaqlar ingilis dilini maraqlı və effektiv şəkildə öyrənirlər.'],
      ['Kursun sonunda sertifikat verilirmi?', 'Bəli. Sertifikat yalnız kursun sonunda keçirilən imtahanda uğur qazanan şagirdlərə təqdim olunur.'],
    ],
  },

  /* ---------------------------------------------------------- */
  'biznes-ingilis-dili-kursu.html': {
    h1: 'Biznes İngilis Dili Kursları',
    lead: 'İşgüzar yazışma, təqdimat və danışıqlar üçün peşəkar ingilis dili — Cambridge BEC hazırlığı daxil.',
    info: [SCHEDULE, LESSON, LEVELS, FORMAT],
    intro: ['British Academy-də Biznes İngilis dili kursları iş mühitində peşəkar ünsiyyət qurmaq istəyən şəxslər üçün hazırlanmışdır. Tədris proqramı beynəlxalq biznes mühitində istifadə olunan ingilis dili bacarıqlarının inkişafına yönəlib. Kurs zamanı işgüzar yazışmalar, təqdimatlar, görüşlər, danışıqlar və peşəkar ünsiyyət üçün lazım olan dil bilikləri praktik şəkildə öyrədilir.'],
    sections: [
      {
        h: 2, t: 'Niyə British Academy Biznes İngilis Dili Kursunu Seçməlisiniz?',
        ul: ['İşgüzar ingilis dili üzrə xüsusi proqram', 'Peşəkar və təcrübəli müəllim heyəti', 'Danışıq və praktika yönümlü interaktiv dərslər', 'İşgüzar yazışma və təqdimat bacarıqlarının inkişafı', 'Qrammatika və peşəkar terminologiyanın təkmilləşdirilməsi', 'Söz ehtiyatının genişləndirilməsi', 'Fərdi və qrup dərsləri'],
      },
      {
        h: 2, t: 'Kurs Kimlər Üçün Uyğundur?',
        p: ['Biznes İngilis dili kursu aşağıdakılar üçün uyğundur:'],
        ul: ['Şirkətlərdə və təşkilatlarda çalışan əməkdaşlar', 'Menecerlər və rəhbər vəzifədə çalışan şəxslər', 'Beynəlxalq şirkətlərdə işləmək istəyən namizədlər', 'Xarici tərəfdaşlarla işləyən mütəxəssislər', 'İngilis dilində peşəkar ünsiyyət bacarıqlarını inkişaf etdirmək istəyən hər kəs', 'Cambridge Business English Certificate (BEC) imtahanına hazırlaşan namizədlər'],
      },
      {
        h: 2, t: 'Kursun Müddəti və Dərs Cədvəli',
        ul: ['Hər səviyyə orta hesabla 1,5–2 ay davam edir.', 'Tələbənin inkişaf tempindən asılı olaraq bəzi hallarda bir səviyyənin müddəti 3 aya qədər uzana bilər.', 'Hər dərs 90 dəqiqə davam edir.', 'Dərs günləri və saatları tələbələrin uyğunluğuna əsasən müəyyən edilir.', 'Fərdi və qrup dərsləri mövcuddur.'],
        highlight: 'Qeyd: Saat 17:00-dan sonra keçirilən dərslər üçün əlavə ödəniş tətbiq olunur: qrup dərsləri – 10 AZN, fərdi dərslər – 20 AZN.',
      },
    ],
    faq: [
      ['Biznes İngilis dili kursu kimlər üçün uyğundur?', 'Bu kurs iş mühitində ingilis dilindən istifadə edən və ya istifadə etməyi planlaşdıran şəxslər, şirkət əməkdaşları, rəhbərlər, tələbələr və Cambridge BEC imtahanına hazırlaşan namizədlər üçün uyğundur.'],
      ['Bir səviyyə nə qədər davam edir?', 'Hər səviyyə orta hesabla 1,5–2 ay davam edir. Tələbənin inkişaf tempindən asılı olaraq bu müddət bəzi hallarda 3 aya qədər uzana bilər.'],
      ['Dərslər neçə dəqiqə davam edir?', 'Hər dərs 90 dəqiqə davam edir. Dərs cədvəli tələbələrin uyğunluğuna əsasən hazırlanır.'],
      ['Biznes İngilis dili kursunun sonunda sertifikat verilirmi?', 'Bəli. Sertifikat yalnız kursun sonunda keçirilən imtahanda uğur qazanan tələbələrə təqdim olunur.'],
      ['Axşam saatlarında dərslər üçün əlavə ödəniş varmı?', 'Bəli. 17:00-dan sonra keçirilən qrup dərsləri üçün 10 AZN, fərdi dərslər üçün isə 20 AZN əlavə ödəniş tətbiq edilir.'],
    ],
    pricing: { note: 'Saat 17:00-dan sonrakı dərslər üçün əlavə ödəniş: qrup 10 AZN, fərdi 20 AZN.' },
  },

  /* ---------------------------------------------------------- */
  'conversation-club.html': {
    h1: 'İngilis Dili Danışıq Klubları',
    lead: 'Həftədə 4 dəfə, 8 fərqli klub formatı — British Academy tələbələri üçün tamamilə ödənişsiz.',
    info: [['Tezlik', 'Həftədə 4 dəfə'], ['Bir dəfə', '10 AZN'], ['Aylıq', '80 AZN'], ['BA tələbəsi', 'Ödənişsiz']],
    intro: ['British Academy-də İngilis dili danışıq klubları ingilis dilində sərbəst danışıq bacarıqlarını inkişaf etdirmək istəyənlər üçün təşkil olunur. Danışıq klubları interaktiv metodlarla keçirilir və iştirakçılara real ünsiyyət mühitində ingilis dilindən istifadə etmək imkanı yaradır. Diskussiyalar, dialoqlar, oyunlar və müxtəlif praktik fəaliyyətlər sayəsində həm danışıq bacarıqları, həm də ümumi dil bilikləri inkişaf etdirilir.'],
    sections: [
      {
        h: 2, t: 'Danışıq Klublarında Hansı Proqramlar Var?',
        p: ['British Academy-də həftə ərzində müxtəlif mövzular üzrə danışıq klubları təşkil olunur:'],
        ul: ['Speaking Club', 'Business English Club', 'Game Club', 'Vocabulary Club', 'Reading Club', 'Listening Club', 'Movie Club'],
        dl: [['Make Up Club', 'Dərsdə çətinlik çəkdiyiniz mövzuların təkrarı və Speaking müəllimi ilə əlavə dəstək imkanı.']],
      },
      {
        h: 2, t: 'Danışıq Klublarının Üstünlükləri',
        ul: ['Həftədə 4 dəfə keçirilir.', 'İnteraktiv və danışıq yönümlü proqram.', 'Diskussiyalar, dialoqlar və debatlar.', 'Söz ehtiyatının artırılması.', 'Dinləmə və tələffüz bacarıqlarının inkişafı.', 'Praktik ingilis dili mühiti.', 'Fərqli mövzular üzrə ünsiyyət bacarıqlarının inkişafı.'],
      },
      {
        h: 2, t: 'Danışıq Klubları Kimlər Üçün Uyğundur?',
        p: ['Danışıq klubları:'],
        ul: ['İngilis dilində sərbəst danışmaq istəyənlər;', 'Söz ehtiyatını artırmaq istəyənlər;', 'Tələffüzünü inkişaf etdirmək istəyənlər;', 'Beynəlxalq imtahanlara hazırlaşanlar;', 'İş və gündəlik həyat üçün danışıq bacarıqlarını gücləndirmək istəyən hər kəs üçün uyğundur.'],
      },
    ],
    faq: [
      ['İngilis dili danışıq klubları həftədə neçə dəfə keçirilir?', 'Danışıq klubları həftədə 4 dəfə təşkil olunur və müxtəlif mövzular üzrə keçirilir.'],
      ['Danışıq klublarında hansı fəaliyyətlər olur?', 'Speaking Club, Business English Club, Vocabulary Club, Reading Club, Listening Club, Movie Club, Game Club və Make Up Club çərçivəsində diskussiyalar, dialoqlar, oyunlar və praktik tapşırıqlar keçirilir.'],
      ['Danışıq klubunda iştirakın qiyməti nə qədərdir?', 'Bir dəfə iştirak 10 AZN, aylıq iştirak isə 80 AZN təşkil edir.'],
      ['British Academy tələbələri danışıq klublarında ödəniş edirlərmi?', 'Xeyr. British Academy tələbələri üçün bütün danışıq klublarında iştirak ödənişsizdir.'],
      ['Danışıq klubuna necə qoşulmaq olar?', 'Danışıq klubunda iştirak etmək üçün ən azı 1 gün əvvəl qeydiyyatdan keçmək lazımdır. Bu, qrupların düzgün formalaşdırılması və iştirakçıların rahatlığı üçün vacibdir.'],
    ],
    pricing: {
      custom: [['Bir dəfə iştirak', '10 AZN'], ['Aylıq iştirak', '80 AZN'], ['British Academy tələbələri', 'Ödənişsiz']],
      note: 'Danışıq klubunda iştirak etmək üçün ən azı 1 gün əvvəl qeydiyyatdan keçmək mütləqdir.',
    },
  },
};
