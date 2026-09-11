/**
 * Kompüter, karyera və uşaq proqramları üzrə bloq yazıları.
 * Faktlar kursun canlı səhifəsindən götürülüb. Qiymət qəsdən yazılmayıb.
 */
const az = (text) => ({ az: text, en: "", ru: "" });

export const CAREER_KIDS_POSTS = [
  {
    slug: "ofis-proqramlari-word-excel-powerpoint",
    category: "karyera",
    readMinutes: 4,
    title: az("Ofis proqramları kursu: Word, Excel və PowerPoint-i niyə bilmək lazımdır"),
    excerpt: az("İş yerində ən çox işlədilən ofis proqramları, onları sistemli öyrənməyin faydası və 3 aylıq praktik proqramın nəyi əhatə etdiyi."),
    tags: az("MS Office, Word, Excel, PowerPoint, kompüter kursu"),
    seo: {
      keywords: az("MS Office, Word, Excel, PowerPoint, kompüter kursu"),
      metaTitle: az("Ofis proqramları kursu — Word, Excel, PowerPoint"),
      metaDescription: az("MS Office kursu: Windows, Word, Excel və PowerPoint üzrə 3 aylıq praktik proqram. İş yerində real tapşırıqlar əsasında öyrənmə."),
    },
    content: az(`
<p>Demək olar ki, hər ofis işində sənəd hazırlamaq, cədvəl aparmaq və təqdimat qurmaq lazım gəlir. Bu proqramları «bir az bilmək» ilə sistemli bilmək arasındakı fərq iş sürətində və nəticənin keyfiyyətində dərhal görünür.</p>

<h2>Kurs nəyi əhatə edir</h2>
<ul>
  <li><strong>Windows</strong> — fayl və qovluq idarəsi, əsas iş vərdişləri</li>
  <li><strong>Word</strong> — rəsmi sənəd, məktub, cədvəl və formatlaşdırma</li>
  <li><strong>Excel</strong> — cədvəl, düsturlar, sadə hesabat</li>
  <li><strong>PowerPoint</strong> — aydın və səliqəli təqdimat</li>
</ul>

<h2>Necə keçir</h2>
<p>Kurs <strong>3 ay</strong> davam edir, dərslər həftədə 2 dəfə, hər biri 90 dəqiqədir. Qruplar kiçikdir ki, hər iştirakçıya kifayət qədər diqqət ayrılsın. Tədris real iş tapşırıqları üzərində aparılır — nəzəriyyə yox, gündəlik işdə qarşılaşacağınız vəziyyətlər.</p>

<h2>Kimlər üçündür</h2>
<ul>
  <li>İlk ofis işinə hazırlaşanlar</li>
  <li>Kompüterdən istifadə edən, amma bilgisini sistemləşdirmək istəyənlər</li>
  <li>CV-sinə ölçülə bilən bacarıq əlavə etmək istəyənlər</li>
</ul>

<h2>Növbəti addım</h2>
<p>Excel-də daha dərinə getmək istəyənlər üçün ayrıca proqram var — bax <a href="/bloq/excel-kursu-karyerada-ne-verir">Excel kursu karyerada nə verir</a> və <a href="/kurslar/pesekar-excel-kursu">Peşəkar Excel kursu</a>.</p>

<p>Qeydiyyat: <a href="/kurslar/ms-office">MS Office proqramları</a>.</p>
`),
  },

  {
    slug: "muhasibatliq-ve-1c-kursu-kimlere-lazimdir",
    category: "karyera",
    readMinutes: 4,
    title: az("Mühasibatlıq və 1C: bu sahədə işə başlamaq üçün nə bilmək lazımdır"),
    excerpt: az("Mühasibat uçotunun əsasları, 1C proqramının iş yerindəki rolu və sahəyə yeni başlayanlar üçün öyrənmə ardıcıllığı."),
    tags: az("mühasibatlıq, 1C, mühasibat uçotu, karyera kursu"),
    seo: {
      keywords: az("mühasibatlıq, 1C, mühasibat uçotu, karyera kursu"),
      metaTitle: az("Mühasibatlıq və 1C kursu — sahəyə başlanğıc"),
      metaDescription: az("Mühasibatlıq və 1C kursu kimlər üçündür: uçotun əsasları, ilkin sənədlər, 1C-də iş və mühasib köməkçisi kimi karyeraya başlanğıc."),
    },
    content: az(`
<p>Hər şirkətin maliyyə axını uçota alınmalıdır — ona görə mühasibat biliyi davamlı tələb olunan peşə bacarığıdır. Praktikada bu işin böyük hissəsi <strong>1C</strong> kimi proqramlarda aparılır.</p>

<h2>Nəzəriyyə, yoxsa proqram?</h2>
<p>Hər ikisi. Proqramı bilib uçotun məntiqini bilməmək — düyməni basmağı bacarıb nəticəni yoxlaya bilməmək deməkdir. Səhvi tapmaq üçün hansı əməliyyatın hansı hesaba necə təsir etdiyini başa düşmək lazımdır.</p>

<h2>Öyrənmə ardıcıllığı</h2>
<ol>
  <li>Mühasibat uçotunun əsas prinsipləri və hesablar planı</li>
  <li>İlkin sənədlər — qaimə, akt, hesab-faktura</li>
  <li>Kassa və bank əməliyyatları</li>
  <li>Əmək haqqı hesablanması</li>
  <li>1C-də bu əməliyyatların aparılması və hesabatların çıxarılması</li>
</ol>

<h2>Kimlər üçündür</h2>
<ul>
  <li>İqtisadiyyat və maliyyə ixtisası tələbələri və məzunları</li>
  <li>Mühasib köməkçisi kimi işə başlamaq istəyənlər</li>
  <li>Öz biznesinin maliyyəsini anlamaq istəyən sahibkarlar</li>
</ul>

<h2>Tamamlayıcı bacarıq</h2>
<p>Mühasibatda Excel gündəlik alətdir — cədvəllərin yoxlanması, müqayisə və hesabat üçün. Bu bacarığı gücləndirmək üçün <a href="/kurslar/pesekar-excel-kursu">Peşəkar Excel kursuna</a> baxın.</p>

<p>Qeydiyyat: <a href="/kurslar/muhasibatliq-1c-kursu">Mühasibatlıq və 1C kursu</a>.</p>
`),
  },

  {
    slug: "hr-ve-karguzarliq-kursu-ne-oyredir",
    category: "karyera",
    readMinutes: 4,
    title: az("HR və kargüzarlıq: insan resursları sahəsinə necə başlamaq olar"),
    excerpt: az("HR mütəxəssisinin gündəlik işi, kargüzarlığın rolu, əmək münasibətlərinin sənədləşdirilməsi və sahəyə yeni başlayanlar üçün lazım olan bacarıqlar."),
    tags: az("HR, insan resursları, kargüzarlıq, karyera kursu"),
    seo: {
      keywords: az("HR, insan resursları, kargüzarlıq, karyera kursu"),
      metaTitle: az("HR və kargüzarlıq kursu — sahəyə başlanğıc"),
      metaDescription: az("HR və kargüzarlıq kursu nə öyrədir: işə qəbul, əmək müqaviləsi, kadr sənədləri və sənəd dövriyyəsi. İnsan resurslarında karyeraya başlanğıc."),
    },
    content: az(`
<p>İnsan resursları (HR) şirkətin ən vacib resursu — insanlarla işləyir: işə qəbul, uyğunlaşma, inkişaf və əmək münasibətlərinin düzgün rəsmiləşdirilməsi. Kargüzarlıq isə bu prosesin sənəd tərəfidir.</p>

<h2>HR mütəxəssisi nə edir</h2>
<ul>
  <li>Vakansiya elanı, namizədlərin seçimi və müsahibə</li>
  <li>İşə qəbul və yeni işçinin uyğunlaşması</li>
  <li>Əmək müqavilələri və kadr əmrləri</li>
  <li>Məzuniyyət, ezamiyyət və iş vaxtının uçotu</li>
  <li>Təlim və performansın qiymətləndirilməsi</li>
</ul>

<h2>Kargüzarlıq niyə vacibdir</h2>
<p>Əmək münasibətlərində hər qərar sənədlə təsdiqlənməlidir. Səhv tərtib olunmuş əmr və ya müqavilə sonradan hüquqi problemə çevrilə bilər. Sənədlərin düzgün formatı, qeydiyyatı və saxlanması HR işinin əsas hissəsidir.</p>

<h2>Kimlər üçündür</h2>
<ul>
  <li>HR sahəsində karyeraya başlamaq istəyənlər</li>
  <li>Ofis meneceri, katib və inzibati vəzifələrdə çalışanlar</li>
  <li>Kiçik biznesdə kadr işini özü aparan sahibkarlar</li>
</ul>

<h2>Tamamlayıcı bacarıqlar</h2>
<p>HR işində sənəd hazırlığı və cədvəl işi gündəlikdir — <a href="/kurslar/ms-office">MS Office proqramları</a> kursu bu baxımdan yaxşı tamamlayıcıdır. Beynəlxalq şirkətlərdə isə <a href="/kurslar/biznes-ingilis-dili-kursu">Biznes İngilis dili</a> üstünlük verir.</p>

<p>Qeydiyyat: <a href="/kurslar/hr-karguzarliq-kursu">HR & Kargüzarlıq kursu</a>.</p>
`),
  },

  {
    slug: "usaqlar-ucun-rus-dili-nece-oyretmek",
    category: "usaq-proqramlari",
    readMinutes: 4,
    title: az("Uşaqlar üçün rus dili: erkən yaşda öyrənməyin üstünlükləri"),
    excerpt: az("Uşağa rus dilini hansı yaşda və necə öyrətmək lazımdır, oyun əsaslı dərsin faydası və valideynin evdə edə biləcəyi sadə addımlar."),
    tags: az("uşaq rus dili, uşaqlar üçün rus dili, valideyn, erkən yaş"),
    seo: {
      keywords: az("uşaq rus dili, uşaqlar üçün rus dili, valideyn, erkən yaş"),
      metaTitle: az("Uşaqlar üçün rus dili — erkən yaşda öyrənmək"),
      metaDescription: az("Uşaqlar üçün rus dili: erkən yaşda öyrənməyin faydası, oyun əsaslı dərslər, yaşa uyğun proqram və evdə dəstək üçün valideynə məsləhətlər."),
    },
    content: az(`
<p>Rus dili Azərbaycanda təhsil, iş və gündəlik həyatda geniş işlədilir. Uşağın bu dili erkən yaşda, təbii şəkildə mənimsəməsi sonrakı illərdə ciddi üstünlük verir.</p>

<h2>Erkən yaşın üstünlüyü</h2>
<ul>
  <li><strong>Tələffüz</strong> — uşaq səsləri daha asan və təbii təkrarlayır.</li>
  <li><strong>Qorxusuzluq</strong> — səhv etməkdən çəkinmir, danışmağa daha açıqdır.</li>
  <li><strong>Təbii mənimsəmə</strong> — dili qayda ilə yox, istifadə vasitəsilə öyrənir.</li>
</ul>

<h2>Dərs necə olmalıdır</h2>
<p>Uşaq üçün dərs oyun, mahnı, dialoq və vizual materiallar üzərində qurulmalıdır. Qrammatika cədvəli bu yaşda işləmir — uşaq dili istifadə edərək öyrənir. Qrupun yaşa və səviyyəyə görə bölünməsi də vacibdir.</p>

<h2>Valideyn evdə nə edə bilər</h2>
<ul>
  <li>Rusca cizgi filmləri və uşaq mahnıları</li>
  <li>Sadə şəkilli kitablar birlikdə oxumaq</li>
  <li>Gündəlik bir-iki sadə ifadəni rusca işlətmək</li>
  <li>Səhvi düzəltməkdən çox, danışmağı həvəsləndirmək</li>
</ul>

<h2>Nəticəni necə görmək</h2>
<p>İrəliləyiş həftələrlə deyil, aylarla ölçülür. İlk mərhələdə uşağın anlaması danışmasından qabaqda gedir — bu, tam normaldır.</p>

<p>Ümumi yaş bələdçisi üçün <a href="/bloq/usaga-ingilis-dili-nece-yasdan">uşağa dil öyrətmək</a> yazımızı oxuyun. Qeydiyyat: <a href="/kurslar/usaq-rus-dili">Uşaqlar üçün Rus dili</a>.</p>
`),
  },

  {
    slug: "usaqlar-ucun-mentiq-dersleri-ne-verir",
    category: "usaq-proqramlari",
    readMinutes: 4,
    title: az("Uşaqlar üçün məntiq dərsləri: düşünmə bacarığını necə inkişaf etdirir"),
    excerpt: az("Məntiq dərslərinin uşağın məktəb uğuruna, diqqətinə və problem həll etmə bacarığına təsiri, dərslərin necə qurulduğu və kimlər üçün faydalı olduğu."),
    tags: az("uşaq məntiq, məntiqi düşünmə, uşaq inkişafı, valideyn"),
    seo: {
      keywords: az("uşaq məntiq, məntiqi düşünmə, uşaq inkişafı, valideyn"),
      metaTitle: az("Uşaqlar üçün məntiq dərsləri — nə verir"),
      metaDescription: az("Uşaqlar üçün məntiq dərsləri: diqqət, analitik düşünmə və problem həll etmə bacarığının inkişafı, məktəb uğuruna təsiri və dərslərin quruluşu."),
    },
    content: az(`
<p>Məntiq ayrıca fənn kimi görünsə də, əslində bütün fənlərin əsasında dayanır: riyazi məsələni həll etmək, mətni anlamaq, səbəb-nəticə əlaqəsini görmək — hamısı məntiqi düşünmə tələb edir.</p>

<h2>Uşağa nə verir</h2>
<ul>
  <li><strong>Diqqət və səbir</strong> — tapşırığı sona qədər izləmək vərdişi</li>
  <li><strong>Analitik düşünmə</strong> — məlumatı hissələrə bölüb nəticə çıxarmaq</li>
  <li><strong>Problem həlli</strong> — bir yol işləmədikdə başqasını axtarmaq</li>
  <li><strong>Özünəinam</strong> — çətin tapşırığı öz gücü ilə həll etməyin sevinci</li>
</ul>

<h2>Dərslər necə qurulur</h2>
<p>Yaşa uyğun tapmacalar, ardıcıllıq və qanunauyğunluq tapşırıqları, məkan təsəvvürü üzrə məşqlər və məntiqi oyunlar. Tapşırıqlar asandan çətinə doğru gedir, uşaq öz tempində irəliləyir.</p>

<h2>Kimlər üçün faydalıdır</h2>
<ul>
  <li>Məktəbə hazırlaşan və ibtidai sinif uşaqları</li>
  <li>Riyaziyyatda çətinlik çəkən uşaqlar</li>
  <li>Diqqəti tez yayınan uşaqlar</li>
  <li>Olimpiada və intellektual yarışlara hazırlaşanlar</li>
</ul>

<h2>Dil öyrənmə ilə əlaqə</h2>
<p>Məntiqi düşünmə dil öyrənməni də asanlaşdırır — qaydanı görmək və tətbiq etmək bacarığı eyni əzələdir. Bu səbəbdən məntiq dərsləri <a href="/kurslar/usaq-ingilis-dili">Uşaqlar üçün İngilis dili</a> ilə yaxşı tamamlanır.</p>

<p>Qeydiyyat: <a href="/kurslar/usaq-mentiq">Uşaqlar üçün Məntiq</a>.</p>
`),
  },
];
