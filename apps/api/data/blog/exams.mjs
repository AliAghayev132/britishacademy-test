/**
 * Beynəlxalq imtahanlar üzrə bloq yazıları.
 * İmtahan formatı dəyişə bilir — mətn ümumi quruluşu izah edir və oxucunu
 * aktual versiya üçün rəsmi mənbəyə yönləndirir. Qiymət yazılmayıb.
 */
const az = (text) => ({ az: text, en: "", ru: "" });

export const EXAM_POSTS = [
  {
    slug: "toefl-nedir-ve-nece-hazirlasmali",
    category: "imtahanlar",
    readMinutes: 5,
    title: az("TOEFL nədir və necə hazırlaşmalı: bölmələr və hazırlıq planı"),
    excerpt: az("TOEFL iBT-nin quruluşu, kimlərin qəbul etdiyi, hazırlığın hansı ardıcıllıqla qurulmalı olduğu və Pre-TOEFL mərhələsinin nə vaxt lazım olduğu."),
    tags: az("TOEFL, TOEFL iBT, Pre-TOEFL, ingilis dili imtahanı"),
    seo: {
      keywords: az("TOEFL, TOEFL iBT, Pre-TOEFL, ingilis dili imtahanı"),
      metaTitle: az("TOEFL nədir və necə hazırlaşmalı — bələdçi"),
      metaDescription: az("TOEFL iBT imtahanının bölmələri, kimlərin qəbul etdiyi, hazırlıq ardıcıllığı və Pre-TOEFL mərhələsi. Rəsmi TOEFL mərkəzində hazırlıq."),
    },
    content: az(`
<p>TOEFL — ETS təşkilatının hazırladığı akademik ingilis dili imtahanıdır. Xüsusilə ABŞ və Kanada universitetləri tərəfindən geniş qəbul olunur, amma Avropa və Asiyada da tanınır.</p>

<h2>İmtahanın quruluşu</h2>
<p>TOEFL iBT dörd bacarığı yoxlayır: <strong>Reading, Listening, Speaking və Writing</strong>. Mövzular akademik mühitə yaxındır — mühazirə parçaları, kampus söhbətləri, elmi mətnlər. Speaking bölməsində cavablar mikrofona danışılır və yazılır.</p>
<p>ETS formatı və bal şkalasını vaxtaşırı yeniləyir. Hazırlığa başlamazdan əvvəl aktual versiyanı rəsmi ETS saytından yoxlayın.</p>

<h2>Kimlər üçündür</h2>
<ul>
  <li>Xaricdə bakalavr və ya magistratura planlaşdıranlar</li>
  <li>Təqaüd proqramlarına müraciət edənlər</li>
  <li>Hədəf universiteti məhz TOEFL tələb edənlər</li>
</ul>

<h2>Pre-TOEFL nə vaxt lazımdır</h2>
<p>İmtahan hazırlığı ümumi dil bazası üzərində qurulur. Səviyyəniz orta səviyyədən aşağıdırsa, birbaşa imtahan texnikasına keçmək nəticə vermir — əvvəlcə <strong>Pre-TOEFL</strong> mərhələsində baza gücləndirilir.</p>

<h2>Hazırlıq ardıcıllığı</h2>
<ol>
  <li>Səviyyənin ölçülməsi — <a href="/testler">onlayn testimizlə</a> başlaya bilərsiniz</li>
  <li>Zəif bacarığın müəyyən edilməsi</li>
  <li>Bölmə-bölmə format və texnika</li>
  <li>Vaxtlı sınaq imtahanları</li>
</ol>

<p>British Academy Azərbaycanda <strong>rəsmi TOEFL imtahan mərkəzidir</strong>. IELTS ilə müqayisə üçün <a href="/bloq/ielts-yoxsa-toefl-hansini-secmeli">IELTS yoxsa TOEFL</a> yazımızı oxuyun. Hazırlıq: <a href="/kurslar/toefl">TOEFL & Pre-TOEFL</a>.</p>
`),
  },

  {
    slug: "oet-tibb-isciler-ucun-ingilis-dili-imtahani",
    category: "imtahanlar",
    readMinutes: 5,
    title: az("OET nədir: tibb işçiləri üçün ingilis dili imtahanı"),
    excerpt: az("Həkim, tibb bacısı, stomatoloq və əczaçılar üçün nəzərdə tutulmuş OET imtahanının quruluşu, IELTS-dən fərqi və kimlər üçün daha sərfəli olduğu."),
    tags: az("OET, Occupational English Test, həkim, tibb bacısı, xaricdə iş"),
    seo: {
      keywords: az("OET, Occupational English Test, həkim, tibb bacısı, xaricdə iş"),
      metaTitle: az("OET nədir — tibb işçiləri üçün ingilis dili imtahanı"),
      metaDescription: az("OET imtahanı tibb işçiləri üçün: bölmələr, peşəyə uyğun tapşırıqlar, IELTS-dən fərqi və xaricdə tibb sahəsində işləmək üçün əhəmiyyəti."),
    },
    content: az(`
<p>OET (Occupational English Test) səhiyyə işçiləri üçün hazırlanmış ingilis dili imtahanıdır. Ümumi imtahanlardan fərqli olaraq burada dil <strong>peşə kontekstində</strong> yoxlanılır — xəstə ilə söhbət, həmkara yönləndirmə məktubu, tibbi qeydlərin oxunması.</p>

<h2>Kimlər üçündür</h2>
<p>OET bir sıra səhiyyə peşəsi üçün keçirilir: həkimlər, tibb bacıları, stomatoloqlar, əczaçılar, fizioterapevtlər və digərləri. Xaricdə — xüsusilə Böyük Britaniya, İrlandiya, Avstraliya və Yeni Zelandiyada — tibb sahəsində işləmək və ya qeydiyyatdan keçmək istəyənlər üçün nəzərdə tutulub.</p>

<h2>Quruluş</h2>
<ul>
  <li><strong>Listening</strong> və <strong>Reading</strong> — bütün peşələr üçün ümumi, səhiyyə mövzularında</li>
  <li><strong>Writing</strong> — peşəyə uyğun məktub (məsələn, yönləndirmə və ya çıxarış məktubu)</li>
  <li><strong>Speaking</strong> — rol oyunu: siz öz peşənizdə, qarşı tərəf xəstə və ya onun yaxını</li>
</ul>

<h2>IELTS-dən fərqi</h2>
<p>IELTS-də mövzular ümumidir, OET-də isə gündəlik iş mühitinizdəndir. Səhiyyə işçisi üçün tanış kontekst çox vaxt böyük üstünlükdür. Amma hansı imtahanın qəbul edildiyini və hansı nəticənin tələb olunduğunu hədəf tənzimləyici qurumdan (məsələn, tibb şurası) mütləq dəqiqləşdirin.</p>

<h2>Hazırlıqda əsas məqamlar</h2>
<ul>
  <li>Writing-də məktub formatı və lazımi məlumatın seçilməsi</li>
  <li>Speaking-də empatiya və aydın izah — təkcə dil yox, ünsiyyət bacarığı da qiymətləndirilir</li>
  <li>Tibbi terminləri sadə dildə xəstəyə çatdırmaq</li>
</ul>

<p>Hazırlıq kursu: <a href="/kurslar/oet">OET (Tibb işçiləri üçün)</a>. Ümumi dil bazası lazımdırsa: <a href="/kurslar/ingilis-dili-kurslari">İngilis dili kursu</a>.</p>
`),
  },

  {
    slug: "toeic-nedir-is-ucun-ingilis-dili-sertifikati",
    category: "imtahanlar",
    readMinutes: 4,
    title: az("TOEIC nədir: iş dünyası üçün ingilis dili sertifikatı"),
    excerpt: az("TOEIC imtahanının nəyi ölçdüyü, hansı hallarda IELTS və TOEFL-dən daha uyğun olduğu və rəsmi imtahan mərkəzində imtahan vermək imkanı."),
    tags: az("TOEIC, iş üçün ingilis dili, sertifikat, karyera"),
    seo: {
      keywords: az("TOEIC, iş üçün ingilis dili, sertifikat, karyera"),
      metaTitle: az("TOEIC nədir — iş üçün ingilis dili sertifikatı"),
      metaDescription: az("TOEIC imtahanı nəyi ölçür, kimlər üçün uyğundur, bal sistemi və rəsmi TOEIC mərkəzində imtahan və hazırlıq imkanı."),
    },
    content: az(`
<p>TOEIC iş mühitində ingilis dili bacarığını ölçən beynəlxalq imtahandır. Akademik imtahanlardan fərqli olaraq burada ofis, iclas, səyahət, müqavilə və müştəri ünsiyyəti kimi real iş vəziyyətləri əsas götürülür.</p>

<h2>Nəyi ölçür</h2>
<p>Ən geniş yayılmış format <strong>Listening & Reading</strong> imtahanıdır. Bundan əlavə, danışıq və yazı bacarıqları üçün ayrıca <strong>Speaking & Writing</strong> imtahanı da mövcuddur. Nəticə keçid/kəsilmə ilə deyil, bal ilə verilir — bu da işəgötürənə səviyyəni dəqiq görmək imkanı yaradır.</p>

<h2>Kimlər üçün uyğundur</h2>
<ul>
  <li>Beynəlxalq şirkətlərdə işləyən və ya iş axtaranlar</li>
  <li>CV-sinə ölçülə bilən dil göstəricisi əlavə etmək istəyənlər</li>
  <li>Şirkət daxilində vəzifə yüksəlişi üçün dil səviyyəsini təsdiqləməli olanlar</li>
</ul>

<h2>IELTS və TOEFL ilə fərq</h2>
<p>Universitet qəbulu üçün adətən IELTS və ya TOEFL istənilir. TOEIC isə daha çox <strong>işəgötürənlər</strong> tərəfindən tələb olunur. Məqsədiniz təhsildirsə, <a href="/bloq/ielts-nedir-ve-nece-hazirlasmali">IELTS bələdçimizə</a> baxın.</p>

<h2>İmtahanı harada vermək olar</h2>
<p>British Academy Azərbaycanda <strong>rəsmi TOEIC imtahan mərkəzidir</strong>. İmtahanı mərkəzimizdə verə və ona burada hazırlaşa bilərsiniz.</p>

<p>Ətraflı: <a href="/kurslar/toeic">TOEIC (Rəsmi imtahan)</a>.</p>
`),
  },

  {
    slug: "sat-nedir-ve-nece-hazirlasmali",
    category: "imtahanlar",
    readMinutes: 5,
    title: az("SAT nədir və necə hazırlaşmalı: xaricdə bakalavr üçün imtahan"),
    excerpt: az("Rəqəmsal SAT-ın quruluşu, bölmələri, hansı universitetlərin tələb etdiyi və Pre-SAT mərhələsinin kimlər üçün lazım olduğu."),
    tags: az("SAT, Digital SAT, Pre-SAT, xaricdə bakalavr, universitet qəbulu"),
    seo: {
      keywords: az("SAT, Digital SAT, Pre-SAT, xaricdə bakalavr, universitet qəbulu"),
      metaTitle: az("SAT nədir və necə hazırlaşmalı — bakalavr üçün"),
      metaDescription: az("Rəqəmsal SAT imtahanının bölmələri, bal sistemi, hansı universitetlərin tələb etdiyi və Pre-SAT ilə hazırlığın düzgün ardıcıllığı."),
    },
    content: az(`
<p>SAT — xaricdə, xüsusilə ABŞ-da bakalavr təhsili üçün geniş istifadə olunan qəbul imtahanıdır. Bir sıra Avropa və Türkiyə universitetləri də SAT nəticəsini qəbul edir.</p>

<h2>İmtahanın quruluşu</h2>
<p>SAT artıq <strong>rəqəmsal</strong> formatda keçirilir və iki bölmədən ibarətdir:</p>
<ul>
  <li><strong>Reading and Writing</strong> — mətni anlamaq, məntiqi əlaqələr, qrammatika və üslub</li>
  <li><strong>Math</strong> — cəbr, məlumat təhlili, həndəsə elementləri</li>
</ul>
<p>İmtahan <strong>adaptivdir</strong>: birinci modulda göstərdiyiniz nəticə ikinci modulun çətinliyini müəyyən edir. Ümumi nəticə 400–1600 bal aralığında verilir.</p>

<h2>Kimlərə lazımdır</h2>
<ul>
  <li>ABŞ və digər ölkələrdə bakalavra müraciət edən məktəblilər</li>
  <li>Qəbulda və ya təqaüddə üstünlük qazanmaq istəyənlər</li>
  <li>Türkiyədə YÖS əvəzinə SAT ilə müraciət etmək istəyənlər — bax <a href="/bloq/turkiyede-tehsil-yos-ve-qebul">Türkiyədə təhsil</a></li>
</ul>

<h2>Pre-SAT nə üçündür</h2>
<p>Reading and Writing bölməsi güclü ingilis dili tələb edir. Səviyyə hələ bu mətnləri rahat oxumağa çatmırsa, əvvəlcə <strong>Pre-SAT</strong> mərhələsində dil və riyazi baza qurulur, sonra imtahan texnikasına keçilir.</p>

<h2>Nə vaxt başlamaq</h2>
<p>Müraciət mövsümündən ən azı bir neçə ay əvvəl. İmtahanı bir dəfədən çox vermək mümkündür, ona görə vaxt planında ikinci cəhd üçün yer saxlayın.</p>

<p>Hazırlıq: <a href="/kurslar/sat-kurslari">SAT & Pre-SAT</a>. Ölkə seçimi üçün: <a href="/xaricde-tehsil/teqaud-proqramlari">Təqaüd proqramları</a>.</p>
`),
  },

  {
    slug: "toles-huquqi-ingilis-dili-imtahani",
    category: "imtahanlar",
    readMinutes: 4,
    title: az("TOLES nədir: hüquqi ingilis dili üzrə beynəlxalq imtahan"),
    excerpt: az("TOLES imtahanının hüquqşünaslar üçün əhəmiyyəti, səviyyələri və hüquqi ingilis dilinə hazırlığın necə qurulduğu."),
    tags: az("TOLES, Legal English, hüquqi ingilis dili, hüquqşünas"),
    seo: {
      keywords: az("TOLES, Legal English, hüquqi ingilis dili, hüquqşünas"),
      metaTitle: az("TOLES nədir — hüquqi ingilis dili imtahanı"),
      metaDescription: az("TOLES (Test of Legal English Skills) nədir, hansı səviyyələri var, hüquqşünaslar üçün nə üstünlük verir və hazırlıq necə aparılır."),
    },
    content: az(`
<p>TOLES (Test of Legal English Skills) hüquqşünaslar və hüquq tələbələri üçün hazırlanmış beynəlxalq hüquqi ingilis dili imtahanıdır. Ümumi dil biliyini deyil, hüquqi kontekstdə dilin düzgün istifadəsini ölçür.</p>

<h2>Nəyi yoxlayır</h2>
<ul>
  <li>Hüquqi terminologiyanın düzgün başa düşülməsi və işlədilməsi</li>
  <li>Müqavilə bəndlərinin oxunması və təhlili</li>
  <li>Hüquqi yazışma — məktub, memorandum</li>
  <li>Formal və dəqiq üslub</li>
</ul>

<h2>Səviyyələr</h2>
<p>İmtahan bir neçə səviyyədə keçirilir — başlanğıc hüquqi ingilis dilindən irəli səviyyəyə qədər. Bu, hər kəsə öz səviyyəsinə uyğun sertifikat almaq və sonra yuxarı səviyyəyə keçmək imkanı verir.</p>

<h2>Kimə nə verir</h2>
<ul>
  <li><strong>Beynəlxalq hüquq firmalarında iş</strong> — hüquqi ingilis dilinin təsdiqi</li>
  <li><strong>Xaricdə LLM</strong> — hüquqi dili akademik mühitə hazırlıq</li>
  <li><strong>Şirkət hüquqşünasları</strong> — xarici tərəfdaşlarla müqavilə işi</li>
</ul>

<h2>Hazırlıq</h2>
<p>TOLES-ə hazırlıq həm terminologiya, həm də imtahan formatı üzərində aparılır. Hüquqi ingilis dilinin ümumi mənzərəsi üçün <a href="/bloq/huquqsunaslar-ucun-ingilis-dili">hüquqşünaslar üçün ingilis dili</a> yazımızı oxuyun.</p>

<p>Hazırlıq kursu: <a href="/kurslar/toles">TOLES</a>.</p>
`),
  },

  {
    slug: "tefl-sertifikati-ingilis-dili-muellimi-olmaq",
    category: "karyera",
    readMinutes: 4,
    title: az("TEFL sertifikatı: ingilis dili müəllimi olmaq üçün ilk addım"),
    excerpt: az("TEFL nədir, kimlərə lazımdır, beynəlxalq işəgötürənlərin nəyə baxdığı və sertifikatın müəllimlik karyerasında hansı qapıları açdığı."),
    tags: az("TEFL, ingilis dili müəllimi, müəllimlik, peşəkar sertifikat"),
    seo: {
      keywords: az("TEFL, ingilis dili müəllimi, müəllimlik, peşəkar sertifikat"),
      metaTitle: az("TEFL sertifikatı — ingilis dili müəllimi olmaq"),
      metaDescription: az("TEFL sertifikatı nədir, kimlər üçündür, işəgötürənlər nəyə baxır və ingilis dili müəllimliyində karyera üçün hansı imkanları açır."),
    },
    content: az(`
<p>TEFL (Teaching English as a Foreign Language) — ingilis dilini xarici dil kimi tədris etmək üçün peşəkar sertifikatdır. Dili yaxşı bilmək müəllim olmaq üçün kifayət deyil; dərsi planlamaq, izah etmək və sinfi idarə etmək ayrıca bacarıqdır.</p>

<h2>Kimlər üçündür</h2>
<ul>
  <li>İngilis dili müəllimi kimi karyeraya başlamaq istəyənlər</li>
  <li>Hazırda dərs deyən, amma metodik bazasını gücləndirmək istəyən müəllimlər</li>
  <li>Xaricdə və ya onlayn platformalarda dərs demək istəyənlər</li>
</ul>

<h2>Kursda nə öyrədilir</h2>
<ul>
  <li>Dərs planlaşdırma və məqsəd qoyma</li>
  <li>Qrammatika və lüğətin öyrədilməsi üsulları</li>
  <li>Dörd bacarığın (danışıq, dinləmə, oxu, yazı) tədrisi</li>
  <li>Sinif idarəçiliyi və fərqli səviyyələrlə iş</li>
  <li>Praktik dərs və geri bildirim</li>
</ul>

<h2>İşəgötürənlər nəyə baxır</h2>
<p>Beynəlxalq dil məktəbləri adətən sertifikatın <strong>həcminə</strong> (tədris saatlarına) və <strong>praktik hissənin</strong> olub-olmamasına baxır. Hədəf ölkə və ya platformanın tələbini əvvəlcədən öyrənin.</p>

<h2>Dil səviyyəsi</h2>
<p>TEFL-ə başlamaq üçün güclü ingilis dili lazımdır — adətən ən azı B2, ideal halda C1. Səviyyənizi <a href="/testler">onlayn testlə</a> yoxlaya bilərsiniz.</p>

<p>Ətraflı: <a href="/kurslar/tefl-kurslari">TEFL Kursları</a>.</p>
`),
  },
];
