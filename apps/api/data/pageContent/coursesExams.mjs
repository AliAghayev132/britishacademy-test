/**
 * Beynəlxalq imtahan və peşəkar sertifikat kurslarının səhifə məzmunu.
 *
 * Kursa aid faktlar canlı səhifədən götürülüb (IELTS: 3 ay, həftədə 2 dəfə
 * 90 dəq, minimum B2, 3–6 / maks. 7 nəfər; Duolingo: həftədə 2 dəfə 90 dəq,
 * minimum B1+; British Academy rəsmi TOEIC/TOEFL mərkəzidir). İmtahanlar
 * haqqında yalnız dəyişməyən ümumi məlumat yazılıb — bal şkalası, qiymət
 * və tarix kimi tez dəyişən rəqəmlər qəsdən yoxdur.
 */
const az = (text) => ({ az: text, en: "", ru: "" });
const row = (label, value) => ({ label: az(label), value: az(value) });
const qa = (question, answer) => ({ question: az(question), answer: az(answer) });

const SCHEDULE_Q = qa("Dərs cədvəli necə müəyyən olunur?", "Qrupun tərkibinə və tələbələrin uyğunluğuna görə. Aktual qrup və cədvəl üçün bizimlə əlaqə saxlayın.");

export const COURSE_PAGES_EXAMS = [
  {
    // Səhifədə mətn, lead və təsvir var — yalnız qısa məlumat, FAQ və SEO.
    slug: "ielts-kurslari",
    info: [
      row("Müddət", "3 ay"),
      row("Dərs rejimi", "Həftədə 2 dəfə · 90 dəq + Practice"),
      row("Minimum səviyyə", "Intermediate (B2)"),
      row("Qrup", "3–6, maksimum 7 nəfər"),
      row("Müəllimlər", "IELTS 8.0 dərəcəli"),
    ],
    faq: [
      qa("IELTS kursuna qoşulmaq üçün hansı səviyyə lazımdır?", "Minimum Intermediate (B2) səviyyə tələb olunur. Səviyyəniz aşağıdırsa, Pre-IELTS proqramı ilə başlayırsınız."),
      qa("Hazırlıq nə qədər davam edir?", "Proqram 3 aydır. Dərslər həftədə 2 dəfə, 90 dəqiqə keçirilir, dərsdən asılı olaraq əlavə Practice sessiyaları olur."),
      qa("Academic və General Training arasında fərq nədir?", "Academic modul universitet qəbulu üçündür, General Training isə adətən iş və immiqrasiya məqsədilə verilir. Dinləmə və danışıq hər ikisində eynidir, oxu və yazı tapşırıqları fərqlənir."),
      qa("Dərsləri kim aparır?", "10 illik təcrübəsi və IELTS 8.0 dərəcəsi olan müəllimlər."),
      qa("Qruplar neçə nəfərdir?", "Qruplar 3–6, maksimum 7 nəfərdən ibarətdir."),
    ],
    seo: {
      metaTitle: az("IELTS kursu Bakıda — 8.0 bal sahibi müəllimlər"),
      metaDescription: az("IELTS hazırlığı: 3 aylıq proqram, IELTS 8.0 dərəcəli müəllimlər, həftədə 2 dəfə 90 dəqiqə və əlavə Practice. 3–7 nəfərlik qruplar, minimum B2."),
      keywords: az("IELTS kursu, IELTS hazırlığı, Pre-IELTS, IELTS Bakı, IELTS Academic"),
    },
  },

  {
    slug: "toefl",
    lead: az("Rəsmi TOEFL imtahan mərkəzində hazırlıq — dörd bacarıq, imtahan formatı və vaxtlı sınaqlar."),
    excerpt: az("TOEFL iBT və Pre-TOEFL hazırlığı: oxu, dinləmə, danışıq və yazı üzrə məqsədyönlü proqram. İmtahanı elə bizim mərkəzdə verə bilərsiniz."),
    contentHtml: az(`
<p><strong>TOEFL iBT</strong> ingilis dilində təhsil verən universitetlərin, xüsusən ABŞ və Kanada universitetlərinin geniş qəbul etdiyi akademik ingilis dili imtahanıdır. British Academy <strong>rəsmi TOEFL imtahan mərkəzidir</strong> — hazırlaşdığınız yerdə imtahan da verə bilərsiniz.</p>
<h2>İmtahanın quruluşu</h2>
<ul>
  <li><strong>Reading</strong> — akademik mətnlərin oxunması və anlaşılması</li>
  <li><strong>Listening</strong> — mühazirə və kampus danışıqlarının dinlənilməsi</li>
  <li><strong>Speaking</strong> — kompüterə yazılan şifahi cavablar</li>
  <li><strong>Writing</strong> — oxu və dinləməyə əsaslanan və müstəqil yazı tapşırıqları</li>
</ul>
<h2>Pre-TOEFL və TOEFL</h2>
<p>İmtahan hazırlığı möhkəm dil bazası tələb edir. Səviyyəniz hələ bu bazaya çatmırsa, <strong>Pre-TOEFL</strong> mərhələsi ilə başlayırsınız: qrammatika, akademik lüğət və dörd bacarıq gücləndirilir. Sonra əsas <strong>TOEFL</strong> proqramında imtahan formatı, strategiya və vaxt idarəsi üzərində işlənir.</p>
<h2>Hazırlıq necə gedir</h2>
<ol>
  <li>Səviyyənin və hədəf balın müəyyən edilməsi</li>
  <li>Hər bölmə üzrə tapşırıq tipləri və strategiyalar</li>
  <li>Qeyd götürmə və inteqrasiya olunmuş tapşırıqlar üzrə məşq</li>
  <li>Vaxtlı sınaq imtahanları və fərdi geri bildirim</li>
</ol>
<p>Səviyyənizi <a href="/testler">onlayn testlə</a> yoxlaya bilərsiniz. Kanadada təhsil planlaşdırırsınızsa: <a href="/xaricde-tehsil/kanada">Kanadada təhsil</a>.</p>
`),
    info: [row("İmtahan", "TOEFL iBT"), row("Bölmələr", "Reading · Listening · Speaking · Writing"), row("Mərhələlər", "Pre-TOEFL → TOEFL"), row("İmtahan mərkəzi", "Rəsmi TOEFL mərkəzi")],
    faq: [
      qa("TOEFL-i harada verə bilərəm?", "British Academy rəsmi TOEFL imtahan mərkəzidir — imtahanı bizim mərkəzdə verə bilərsiniz. Qeydiyyat və tarixlər üçün bizimlə əlaqə saxlayın."),
      qa("Pre-TOEFL nədir?", "Dil bazası imtahan hazırlığı üçün hələ yetərli olmayanlar üçün hazırlıq mərhələsidir: qrammatika, akademik lüğət və dörd bacarıq gücləndirilir, sonra əsas TOEFL proqramına keçilir."),
      qa("TOEFL və IELTS arasında necə seçim edim?", "Hər ikisi geniş qəbul olunur. Əvvəlcə müraciət edəcəyiniz universitetin hansını qəbul etdiyinə baxın. ABŞ universitetləri TOEFL-ə daha çox üstünlük verir, İngiltərə üçün IELTS daha yayğındır."),
      qa("Hazırlıq nə qədər vaxt aparır?", "Başlanğıc səviyyənizdən və hədəf balınızdan asılıdır. İlkin səviyyə yoxlamasından sonra sizə uyğun plan təklif olunur."),
      SCHEDULE_Q,
    ],
    seo: {
      metaTitle: az("TOEFL hazırlığı — rəsmi TOEFL imtahan mərkəzi"),
      metaDescription: az("TOEFL iBT və Pre-TOEFL hazırlığı: dörd bölmə üzrə strategiya, vaxtlı sınaq imtahanları və fərdi geri bildirim. İmtahanı rəsmi mərkəzimizdə verin."),
      keywords: az("TOEFL kursu, TOEFL iBT, Pre-TOEFL, TOEFL Bakı, TOEFL imtahan mərkəzi"),
    },
  },

  {
    slug: "oet",
    lead: az("Həkim, tibb bacısı, əczaçı və digər tibb işçiləri üçün peşəyə yönəlmiş ingilis dili imtahanına hazırlıq."),
    excerpt: az("OET (Occupational English Test) hazırlığı: tibbi kontekstdə dinləmə, oxu, yazı və pasiyentlə danışıq."),
    contentHtml: az(`
<p><strong>OET (Occupational English Test)</strong> tibb işçiləri üçün hazırlanmış ingilis dili imtahanıdır. Ümumi imtahanlardan fərqli olaraq burada dil real klinik vəziyyətlər üzərində yoxlanılır: pasiyentlə danışıq, həmkara yönləndirmə məktubu, tibbi mətnlər.</p>
<h2>Kimlər üçündür</h2>
<p>Həkimlər, tibb bacıları, stomatoloqlar, əczaçılar, fizioterapevtlər və digər səhiyyə mütəxəssisləri — xüsusən İngiltərə, İrlandiya, Avstraliya və Yeni Zelandiya kimi ölkələrdə qeydiyyat və iş planlaşdıranlar. Hansı qurumun OET-i qəbul etdiyini əvvəlcədən yoxlayın.</p>
<h2>İmtahanın quruluşu</h2>
<ul>
  <li><strong>Listening</strong> — konsultasiya və tibbi mühazirələr</li>
  <li><strong>Reading</strong> — tibbi mətnlər və təlimatlar</li>
  <li><strong>Writing</strong> — peşəyə uyğun məktub (məsələn, yönləndirmə və ya çıxarış məktubu)</li>
  <li><strong>Speaking</strong> — pasiyentlə rol oyunu</li>
</ul>
<p>Yazı və danışıq hissələri <strong>peşəyə görə</strong> fərqlənir — həkim həkimə, tibb bacısı tibb bacısına uyğun tapşırıq alır.</p>
<h2>Hazırlıqda nə edilir</h2>
<ol>
  <li>Tibbi lüğət və klinik ünsiyyət ifadələri</li>
  <li>Məktub yazısının quruluşu və qiymətləndirmə meyarları</li>
  <li>Pasiyentlə rol oyunlarının məşqi</li>
  <li>Vaxtlı sınaq imtahanları</li>
</ol>
`),
    info: [row("Sahə", "Səhiyyə mütəxəssisləri"), row("Bölmələr", "Listening · Reading · Writing · Speaking"), row("Xüsusiyyət", "Yazı və danışıq peşəyə uyğun")],
    faq: [
      qa("OET kimlər üçündür?", "Həkim, tibb bacısı, stomatoloq, əczaçı, fizioterapevt və digər səhiyyə mütəxəssisləri üçün — xaricdə qeydiyyat və iş üçün ingilis dili biliyini təsdiqləmək məqsədilə."),
      qa("OET-in IELTS-dən fərqi nədir?", "OET dili tibbi kontekstdə yoxlayır: mətnlər, məktub və danışıq tapşırıqları klinik vəziyyətlərdən götürülür. Bir çox tibb işçisi üçün bu, məzmun baxımından daha tanış formatdır."),
      qa("OET hansı ölkələrdə qəbul olunur?", "İngiltərə, İrlandiya, Avstraliya, Yeni Zelandiya və başqa ölkələrdə bir çox səhiyyə qurumu qəbul edir. Konkret qurumun tələbini əvvəlcədən yoxlamaq vacibdir."),
      qa("Başlamaq üçün hansı səviyyə lazımdır?", "İmtahan yuxarı-orta və daha yüksək səviyyədə dil biliyi tələb edir. İlkin səviyyə yoxlamasından sonra sizə uyğun plan təklif olunur."),
      SCHEDULE_Q,
    ],
    seo: {
      metaTitle: az("OET hazırlığı — tibb işçiləri üçün ingilis dili"),
      metaDescription: az("OET hazırlığı: həkim, tibb bacısı, əczaçı və digər tibb işçiləri üçün. Tibbi lüğət, yönləndirmə məktubu, pasiyentlə rol oyunları və sınaq imtahanları."),
      keywords: az("OET, OET hazırlığı, tibb işçiləri ingilis dili, Occupational English Test"),
    },
  },

  {
    slug: "toeic",
    lead: az("İşgüzar ingilis dilinin beynəlxalq ölçüsü — hazırlıq və imtahan eyni mərkəzdə."),
    excerpt: az("TOEIC hazırlığı və rəsmi imtahan: iş mühitində ingilis dili bacarığını təsdiqləyən beynəlxalq sertifikat."),
    contentHtml: az(`
<p><strong>TOEIC</strong> iş mühitində ingilis dili bacarığını ölçən beynəlxalq imtahandır. Şirkətlər onu işə qəbulda və əməkdaşların dil səviyyəsini qiymətləndirmək üçün istifadə edir. British Academy <strong>rəsmi TOEIC imtahan mərkəzidir</strong>.</p>
<h2>İmtahan nəyi yoxlayır</h2>
<ul>
  <li><strong>Listening &amp; Reading</strong> — ən geniş yayılmış format: iclas, elan, e-poçt, hesabat və reklam kimi iş mətnləri</li>
  <li><strong>Speaking &amp; Writing</strong> — şifahi və yazılı ünsiyyət bacarıqları</li>
</ul>
<h2>Kimlər üçündür</h2>
<p>İş axtaranlar, CV-sinə tanınmış dil sertifikatı əlavə etmək istəyənlər, beynəlxalq şirkətlərdə çalışanlar və əməkdaşlarının səviyyəsini ölçmək istəyən şirkətlər.</p>
<h2>Hazırlıq necə gedir</h2>
<ol>
  <li>İlkin səviyyə yoxlaması</li>
  <li>Hər hissənin tapşırıq tipləri və strategiyası</li>
  <li>İşgüzar lüğət və qrammatik tələlər</li>
  <li>Vaxtlı sınaq imtahanları</li>
</ol>
<p>İşgüzar dil bazanızı gücləndirmək istəyirsinizsə: <a href="/kurslar/biznes-ingilis-dili-kursu">Biznes İngilis dili kursu</a>.</p>
`),
    info: [row("İmtahan mərkəzi", "Rəsmi TOEIC mərkəzi"), row("Formatlar", "Listening & Reading · Speaking & Writing"), row("Sahə", "İşgüzar ingilis dili")],
    faq: [
      qa("TOEIC imtahanını harada verə bilərəm?", "British Academy rəsmi TOEIC imtahan mərkəzidir. Qeydiyyat və tarixlər üçün bizimlə əlaqə saxlayın."),
      qa("TOEIC nə üçün lazımdır?", "İş mühitində ingilis dili bacarığını təsdiqləmək üçün. Bir çox şirkət işə qəbulda və əməkdaşların qiymətləndirilməsində TOEIC nəticəsindən istifadə edir."),
      qa("TOEIC ilə IELTS/TOEFL arasında fərq nədir?", "IELTS və TOEFL əsasən akademik məqsədlər (universitet qəbulu) üçündür. TOEIC isə işgüzar kontekstə yönəlib: mətnlər və tapşırıqlar iş həyatından götürülür."),
      qa("Hazırlıq nə qədər vaxt aparır?", "Başlanğıc səviyyənizdən və hədəf nəticədən asılıdır. İlkin yoxlamadan sonra uyğun plan təklif olunur."),
      SCHEDULE_Q,
    ],
    seo: {
      metaTitle: az("TOEIC imtahanı və hazırlıq — rəsmi TOEIC mərkəzi"),
      metaDescription: az("TOEIC hazırlığı və rəsmi imtahan: iş mühitində ingilis dili bacarığını təsdiqləyən beynəlxalq sertifikat. Hazırlıq və imtahan eyni mərkəzdə."),
      keywords: az("TOEIC, TOEIC imtahanı, TOEIC Bakı, TOEIC hazırlığı, işgüzar ingilis dili"),
    },
  },

  {
    slug: "sat-kurslari",
    lead: az("ABŞ və digər ölkələrdə bakalavr qəbulu üçün SAT hazırlığı — riyaziyyat, oxu və yazı."),
    excerpt: az("SAT və Pre-SAT hazırlığı: Math və Reading & Writing bölmələri, imtahan strategiyası və sınaq testləri."),
    contentHtml: az(`
<p><strong>SAT</strong> ABŞ universitetlərinin bakalavr qəbulunda geniş istifadə olunan standartlaşdırılmış imtahandır. Nəticəsini bir çox başqa ölkənin universitetləri də, o cümlədən Türkiyədə xarici tələbə qəbulunda qəbul edir.</p>
<h2>İmtahanın quruluşu</h2>
<p>İmtahan rəqəmsal formatda keçirilir və iki bölmədən ibarətdir:</p>
<ul>
  <li><strong>Reading and Writing</strong> — qısa mətnlər üzrə anlama, lüğət, qrammatika və mətnin redaktəsi</li>
  <li><strong>Math</strong> — cəbr, funksiyalar, məlumatların təhlili, həndəsə və triqonometriya əsasları</li>
</ul>
<h2>Pre-SAT və SAT</h2>
<p><strong>Pre-SAT</strong> mərhələsində riyazi baza və ingilis dilində akademik oxu bacarığı gücləndirilir. Əsas <strong>SAT</strong> proqramında tapşırıq tipləri, strategiya və vaxt idarəsi üzərində işlənir.</p>
<h2>Hazırlıq necə gedir</h2>
<ol>
  <li>Diaqnostik test ilə başlanğıc nöqtəsi</li>
  <li>Mövzular üzrə boşluqların doldurulması</li>
  <li>Tapşırıq tipləri və strategiya</li>
  <li>Tam formatlı sınaq imtahanları</li>
</ol>
<p>Xaricdə bakalavr planlaşdırırsınızsa: <a href="/xaricde-tehsil/turkiye">Türkiyədə təhsil</a>, <a href="/xaricde-tehsil/teqaud-proqramlari">təqaüd proqramları</a>.</p>
`),
    info: [row("Bölmələr", "Reading & Writing · Math"), row("Format", "Rəqəmsal imtahan"), row("Mərhələlər", "Pre-SAT → SAT"), row("Məqsəd", "Bakalavr qəbulu")],
    faq: [
      qa("SAT nə üçün lazımdır?", "ABŞ universitetlərinin bakalavr qəbulunda geniş istifadə olunur. Bir çox başqa ölkənin universiteti də, o cümlədən Türkiyədə xarici tələbə qəbulunda, SAT nəticəsini qəbul edir."),
      qa("SAT neçə bölmədən ibarətdir?", "İki bölmədən: Reading and Writing və Math. İmtahan rəqəmsal formatda keçirilir."),
      qa("Pre-SAT nədir?", "Əsas hazırlığa keçməzdən əvvəl riyazi bazanı və ingilis dilində akademik oxu bacarığını gücləndirən mərhələdir."),
      qa("Hazırlığa nə vaxt başlamaq lazımdır?", "Müraciət tarixindən xeyli əvvəl — imtahanı lazım olsa təkrar verməyə vaxt qalsın. Dəqiq plan diaqnostik testdən sonra qurulur."),
      SCHEDULE_Q,
    ],
    seo: {
      metaTitle: az("SAT kursu — SAT və Pre-SAT hazırlığı Bakıda"),
      metaDescription: az("SAT hazırlığı: Math və Reading & Writing bölmələri, diaqnostik test, strategiya və tam formatlı sınaq imtahanları. Xaricdə bakalavr qəbulu üçün."),
      keywords: az("SAT kursu, SAT hazırlığı, Pre-SAT, Digital SAT, SAT Bakı"),
    },
  },

  {
    // Səhifədə mətn var — lead, təsvir, məlumat, FAQ və SEO.
    slug: "duolingo",
    lead: az("Onlayn verilən, universitetlərin getdikcə daha çox qəbul etdiyi ingilis dili imtahanına hazırlıq."),
    excerpt: az("Duolingo English Test (DET) hazırlığı: həftədə 2 dəfə 90 dəqiqə, minimum B1+ səviyyə."),
    info: [row("İmtahan", "Duolingo English Test"), row("Dərs rejimi", "Həftədə 2 dəfə · 90 dəq"), row("Minimum səviyyə", "B1+"), row("Məqsəd", "Universitet qəbulu")],
    faq: [
      qa("Duolingo English Test nədir?", "Xaricdə universitet və kollec təhsili üçün ingilis dili biliyini təsdiqləyən beynəlxalq imtahandır. İmtahan onlayn verilir."),
      qa("Kursa qoşulmaq üçün hansı səviyyə lazımdır?", "Tələbə ən azı B1+ səviyyəsində olmalıdır."),
      qa("Dərslər necə keçirilir?", "Həftədə 2 dəfə, 90 dəqiqə."),
      qa("Bütün universitetlər Duolingo nəticəsini qəbul edirmi?", "Xeyr, qəbul edən universitetlərin sayı çoxdur, amma hamısı qəbul etmir. Müraciət edəcəyiniz proqramın tələbini əvvəlcədən yoxlayın."),
    ],
    seo: {
      metaTitle: az("Duolingo English Test hazırlığı — DET kursu"),
      metaDescription: az("Duolingo English Test (DET) hazırlığı: xaricdə universitet qəbulu üçün. Həftədə 2 dəfə 90 dəqiqəlik dərslər, minimum B1+ səviyyə."),
      keywords: az("Duolingo English Test, DET, Duolingo imtahanı, Duolingo hazırlığı"),
    },
  },

  {
    slug: "toles",
    lead: az("Hüquqi ingilis dili üzrə beynəlxalq sertifikat — hüquqşünaslar və hüquq tələbələri üçün hazırlıq."),
    excerpt: az("TOLES (Test of Legal English Skills) hazırlığı: hüquqi terminologiya, müqavilə dili və hüquqi yazı."),
    contentHtml: az(`
<p><strong>TOLES (Test of Legal English Skills)</strong> hüquqi ingilis dili bacarığını ölçən beynəlxalq imtahandır. Onu hüquqşünaslar, hüquq firmalarının əməkdaşları və hüquq fakültəsinin tələbələri verir.</p>
<h2>İmtahan səviyyələri</h2>
<ul>
  <li><strong>Foundation</strong> — hüquqi terminologiyanın əsasları</li>
  <li><strong>Higher</strong> — hüquqi sənədlərin dili, müqavilə bəndləri</li>
  <li><strong>Advanced</strong> — mürəkkəb hüquqi mətnlərin təhlili və yazı</li>
</ul>
<h2>Hazırlıqda nə edilir</h2>
<ol>
  <li>Hüquqi terminologiya və tez qarışdırılan anlayışlar</li>
  <li>Müqavilə dili: öhdəlik, şərt, zəmanət, məsuliyyət ifadələri</li>
  <li>Hüquqi yazışma və sənəd redaktəsi</li>
  <li>İmtahan formatında sınaq tapşırıqları</li>
</ol>
<p>Hüquqi dil bazasını qurmaq üçün əvvəlcə <a href="/kurslar/huquqsunaslar-ingilis-dili-kursu">Hüquqşünaslar üçün İngilis dili</a> kursuna da baxa bilərsiniz.</p>
`),
    info: [row("İmtahan", "Test of Legal English Skills"), row("Səviyyələr", "Foundation · Higher · Advanced"), row("Sahə", "Hüquqi ingilis dili")],
    faq: [
      qa("TOLES kimlər üçündür?", "Hüquqşünaslar, hüquq firmalarının əməkdaşları, hüquq tələbələri və hüquqi ingilis dili biliyini sertifikatla təsdiqləmək istəyənlər üçün."),
      qa("TOLES-in hansı səviyyələri var?", "Foundation, Higher və Advanced. Səviyyə mövcud dil biliyinizə görə seçilir."),
      qa("TOLES ilə Hüquqşünaslar üçün İngilis dili kursu arasında fərq nədir?", "Kurs hüquqi ingilis dilinin bazasını qurur, TOLES hazırlığı isə bu bazanı konkret imtahan formatına yönəldir."),
      SCHEDULE_Q,
    ],
    seo: {
      metaTitle: az("TOLES hazırlığı — hüquqi ingilis dili sertifikatı"),
      metaDescription: az("TOLES (Test of Legal English Skills) hazırlığı: Foundation, Higher və Advanced səviyyələri, hüquqi terminologiya, müqavilə dili və sınaq tapşırıqları."),
      keywords: az("TOLES, Legal English, hüquqi ingilis dili sertifikatı, TOLES hazırlığı"),
    },
  },

  {
    slug: "tefl-kurslari",
    lead: az("İngilis dilini xarici dil kimi tədris etmək üçün beynəlxalq müəllim sertifikatı proqramı."),
    excerpt: az("TEFL: ingilis dili müəllimləri və müəllim olmaq istəyənlər üçün metodika, dərs planlaşdırma və sinif idarəçiliyi."),
    contentHtml: az(`
<p><strong>TEFL (Teaching English as a Foreign Language)</strong> ingilis dilini ana dili olmayanlara tədris etmək üçün müəllim hazırlığı proqramıdır. Sertifikat dil kurslarında, məktəblərdə və onlayn platformalarda müəllimlik üçün tanınır.</p>
<h2>Proqram nə öyrədir</h2>
<ul>
  <li>Dil tədrisinin əsas metodları və kommunikativ yanaşma</li>
  <li>Dərs planlaşdırma — məqsəd, mərhələlər, fəaliyyətlər</li>
  <li>Qrammatika, lüğət və tələffüzün tədrisi</li>
  <li>Dörd bacarığın — oxu, dinləmə, danışıq, yazı — tədrisi</li>
  <li>Sinif idarəçiliyi və fərqli səviyyələrlə iş</li>
  <li>Qiymətləndirmə və geri bildirim</li>
</ul>
<h2>Kimlər üçündür</h2>
<p>İngilis dili müəllimliyinə başlamaq istəyənlər, metodikasını sistemləşdirmək istəyən müəllimlər, xaricdə və ya onlayn dərs demək planlaşdıranlar.</p>
<h2>Tələb olunan səviyyə</h2>
<p>Tədris üçün ingilis dilini yüksək səviyyədə bilmək lazımdır. Səviyyənizi əvvəlcə <a href="/testler">onlayn testlə</a> yoxlaya bilərsiniz.</p>
`),
    info: [row("Proqram", "Teaching English as a Foreign Language"), row("Növ", "Peşəkar sertifikat"), row("Kimlər üçün", "Müəllimlər və namizədlər")],
    faq: [
      qa("TEFL nədir?", "İngilis dilini xarici dil kimi tədris etmək üçün müəllim hazırlığı proqramı və sertifikatıdır."),
      qa("TEFL üçün müəllim diplomu lazımdırmı?", "Proqram həm təcrübəli müəllimlər, həm də müəllimliyə yeni başlayanlar üçündür. Əsas şərt ingilis dilini yüksək səviyyədə bilməkdir."),
      qa("TEFL sertifikatı ilə harada işləmək olar?", "Dil kurslarında, özəl məktəblərdə, onlayn platformalarda və xaricdə ingilis dili tədrisi proqramlarında. Konkret işəgötürənin tələbini əvvəlcədən yoxlayın."),
      SCHEDULE_Q,
    ],
    seo: {
      metaTitle: az("TEFL kursu — ingilis dili müəllimi sertifikatı"),
      metaDescription: az("TEFL kursu: ingilis dilini xarici dil kimi tədris etmək üçün metodika, dərs planlaşdırma, sinif idarəçiliyi və beynəlxalq müəllim sertifikatı."),
      keywords: az("TEFL, TEFL kursu, TEFL sertifikatı, ingilis dili müəllimi"),
    },
  },
];
