/**
 * Kompüter, karyera və uşaq kurslarının səhifə məzmunu.
 *
 * Canlı səhifədən götürülən faktlar: MS Office — 3 ay, həftədə 2 dəfə
 * 90 dəq, Windows/Word/Excel/PowerPoint; uşaq ingilis dili — 6 yaşdan,
 * səviyyə 1,5–2 ay (3 aya qədər), dərs 90 dəq, fərdi və qrup. Digər
 * kursların səhifəsində fakt olmadığı üçün müddət/yaş kimi rəqəmlər
 * yazılmayıb — admin paneldə dəqiqləşdirilə bilər.
 */
const az = (text) => ({ az: text, en: "", ru: "" });
const row = (label, value) => ({ label: az(label), value: az(value) });
const qa = (question, answer) => ({ question: az(question), answer: az(answer) });

const SCHEDULE_Q = qa("Dərs cədvəli necə müəyyən olunur?", "Qrupun tərkibinə və tələbələrin uyğunluğuna görə. Aktual qrup və cədvəl üçün bizimlə əlaqə saxlayın.");

export const COURSE_PAGES_CAREER_KIDS = [
  {
    // Səhifədə mətn, lead və təsvir var — məlumat, FAQ və SEO.
    slug: "ms-office",
    info: [row("Müddət", "3 ay"), row("Dərs rejimi", "Həftədə 2 dəfə · 90 dəq"), row("Proqramlar", "Windows · Word · Excel · PowerPoint"), row("Qrup", "Kiçik qruplar")],
    faq: [
      qa("Kurs hansı proqramları əhatə edir?", "Windows, Microsoft Word, Excel və PowerPoint."),
      qa("Kurs nə qədər davam edir?", "3 ay. Dərslər həftədə 2 dəfə, hər biri 90 dəqiqə keçirilir."),
      qa("Kompüteri heç bilməyənlər qoşula bilərmi?", "Bəli. Kurs Windows əsasları ilə başlayır və addım-addım ofis proqramlarına keçir."),
      qa("Dərslər praktikdirmi?", "Bəli. Kurs boyunca real iş tapşırıqları üzərində işləyirsiniz: sənəd hazırlama, cədvəl və hesabatlar, təqdimat qurulması."),
      qa("Excel-i daha dərindən öyrənmək istəyirəm.", "Bunun üçün ayrıca Peşəkar Excel kursumuz var — formullar, pivot cədvəllər və məlumat təhlili."),
    ],
    seo: {
      metaTitle: az("MS Office kursu — Word, Excel, PowerPoint"),
      metaDescription: az("MS Office kursu: Windows, Word, Excel və PowerPoint — 3 aylıq praktik proqram, həftədə 2 dəfə 90 dəqiqə, kiçik qruplar və real iş tapşırıqları."),
      keywords: az("MS Office kursu, ofis proqramları kursu, Word, Excel, PowerPoint, kompüter kursu"),
    },
  },

  {
    slug: "pesekar-excel-kursu",
    lead: az("Formullardan pivot cədvəllərə və hesabatlara qədər — Excel-i iş aləti kimi öyrənin."),
    excerpt: az("Peşəkar Excel kursu: funksiyalar, məlumatların təhlili, pivot cədvəllər, qrafiklər və avtomatlaşdırılmış hesabatlar."),
    contentHtml: az(`
<p>Excel demək olar ki, hər ofisdə istifadə olunur, amma çoxu onun imkanlarının kiçik bir hissəsini bilir. Peşəkar Excel kursu saatlarla əl ilə görülən işi bir neçə dəqiqəyə endirməyi öyrədir.</p>
<h2>Kursun mövzuları</h2>
<ul>
  <li>Formullar, nisbi və mütləq istinadlar</li>
  <li>Məntiqi funksiyalar — <strong>IF</strong>, <strong>IFS</strong>, <strong>AND/OR</strong></li>
  <li>Axtarış funksiyaları — <strong>VLOOKUP</strong>, <strong>XLOOKUP</strong>, <strong>INDEX/MATCH</strong></li>
  <li>Mətn və tarix funksiyaları</li>
  <li>Sıralama, filtr, şərti formatlama və məlumat yoxlaması</li>
  <li><strong>Pivot cədvəllər</strong> və pivot qrafiklər</li>
  <li>Qrafiklər və vizual hesabatlar</li>
  <li>Böyük cədvəllərlə iş və məlumatın təmizlənməsi</li>
</ul>
<h2>Kimlər üçündür</h2>
<p>Mühasiblər, maliyyəçilər, satış və logistika əməkdaşları, HR mütəxəssisləri, analitiklər və gündəlik işində cədvəllərlə çalışan hər kəs.</p>
<h2>Başlanğıc səviyyə</h2>
<p>Excel-in əsaslarını bilmək tövsiyə olunur. Kompüter biliyiniz sıfırdırsa, əvvəlcə <a href="/kurslar/ms-office">MS Office proqramları</a> kursu ilə başlayın.</p>
`),
    info: [row("Sahə", "Məlumat təhlili və hesabat"), row("Əsas mövzular", "Funksiyalar · Pivot · Qrafiklər"), row("Başlanğıc", "Excel əsasları tövsiyə olunur")],
    faq: [
      qa("Kurs kimlər üçündür?", "Gündəlik işində cədvəllərlə çalışanlar üçün: mühasiblər, maliyyəçilər, satış və logistika əməkdaşları, HR mütəxəssisləri və analitiklər."),
      qa("Excel-i heç bilmirəm, qoşula bilərəmmi?", "Əsasları bilmək tövsiyə olunur. Sıfırdan başlayırsınızsa, MS Office proqramları kursu daha uyğundur."),
      qa("Kursda hansı funksiyalar öyrədilir?", "Məntiqi (IF, IFS), axtarış (VLOOKUP, XLOOKUP, INDEX/MATCH), mətn və tarix funksiyaları, həmçinin pivot cədvəllər, şərti formatlama və qrafiklər."),
      qa("Dərslər praktikdirmi?", "Bəli. Mövzular real iş cədvəlləri və hesabat nümunələri üzərində işlənir."),
      SCHEDULE_Q,
    ],
    seo: {
      metaTitle: az("Peşəkar Excel kursu — funksiyalar və pivot"),
      metaDescription: az("Peşəkar Excel kursu: IF, VLOOKUP, XLOOKUP, pivot cədvəllər, şərti formatlama, qrafiklər və hesabatlar. Real iş cədvəlləri üzərində praktik dərslər."),
      keywords: az("Excel kursu, peşəkar Excel, Excel təlimi, pivot cədvəl, VLOOKUP, XLOOKUP"),
    },
  },

  {
    slug: "muhasibatliq-1c-kursu",
    lead: az("Mühasibat uçotunun əsaslarından 1C proqramında praktik işə qədər — karyeraya hazır bacarıq."),
    excerpt: az("Mühasibatlıq və 1C kursu: uçot prinsipləri, ilkin sənədlər, əməliyyatların 1C-də əks olunması və hesabatlar."),
    contentHtml: az(`
<p>Mühasib hər sahədə tələb olunan peşədir. Bu kurs iki hissəni birləşdirir: <strong>mühasibat uçotunun nəzəri əsasları</strong> və bu bilikləri gündəlik işdə tətbiq etmək üçün <strong>1C proqramında praktika</strong>.</p>
<h2>Kursun mövzuları</h2>
<ul>
  <li>Mühasibat uçotunun prinsipləri, hesablar planı və ikili yazılış</li>
  <li>İlkin sənədlər — qaimə, hesab-faktura, kassa və bank sənədləri</li>
  <li>Anbar və mal-material uçotu</li>
  <li>Əsas vəsaitlər və amortizasiya</li>
  <li>Əmək haqqı hesablanması</li>
  <li>Vergilərin əsasları və hesabatlar</li>
  <li>Bütün əməliyyatların 1C proqramında əks olunması</li>
</ul>
<h2>Kimlər üçündür</h2>
<p>Mühasib kimi karyeraya başlamaq istəyənlər, iqtisadiyyat tələbələri və məzunları, biliklərini sistemləşdirmək istəyən mühasib köməkçiləri və öz biznesinin uçotunu anlamaq istəyən sahibkarlar.</p>
<h2>Kompüter bazası</h2>
<p>İşdə 1C ilə yanaşı Excel də çox istifadə olunur. Cədvəllərlə işi gücləndirmək üçün <a href="/kurslar/pesekar-excel-kursu">Peşəkar Excel kursu</a> yaxşı tamamlayıcıdır.</p>
`),
    info: [row("Sahə", "Mühasibat uçotu"), row("Proqram", "1C"), row("Yönüm", "Nəzəriyyə + praktika")],
    faq: [
      qa("Kursa başlamaq üçün iqtisadi təhsil lazımdırmı?", "Xeyr. Kurs uçotun əsaslarından başlayır. İqtisadi təhsil faydalıdır, amma şərt deyil."),
      qa("Kursda 1C proqramında praktika varmı?", "Bəli. Nəzəri mövzular 1C proqramında praktik əməliyyatlarla möhkəmləndirilir."),
      qa("Kurs hansı mövzuları əhatə edir?", "Uçot prinsipləri, ilkin sənədlər, anbar uçotu, əsas vəsaitlər, əmək haqqı, vergilərin əsasları və hesabatlar."),
      qa("Kursdan sonra harada işləyə bilərəm?", "Şirkətlərin mühasibatlıq şöbələrində mühasib köməkçisi və ya mühasib kimi, həmçinin audit və autsorsinq şirkətlərində."),
      SCHEDULE_Q,
    ],
    seo: {
      metaTitle: az("Mühasibatlıq və 1C kursu Bakıda"),
      metaDescription: az("Mühasibatlıq və 1C kursu: uçot prinsipləri, ilkin sənədlər, anbar, əmək haqqı, vergilərin əsasları və bütün əməliyyatların 1C proqramında praktikası."),
      keywords: az("mühasibatlıq kursu, 1C kursu, mühasib kursu, mühasibat uçotu, 1C proqramı"),
    },
  },

  {
    slug: "hr-karguzarliq-kursu",
    lead: az("Kadr uçotu, əmək qanunvericiliyi və sənəd dövriyyəsi — HR və kargüzarlıq üzrə praktik bacarıqlar."),
    excerpt: az("HR & Kargüzarlıq kursu: işə qəbul, əmək müqaviləsi, əmrlər, məzuniyyət, kadr sənədləri və idarə sənəd dövriyyəsi."),
    contentHtml: az(`
<p>Hər təşkilatda insan resursları və sənəd dövriyyəsi ilə məşğul olan mütəxəssisə ehtiyac var. Kurs bu iki yaxın sahəni birlikdə öyrədir: <strong>HR (kadr işi)</strong> və <strong>kargüzarlıq</strong>.</p>
<h2>HR hissəsi</h2>
<ul>
  <li>Əmək qanunvericiliyinin əsasları</li>
  <li>İşə qəbul prosesi, vakansiya və müsahibə</li>
  <li>Əmək müqaviləsi və ona dəyişikliklər</li>
  <li>Kadr əmrləri — qəbul, köçürmə, məzuniyyət, azad etmə</li>
  <li>İş vaxtının uçotu və məzuniyyət növləri</li>
  <li>Şəxsi işlər və kadr uçotu</li>
</ul>
<h2>Kargüzarlıq hissəsi</h2>
<ul>
  <li>Rəsmi sənədlərin tərtibi qaydaları</li>
  <li>Daxil olan və göndərilən sənədlərin qeydiyyatı</li>
  <li>Məktub, arayış, akt və protokol</li>
  <li>Sənəd dövriyyəsi və arxiv işi</li>
</ul>
<h2>Kimlər üçündür</h2>
<p>HR və ya ofis meneceri kimi karyeraya başlamaq istəyənlər, kargüzarlar, katiblər və kadr işini sistemli öyrənmək istəyən rəhbərlər. Sənədlərin hazırlanmasında <a href="/kurslar/ms-office">MS Office</a> bilikləri də vacibdir.</p>
`),
    info: [row("Sahə", "İnsan resursları və sənəd dövriyyəsi"), row("Əsas mövzular", "Əmək müqaviləsi · Əmrlər · Kadr uçotu"), row("Yönüm", "Praktik sənədləşmə")],
    faq: [
      qa("Kurs kimlər üçündür?", "HR mütəxəssisi, ofis meneceri, kargüzar və ya katib kimi işləmək istəyənlər, həmçinin kadr işini sistemli öyrənmək istəyən rəhbərlər üçün."),
      qa("Kursda əmək qanunvericiliyi öyrədilirmi?", "Bəli. Əmək qanunvericiliyinin kadr işi üçün vacib olan əsasları — əmək müqaviləsi, iş vaxtı, məzuniyyət və azad etmə — praktik nümunələrlə keçilir."),
      qa("Kargüzarlıq nədir?", "Təşkilatda rəsmi sənədlərin tərtibi, qeydiyyatı, dövriyyəsi və arxivləşdirilməsi işidir."),
      qa("Əvvəlcədən təcrübə lazımdırmı?", "Xeyr. Kurs əsaslardan başlayır və nümunə sənədlər üzərində praktika ilə davam edir."),
      SCHEDULE_Q,
    ],
    seo: {
      metaTitle: az("HR və Kargüzarlıq kursu — kadr işi və sənədlər"),
      metaDescription: az("HR və kargüzarlıq kursu: əmək qanunvericiliyinin əsasları, əmək müqaviləsi, kadr əmrləri, məzuniyyət, sənəd dövriyyəsi və arxiv işi üzrə praktik bacarıqlar."),
      keywords: az("HR kursu, kargüzarlıq kursu, kadr işi, insan resursları, sənəd dövriyyəsi"),
    },
  },

  {
    // Səhifədə FAQ var — saxlanılır.
    slug: "usaq-ingilis-dili",
    contentHtml: az(`
<p>Uşaqlar dili qaydalarla deyil, istifadə edərək öyrənir. Proqramımız <strong>6 yaş və yuxarı</strong> uşaqlar üçün xüsusi hazırlanıb: oyunlar, dialoqlar və praktik fəaliyyətlər vasitəsilə ingilis dili maraqlı və effektiv şəkildə öyrədilir.</p>
<h2>Proqramın xüsusiyyətləri</h2>
<ul>
  <li>Yaşa uyğun interaktiv tədris metodikası</li>
  <li>Oyunlar, dialoqlar və praktik fəaliyyətlər</li>
  <li>Danışıq, dinləmə, oxu və yazı bacarıqlarının kompleks inkişafı</li>
  <li>Peşəkar və təcrübəli müəllim heyəti</li>
  <li>Müasir tədris materialları</li>
</ul>
<h2>Dərslər necə təşkil olunur</h2>
<p>Hər dərs <strong>90 dəqiqə</strong> davam edir. Hər səviyyə orta hesabla 1,5–2 ay çəkir; uşağın inkişaf tempindən asılı olaraq bəzi hallarda 3 aya qədər uzana bilər. Dərs günləri və saatları valideynin və uşağın uyğunluğuna görə müəyyən olunur. Dərslər həm <strong>fərdi</strong>, həm də <strong>qrup</strong> formatında keçirilir.</p>
<h2>Sertifikat</h2>
<p>Kursun sonunda imtahan keçirilir və uğur qazanan şagirdlərə sertifikat təqdim olunur.</p>
`),
    info: [row("Yaş", "6 yaş və yuxarı"), row("Dərs", "90 dəqiqə"), row("Səviyyə müddəti", "1,5–2 ay (3 aya qədər)"), row("Format", "Fərdi / qrup")],
    seo: {
      metaTitle: az("Uşaqlar üçün İngilis dili kursu — 6 yaşdan"),
      metaDescription: az("Uşaqlar üçün ingilis dili: 6 yaş və yuxarı, oyun əsaslı interaktiv dərslər, fərdi və qrup formatı, 90 dəqiqəlik dərslər və kursun sonunda sertifikat."),
      keywords: az("uşaq ingilis dili, uşaqlar üçün ingilis dili kursu, ingilis dili uşaqlar, Bakı"),
    },
  },

  {
    slug: "usaq-rus-dili",
    lead: az("Uşaqlar üçün danışıq yönümlü rus dili — oyun, dialoq və yaşa uyğun materiallarla."),
    excerpt: az("Uşaqlar üçün rus dili kursu: yaşa uyğun interaktiv dərslər, danışıq, oxu və yazı bacarıqlarının inkişafı."),
    contentHtml: az(`
<p>Rus dili Azərbaycanda gündəlik həyatda, təhsildə və iş mühitində geniş istifadə olunur. Uşaq yaşında öyrənilən dil daha təbii mənimsənilir və tələffüz daha asan formalaşır.</p>
<h2>Proqramın xüsusiyyətləri</h2>
<ul>
  <li>Yaşa uyğun interaktiv metodika</li>
  <li>Oyunlar, mahnılar, dialoqlar və rol oyunları</li>
  <li>Danışıq, dinləmə, oxu və yazı bacarıqlarının birlikdə inkişafı</li>
  <li>Kiril əlifbası və düzgün yazı vərdişi</li>
  <li>Səviyyəyə uyğun qruplar</li>
</ul>
<h2>Kimlər üçündür</h2>
<p>Rus dilini sıfırdan öyrənən uşaqlar, həmçinin rus bölməsində oxuyan və dərslərini gücləndirmək istəyən şagirdlər.</p>
<h2>Böyüklər üçün də var</h2>
<p>Valideynlər üçün: <a href="/kurslar/rus-dili-kursu">Rus dili kursu</a>. Uşaqlar üçün ingilis dili: <a href="/kurslar/usaq-ingilis-dili">Uşaqlar üçün İngilis dili</a>.</p>
`),
    info: [row("Yönüm", "Danışıq və oyun əsaslı"), row("Bacarıqlar", "Danışıq · Dinləmə · Oxu · Yazı"), row("Qruplar", "Səviyyəyə görə")],
    faq: [
      qa("Uşaq rus dilini sıfırdan öyrənə bilərmi?", "Bəli. Proqram sıfırdan başlayanlar üçün də qurulub: əlifba, sadə ifadələr və gündəlik danışıqdan başlanır."),
      qa("Dərslər necə keçirilir?", "Oyunlar, mahnılar, dialoqlar və rol oyunları ilə — uşağın yaşına uyğun interaktiv formada."),
      qa("Rus bölməsində oxuyan şagirdlər qoşula bilərmi?", "Bəli. Səviyyə müəyyən edildikdən sonra uşaq uyğun qrupa yerləşdirilir və zəif tərəfləri üzərində işlənir."),
      qa("Hansı yaşdan başlamaq olar?", "Yaş və qrup uşağın səviyyəsinə görə müəyyən edilir. Dəqiq məlumat üçün bizimlə əlaqə saxlayın."),
    ],
    seo: {
      metaTitle: az("Uşaqlar üçün Rus dili kursu — oyun əsaslı"),
      metaDescription: az("Uşaqlar üçün rus dili kursu: oyun, mahnı və dialoqlarla interaktiv dərslər, danışıq, oxu və yazı bacarıqlarının inkişafı, səviyyəyə uyğun qruplar."),
      keywords: az("uşaq rus dili, uşaqlar üçün rus dili kursu, rus dili uşaqlar, Bakı"),
    },
  },

  {
    slug: "usaq-mentiq",
    lead: az("Diqqət, yaddaş və problem həll etmə bacarığını inkişaf etdirən məntiq dərsləri."),
    excerpt: az("Uşaqlar üçün məntiq kursu: məntiqi və analitik düşüncə, diqqət, yaddaş və tapşırıqları mərhələli həll etmə bacarığı."),
    contentHtml: az(`
<p>Məntiq dərsləri uşağa hazır cavab deyil, <strong>düşünmə yolu</strong> öyrədir. Qazanılan bacarıq riyaziyyatda, oxuda və gündəlik qərarlarda da özünü göstərir.</p>
<h2>Hansı bacarıqlar inkişaf edir</h2>
<ul>
  <li><strong>Məntiqi və analitik düşüncə</strong> — səbəb-nəticə, qanunauyğunluq tapma</li>
  <li><strong>Diqqət və konsentrasiya</strong></li>
  <li><strong>Yaddaş</strong> — vizual və eşitmə yaddaşı</li>
  <li><strong>Məkan təsəvvürü</strong> — fiqurlar, ardıcıllıqlar, labirintlər</li>
  <li><strong>Problem həll etmə</strong> — tapşırığı hissələrə bölmək və mərhələli həll</li>
</ul>
<h2>Dərslər necə keçir</h2>
<p>Tapşırıqlar uşağın yaşına və səviyyəsinə uyğun seçilir: tapmacalar, məntiqi oyunlar, ardıcıllıq və qanunauyğunluq tapşırıqları. Asandan çətinə doğru irəliləyiş uşağın özünə inamını da artırır.</p>
<h2>Digər uşaq proqramları</h2>
<p><a href="/kurslar/usaq-ingilis-dili">Uşaqlar üçün İngilis dili</a> və <a href="/kurslar/usaq-rus-dili">Uşaqlar üçün Rus dili</a>.</p>
`),
    info: [row("Bacarıqlar", "Məntiq · Diqqət · Yaddaş"), row("Metod", "Tapmaca və məntiqi oyunlar"), row("Qruplar", "Yaş və səviyyəyə görə")],
    faq: [
      qa("Məntiq dərsləri uşağa nə verir?", "Məntiqi və analitik düşüncəni, diqqəti, yaddaşı və problem həll etmə bacarığını inkişaf etdirir. Bu bacarıqlar riyaziyyat və oxu kimi dərslərdə də kömək edir."),
      qa("Dərslər necə keçirilir?", "Yaşa uyğun tapmacalar, məntiqi oyunlar, ardıcıllıq və qanunauyğunluq tapşırıqları ilə — asandan çətinə doğru."),
      qa("Hansı yaşdan başlamaq olar?", "Qruplar uşağın yaşına və səviyyəsinə görə formalaşdırılır. Dəqiq məlumat üçün bizimlə əlaqə saxlayın."),
      qa("Məntiq dərsləri məktəb riyaziyyatını əvəz edirmi?", "Xeyr, onu tamamlayır. Məqsəd konkret mövzunu deyil, düşünmə bacarığını inkişaf etdirməkdir."),
    ],
    seo: {
      metaTitle: az("Uşaqlar üçün Məntiq kursu — düşünmə bacarığı"),
      metaDescription: az("Uşaqlar üçün məntiq kursu: məntiqi və analitik düşüncə, diqqət, yaddaş, məkan təsəvvürü və problem həll etmə bacarığını inkişaf etdirən dərslər."),
      keywords: az("uşaq məntiq, məntiq kursu, uşaqlar üçün məntiq, məntiqi düşüncə"),
    },
  },
];
