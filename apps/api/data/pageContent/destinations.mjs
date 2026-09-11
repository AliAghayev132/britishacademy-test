/**
 * «Xaricdə təhsil» ölkə səhifələrinin başlanğıc məzmunu.
 *
 * Canlı saytda 12 səhifənin heç birində mətn yox idi — yalnız ölkə adı və
 * qısa şüar. Burada ölkələr haqqında YALNIZ sabit, ümumi məlumat yazılıb;
 * təhsil haqqı, maliyyə sübutunun məbləği, müraciət tarixləri kimi hər il
 * dəyişən rəqəmlər qəsdən yoxdur — onlar konsultasiyada dəqiqləşdirilir.
 */
const az = (text) => ({ az: text, en: "", ru: "" });
const row = (label, value) => ({ label: az(label), value: az(value) });
const qa = (question, answer) => ({ question: az(question), answer: az(answer) });

/** Hər ölkənin sonunda eyni «necə kömək edirik» bloku. */
const HELP = (country) => `
<h2>British Academy necə kömək edir</h2>
<ol>
  <li>Məqsədinizə və büdcənizə uyğun ${country} universitetləri və proqramların seçilməsi</li>
  <li>Sənədlərin siyahısı və hazırlanması üzrə məsləhət</li>
  <li>Müraciət prosesinin addım-addım izlənməsi</li>
  <li>Tələb olunan dil imtahanına hazırlıq — <a href="/kurslar/ielts-kurslari">IELTS</a>, <a href="/kurslar/toefl">TOEFL</a>, <a href="/kurslar/duolingo">Duolingo</a></li>
</ol>
<p>Pulsuz ilkin konsultasiya üçün <a href="/elaqe">bizimlə əlaqə saxlayın</a>.</p>
`;

const COST_Q = (where) => qa(`${where} təhsil nə qədər başa gəlir?`, "Xərc universitetdən, proqramdan və şəhərdən asılıdır və hər il dəyişir. Konsultasiyada seçdiyiniz proqramlar üzrə aktual təhsil haqqı və yaşayış xərcləri hesablanır.");

