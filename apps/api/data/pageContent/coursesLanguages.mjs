/**
 * Dil kursları səhifələrinin məzmunu.
 *
 * Faktlar kursun canlı səhifəsindən (FAQ, təsvir) götürülüb: dərs 90 dəqiqə,
 * hər səviyyə orta hesabla 1,5–2 ay, sertifikat imtahanda uğur qazananlara,
 * alman dili yalnız Caspian Plaza filialında və s. Qiymət yazılmayıb.
 *
 * Səhifədə artıq FAQ varsa (bir sıra kursda var) import onu saxlayır —
 * ona görə belə kurslar üçün burada FAQ yazılmayıb.
 */
const az = (text) => ({ az: text, en: "", ru: "" });
const row = (label, value) => ({ label: az(label), value: az(value) });
const qa = (question, answer) => ({ question: az(question), answer: az(answer) });

const LEVELS = row("Səviyyələr", "A1 – C2 (CEFR)");
const LESSON = row("Dərs", "90 dəqiqə");
const TERM = row("Səviyyə müddəti", "Orta hesabla 1,5–2 ay");
const CERT = row("Sertifikat", "Yekun imtahanda uğur qazananlara");

export const COURSE_PAGES_LANGUAGES = [
  {
    // Səhifədə mətn və FAQ artıq var — yalnız qısa məlumat və SEO.
    slug: "ingilis-dili-kurslari",
    info: [LEVELS, row("Dərs rejimi", "Həftədə 2 dəfə · 90 dəq"), row("Qrup", "3–5, maksimum 6 nəfər"), row("İmtahan mərkəzi", "Rəsmi TOEIC / TOEFL mərkəzi")],
    seo: {
      metaTitle: az("İngilis dili kursu Bakıda — British Academy"),
      metaDescription: az("İngilis dili kursu: CEFR üzrə A1–C2, kiçik qruplar, həftədə 2 dəfə 90 dəqiqə. Rəsmi TOEIC və TOEFL imtahan mərkəzində beynəlxalq sertifikat."),
      keywords: az("ingilis dili kursu, ingilis dili Bakı, İngilis dili dərsləri, TOEIC, TOEFL"),
    },
  },

  {
    slug: "biznes-ingilis-dili-kursu",
    contentHtml: az(`
<p>Biznes İngilis dili kursu iş mühitində ingilis dilindən istifadə edənlər üçün qurulub: rəsmi yazışma, təqdimat, iclas və danışıqlar. Proqram Cambridge <strong>BEC</strong> imtahanına hazırlığı da əhatə edir.</p>
<h2>Kurs nə öyrədir</h2>
<ul>
  <li>İşgüzar e-poçt, təklif və hesabat yazmaq</li>
  <li>Təqdimat qurmaq və rəqəmləri izah etmək</li>
  <li>İclasda fikir bildirmək, razılaşmaq və etiraz etmək</li>
  <li>Danışıqlarda şərt irəli sürmək və güzəştə getmək</li>
  <li>Telefon və video zənglərdə peşəkar ünsiyyət</li>
</ul>
<h2>Kimlər üçündür</h2>
<p>Şirkət əməkdaşları, rəhbərlər, beynəlxalq layihələrdə çalışanlar, iş axtaran tələbələr və Cambridge BEC-ə hazırlaşanlar.</p>
<h2>Necə təşkil olunur</h2>
<p>Proqram CEFR səviyyələri üzrə qurulub. Hər səviyyə orta hesabla 1,5–2 ay çəkir, dərs 90 dəqiqədir, cədvəl tələbələrin uyğunluğuna görə tərtib olunur. Kursun sonunda imtahan keçirilir və uğur qazananlara sertifikat verilir.</p>
`),
    info: [LEVELS, LESSON, TERM, row("Hazırlıq", "Cambridge BEC")],
    seo: {
      metaTitle: az("Biznes İngilis dili kursu — Cambridge BEC"),
      metaDescription: az("Biznes ingilis dili kursu: işgüzar yazışma, təqdimat, danışıqlar və Cambridge BEC hazırlığı. CEFR səviyyələri, 90 dəqiqəlik dərslər, sertifikat."),
      keywords: az("biznes ingilis dili, Business English, Cambridge BEC, işgüzar ingilis dili"),
    },
  },

  {
    slug: "huquqsunaslar-ingilis-dili-kursu",
    lead: az("Hüquqi terminologiya, müqavilə dili və hüquqi yazışma — hüquqşünaslar üçün peşəkar ingilis dili."),
    excerpt: az("Hüquqşünaslar və hüquq tələbələri üçün ingilis dili: terminologiya, müqavilə dili, hüquqi yazışma və TOLES-ə hazırlıq."),
    contentHtml: az(`
<p>Hüquq sahəsində bir sözün səhv seçilməsi sənədin mənasını dəyişə bilər. Bu kurs hüquqşünaslara ingilis dilini məhz peşə kontekstində — müqavilə, yazışma və hüquqi müzakirə üzərində öyrədir.</p>
<h2>Proqramın əsas mövzuları</h2>
<ul>
  <li>Hüquqi terminologiya və onun gündəlik dildən fərqi</li>
  <li>Müqavilələrin quruluşu, bəndlər və öhdəliklərin ifadəsi</li>
  <li>Hüquqi yazışma — məktub, memorandum, rəy</li>
  <li>Formal üslub və dəqiq ifadə</li>
  <li>Müştəri və həmkarla peşəkar ünsiyyət</li>
</ul>
<h2>Kimlər üçündür</h2>
<p>Hüquqşünaslar, hüquq fakültəsinin tələbələri, şirkətlərin hüquq şöbəsində çalışanlar və xaricdə hüquq üzrə magistratura planlaşdıranlar.</p>
<h2>Beynəlxalq sertifikat</h2>
<p>Hüquqi ingilis dilini rəsmi olaraq təsdiqləmək istəyənlər üçün <a href="/kurslar/toles">TOLES</a> hazırlığımız da var. Başlamaq üçün ən azı orta səviyyə (B1–B2) tövsiyə olunur — səviyyənizi <a href="/testler">onlayn testlə</a> yoxlaya bilərsiniz.</p>
`),
    info: [LEVELS, row("Sahə", "Hüquqi ingilis dili"), row("Tövsiyə olunan başlanğıc", "B1 – B2"), row("Əlaqəli sertifikat", "TOLES")],
    faq: [
      qa("Bu kurs kimlər üçün uyğundur?", "Hüquqşünaslar, hüquq tələbələri, şirkətlərin hüquq şöbəsində çalışanlar və xaricdə hüquq üzrə təhsil planlaşdıranlar üçün."),
      qa("Başlamaq üçün hansı səviyyə lazımdır?", "Hüquqi dil ümumi dilin üzərində qurulur, ona görə ən azı orta səviyyə (B1–B2) tövsiyə olunur. Səviyyəniz aşağıdırsa, əvvəlcə ümumi ingilis dili kursu ilə başlamaq daha səmərəlidir."),
      qa("Kurs beynəlxalq sertifikata hazırlayırmı?", "Hüquqi ingilis dili üzrə beynəlxalq sertifikat üçün ayrıca TOLES hazırlığımız var. Bu kurs isə həmin imtahan üçün lazım olan terminologiya və üslub bazasını qurur."),
      qa("Dərs cədvəli necə müəyyən olunur?", "Qrupun tərkibinə və tələbələrin uyğunluğuna görə. Aktual cədvəl üçün bizimlə əlaqə saxlayın."),
    ],
    seo: {
      metaTitle: az("Hüquqşünaslar üçün İngilis dili — Legal English"),
      metaDescription: az("Hüquqşünaslar üçün ingilis dili kursu: hüquqi terminologiya, müqavilə dili, hüquqi yazışma və TOLES imtahanına hazırlıq bazası."),
      keywords: az("hüquqi ingilis dili, Legal English, hüquqşünas ingilis dili, TOLES"),
    },
  },

  {
    slug: "otel-turizm-ingilis-dili-kursu",
    lead: az("Qonaq qarşılamadan tur bələdçiliyinə qədər — turizm və qonaqpərvərlik sektoru üçün praktik ingilis dili."),
    excerpt: az("Otel, restoran və turizm sahəsində çalışanlar üçün ingilis dili: qarşılama, rezervasiya, şikayətlərin həlli və tur təqdimatı."),
    contentHtml: az(`
<p>Turizmdə ingilis dili işin özüdür: qonaqla ilk təmas, rezervasiya, problem həlli və tövsiyələr çox vaxt ingilis dilində aparılır. Bu kurs dili məhz həmin iş vəziyyətləri üzərində öyrədir.</p>
<h2>Kursda məşq olunan vəziyyətlər</h2>
<ul>
  <li>Check-in, otaq təqdimatı və qaydaların izahı</li>
  <li>Telefon və e-poçtla rezervasiya, dəyişiklik və ləğv</li>
  <li>Narazı qonaqla sakit və həll yönümlü danışıq</li>
  <li>Şəhər, marşrut və mətbəx üzrə tövsiyə</li>
  <li>Restoran xidməti — menyu və sifariş</li>
</ul>
<h2>Kimlər üçündür</h2>
<p>Otel və restoran işçiləri, tur operatorları, bələdçilər, turizm və aviasiya ixtisası tələbələri, həmçinin bu sahədə iş axtaranlar.</p>
<h2>Danışıq təcrübəsi</h2>
<p>Sahədə ən vacib bacarıq sərbəst danışıqdır. Tələbələrimiz dərsdən əlavə <a href="/kurslar/conversation-club">danışıq klublarına</a> da qoşula bilər.</p>
`),
    info: [LEVELS, row("Sahə", "Turizm və qonaqpərvərlik"), row("Yönüm", "Praktik iş ssenariləri")],
    faq: [
      qa("Kurs kimlər üçündür?", "Otel, restoran və turizm sahəsində çalışanlar, bələdçilər, tur operatorları və turizm ixtisası tələbələri üçün."),
      qa("Ümumi ingilis dili kursundan fərqi nədir?", "Mövzular və lüğət birbaşa sahəyə yönəlib: qarşılama, rezervasiya, şikayət, restoran xidməti. Hər mövzu real iş ssenarisi üzərində məşq olunur."),
      qa("Başlamaq üçün hansı səviyyə lazımdır?", "Səviyyənizi əvvəlcə onlayn testlə yoxlamağı tövsiyə edirik. Nəticəyə görə uyğun proqram və qrup seçilir."),
      qa("Dərs cədvəli necə müəyyən olunur?", "Qrupun tərkibinə və tələbələrin uyğunluğuna görə. Aktual cədvəl üçün bizimlə əlaqə saxlayın."),
    ],
    seo: {
      metaTitle: az("Otel və Turizm üçün İngilis dili kursu"),
      metaDescription: az("Turizm və otel sahəsi üçün ingilis dili kursu: qonaq qarşılama, rezervasiya, şikayətlərin həlli, restoran xidməti və tur təqdimatı."),
      keywords: az("turizm ingilis dili, otel ingilis dili, qonaqpərvərlik, resepsiya"),
    },
  },

  {
    slug: "alman-dili-kursu",
    contentHtml: az(`
<p>Alman dili kursumuz CEFR standartlarına uyğun qurulub və danışıq yönümlüdür: qrammatika öyrədilir, amma məqsəd real vəziyyətlərdə sərbəst ünsiyyətdir.</p>
<h2>Kimlər üçündür</h2>
<ul>
  <li>Alman dilini sıfırdan öyrənmək istəyənlər</li>
  <li>Almaniyada təhsil almaq və ya işləmək planlaşdıranlar</li>
  <li>Mövcud biliyini inkişaf etdirmək istəyənlər</li>
  <li>Viza və ailə birləşməsi üçün dil sertifikatına hazırlaşanlar</li>
</ul>
<h2>Proqram necə qurulub</h2>
<p>Səviyyələr A1-dən C2-yə qədərdir. Hər səviyyə orta hesabla 1,5–2 ay çəkir, dərs 90 dəqiqədir, dərs günləri və saatları tələbələrin uyğunluğuna görə müəyyən olunur. Kursun sonunda imtahan keçirilir, uğur qazananlara sertifikat verilir.</p>
<h2>Harada keçirilir</h2>
<p>Alman dili kursları <strong>yalnız Caspian Plaza filialında</strong> tədris olunur.</p>
<h2>Növbəti addım</h2>
<p>Rəsmi beynəlxalq sertifikat (Goethe, telc, TestDaF) lazımdırsa, <a href="/kurslar/beynelxalq-sertifikatli-alman-dili-kursu">beynəlxalq sertifikatlı proqrama</a> baxın. Almaniyada təhsil üçün: <a href="/xaricde-tehsil/almaniya">Almaniyada təhsil</a>.</p>
`),
    info: [LEVELS, LESSON, TERM, row("Filial", "Yalnız Caspian Plaza")],
    seo: {
      metaTitle: az("Alman dili kursu Bakıda — A1-dən C2-yə"),
      metaDescription: az("Alman dili kursu: CEFR üzrə A1–C2, danışıq yönümlü dərslər, 90 dəqiqəlik dərslər, sertifikat. Kurslar Caspian Plaza filialında keçirilir."),
      keywords: az("alman dili kursu, alman dili Bakı, alman dili dərsləri, Almaniya"),
    },
  },

  {
    slug: "beynelxalq-sertifikatli-alman-dili-kursu",
    lead: az("Goethe, telc və TestDaF kimi rəsmi alman dili imtahanlarına məqsədyönlü hazırlıq."),
    excerpt: az("Viza, universitet qəbulu və iş üçün tələb olunan rəsmi alman dili sertifikatlarına hazırlıq proqramı."),
    contentHtml: az(`
<p>Viza, universitet və işəgötürən alman dili biliyini tanınmış sertifikatla görmək istəyir. Bu proqram dil biliyini imtahan formatı ilə birləşdirir: tapşırıq tipləri, vaxt idarəsi və qiymətləndirmə meyarları.</p>
<h2>Hansı sertifikata hazırlaşmaq</h2>
<ul>
  <li><strong>Goethe-Zertifikat</strong> — A1-dən C2-yə hər səviyyə üçün, viza prosesində geniş tanınır</li>
  <li><strong>telc Deutsch</strong> — səviyyələr üzrə geniş tanınan digər imtahan</li>
  <li><strong>TestDaF</strong> — alman dilində universitet təhsili üçün</li>
</ul>
<p>Hansı sertifikatın lazım olduğunu müraciət edəcəyiniz qurumdan dəqiqləşdirin — tələb qurumdan quruma dəyişir.</p>
<h2>Hazırlıq necə gedir</h2>
<ol>
  <li>Mövcud səviyyənin müəyyən edilməsi</li>
  <li>Dörd bacarıq üzrə boşluqların doldurulması</li>
  <li>İmtahan formatı və tapşırıq tipləri</li>
  <li>Vaxtlı sınaq imtahanları və geri bildirim</li>
</ol>
<p>Dili sıfırdan başlayırsınızsa, əvvəlcə <a href="/kurslar/alman-dili-kursu">Alman dili kursu</a> ilə baza qurmaq daha düzgündür.</p>
`),
    info: [LEVELS, row("İmtahanlar", "Goethe · telc · TestDaF"), row("Məqsəd", "Viza, təhsil, iş")],
    faq: [
      qa("Hansı sertifikat mənə lazımdır?", "Məqsədinizdən asılıdır: viza və ailə birləşməsi üçün adətən A1 səviyyəsində Goethe və ya telc, universitet təhsili üçün TestDaF və ya C1 səviyyəli sertifikat istənilir. Dəqiq tələbi müraciət edəcəyiniz qurumdan öyrənin."),
      qa("Sıfırdan başlaya bilərəmmi?", "Sertifikat hazırlığı mövcud dil bazası üzərində qurulur. Sıfırdan başlayırsınızsa, əvvəlcə Alman dili kursunda baza qurmaq tövsiyə olunur."),
      qa("Hazırlıqda nə edilir?", "Dörd bacarıq (oxu, dinləmə, yazı, danışıq) üzrə boşluqlar doldurulur, imtahanın tapşırıq tipləri öyrədilir və vaxtlı sınaq imtahanları keçirilir."),
      qa("Harada keçirilir?", "Alman dili dərsləri Caspian Plaza filialında tədris olunur. Aktual qrup və cədvəl üçün bizimlə əlaqə saxlayın."),
    ],
    seo: {
      metaTitle: az("Goethe, telc, TestDaF — alman dili sertifikatı"),
      metaDescription: az("Beynəlxalq sertifikatlı alman dili proqramı: Goethe, telc və TestDaF imtahanlarına hazırlıq — viza, universitet qəbulu və iş üçün."),
      keywords: az("Goethe-Zertifikat, telc, TestDaF, alman dili sertifikatı, alman dili imtahanı"),
    },
  },

  {
    // Səhifədə mətn və FAQ artıq var — yalnız qısa məlumat və SEO.
    slug: "rus-dili-kursu",
    info: [LEVELS, row("Dərs rejimi", "Həftədə 2 dəfə · 90 dəq"), row("Qrup", "3–6 nəfər"), row("Format", "Qrup / fərdi")],
    seo: {
      metaTitle: az("Rus dili kursu Bakıda — danışıq yönümlü"),
      metaDescription: az("Rus dili kursu: danışıq yönümlü dərslər, 3–6 nəfərlik qruplar, həftədə 2 dəfə 90 dəqiqə, A1–C2 səviyyələri və sertifikat."),
      keywords: az("rus dili kursu, rus dili Bakı, rus dili dərsləri, danışıq"),
    },
  },

  {
    slug: "ispan-dili-kursu",
    contentHtml: az(`
<p>İspan dili 20-dən çox ölkədə rəsmi dildir. Kursumuz danışıq yönümlü və interaktivdir: ilk dərslərdən gündəlik ünsiyyət üçün lazım olan baza qurulur.</p>
<h2>Kurs kimlər üçündür</h2>
<p>İspan dilini sıfırdan öyrənmək və ya mövcud biliyini inkişaf etdirmək istəyən bütün yaş qrupları üçün — səyahət, iş, təhsil və ya maraq üçün.</p>
<h2>Proqram necə qurulub</h2>
<ul>
  <li>Bütün səviyyələr üçün proqram — A1-dən C2-yə</li>
  <li>Hər səviyyə orta hesabla 1,5–2 ay</li>
  <li>90 dəqiqəlik interaktiv dərslər</li>
  <li>Kursun sonunda imtahan və sertifikat</li>
</ul>
<h2>Ödənişsiz sınaq dərsi</h2>
<p>Kursa başlamazdan əvvəl <strong>ödənişsiz sınaq dərsində</strong> iştirak edib tədris metodikası ilə tanış ola bilərsiniz.</p>
`),
    info: [LEVELS, LESSON, TERM, row("Sınaq dərsi", "Ödənişsiz")],
    seo: {
      metaTitle: az("İspan dili kursu — ödənişsiz sınaq dərsi"),
      metaDescription: az("İspan dili kursu: danışıq yönümlü interaktiv dərslər, A1–C2 səviyyələri, 90 dəqiqəlik dərslər, sertifikat və ödənişsiz sınaq dərsi."),
      keywords: az("ispan dili kursu, ispan dili Bakı, ispan dili dərsləri"),
    },
  },

  {
    slug: "italyan-dili-kursu",
    contentHtml: az(`
<p>İtalyan dili kursumuzda dərsləri <strong>İtaliyada təhsil almış müəllimlər</strong> aparır. Proqram danışıq yönümlüdür: qrammatika ilə yanaşı real həyat vəziyyətlərində sərbəst ünsiyyət qurmaq öyrədilir.</p>
<h2>Kimlər üçündür</h2>
<p>İtalyan dilini sıfırdan öyrənmək, mövcud biliyini inkişaf etdirmək, İtaliyada təhsil, iş və ya səyahət üçün hazırlaşmaq istəyənlər.</p>
<h2>Format</h2>
<p>Kurslar həm <strong>onlayn</strong>, həm də <strong>əyani</strong> keçirilir — proqram eynidir, seçim qrafikinizdən asılıdır.</p>
<h2>Proqram</h2>
<ul>
  <li>A1-dən C2-yə qədər səviyyələr</li>
  <li>Hər səviyyə orta hesabla 1,5–2 ay</li>
  <li>Danışıq yönümlü dərslər</li>
  <li>Kursun sonunda imtahan və sertifikat</li>
</ul>
`),
    info: [LEVELS, TERM, row("Format", "Onlayn / əyani"), row("Müəllimlər", "İtaliyada təhsil almış")],
    seo: {
      metaTitle: az("İtalyan dili kursu — onlayn və əyani"),
      metaDescription: az("İtalyan dili kursu: İtaliyada təhsil almış müəllimlər, danışıq yönümlü proqram, A1–C2 səviyyələri, onlayn və əyani format, sertifikat."),
      keywords: az("italyan dili kursu, italyan dili Bakı, italyan dili online"),
    },
  },

  {
    slug: "fransiz-dili-kursu",
    lead: az("Fransız dilini sıfırdan öyrənin — CEFR səviyyələri üzrə proqram, danışıq və tələffüzə xüsusi diqqət."),
    excerpt: az("Fransız dili kursu: A1–C2 səviyyələri, tələffüz və danışıq üzərində iş, DELF/DALF sertifikatlarına istiqamət."),
    contentHtml: az(`
<p>Fransız dili beş qitədə danışılır və Fransa, Belçika, İsveçrə, Kanada kimi ölkələrdə təhsil üçün qapı açır. Kursumuz dili CEFR səviyyələri üzrə, danışıq və tələffüzə xüsusi diqqətlə öyrədir.</p>
<h2>Kursda nəyə diqqət edilir</h2>
<ul>
  <li><strong>Tələffüz</strong> — oxunmayan hərflər, burun səsləri və sözlərin birləşməsi</li>
  <li><strong>Dinləmə</strong> — canlı nitqi anlamaq</li>
  <li><strong>Qrammatika</strong> — cins, fel təsrifləri, zamanlar</li>
  <li><strong>Danışıq</strong> — gündəlik və rəsmi ünsiyyət</li>
</ul>
<h2>Kimlər üçündür</h2>
<p>Fransız dilini sıfırdan öyrənmək istəyənlər, fransızdilli ölkələrdə təhsil planlaşdıranlar və rəsmi sertifikata hazırlaşanlar.</p>
<h2>Sertifikat istiqaməti</h2>
<p>Rəsmi fransız dili sertifikatları <strong>DELF</strong> (A1–B2) və <strong>DALF</strong> (C1–C2) adlanır. Kanadada təhsil planlaşdırırsınızsa, <a href="/xaricde-tehsil/kanada">Kanada səhifəmizə</a> də baxın.</p>
`),
    info: [LEVELS, row("Sertifikat istiqaməti", "DELF / DALF")],
    faq: [
      qa("Fransız dilini sıfırdan öyrənə bilərəmmi?", "Bəli. Proqram A1 səviyyəsindən başlayır. Mövcud biliyiniz varsa, səviyyəniz müəyyən edilib uyğun qrupa yerləşdirilirsiniz."),
      qa("Hansı rəsmi sertifikatlar var?", "Ən geniş tanınanları DELF (A1–B2) və DALF (C1–C2) sertifikatlarıdır. Bəzi universitet və immiqrasiya prosesləri TCF testini də istəyir."),
      qa("Fransız dili Kanadada təhsil üçün lazımdırmı?", "Kvebek əyalətində və fransızdilli proqramlarda fransız dili tələb olunur; digər hallarda üstünlük verir."),
      qa("Dərs cədvəli necə müəyyən olunur?", "Qrupun tərkibinə və tələbələrin uyğunluğuna görə. Aktual cədvəl üçün bizimlə əlaqə saxlayın."),
    ],
    seo: {
      metaTitle: az("Fransız dili kursu Bakıda — A1-dən C2-yə"),
      metaDescription: az("Fransız dili kursu: CEFR üzrə A1–C2 səviyyələri, tələffüz və danışıq üzərində iş, DELF və DALF sertifikatlarına istiqamət."),
      keywords: az("fransız dili kursu, fransız dili Bakı, DELF, DALF"),
    },
  },

  {
    slug: "conversation-club",
    contentHtml: az(`
<p>Dərsdə öyrəndiyinizi sərbəst danışığa çevirmək üçün təcrübə lazımdır. Conversation Club məhz bunun üçündür: qiymət təzyiqi olmadan, müxtəlif mövzularda və fərqli insanlarla ingilis dilində danışmaq.</p>
<h2>8 fərqli klub formatı</h2>
<ul>
  <li><strong>Speaking Club</strong> — sərbəst müzakirə</li>
  <li><strong>Business English Club</strong> — işgüzar mövzular</li>
  <li><strong>Vocabulary Club</strong> — lüğət ehtiyatı</li>
  <li><strong>Reading Club</strong> — oxu və müzakirə</li>
  <li><strong>Listening Club</strong> — dinləmə bacarığı</li>
  <li><strong>Movie Club</strong> — film əsasında müzakirə</li>
  <li><strong>Game Club</strong> — oyunla dil praktikası</li>
  <li><strong>Make Up Club</strong> — buraxılmış mövzuların tamamlanması</li>
</ul>
<h2>Necə qoşulmaq</h2>
<p>Klublar <strong>həftədə 4 dəfə</strong> keçirilir. İştirak üçün ən azı 1 gün əvvəl qeydiyyatdan keçmək lazımdır. <strong>British Academy tələbələri üçün bütün klublar ödənişsizdir.</strong></p>
`),
    info: [row("Tezlik", "Həftədə 4 dəfə"), row("Formatlar", "8 klub növü"), row("Səviyyələr", "A1 – C2"), row("Tələbələrimiz üçün", "Ödənişsiz")],
    seo: {
      metaTitle: az("İngilis dili danışıq klubu — Conversation Club"),
      metaDescription: az("İngilis dili danışıq klubları: həftədə 4 dəfə, 8 fərqli format — Speaking, Business, Movie, Game və digərləri. Tələbələrimiz üçün ödənişsiz."),
      keywords: az("danışıq klubu, conversation club, speaking club, ingilis dili praktika"),
    },
  },

  {
    slug: "workshop",
    lead: az("Kurs zamanı qaranlıq qalan mövzular üçün təkrar dərsləri — tələbələrimiz üçün ödənişsiz."),
    excerpt: az("Workshop: tam başa düşülməyən və ya zəif qalan mövzular üzrə dəstək dərsləri. Təhsil paketinə daxildir."),
    contentHtml: az(`
<p>Dil kursunda bir mövzu tam oturmayanda növbəti dərs onun üzərində qurulur və boşluq böyüyür. Workshop-lar bu boşluğu vaxtında bağlamaq üçündür.</p>
<h2>Workshop nədir</h2>
<p>Keçilən dərslərdə tam başa düşmədiyiniz, çətinlik çəkdiyiniz və ya zəif qaldığınız mövzular üzrə təşkil olunan <strong>təkrar və dəstək dərsləridir</strong>. Mövzu fərqli izah və əlavə tapşırıqlarla yenidən işlənir.</p>
<h2>Nə verir</h2>
<ul>
  <li>Problem mövzu yarandığı həftədə həll olunur</li>
  <li>Qrupun tempindən geri qalmırsınız</li>
  <li>Kiçik mühitdə sual vermək daha rahatdır</li>
</ul>
<h2>Kimlər qatıla bilər</h2>
<p>Workshop-lar British Academy tələbələrinin təhsil paketinə daxildir və <strong>ödənişsizdir</strong>. Danışıq təcrübəsi üçün <a href="/kurslar/conversation-club">danışıq klubları</a> da paketə daxildir.</p>
`),
    info: [row("Növ", "Mövzu təkrarı / dəstək dərsi"), row("Tələbələrimiz üçün", "Ödənişsiz"), row("Paket", "Əsas kursa daxildir")],
    faq: [
      qa("Workshop nədir?", "Kurs zamanı tam başa düşülməyən və ya zəif qalan mövzular üzrə təşkil olunan təkrar və dəstək dərsləridir."),
      qa("Workshop ödənişlidirmi?", "Xeyr. Workshop-lar British Academy tələbələrinin təhsil paketinə daxildir və ödənişsizdir."),
      qa("Workshop-a necə qatılmaq olar?", "Müəlliminizə və ya filial administratoruna hansı mövzuda dəstək lazım olduğunu bildirin — sizi uyğun Workshop-a yönləndirəcəklər."),
      qa("Workshop danışıq klubundan nə ilə fərqlənir?", "Workshop konkret mövzunun təkrarı üçündür, danışıq klubu isə sərbəst danışıq təcrübəsi üçün. Hər ikisi təhsil paketinə daxildir."),
    ],
    seo: {
      metaTitle: az("Workshop — mövzu təkrarı və dəstək dərsləri"),
      metaDescription: az("Workshop: kurs zamanı başa düşülməyən mövzular üzrə təkrar və dəstək dərsləri. British Academy tələbələri üçün ödənişsiz, təhsil paketinə daxil."),
      keywords: az("workshop, mövzu təkrarı, dəstək dərsi, ingilis dili kursu"),
    },
  },
];