export const DESTINATION_PAGES = [
  {
    slug: "almaniya",
    lead: az("Əksər dövlət universitetlərində təhsil haqqı yoxdur, diplom bütün dünyada tanınır — Almaniya xaricdə təhsilin ən populyar istiqamətlərindən biridir."),
    contentHtml: az(`
<p>Almaniya güclü mühəndislik, texnologiya, tibb və iqtisadiyyat məktəbləri ilə tanınır. Ölkənin əsas üstünlüyü: <strong>əksər dövlət universitetlərində bakalavr və magistr təhsili üçün təhsil haqqı alınmır</strong> — tələbə yalnız semestr haqqı ödəyir. (Bəzi federal əyalətlər AB-dən kənar tələbələrdən təhsil haqqı alır — proqram seçiləndə bu yoxlanılır.)</p>
<h2>Təhsil dili</h2>
<p>Proqramların əksəriyyəti alman dilindədir, lakin xüsusən magistraturada <strong>ingilis dilində</strong> çox sayda proqram var. Alman dilli proqram üçün TestDaF, DSH və ya Goethe C1 kimi sertifikat, ingilisdilli proqram üçün IELTS və ya TOEFL istənilir.</p>
<h2>Bakalavr üçün diqqət</h2>
<p>Bəzi hallarda Azərbaycan attestatı birbaşa qəbul üçün kifayət etmir və tələbə əvvəlcə <strong>Studienkolleg</strong> (hazırlıq ili) keçir və ya yerli universitetdə bir-iki il oxuduqdan sonra müraciət edir. Hansı yolun sizə aid olduğu attestat və ixtisasa görə müəyyən edilir.</p>
<h2>Viza və maliyyə</h2>
<p>Tələbə vizası üçün adətən qəbul məktubu və yaşayış xərclərini qarşılayan maliyyə sübutu — çox vaxt <strong>bloklanmış hesab (Sperrkonto)</strong> — tələb olunur. Tələbələr qanunla müəyyən limitlər daxilində işləyə bilər.</p>
${HELP("Almaniya")}
<p>Alman dilini bizdə öyrənə bilərsiniz: <a href="/kurslar/alman-dili-kursu">Alman dili kursu</a> və <a href="/kurslar/beynelxalq-sertifikatli-alman-dili-kursu">beynəlxalq sertifikatlı alman dili</a>.</p>
`),
    facts: [
      row("Təhsil haqqı", "Əksər dövlət universitetlərində yoxdur"),
      row("Təhsil dili", "Alman, ingilis"),
      row("Dil sertifikatı", "TestDaF / DSH / Goethe · IELTS / TOEFL"),
      row("Viza", "Tələbə vizası, bloklanmış hesab"),
    ],
    faq: [
      qa("Almaniyada təhsil həqiqətən ödənişsizdir?", "Əksər dövlət universitetlərində bakalavr və magistr üçün təhsil haqqı alınmır, tələbə yalnız semestr haqqı ödəyir. Bəzi federal əyalətlər AB-dən kənar tələbələrdən haqq alır, özəl universitetlər isə ödənişlidir. Yaşayış xərcləri isə hər halda tələbənin öz üzərindədir."),
      qa("Alman dilini bilmədən oxumaq olarmı?", "Bəli, ingilisdilli proqramlara müraciət etmək olar — xüsusən magistraturada seçim genişdir. Amma gündəlik həyat və iş üçün alman dili böyük üstünlük verir."),
      qa("Studienkolleg nədir?", "Attestatı birbaşa qəbul üçün kifayət etməyən xarici tələbələr üçün hazırlıq ilidir. Sonunda keçirilən imtahan universitetə qəbul hüququ verir."),
      qa("Bloklanmış hesab nədir?", "Viza üçün yaşayış xərclərini sübut etməyin ən geniş yayılmış yoludur: məbləğ xüsusi hesaba yatırılır və Almaniyada aylıq hissələrlə istifadəyə verilir. Tələb olunan məbləğ hər il yenilənir."),
      qa("Almaniyada oxuyarkən işləmək olarmı?", "Bəli, qanunla müəyyən edilmiş limitlər daxilində. Bu, yaşayış xərclərinin bir hissəsini qarşılamağa kömək edir."),
    ],
    seo: {
      metaTitle: az("Almaniyada təhsil — ödənişsiz dövlət universitetləri"),
      metaDescription: az("Almaniyada təhsil: əksər dövlət universitetlərində təhsil haqqı yoxdur, alman və ingilis dilində proqramlar, Studienkolleg, bloklanmış hesab və viza."),
      keywords: az("Almaniyada təhsil, Almaniya universitetləri, Studienkolleg, Sperrkonto, Almaniya tələbə vizası"),
    },
  },

  {
    slug: "turkiye",
    lead: az("Mədəni yaxınlıq, dil rahatlığı və geniş universitet seçimi — Türkiyədə bakalavr və magistr təhsili."),
    contentHtml: az(`
<p>Türkiyə azərbaycanlı tələbələr üçün ən rahat istiqamətlərdən biridir: dil maneəsi azdır, mədəniyyət tanışdır, uçuş qısadır. Ölkədə çox sayda <strong>dövlət</strong> və <strong>vəqf (özəl)</strong> universiteti fəaliyyət göstərir.</p>
<h2>Universitet növləri</h2>
<ul>
  <li><strong>Dövlət universitetləri</strong> — təhsil haqqı daha aşağıdır, qəbul rəqabətlidir</li>
  <li><strong>Vəqf universitetləri</strong> — ödənişlidir, çox vaxt təqaüd və endirim imkanları var</li>
</ul>
<h2>Qəbul yolları</h2>
<p>Xarici tələbələr bakalavra adətən universitetlərin öz qəbul imtahanları (YÖS tipli), <a href="/kurslar/sat-kurslari">SAT</a> nəticəsi və ya attestat balı ilə qəbul olunur. Tələblər universitetdən universitetə dəyişir.</p>
<h2>Təhsil dili</h2>
<p>Proqramlar türk və ingilis dilindədir. İngilisdilli proqramlarda dil biliyi IELTS/TOEFL ilə və ya universitetin öz imtahanı ilə yoxlanılır; kifayət etmədikdə tələbə hazırlıq ilini keçir.</p>
<h2>Təqaüd</h2>
<p><strong>Türkiye Bursları</strong> dövlət təqaüd proqramı təhsil haqqını, yaşayış və digər xərclərin bir hissəsini qarşılayır. Digər imkanlar üçün: <a href="/xaricde-tehsil/teqaud-proqramlari">Təqaüd proqramları</a>.</p>
${HELP("Türkiyə")}
`),
    facts: [
      row("Universitetlər", "Dövlət və vəqf"),
      row("Təhsil dili", "Türk, ingilis"),
      row("Qəbul", "Universitet imtahanı / SAT / attestat"),
      row("Təqaüd", "Türkiye Bursları"),
    ],
    faq: [
      qa("Türkiyədə universitetə necə qəbul olmaq olar?", "Xarici tələbələr bakalavra adətən universitetin öz qəbul imtahanı, SAT nəticəsi və ya attestat balı ilə qəbul olunur. Tələblər universitetə görə dəyişir."),
      qa("Dövlət və vəqf universitetləri arasında fərq nədir?", "Dövlət universitetlərində təhsil haqqı aşağıdır, qəbul daha rəqabətlidir. Vəqf universitetləri ödənişlidir, amma çox vaxt təqaüd və endirim imkanları təklif edir."),
      qa("İngilis dilində oxumaq mümkündürmü?", "Bəli, bir çox universitetdə ingilisdilli proqramlar var. Dil səviyyəsi IELTS/TOEFL və ya universitetin öz imtahanı ilə yoxlanılır."),
      qa("Türkiye Bursları nədir?", "Türkiyə dövlətinin xarici tələbələr üçün təqaüd proqramıdır — təhsil haqqını, yaşayış və digər xərclərin bir hissəsini qarşılayır."),
      COST_Q("Türkiyədə"),
    ],
    seo: {
      metaTitle: az("Türkiyədə təhsil — bakalavr və magistr"),
      metaDescription: az("Türkiyədə təhsil: dövlət və vəqf universitetləri, türk və ingilis dilində proqramlar, SAT və universitet imtahanları ilə qəbul, Türkiye Bursları təqaüdü."),
      keywords: az("Türkiyədə təhsil, Türkiyə universitetləri, Türkiye Bursları, YÖS, Türkiyədə bakalavr"),
    },
  },

  {
    slug: "ingiltere",
    lead: az("Dünyanın ən tanınmış universitetləri, qısa və intensiv proqramlar — İngiltərədə təhsil."),
    contentHtml: az(`
<p>Böyük Britaniya universitetləri beynəlxalq reytinqlərin yuxarı sıralarında yer alır və diplomları bütün dünyada tanınır. Əsas üstünlüklərdən biri <strong>proqramların qısa olmasıdır</strong>.</p>
<h2>Proqramların müddəti</h2>
<ul>
  <li><strong>Bakalavr</strong> — İngiltərədə adətən 3 il (Şotlandiyada 4 il)</li>
  <li><strong>Magistr</strong> — əksər proqramlarda 1 il</li>
</ul>
<h2>Müraciət</h2>
<p>Bakalavr müraciətləri mərkəzləşdirilmiş <strong>UCAS</strong> sistemi ilə, magistr müraciətləri isə birbaşa universitetə edilir. Motivasiya məktubu və tövsiyə məktubları qəbulda mühüm rol oynayır. Bəzi hallarda attestatla birbaşa bakalavr qəbulu mümkün olmur və tələbə əvvəlcə <strong>Foundation</strong> proqramı keçir.</p>
<h2>Dil tələbi</h2>
<p>Ən çox tələb olunan imtahan <a href="/kurslar/ielts-kurslari">IELTS</a>-dir; bir çox universitet başqa imtahanları da qəbul edir. Tələb olunan bal proqrama görə dəyişir.</p>
<h2>Viza</h2>
<p>Tələbə vizası üçün universitetin qəbul təsdiqi, maliyyə sübutu və dil tələbinə uyğunluq lazımdır. Təhsildən sonra məzunlar üçün iş axtarmağa imkan verən viza marşrutu mövcuddur — şərtlər vaxtaşırı yenilənir.</p>
${HELP("İngiltərə")}
`),
    facts: [
      row("Bakalavr", "Adətən 3 il"),
      row("Magistr", "Adətən 1 il"),
      row("Müraciət", "UCAS (bakalavr) · birbaşa (magistr)"),
      row("Dil imtahanı", "IELTS və digərləri"),
    ],
    faq: [
      qa("İngiltərədə bakalavr neçə il davam edir?", "İngiltərədə adətən 3 il, Şotlandiyada 4 il. Magistr proqramlarının əksəriyyəti 1 ildir."),
      qa("UCAS nədir?", "Böyük Britaniya universitetlərinə bakalavr müraciətlərinin edildiyi mərkəzləşdirilmiş sistemdir. Bir müraciətlə bir neçə universitetə müraciət etmək olur."),
      qa("Foundation proqramı nədir?", "Attestatı birbaşa bakalavr qəbulu üçün kifayət etməyən tələbələr üçün bir illik hazırlıq proqramıdır. Uğurla bitirən tələbə bakalavra keçir."),
      qa("Hansı IELTS balı lazımdır?", "Universitetdən və proqramdan asılıdır. Dəqiq tələb proqram seçildikdən sonra müəyyən edilir."),
      COST_Q("İngiltərədə"),
    ],
    seo: {
      metaTitle: az("İngiltərədə təhsil — bakalavr, magistr, UCAS"),
      metaDescription: az("İngiltərədə təhsil: 3 illik bakalavr, 1 illik magistr, UCAS müraciəti, Foundation proqramı, IELTS tələbi və tələbə vizası haqqında əsas məlumat."),
      keywords: az("İngiltərədə təhsil, Böyük Britaniya universitetləri, UCAS, Foundation, UK tələbə vizası"),
    },
  },

  {
    slug: "kanada",
    lead: az("Yüksək həyat keyfiyyəti, tanınmış diplom və təhsildən sonra iş imkanları — Kanadada bakalavr, magistr və dil proqramları."),
    contentHtml: az(`
<p>Kanada təhlükəsiz, çoxmədəniyyətli və beynəlxalq tələbələrə açıq ölkədir. Burada həm <strong>universitetlər</strong>, həm də peşə yönümlü <strong>kolleclər</strong> geniş seçim təklif edir.</p>
<h2>Təhsil növləri</h2>
<ul>
  <li><strong>Universitet</strong> — bakalavr, magistr və doktorantura</li>
  <li><strong>Kollec</strong> — praktik, işə yönəlmiş diplom və sertifikat proqramları</li>
  <li><strong>Dil proqramları</strong> — ingilis və ya fransız dili</li>
</ul>
<h2>Təhsil dili</h2>
<p>Ölkənin iki rəsmi dili var. Əksər proqramlar ingilis dilindədir; Kvebek əyalətində və bəzi başqa yerlərdə fransızdilli proqramlar var. Dil biliyi <a href="/kurslar/ielts-kurslari">IELTS</a>, <a href="/kurslar/toefl">TOEFL</a> və ya <a href="/kurslar/duolingo">Duolingo</a> ilə təsdiqlənir; fransız dili üçün: <a href="/kurslar/fransiz-dili-kursu">Fransız dili kursu</a>.</p>
<h2>Təhsil icazəsi</h2>
<p>Kanadada oxumaq üçün <strong>study permit</strong> (təhsil icazəsi) lazımdır. Müraciət üçün qəbul məktubu, maliyyə sübutu və digər sənədlər tələb olunur. Kvebekdə oxuyanlar üçün əlavə əyalət sənədi tələb olunur. Qaydalar və kvotalar vaxtaşırı dəyişir.</p>
<h2>Təhsildən sonra</h2>
<p>Uyğun proqramları bitirən məzunlar təhsildən sonra iş icazəsinə müraciət edə bilər — bu, Kanadada iş təcrübəsi qazanmağa imkan verir. Şərtlər proqrama görə dəyişir.</p>
${HELP("Kanada")}
`),
    facts: [
      row("Təhsil növləri", "Universitet, kollec, dil proqramı"),
      row("Təhsil dili", "İngilis, fransız"),
      row("Sənəd", "Study permit (təhsil icazəsi)"),
      row("Dil imtahanı", "IELTS / TOEFL / Duolingo"),
    ],
    faq: [
      qa("Kanadada kollec və universitet arasında fərq nədir?", "Universitetlər akademik dərəcə (bakalavr, magistr) verir. Kolleclər isə daha qısa, praktik və birbaşa işə yönəlmiş diplom və sertifikat proqramları təklif edir."),
      qa("Study permit nədir?", "Kanadada təhsil almaq üçün tələb olunan icazədir. Müraciətə qəbul məktubu, maliyyə sübutu və digər sənədlər daxildir."),
      qa("Fransız dili lazımdırmı?", "Əksər proqramlar ingilis dilindədir. Fransız dili Kvebekdə və fransızdilli proqramlarda tələb olunur, digər hallarda isə üstünlük verir."),
      qa("Təhsildən sonra Kanadada işləmək olarmı?", "Uyğun proqramları bitirən məzunlar təhsildən sonra iş icazəsinə müraciət edə bilər. Şərtlər proqrama görə dəyişir və vaxtaşırı yenilənir."),
      COST_Q("Kanadada"),
    ],
    seo: {
      metaTitle: az("Kanadada təhsil — universitet, kollec və dil"),
      metaDescription: az("Kanadada təhsil: universitet və kollec proqramları, ingilis və fransız dili, study permit, IELTS/TOEFL/Duolingo tələbi və təhsildən sonra iş imkanları."),
      keywords: az("Kanadada təhsil, Kanada universitetləri, Kanada kollecləri, study permit, Kanada tələbə vizası"),
    },
  },

  {
    slug: "polsa",
    lead: az("Avropa diplomu əlçatan qiymətə — Polşada ingilis dilində bakalavr və magistr proqramları."),
    contentHtml: az(`
<p>Polşa Avropa İttifaqında təhsil almaq istəyənlər üçün ən sərfəli istiqamətlərdən biridir. Ölkədə köklü dövlət universitetləri ilə yanaşı müasir özəl universitetlər də fəaliyyət göstərir, diplomlar bütün AB-də tanınır.</p>
<h2>Niyə Polşa</h2>
<ul>
  <li>Qərbi Avropa ilə müqayisədə daha əlçatan təhsil haqqı və yaşayış xərcləri</li>
  <li><strong>İngilis dilində</strong> geniş proqram seçimi</li>
  <li>Şengen zonası — Avropada səyahət imkanı</li>
  <li>Tibb, mühəndislik, İT, biznes və beynəlxalq münasibətlər üzrə güclü proqramlar</li>
</ul>
<h2>Təhsil dili</h2>
<p>Xarici tələbələrin əksəriyyəti ingilisdilli proqramlarda oxuyur; dil biliyi IELTS, TOEFL və ya universitetin öz müsahibəsi ilə yoxlanılır. Polyak dilində oxumaq da mümkündür — bunun üçün adətən hazırlıq kursu keçilir.</p>
<h2>Viza</h2>
<p>Qəbul məktubu alındıqdan sonra milli tələbə vizasına müraciət edilir; sonradan ölkə daxilində müvəqqəti yaşayış icazəsi almaq mümkündür.</p>
${HELP("Polşa")}
`),
    facts: [
      row("Diplom", "AB-də tanınır"),
      row("Təhsil dili", "İngilis, polyak"),
      row("Üstünlük", "Sərfəli təhsil və yaşayış"),
      row("Zona", "Şengen"),
    ],
    faq: [
      qa("Polşada ingilis dilində oxumaq olarmı?", "Bəli, həm bakalavr, həm də magistr səviyyəsində ingilisdilli proqramların seçimi genişdir."),
      qa("Polşa diplomu harada tanınır?", "Polşa AB üzvüdür, diplomlar bütün Avropa İttifaqında və bir çox başqa ölkədə tanınır."),
      qa("Polyak dilini bilmək lazımdırmı?", "İngilisdilli proqramlar üçün lazım deyil. Amma gündəlik həyatda və iş axtarışında polyak dili böyük üstünlük verir."),
      COST_Q("Polşada"),
    ],
    seo: {
      metaTitle: az("Polşada təhsil — sərfəli Avropa diplomu"),
      metaDescription: az("Polşada təhsil: AB-də tanınan diplom, ingilis dilində bakalavr və magistr proqramları, əlçatan təhsil haqqı və yaşayış xərcləri, Şengen üstünlüyü."),
      keywords: az("Polşada təhsil, Polşa universitetləri, Avropada təhsil, Polşa tələbə vizası"),
    },
  },

  {
    slug: "latviya",
    lead: az("Baltikyanı ölkədə Avropa diplomu — Latviyada ingilis dilində bakalavr və magistr təhsili."),
    contentHtml: az(`
<p>Latviya Avropa İttifaqı və Şengen zonasının üzvüdür. Riqa universitetləri beynəlxalq tələbələrə ingilis dilində geniş proqram seçimi təklif edir, diplom isə bütün AB-də tanınır.</p>
<h2>Niyə Latviya</h2>
<ul>
  <li>AB standartlarında təhsil və tanınan diplom</li>
  <li>İngilis dilində proqramlar — biznes, İT, mühəndislik, tibb, aviasiya</li>
  <li>Qərbi Avropa ilə müqayisədə daha əlçatan xərclər</li>
  <li>Şengen zonasında yaşamaq və səyahət imkanı</li>
</ul>
<h2>Qəbul</h2>
<p>Qəbul əsasən attestat və ya bakalavr diplomu, motivasiya məktubu və ingilis dili biliyi əsasında aparılır. Bəzi proqramlarda universitetin öz imtahanı və ya müsahibəsi olur.</p>
<h2>Yaşayış icazəsi</h2>
<p>Qəbul olunan tələbə təhsil müddəti üçün yaşayış icazəsinə müraciət edir. Sənədlərin siyahısı və müddətlər universitet seçildikdən sonra dəqiqləşdirilir.</p>
${HELP("Latviya")}
`),
    facts: [
      row("Diplom", "AB-də tanınır"),
      row("Təhsil dili", "İngilis, latış"),
      row("Əsas şəhər", "Riqa"),
      row("Zona", "AB, Şengen"),
    ],
    faq: [
      qa("Latviyada ingilis dilində oxumaq olarmı?", "Bəli. Universitetlər beynəlxalq tələbələr üçün bakalavr və magistr səviyyəsində ingilisdilli proqramlar təklif edir."),
      qa("Latviya diplomu tanınırmı?", "Bəli, Latviya AB üzvüdür və diplomu bütün Avropa İttifaqında tanınır."),
      qa("Qəbul üçün hansı sənədlər lazımdır?", "Adətən attestat və ya diplom, motivasiya məktubu və ingilis dili biliyini təsdiqləyən sənəd. Bəzi proqramlarda müsahibə və ya imtahan olur."),
      COST_Q("Latviyada"),
    ],
    seo: {
      metaTitle: az("Latviyada təhsil — Riqada Avropa diplomu"),
      metaDescription: az("Latviyada təhsil: AB-də tanınan diplom, Riqa universitetlərində ingilis dilində bakalavr və magistr proqramları, əlçatan xərclər və Şengen üstünlüyü."),
      keywords: az("Latviyada təhsil, Riqa universitetləri, Latviya universitetləri, Baltikyanı təhsil"),
    },
  },

  {
    slug: "macaristan",
    lead: az("Stipendium Hungaricum dövlət təqaüdü və güclü tibb proqramları ilə Macarıstanda təhsil."),
    contentHtml: az(`
<p>Macarıstan Avropanın mərkəzində, AB və Şengen zonasında yerləşir. Ölkə xüsusən <strong>Stipendium Hungaricum</strong> dövlət təqaüdü və ingilis dilində <strong>tibb, stomatologiya və əczaçılıq</strong> proqramları ilə tanınır.</p>
<h2>Stipendium Hungaricum</h2>
<p>Macarıstan hökumətinin tərəfdaş ölkələrin tələbələri üçün təqaüd proqramıdır. Adətən təqaüdə daxildir:</p>
<ul>
  <li>Təhsil haqqından azadlıq</li>
  <li>Aylıq təqaüd</li>
  <li>Yataqxana və ya yaşayış xərclərinə dəstək</li>
  <li>Tibbi sığorta</li>
</ul>
<p>Müraciət ildə bir dəfə, müəyyən müddətdə qəbul edilir və rəqabətlidir — sənədlərə erkən başlamaq vacibdir. Şərtlər hər il elan olunur.</p>
<h2>Tibb təhsili</h2>
<p>Macarıstanın tibb universitetləri uzun illərdir ingilis dilində tibb təhsili verir və diplomları AB-də tanınır. Qəbul adətən biologiya və kimya üzrə imtahan və ya müsahibə ilə aparılır.</p>
<h2>Təhsil dili</h2>
<p>Beynəlxalq tələbələr əsasən ingilisdilli proqramlarda oxuyur; dil biliyi <a href="/kurslar/ielts-kurslari">IELTS</a>, <a href="/kurslar/toefl">TOEFL</a> və ya universitetin öz imtahanı ilə təsdiqlənir.</p>
${HELP("Macarıstan")}
`),
    facts: [
      row("Təqaüd", "Stipendium Hungaricum"),
      row("Güclü sahələr", "Tibb, stomatologiya, əczaçılıq"),
      row("Təhsil dili", "İngilis, macar"),
      row("Zona", "AB, Şengen"),
    ],
    faq: [
      qa("Stipendium Hungaricum nəyi əhatə edir?", "Adətən təhsil haqqından azadlıq, aylıq təqaüd, yaşayışa dəstək və tibbi sığorta. Dəqiq şərtlər hər il elan olunur."),
      qa("Stipendium Hungaricum-a nə vaxt müraciət edilir?", "Müraciət ildə bir dəfə, müəyyən müddət ərzində qəbul edilir. Tarixlər hər il elan olunur; sənədlərə erkən başlamaq tövsiyə olunur."),
      qa("Macarıstanda ingilis dilində tibb oxumaq olarmı?", "Bəli, Macarıstanın tibb universitetləri ingilis dilində tibb, stomatologiya və əczaçılıq proqramları təklif edir. Qəbul adətən biologiya və kimya üzrə imtahan və ya müsahibə ilə olur."),
      COST_Q("Macarıstanda"),
    ],
    seo: {
      metaTitle: az("Macarıstanda təhsil — Stipendium Hungaricum"),
      metaDescription: az("Macarıstanda təhsil: Stipendium Hungaricum dövlət təqaüdü, ingilis dilində tibb, stomatologiya və əczaçılıq proqramları, AB-də tanınan diplom."),
      keywords: az("Macarıstanda təhsil, Stipendium Hungaricum, Macarıstan təqaüdü, Macarıstanda tibb təhsili"),
    },
  },

  {
    slug: "litva",
    lead: az("Müasir kampuslar, ingilisdilli proqramlar və əlçatan xərclər — Litvada Avropa təhsili."),
    contentHtml: az(`
<p>Litva AB və Şengen zonasının üzvüdür. Vilnüs və Kaunas universitetləri beynəlxalq tələbələrə bakalavr və magistr səviyyəsində ingilis dilində proqramlar təklif edir.</p>
<h2>Niyə Litva</h2>
<ul>
  <li>AB-də tanınan diplom</li>
  <li>İngilis dilində geniş proqram seçimi — İT, biznes, mühəndislik, tibb, sosial elmlər</li>
  <li>Qərbi Avropa ilə müqayisədə sərfəli təhsil və yaşayış</li>
  <li>Kiçik ölkə, rahat və təhlükəsiz tələbə həyatı</li>
</ul>
<h2>Qəbul</h2>
<p>Qəbul əsasən attestat və ya bakalavr diplomu, motivasiya məktubu və ingilis dili biliyinə görə aparılır. Bəzi proqramlarda əlavə imtahan və ya müsahibə olur.</p>
<h2>Yaşayış icazəsi</h2>
<p>Qəbul olunan tələbə təhsil müddəti üçün müvəqqəti yaşayış icazəsinə müraciət edir. Sənədlər və müddətlər universitet seçildikdən sonra dəqiqləşdirilir.</p>
${HELP("Litva")}
`),
    facts: [
      row("Diplom", "AB-də tanınır"),
      row("Təhsil dili", "İngilis, litva"),
      row("Əsas şəhərlər", "Vilnüs, Kaunas"),
      row("Zona", "AB, Şengen"),
    ],
    faq: [
      qa("Litvada ingilis dilində oxumaq olarmı?", "Bəli, bakalavr və magistr səviyyəsində ingilisdilli proqramların seçimi genişdir."),
      qa("Litva diplomu tanınırmı?", "Bəli, Litva AB üzvüdür və diplomu bütün Avropa İttifaqında tanınır."),
      qa("Qəbul necə aparılır?", "Əsasən attestat və ya diplom, motivasiya məktubu və ingilis dili biliyinə görə. Bəzi proqramlarda əlavə imtahan və ya müsahibə olur."),
      COST_Q("Litvada"),
    ],
    seo: {
      metaTitle: az("Litvada təhsil — sərfəli Avropa təhsili"),
      metaDescription: az("Litvada təhsil: Vilnüs və Kaunas universitetlərində ingilis dilində bakalavr və magistr proqramları, AB-də tanınan diplom və sərfəli yaşayış xərcləri."),
      keywords: az("Litvada təhsil, Litva universitetləri, Vilnüs, Kaunas, Avropada təhsil"),
    },
  },

  {
    slug: "rusiya",
    lead: az("Köklü universitetlər, güclü texniki və tibb məktəbləri, dövlət kvotası ilə təqaüd imkanı — Rusiyada təhsil."),
    contentHtml: az(`
<p>Rusiya uzun akademik ənənəyə malik universitetləri ilə tanınır. Mühəndislik, fundamental elmlər, tibb və incəsənət sahələrində güclü məktəblər var. Azərbaycandan olan tələbələr üçün dil və mədəni yaxınlıq əlavə rahatlıqdır.</p>
<h2>Təhsil dili</h2>
<p>Proqramların əksəriyyəti <strong>rus dilindədir</strong>; bəzi universitetlərdə ingilisdilli proqramlar da var. Rus dilini kifayət qədər bilməyən tələbələr əvvəlcə <strong>hazırlıq fakültəsində</strong> dil və ixtisas fənləri üzrə bir il oxuyur.</p>
<h2>Dövlət kvotası</h2>
<p>Rusiya hökuməti xarici tələbələr üçün <strong>kvota (təqaüd) proqramı</strong> həyata keçirir — bu proqram çərçivəsində təhsil ödənişsiz olur. Müraciət ildə bir dəfə, müəyyən müddətdə qəbul edilir və seçim mərhələlərlə aparılır.</p>
<h2>Qəbul</h2>
<p>Ödənişli yerlərə qəbul universitetin tələblərinə görə — sənəd müsabiqəsi, imtahan və ya müsahibə ilə aparılır.</p>
${HELP("Rusiya")}
<p>Rus dilini bizdə öyrənə bilərsiniz: <a href="/kurslar/rus-dili-kursu">Rus dili kursu</a>.</p>
`),
    facts: [
      row("Təhsil dili", "Rus (bəzi proqramlar ingilis)"),
      row("Hazırlıq", "Hazırlıq fakültəsi"),
      row("Təqaüd", "Dövlət kvotası"),
      row("Güclü sahələr", "Mühəndislik, tibb, elm"),
    ],
    faq: [
      qa("Rusiyada ödənişsiz oxumaq olarmı?", "Bəli, dövlət kvotası proqramı çərçivəsində. Müraciət ildə bir dəfə qəbul edilir və seçim mərhələlərlə aparılır."),
      qa("Rus dilini bilmirəm, oxuya bilərəmmi?", "Bəli. Tələbələr əvvəlcə hazırlıq fakültəsində bir il rus dili və ixtisas fənləri üzrə oxuyur, sonra əsas proqrama keçir."),
      qa("İngilis dilində proqramlar varmı?", "Bəzi universitetlərdə var, lakin seçim rusdilli proqramlarla müqayisədə məhduddur."),
      COST_Q("Rusiyada"),
    ],
    seo: {
      metaTitle: az("Rusiyada təhsil — aparıcı universitetlər və kvota"),
      metaDescription: az("Rusiyada təhsil: köklü universitetlər, rus və ingilis dilində proqramlar, hazırlıq fakültəsi və dövlət kvotası ilə ödənişsiz təhsil imkanı."),
      keywords: az("Rusiyada təhsil, Rusiya universitetləri, Rusiya kvotası, hazırlıq fakültəsi"),
    },
  },

  {
    slug: "gurcustan",
    lead: az("Qonşu ölkədə ingilis dilində tibb və universitet təhsili — yaxın məsafə, rahat şərtlər."),
    contentHtml: az(`
<p>Gürcüstan Azərbaycana yaxınlığı, sərfəli yaşayış xərcləri və ingilis dilində proqramları ilə son illər xüsusən <strong>tibb təhsili</strong> üçün populyar istiqamətə çevrilib.</p>
<h2>Niyə Gürcüstan</h2>
<ul>
  <li>Yaxın məsafə — ailəyə tez-tez gəlib-getmək mümkündür</li>
  <li>İngilis dilində tibb, stomatologiya və digər proqramlar</li>
  <li>Avropa ilə müqayisədə sərfəli təhsil və yaşayış xərcləri</li>
  <li>Azərbaycan vətəndaşları üçün rahat giriş şərtləri</li>
</ul>
<h2>Tibb təhsili</h2>
<p>Bir çox universitet ingilis dilində altı illik tibb (MD) proqramı təklif edir. Diplomun başqa ölkədə tanınması və orada həkim kimi işləmək həmin ölkənin qaydalarından asılıdır — proqram seçməzdən əvvəl bu yoxlanılmalıdır.</p>
<h2>Qəbul</h2>
<p>Qəbul əsasən attestat, ingilis dili biliyi və universitetin imtahanı və ya müsahibəsi əsasında aparılır. Dil biliyi <a href="/kurslar/ielts-kurslari">IELTS</a> və ya <a href="/kurslar/toefl">TOEFL</a> ilə təsdiqlənə bilər.</p>
${HELP("Gürcüstan")}
`),
    facts: [
      row("Güclü sahə", "Tibb (MD), stomatologiya"),
      row("Təhsil dili", "İngilis, gürcü"),
      row("Üstünlük", "Yaxın məsafə, sərfəli xərclər"),
      row("Tibb proqramı", "Adətən 6 il"),
    ],
    faq: [
      qa("Gürcüstanda ingilis dilində tibb oxumaq olarmı?", "Bəli, bir çox universitet ingilis dilində altı illik tibb (MD) proqramı təklif edir."),
      qa("Gürcüstan tibb diplomu başqa ölkələrdə tanınırmı?", "Bu, diplomun istifadə olunacağı ölkənin qaydalarından asılıdır. Harada işləmək istədiyinizi əvvəlcədən müəyyən edib proqramı ona görə seçmək vacibdir."),
      qa("Qəbul necə aparılır?", "Əsasən attestat, ingilis dili biliyi və universitetin imtahanı və ya müsahibəsi əsasında."),
      COST_Q("Gürcüstanda"),
    ],
    seo: {
      metaTitle: az("Gürcüstanda təhsil — ingilis dilində tibb"),
      metaDescription: az("Gürcüstanda təhsil: ingilis dilində tibb (MD) və stomatologiya proqramları, yaxın məsafə, sərfəli təhsil və yaşayış xərcləri, qəbul şərtləri."),
      keywords: az("Gürcüstanda təhsil, Gürcüstanda tibb təhsili, Tbilisi universitetləri, MD proqramı"),
    },
  },

  {
    slug: "estoniya",
    lead: az("Dünyanın ən rəqəmsal ölkələrindən birində İT, texnologiya və biznes təhsili."),
    contentHtml: az(`
<p>Estoniya kiçik, lakin texnologiyada qabaqcıl ölkədir: dövlət xidmətlərinin böyük hissəsi onlayndır, startap mühiti güclüdür. Ölkə AB və Şengen zonasının üzvüdür, universitetləri ingilis dilində geniş proqram təklif edir.</p>
<h2>Niyə Estoniya</h2>
<ul>
  <li><strong>İT və texnologiya</strong> üzrə güclü proqramlar — proqram təminatı, kibertəhlükəsizlik, məlumat elmi</li>
  <li>Biznes, sosial elmlər və dizayn proqramları</li>
  <li>İngilis dilində bakalavr və magistr proqramları</li>
  <li>AB-də tanınan diplom və innovativ iş mühiti</li>
</ul>
<h2>Universitetlər</h2>
<p>Ölkənin əsas universitetləri Tallin və Tartuda yerləşir; texniki və klassik universitetlər beynəlxalq tələbələrə açıqdır.</p>
<h2>Qəbul</h2>
<p>Qəbul attestat və ya diplom, motivasiya məktubu, ingilis dili biliyi və bəzi proqramlarda imtahan və ya müsahibə əsasında aparılır. Qəbuldan sonra tələbə yaşayış icazəsinə müraciət edir.</p>
${HELP("Estoniya")}
`),
    facts: [
      row("Güclü sahələr", "İT, kibertəhlükəsizlik, biznes"),
      row("Təhsil dili", "İngilis, eston"),
      row("Əsas şəhərlər", "Tallin, Tartu"),
      row("Zona", "AB, Şengen"),
    ],
    faq: [
      qa("Estoniya hansı sahələrdə güclüdür?", "İT, proqram təminatı, kibertəhlükəsizlik və məlumat elmi, həmçinin biznes və sosial elmlər."),
      qa("Estoniyada ingilis dilində oxumaq olarmı?", "Bəli, bakalavr və xüsusən magistr səviyyəsində ingilisdilli proqramların seçimi genişdir."),
      qa("Estoniya diplomu tanınırmı?", "Bəli, Estoniya AB üzvüdür və diplomu bütün Avropa İttifaqında tanınır."),
      COST_Q("Estoniyada"),
    ],
    seo: {
      metaTitle: az("Estoniyada təhsil — rəqəmsal ölkədə İT təhsili"),
      metaDescription: az("Estoniyada təhsil: İT, kibertəhlükəsizlik və biznes üzrə ingilis dilində proqramlar, Tallin və Tartu universitetləri, AB-də tanınan diplom."),
      keywords: az("Estoniyada təhsil, Estoniya universitetləri, Tallin, Tartu, İT təhsili"),
    },
  },

  {
    slug: "teqaud-proqramlari",
    lead: az("Tam və qismən təqaüdlər — xaricdə təhsilin xərcini azaltmağın ən real yolları."),
    contentHtml: az(`
<p>Xaricdə təhsil həmişə baha olmaq məcburiyyətində deyil. Bir çox dövlət, universitet və beynəlxalq təşkilat təhsil haqqını, yaşayış xərclərini və ya hər ikisini qarşılayan təqaüdlər təklif edir.</p>
<h2>Təqaüd növləri</h2>
<ul>
  <li><strong>Tam təqaüd</strong> — təhsil haqqı, çox vaxt yaşayış, sığorta və yol xərcləri daxil</li>
  <li><strong>Qismən təqaüd</strong> — təhsil haqqının bir hissəsi və ya endirim</li>
  <li><strong>Universitet təqaüdləri</strong> — akademik nəticəyə görə universitetin özünün verdiyi</li>
</ul>
<h2>Tanınmış proqramlar</h2>
<ul>
  <li><strong>Stipendium Hungaricum</strong> — Macarıstan hökumətinin təqaüdü (<a href="/xaricde-tehsil/macaristan">ətraflı</a>)</li>
  <li><strong>Türkiye Bursları</strong> — Türkiyə dövlət təqaüdü (<a href="/xaricde-tehsil/turkiye">ətraflı</a>)</li>
  <li><strong>Rusiya dövlət kvotası</strong> — ödənişsiz təhsil yerləri (<a href="/xaricde-tehsil/rusiya">ətraflı</a>)</li>
  <li><strong>DAAD</strong> — Almaniyada təhsil və tədqiqat təqaüdləri (<a href="/xaricde-tehsil/almaniya">ətraflı</a>)</li>
  <li><strong>Chevening</strong> — Böyük Britaniyada magistr təqaüdü (<a href="/xaricde-tehsil/ingiltere">ətraflı</a>)</li>
  <li><strong>Erasmus Mundus</strong> — Avropada birgə magistr proqramları</li>
</ul>
<h2>Uğurlu müraciətin açarı</h2>
<ol>
  <li><strong>Erkən başlamaq</strong> — müraciətlər çox vaxt təhsil ilindən xeyli əvvəl bağlanır</li>
  <li><strong>Dil sertifikatı</strong> — əksər təqaüdlər IELTS, TOEFL və ya başqa sertifikat tələb edir</li>
  <li><strong>Güclü motivasiya məktubu</strong> — məqsədinizi və proqrama uyğunluğunuzu aydın göstərən</li>
  <li><strong>Tövsiyə məktubları</strong> və yüksək akademik nəticələr</li>
</ol>
${HELP("uyğun")}
`),
    facts: [
      row("Növlər", "Tam və qismən təqaüd"),
      row("Dövlət proqramları", "Stipendium Hungaricum, Türkiye Bursları, kvota"),
      row("Digər", "DAAD, Chevening, Erasmus Mundus"),
      row("Adətən tələb olunur", "Dil sertifikatı, motivasiya məktubu"),
    ],
    faq: [
      qa("Tam təqaüd nəyi əhatə edir?", "Proqramdan asılıdır. Adətən təhsil haqqı, çox vaxt isə yaşayış, tibbi sığorta və bəzən yol xərcləri də daxil olur."),
      qa("Təqaüdə nə vaxt müraciət etmək lazımdır?", "Çox vaxt təhsil ilindən 6–12 ay əvvəl. Hər proqramın öz müddəti var və hər il elan olunur, ona görə hazırlığa erkən başlamaq vacibdir."),
      qa("Təqaüd üçün dil sertifikatı lazımdırmı?", "Əksər hallarda bəli — IELTS, TOEFL və ya proqramın qəbul etdiyi başqa sertifikat. Bəzi proqramlar təhsil dilinin (məsələn, alman və ya macar) öyrənilməsinə də imkan verir."),
      qa("Hansı təqaüd mənə uyğundur?", "Bu, təhsil səviyyəsindən, ixtisasdan, akademik nəticələrdən və ölkə seçimindən asılıdır. Konsultasiyada profilinizə uyğun proqramlar müəyyən edilir."),
    ],
    seo: {
      metaTitle: az("Xaricdə təhsil üçün təqaüd proqramları"),
      metaDescription: az("Xaricdə təhsil təqaüdləri: Stipendium Hungaricum, Türkiye Bursları, Rusiya kvotası, DAAD, Chevening, Erasmus Mundus — tam və qismən təqaüd imkanları."),
      keywords: az("təqaüd proqramları, xaricdə təhsil təqaüdü, Stipendium Hungaricum, Türkiye Bursları, DAAD, Chevening"),
    },
  },
];
