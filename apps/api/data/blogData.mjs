/**
 * BLOQ MƏZMUNU — SEO üçün başlanğıc dəsti.
 *
 * ── NİYƏ LAZIM OLDU ──
 * Auditdə çıxan mənzərə: saytda 0 bloq yazısı var idi, 39 kurs/ölkə
 * səhifəsindən 34-ünün mətni 40 sözdən az, heç birində isə SEO başlığı yox.
 * Yəni axtarış sistemləri üçün sayt praktiki olaraq boş idi: «Almaniyada
 * təhsil», «IELTS necə hazırlaşmalı» kimi sorğularda göstəriləcək mətn
 * ümumiyyətlə mövcud deyildi.
 *
 * Bu yazılar həmin boşluğu bloq tərəfdən doldurur və hər biri müvafiq
 * KURS/ÖLKƏ səhifəsinə daxili link verir — belədə bloq həm axtarışdan
 * ziyarətçi gətirir, həm də onu satış səhifəsinə ötürür.
 *
 * ── DİL ──
 * Mətn yalnız AZƏRBAYCANCA yazılıb; `en`/`ru` boşdur. Səbəb: sistem boş dili
 * avtomatik AZ-a düşürür (utils/i18n.js → pickLocale), yəni sayt sınmır, və
 * layihədə hazır «Hamısını tərcümə et» düyməsi var (Developer → AI tərcümə).
 * Tərcüməni əl ilə yazmaq əvəzinə həmin alət işlədilməlidir.
 *
 * ── DƏQİQLİK ──
 * ⚠️ Qiymət, təqaüd məbləği və müraciət tarixi QƏSDƏN yazılmayıb: onlar hər
 * il dəyişir və köhnəlmiş rəqəm saytın etibarını sındırır. Mətndə yalnız
 * dəyişməyən məlumat (proses, tələb olunan sənəd növləri, səviyyə sistemi)
 * var; konkret rəqəm lazım olan yerdə oxucu rəsmi mənbəyə yönləndirilir.
 *
 * ── VƏZİYYƏT ──
 * Yazılar `draft` kimi yüklənir. Dərc etmək admin-in qərarıdır: mətn
 * mərkəzin öz tonuna uyğunlaşdırılmalı və faktlar yoxlanmalıdır.
 */

/** Yalnız AZ — qalan dillər AI tərcüməsi ilə doldurulur. */
const az = (text) => ({ az: text, en: "", ru: "" });

/** Bloq kateqoriyaları. `slug` sabitdir — yazılar ona görə bağlanır. */
export const BLOG_CATEGORIES = [
  { slug: "xaricde-tehsil", name: az("Xaricdə təhsil"), color: "#0B63A8", order: 1 },
  { slug: "imtahanlar", name: az("Beynəlxalq imtahanlar"), color: "#B3352F", order: 2 },
  { slug: "dil-oyrenme", name: az("Dil öyrənmə"), color: "#0F6E64", order: 3 },
  { slug: "karyera", name: az("Karyera və bacarıqlar"), color: "#6D3BAF", order: 4 },
  { slug: "usaq-proqramlari", name: az("Uşaq proqramları"), color: "#8F4E00", order: 5 },
];

// Kurs və ölkə səhifələrinin HƏR BİRİ üçün ayrıca yazı — mövzuya görə
// ayrı fayllardadır ki, bu fayl oxunmaz uzunluğa çatmasın. Hamısı aşağıda
// `BLOG_POSTS`-a birləşir; import servisi yalnız o siyahını görür.
import { LANGUAGE_POSTS_A } from "./blog/languagesA.mjs";
import { LANGUAGE_POSTS_B } from "./blog/languagesB.mjs";
import { EXAM_POSTS } from "./blog/exams.mjs";
import { CAREER_KIDS_POSTS } from "./blog/careerKids.mjs";
import { DESTINATION_POSTS } from "./blog/destinations.mjs";

/**
 * Yazının gövdəsi TipTap-ın qəbul etdiyi HTML-dir (h2/h3, p, ul, ol, a).
 * `editor-content.css` bu teqləri onsuz da stilləşdirir.
 */
const CORE_POSTS = [
  // ───────────────────────── XARİCDƏ TƏHSİL ─────────────────────────
  {
    slug: "almaniyada-tehsil-sertler-ve-senedler",
    category: "xaricde-tehsil",
    readMinutes: 8,
    title: az("Almaniyada təhsil: şərtlər, sənədlər və addım-addım proses"),
    excerpt: az(
      "Almaniyada bakalavr və magistratura üçün nə tələb olunur, hansı sənədlər lazımdır və müraciət prosesi hansı ardıcıllıqla gedir — sadə dildə izah.",
    ),
    tags: az("Almaniya, xaricdə təhsil, universitet, viza, Studienkolleg"),
    seo: {
      keywords: az("Almaniya, xaricdə təhsil, universitet, viza, Studienkolleg"),
      metaTitle: az("Almaniyada təhsil — şərtlər, sənədlər və qəbul prosesi"),
      metaDescription: az(
        "Almaniyada təhsil almaq üçün dil səviyyəsi, Studienkolleg, tələb olunan sənədlər və müraciət addımları. British Academy ilə hazırlıq.",
      ),
    },
    content: az(`
<p>Almaniya azərbaycanlı tələbələr üçün ən çox seçilən istiqamətlərdən biridir. Səbəbi sadədir: dövlət universitetlərinin böyük hissəsində təhsil haqqı yoxdur, diplom Avropa boyu tanınır, tələbənin işləmək və məzuniyyətdən sonra iş axtarmaq hüququ var.</p>
<p>Bu yazıda prosesi addım-addım açırıq — nədən başlamaq, hansı sənədləri hazırlamaq və hansı mərhələdə nəyə diqqət etmək lazımdır.</p>

<h2>Kimlər müraciət edə bilər</h2>
<p>Azərbaycanda 11 illik orta təhsil Almaniyanın 13 illik sistemi ilə birbaşa uyğunlaşmır. Ona görə məktəbi bitirən şagird çox vaxt birbaşa bakalavra qəbul olunmur və iki yoldan biri seçilir:</p>
<ul>
  <li><strong>Studienkolleg</strong> — bir illik hazırlıq proqramı. Sonunda <em>Feststellungsprüfung</em> imtahanı verilir və nəticə universitet qəbulunda əsas götürülür.</li>
  <li><strong>Azərbaycanda 1–2 kurs oxumaq</strong> — universitetdə bir-iki il təhsil aldıqdan sonra birbaşa bakalavra müraciət etmək mümkün olur.</li>
</ul>
<p>Magistratura üçün vəziyyət daha sadədir: bakalavr diplomu və uyğun ixtisas kifayət edir.</p>

<h2>Dil tələbi</h2>
<p>Proqram alman dilindədirsə, adətən <strong>B2–C1</strong> səviyyəsi tələb olunur və bu, rəsmi sertifikatla təsdiqlənir (TestDaF, DSH, Goethe, telc). İngilis dilində olan proqramlarda isə IELTS və ya TOEFL istənilir.</p>
<p>Alman dilini sıfırdan başlayırsınızsa, B2-yə çatmaq üçün real vaxt ayırın — bu, bir neçə aylıq deyil, ardıcıl bir illik işdir. <a href="/kurslar/alman-dili-kursu">Alman dili kursu</a> və <a href="/kurslar/beynelxalq-sertifikatli-alman-dili-kursu">beynəlxalq sertifikatlı proqram</a> məhz bu yol üçün qurulub.</p>

<h2>Tələb olunan sənədlər</h2>
<p>Universitetdən universitetə dəyişsə də, əsas dəst demək olar ki, eynidir:</p>
<ol>
  <li>Attestat və ya bakalavr diplomu (notarial tərcümə ilə)</li>
  <li>Qiymət cədvəli / transkript</li>
  <li>Dil sertifikatı</li>
  <li>Motivasiya məktubu</li>
  <li>CV (Avropa formatında)</li>
  <li>Pasport surəti və foto</li>
  <li>Bəzi ixtisaslarda — tövsiyə məktubu və ya portfolio</li>
</ol>
<p>Sənədlərin bir hissəsi <em>uni-assist</em> vasitəsilə yoxlanılır. Hansı universitetin bu sistemdən istifadə etdiyini əvvəlcədən öyrənin — bu, vaxt planınızı dəyişir.</p>

<h2>Maliyyə təsdiqi</h2>
<p>Viza üçün təhsil müddətində özünüzü təmin edə biləcəyinizi göstərmək tələb olunur. Bu, adətən <strong>bloklaşdırılmış hesab</strong> (Sperrkonto) vasitəsilə edilir. Tələb olunan məbləğ hər il yenilənir, ona görə rəqəmi mütləq rəsmi mənbədən — Almaniyanın Azərbaycandakı səfirliyinin saytından — yoxlayın.</p>

<h2>Proses hansı ardıcıllıqla gedir</h2>
<ol>
  <li>İxtisas və universitet seçimi</li>
  <li>Dil hazırlığı və sertifikatın alınması</li>
  <li>Sənədlərin tərcüməsi və təsdiqi</li>
  <li>Universitetə müraciət (birbaşa və ya uni-assist ilə)</li>
  <li>Qəbul məktubu (Zulassung)</li>
  <li>Bloklaşdırılmış hesabın açılması</li>
  <li>Viza müraciəti</li>
  <li>Almaniyada qeydiyyat, sığorta və universitetə yazılma</li>
</ol>

<h2>Nədən vaxtında başlamaq lazımdır</h2>
<p>Ən çox rast gəldiyimiz səhv — prosesə gec başlamaq. Dil sertifikatı, sənəd tərcüməsi və viza növbəsi birlikdə aylar aparır. Real planlaşdırma <strong>təhsilin başlamasından ən azı bir il əvvəl</strong> qurulmalıdır.</p>

<p>Almaniya istiqaməti üzrə addımları birlikdə planlaşdırmaq istəyirsinizsə, <a href="/xaricde-tehsil/almaniya">Almaniyada təhsil səhifəmizə</a> baxın və ya <a href="/elaqe">bizimlə əlaqə saxlayın</a>.</p>
`),
  },

  {
    slug: "polsada-tehsil-qebul-ve-viza",
    category: "xaricde-tehsil",
    readMinutes: 7,
    title: az("Polşada təhsil: qəbul şərtləri, viza və nəyə diqqət etməli"),
    excerpt: az(
      "Polşa Avropa diplomunu daha əlçatan qiymətə almaq istəyənlərin ilk seçimlərindəndir. Qəbul prosesi, dil tələbi və viza mərhələsi haqqında.",
    ),
    tags: az("Polşa, xaricdə təhsil, Avropa universiteti, viza"),
    seo: {
      keywords: az("Polşa, xaricdə təhsil, Avropa universiteti, viza"),
      metaTitle: az("Polşada təhsil — qəbul şərtləri, sənədlər və viza"),
      metaDescription: az(
        "Polşada bakalavr və magistratura qəbulu: dil tələbi, sənəd siyahısı, viza addımları və seçim zamanı diqqət ediləcək məqamlar.",
      ),
    },
    content: az(`
<p>Polşa son illər azərbaycanlı tələbələrin ən çox müraciət etdiyi Avropa ölkələrindən birinə çevrilib. Səbəb — Avropa İttifaqı diplomu, nisbətən əlçatan yaşayış xərcləri və ingilis dilində geniş proqram seçimi.</p>

<h2>İngilis, yoxsa Polyak dilində?</h2>
<p>Polşada həm polyak, həm də ingilis dilində proqramlar var:</p>
<ul>
  <li><strong>İngilis dilində</strong> — daha çox seçim, adətən ödənişli, dil sertifikatı tələb olunur (IELTS/TOEFL, bəzən universitetin öz imtahanı).</li>
  <li><strong>Polyak dilində</strong> — dövlət universitetlərində daha sərfəli, amma B1–B2 səviyyəsində polyak dili lazımdır.</li>
</ul>
<p>İngilis dili tələbi üçün <a href="/kurslar/ielts-kurslari">IELTS hazırlığı</a> ən çox işlədilən yoldur; bəzi universitetlər <a href="/kurslar/duolingo">Duolingo English Test</a> nəticəsini də qəbul edir.</p>

<h2>Sənəd dəsti</h2>
<ol>
  <li>Attestat və ya diplom — <em>apostil</em> ilə</li>
  <li>Notarial tərcümə (polyak və ya ingilis dilinə)</li>
  <li>Qiymət cədvəli</li>
  <li>Dil sertifikatı</li>
  <li>Pasport və foto</li>
  <li>Tibbi arayış (bir sıra ixtisaslarda)</li>
</ol>
<p>Apostil mərhələsi çox vaxt gözdən qaçır və prosesi ləngidir — sənədləri toplamağa məhz oradan başlayın.</p>

<h2>Qəbuldan sonra</h2>
<p>Qəbul məktubunu aldıqdan sonra viza üçün müraciət edilir. Viza paketində adətən yaşayış yeri təsdiqi, sığorta və maliyyə vəsaitinin göstərilməsi tələb olunur. Konkret məbləğ və sənəd siyahısı dəyişə bilir — rəsmi konsulluq səhifəsindən yoxlayın.</p>

<h2>Seçim zamanı üç məsləhət</h2>
<ul>
  <li><strong>Universitetin akkreditasiyasını yoxlayın.</strong> Diplomun Azərbaycanda və Avropada tanınması bundan asılıdır.</li>
  <li><strong>Şəhəri xərcə görə seçin.</strong> Varşava və Krakov daha bahalıdır; kiçik şəhərlərdə eyni proqram daha sərfəli başa gəlir.</li>
  <li><strong>Müraciət tarixlərini qaçırmayın.</strong> Bir çox universitetdə yerlər mərhələli doldurulur — erkən müraciət real üstünlükdür.</li>
</ul>

<p><a href="/xaricde-tehsil/polsa">Polşa istiqaməti</a> üzrə universitet seçimində və sənədlərin hazırlanmasında dəstək üçün <a href="/elaqe">bizə yazın</a>.</p>
`),
  },

  {
    slug: "turkiyede-tehsil-yos-ve-qebul",
    category: "xaricde-tehsil",
    readMinutes: 7,
    title: az("Türkiyədə təhsil: YÖS, SAT və qəbul yolları"),
    excerpt: az(
      "Türkiyə universitetlərinə qəbulun hansı yolları var, YÖS nədir, SAT nə vaxt işə yarayır və sənədləri nə vaxt hazırlamaq lazımdır.",
    ),
    tags: az("Türkiyə, YÖS, SAT, xaricdə təhsil, universitet qəbulu"),
    seo: {
      keywords: az("Türkiyə, YÖS, SAT, xaricdə təhsil, universitet qəbulu"),
      metaTitle: az("Türkiyədə təhsil — YÖS, SAT və qəbul şərtləri"),
      metaDescription: az(
        "Türkiyə universitetlərinə qəbul yolları: YÖS imtahanı, SAT nəticəsi, tələb olunan sənədlər və müraciət təqvimi.",
      ),
    },
    content: az(`
<p>Türkiyə coğrafi yaxınlığı, dil rahatlığı və güclü universitet şəbəkəsi ilə azərbaycanlı tələbələr üçün ənənəvi istiqamətdir. Qəbulun bir neçə fərqli yolu var və hansını seçdiyiniz hazırlıq planınızı tamamilə dəyişir.</p>

<h2>Əsas qəbul yolları</h2>
<h3>1. YÖS (Yabancı Uyruklu Öğrenci Sınavı)</h3>
<p>Xarici tələbələr üçün keçirilən imtahandır. Əsasən <strong>məntiq və riyaziyyat</strong> bölmələrindən ibarətdir — ümumi bilik deyil, düşünmə sürəti yoxlanılır. Hər universitet öz YÖS-ünü keçirə bilər, bəziləri isə mərkəzləşdirilmiş nəticəni qəbul edir.</p>

<h3>2. SAT</h3>
<p>Bir sıra universitetlər SAT nəticəsini qəbul edir. Eyni nəticə ilə həm Türkiyəyə, həm də başqa ölkələrə müraciət etmək imkanı yaranır — bu, SAT-ı çevik seçim edir. <a href="/kurslar/sat-kurslari">SAT hazırlığı</a> bu yolu seçənlər üçündür.</p>

<h3>3. Attestat balı ilə</h3>
<p>Bəzi özəl universitetlər imtahansız, məktəb qiymətləri əsasında qəbul edir. Şərtlər universitetdən universitetə ciddi fərqlənir.</p>

<h2>Dil məsələsi</h2>
<p>Proqram türk dilindədirsə, adətən <strong>TÖMER C1</strong> tələb olunur; sertifikatınız yoxdursa, bir illik dil hazırlığına yönləndirilirsiniz. İngilis dilində proqramlar üçün isə IELTS/TOEFL və ya universitetin öz hazırlıq imtahanı istənilir.</p>

<h2>Sənədlər</h2>
<ul>
  <li>Attestat və qiymət cədvəli (tərcümə + təsdiq)</li>
  <li>YÖS və ya SAT nəticəsi</li>
  <li>Pasport surəti</li>
  <li>Foto</li>
  <li>Dil sertifikatı (varsa)</li>
</ul>

<h2>Vaxt planı</h2>
<p>Müraciət dövrü adətən yazda başlayır və yay boyu mərhələli davam edir. YÖS-ə hazırlıq isə bir neçə ay çəkir — yəni imtahan mövsümündən əvvəlki payızda başlamaq realdır.</p>

<p>Universitet və ixtisas seçimi üzrə <a href="/xaricde-tehsil/turkiye">Türkiyə səhifəmizə</a> baxın.</p>
`),
  },

  {
    slug: "teqaudle-xaricde-tehsil",
    category: "xaricde-tehsil",
    readMinutes: 7,
    title: az("Təqaüdlə xaricdə təhsil: hansı proqramlar var və necə hazırlaşmalı"),
    excerpt: az(
      "Təqaüd proqramlarının növləri, adətən tələb olunan sənədlər və müraciəti gücləndirən amillər — real gözləntilərlə.",
    ),
    tags: az("təqaüd, qrant, xaricdə təhsil, motivasiya məktubu"),
    seo: {
      keywords: az("təqaüd, qrant, xaricdə təhsil, motivasiya məktubu"),
      metaTitle: az("Təqaüdlə xaricdə təhsil — proqramlar və müraciət"),
      metaDescription: az(
        "Xaricdə təhsil üçün təqaüd növləri, tələb olunan sənədlər, motivasiya məktubu və müraciəti gücləndirən amillər.",
      ),
    },
    content: az(`
<p>«Təqaüdlə oxumaq» çox vaxt tək bir şey kimi düşünülür, halbuki proqramlar bir-birindən ciddi fərqlənir. Fərqi bilmək müraciət strategiyanızı dəyişir.</p>

<h2>Təqaüd növləri</h2>
<ul>
  <li><strong>Dövlət təqaüdləri</strong> — bir ölkənin xarici tələbələr üçün elan etdiyi proqramlar. Rəqabət yüksəkdir, müraciət təqvimi sərtdir.</li>
  <li><strong>Universitet təqaüdləri</strong> — universitetin öz büdcəsindən. Çox vaxt təhsil haqqının bir hissəsini örtür.</li>
  <li><strong>Mübadilə proqramları</strong> — bir və ya iki semestrlik. Diplom öz universitetinizdən olur.</li>
  <li><strong>Tədqiqat qrantları</strong> — magistr və doktorantura səviyyəsində, elmi işə bağlıdır.</li>
</ul>

<h2>Adətən nə tələb olunur</h2>
<ol>
  <li>Güclü akademik nəticə (transkript)</li>
  <li>Dil sertifikatı</li>
  <li>Motivasiya məktubu</li>
  <li>Tövsiyə məktubları</li>
  <li>CV və bəzən tədqiqat təklifi</li>
</ol>

<h2>Müraciəti nə gücləndirir</h2>
<p>Təcrübəmizdə fərqi yaradan üç şey var:</p>
<ul>
  <li><strong>Aydın məqsəd.</strong> «Xaricdə oxumaq istəyirəm» deyil, «bu ixtisası bu səbəbə görə, sonra bunu etmək üçün oxumaq istəyirəm».</li>
  <li><strong>Uyğunluq.</strong> Motivasiya məktubu həmin proqramın öz təsvirinə cavab verməlidir — universal məktub göndərmək ən çox rast gəlinən səhvdir.</li>
  <li><strong>Vaxt.</strong> Sənədlərin toplanması, tərcümə və tövsiyə məktubları aylar aparır.</li>
</ul>

<h2>Real gözlənti</h2>
<p>Tam örtülü təqaüdlər azdır və rəqabət yüksəkdir. Ona görə plan qurarkən eyni anda bir neçə variant nəzərdən keçirin: qismən təqaüd, sərfəli ölkə seçimi, ilk il ödənişli — sonra akademik nəticəyə görə təqaüdə keçid.</p>

<p><a href="/xaricde-tehsil/teqaud-proqramlari">Təqaüd proqramları səhifəmizdə</a> aktual istiqamətləri təqdim edirik.</p>
`),
  },

  // ───────────────────────── İMTAHANLAR ─────────────────────────
  {
    slug: "ielts-nedir-ve-nece-hazirlasmali",
    category: "imtahanlar",
    readMinutes: 9,
    title: az("IELTS nədir və necə hazırlaşmalı: bölmələr, bal sistemi və plan"),
    excerpt: az(
      "IELTS-in dörd bölməsi, bal sisteminin necə işlədiyi, Academic və General fərqi və hazırlığı necə qurmaq lazım olduğu.",
    ),
    tags: az("IELTS, ingilis dili, imtahan, band score, hazırlıq"),
    seo: {
      keywords: az("IELTS, ingilis dili, imtahan, band score, hazırlıq"),
      metaTitle: az("IELTS nədir və necə hazırlaşmalı — tam bələdçi"),
      metaDescription: az(
        "IELTS bölmələri, bal sistemi, Academic və General fərqi, hazırlıq planı və ən çox edilən səhvlər. British Academy IELTS kursları.",
      ),
    },
    content: az(`
<p>IELTS dünyada ən geniş qəbul olunan ingilis dili imtahanlarından biridir. Universitet qəbulu, iş müraciəti və immiqrasiya prosesləri üçün istənilir.</p>

<h2>Dörd bölmə</h2>
<ul>
  <li><strong>Listening</strong> — dörd hissə, getdikcə çətinləşir. Bir dəfə səslənir.</li>
  <li><strong>Reading</strong> — üç uzun mətn. Vaxt idarəsi burada həlledicidir.</li>
  <li><strong>Writing</strong> — iki tapşırıq: qrafik/məktub təsviri və esse.</li>
  <li><strong>Speaking</strong> — imtahan verənlə canlı söhbət, üç mərhələ.</li>
</ul>

<h2>Academic, yoxsa General?</h2>
<p><strong>Academic</strong> universitet təhsili üçündür. <strong>General Training</strong> isə iş və immiqrasiya üçün. Listening və Speaking eynidir, Reading və Writing fərqlənir. Hansının lazım olduğunu müraciət edəcəyiniz qurumdan dəqiqləşdirin — səhv variantı vermək vaxt itkisidir.</p>

<h2>Bal necə hesablanır</h2>
<p>Hər bölmə 0–9 aralığında qiymətləndirilir, ümumi bal isə dördünün ortalamasıdır və 0.5-lik addımlarla yuvarlaqlaşdırılır. Yəni zəif bir bölmə ümumi nəticəni ciddi aşağı çəkir — hazırlıqda ən zəif bölməyə vaxt ayırmaq ən sürətli qazancdır.</p>

<h2>Hazırlığı necə qurmaq lazımdır</h2>
<h3>1. Başlanğıc səviyyəni ölçün</h3>
<p>Hazırlığa «sıfırdan IELTS» kimi başlamaq səhvdir. Əvvəlcə mövcud səviyyənizi bilməlisiniz — <a href="/testler">səviyyə testimiz</a> bunun üçün sürətli başlanğıcdır.</p>

<h3>2. Ümumi dildən imtahan texnikasına keçin</h3>
<p>Səviyyəniz B1-dirsə, problem IELTS deyil — ümumi ingilis dilidir. Belə halda əvvəlcə <a href="/kurslar/ingilis-dili-kurslari">ümumi ingilis dili kursu</a>, sonra imtahan hazırlığı düzgün ardıcıllıqdır.</p>

<h3>3. Hər bölməyə ayrı yanaşın</h3>
<p>IELTS bilik imtahanı qədər <em>texnika</em> imtahanıdır: sual tiplərini tanımaq, vaxtı bölmək, tapşırığın nə istədiyini dəqiq oxumaq.</p>

<h3>4. Writing və Speaking üçün geri bildirim alın</h3>
<p>Bu iki bölməni tək başına inkişaf etdirmək çətindir, çünki səhvi görmək üçün kənar göz lazımdır. Ən çox bal itkisi məhz burada olur.</p>

<h2>Ən çox edilən üç səhv</h2>
<ol>
  <li><strong>Yalnız test həll etmək.</strong> Test nəticəni ölçür, bacarığı özü artırmır.</li>
  <li><strong>Writing-də sualı oxumamaq.</strong> Mövzudan yayınan mükəmməl esse aşağı bal alır.</li>
  <li><strong>Speaking-də əzbər cavab.</strong> Süni səslənən hazır bloklar dərhal seçilir.</li>
</ol>

<h2>Nə qədər vaxt lazımdır</h2>
<p>Bu, başlanğıc səviyyədən asılıdır. B2 səviyyəsindən hədəf 6.5–7.0 olan tələbə üçün ardıcıl hazırlıq adətən bir neçə ay çəkir. B1-dən başlayırsınızsa, plan daha uzundur — və bunu əvvəlcədən bilmək stressi azaldır.</p>

<p><a href="/kurslar/ielts-kurslari">IELTS və Pre-IELTS kurslarımız</a> məhz bu ardıcıllıqla qurulub: səviyyənin ölçülməsi, boşluqların doldurulması, sonra imtahan texnikası.</p>
`),
  },

  {
    slug: "ielts-yoxsa-toefl-hansini-secmeli",
    category: "imtahanlar",
    readMinutes: 6,
    title: az("IELTS yoxsa TOEFL: hansını seçmək lazımdır?"),
    excerpt: az(
      "İki imtahanın formatı, qiymətləndirmə fərqi və hansı halda hansının daha məntiqli olduğu — qərar verməyə kömək edən müqayisə.",
    ),
    tags: az("IELTS, TOEFL, müqayisə, ingilis dili imtahanı"),
    seo: {
      keywords: az("IELTS, TOEFL, müqayisə, ingilis dili imtahanı"),
      metaTitle: az("IELTS yoxsa TOEFL — fərqlər və hansını seçməli"),
      metaDescription: az(
        "IELTS və TOEFL arasındakı format, bal sistemi və danışıq bölməsi fərqləri. Hansı imtahan sizə uyğundur?",
      ),
    },
    content: az(`
<p>Hər iki imtahan ingilis dili səviyyəsini ölçür və dünya üzrə geniş qəbul olunur. Seçim «hansı daha yaxşıdır» sualı deyil — «hansı sizin üçün daha rahatdır» sualıdır.</p>

<h2>Əsas fərqlər</h2>
<h3>Danışıq bölməsi</h3>
<p>Bu, ən böyük praktiki fərqdir. <strong>IELTS</strong>-də canlı insanla söhbət edirsiniz. <strong>TOEFL</strong>-da isə mikrofona danışırsınız və cavab yazılır.</p>
<p>Canlı ünsiyyətdə rahat olan üçün IELTS, kamera/mikrofon qarşısında daha sakit olan üçün TOEFL sərfəlidir.</p>

<h3>Bal sistemi</h3>
<p>IELTS 0–9 <em>band</em> sistemi ilə, TOEFL isə 0–120 bal ilə qiymətləndirilir. İkisi arasında təxmini uyğunluq cədvəlləri var, amma qurumlar öz tələbini konkret imtahan üzrə yazır.</p>

<h3>Sual tipləri</h3>
<p>IELTS-də sual formatları daha müxtəlifdir (uyğunlaşdırma, boşluq doldurma, doğru/yalan). TOEFL əsasən çoxvariantlıdır və akademik mühitə — mühazirə, kampus söhbətləri — daha yaxındır.</p>

<h3>Yazı</h3>
<p>IELTS Writing-də qrafik təsviri (Academic) və esse var. TOEFL-da isə oxuduğunuz mətnlə dinlədiyiniz mühazirəni birləşdirən inteqrasiya olunmuş tapşırıq var — yəni eyni anda oxumaq, dinləmək və yazmaq bacarığı yoxlanılır.</p>

<h2>Necə qərar vermək</h2>
<ol>
  <li><strong>Əvvəlcə hədəf qurumun tələbinə baxın.</strong> Bəzi universitetlər yalnız birini qəbul edir — bu, sualı özü həll edir.</li>
  <li><strong>Hər ikisindən bir sınaq testi verin.</strong> Nəzəri müqayisədən çox, öz nəticəniz daha çox şey deyir.</li>
  <li><strong>Kompüter yazma sürətinizi nəzərə alın.</strong> TOEFL-da yazı kompüterdədir; klaviatura sürəti aşağıdırsa bu, real itkidir.</li>
</ol>

<p>Hər iki istiqamət üzrə hazırlıq aparırıq: <a href="/kurslar/ielts-kurslari">IELTS</a> və <a href="/kurslar/toefl">TOEFL</a>. Hansının sizə uyğun olduğuna birlikdə qərar verə bilərik.</p>
`),
  },

  {
    slug: "duolingo-english-test-nedir",
    category: "imtahanlar",
    readMinutes: 5,
    title: az("Duolingo English Test nədir və kimlər üçün uyğundur?"),
    excerpt: az(
      "Onlayn keçirilən, nəticəsi tez çıxan imtahan. Formatı, güclü tərəfləri və seçməzdən əvvəl mütləq yoxlanmalı olan məqam.",
    ),
    tags: az("Duolingo English Test, DET, onlayn imtahan, ingilis dili"),
    seo: {
      keywords: az("Duolingo English Test, DET, onlayn imtahan, ingilis dili"),
      metaTitle: az("Duolingo English Test (DET) nədir — format və qəbul"),
      metaDescription: az(
        "Duolingo English Test formatı, müddəti, nəticə vaxtı və hansı hallarda IELTS/TOEFL əvəzinə seçilə biləcəyi.",
      ),
    },
    content: az(`
<p>Duolingo English Test (DET) son illərdə sürətlə yayılan onlayn ingilis dili imtahanıdır. Əsas cəlbedici tərəfi — evdən verilməsi və nəticənin qısa müddətdə çıxmasıdır.</p>

<h2>Format necədir</h2>
<p>İmtahan <strong>adaptivdir</strong>: düzgün cavab verdikcə suallar çətinləşir, səhv etdikcə asanlaşır. Ona görə hamı eyni sualları görmür və imtahan ənənəvi testlərdən qısa çəkir.</p>
<p>Tapşırıqlar oxuma, dinləmə, yazma və danışmanı birləşdirir — məsələn, şəkli təsvir etmək, dinlədiyini yazmaq, verilmiş mövzuda danışmaq.</p>

<h2>Güclü tərəfləri</h2>
<ul>
  <li>Evdən, öz kompüterinizdən verilir</li>
  <li>Nəticə qısa müddətdə çıxır</li>
  <li>Ənənəvi imtahanlardan qısa davam edir</li>
  <li>Nəticəni istədiyiniz qədər qurumla paylaşmaq mümkündür</li>
</ul>

<h2>Seçməzdən əvvəl mütləq yoxlayın</h2>
<p>Ən vacib məqam budur: <strong>hər universitet DET qəbul etmir.</strong> Qəbul edənlərin sayı artsa da, siyahı ölkədən ölkəyə və universitetdən universitetə dəyişir. Hazırlığa başlamazdan əvvəl hədəf qurumun rəsmi səhifəsindən təsdiqləyin — bu bir yoxlama sizi aylarla yanlış hazırlıqdan xilas edə bilər.</p>

<h2>Texniki tələblər</h2>
<p>İmtahan boyu kamera və mikrofon açıq olur, ekran izlənilir. Sabit internet, sakit otaq və işıqlandırma tələb olunur. Qaydaların pozulması nəticənin ləğvinə gətirir — texniki hazırlığı imtahan gününə saxlamayın.</p>

<h2>Kimlər üçün uyğundur</h2>
<p>Vaxtı məhdud olan, imtahan mərkəzinə getmək istəməyən və hədəf universiteti DET qəbul edən namizədlər üçün məntiqli seçimdir. Amma qəbul dairəsi hələ də IELTS və TOEFL qədər geniş deyil.</p>

<p><a href="/kurslar/duolingo">Duolingo hazırlıq kursumuz</a> format tanıtımı və adaptiv testə uyğun strategiya üzərində qurulub.</p>
`),
  },

  // ───────────────────────── DİL ÖYRƏNMƏ ─────────────────────────
  {
    slug: "ingilis-dili-seviyyeleri-a1-c2",
    category: "dil-oyrenme",
    readMinutes: 7,
    title: az("İngilis dili səviyyələri A1–C2: hansı səviyyədə nə bacarılır?"),
    excerpt: az(
      "CEFR səviyyələrinin hər biri praktikada nə deməkdir, bir səviyyədən digərinə keçmək nə qədər çəkir və öz səviyyənizi necə müəyyən edə bilərsiniz.",
    ),
    tags: az("CEFR, ingilis dili səviyyələri, A1, B2, C1, dil öyrənmə"),
    seo: {
      keywords: az("CEFR, ingilis dili səviyyələri, A1, B2, C1, dil öyrənmə"),
      metaTitle: az("İngilis dili səviyyələri A1–C2 (CEFR) — tam izah"),
      metaDescription: az(
        "A1, A2, B1, B2, C1, C2 səviyyələri praktikada nə deməkdir, keçid nə qədər vaxt aparır və səviyyənizi necə ölçə bilərsiniz.",
      ),
    },
    content: az(`
<p>«Orta səviyyədə bilirəm» ifadəsi hər kəs üçün fərqli şey ifadə edir. Beynəlxalq CEFR sistemi məhz bu qeyri-müəyyənliyi aradan qaldırır və altı səviyyə təyin edir.</p>

<h2>Səviyyələr praktikada</h2>
<h3>A1 — Başlanğıc</h3>
<p>Özünüzü təqdim edir, sadə sual verib cavablandırırsınız. Danışıq çox yavaş və hazır ifadələr üzərindədir.</p>

<h3>A2 — Elementar</h3>
<p>Gündəlik mövzularda (ailə, iş, alış-veriş) sadə cümlələrlə ünsiyyət qurursunuz. Keçmiş zamanı işlədə bilirsiniz.</p>

<h3>B1 — Orta</h3>
<p>Səyahətdə çıxan əksər situasiyaları həll edirsiniz, fikrinizi izah edir və sadə mətn yaza bilirsiniz. Bir çox insanın «orta» dediyi səviyyə əslində budur.</p>

<h3>B2 — Ortadan yuxarı</h3>
<p>Mürəkkəb mətnləri anlayır, öz sahənizdə sərbəst danışırsınız. <strong>Bir çox universitet və işəgötürənin tələb etdiyi minimum səviyyə budur.</strong></p>

<h3>C1 — İrəli</h3>
<p>Uzun və mürəkkəb mətnləri, gizli mənaları anlayırsınız. Dili akademik və peşəkar mühitdə çevik işlədirsiniz.</p>

<h3>C2 — Sərbəst</h3>
<p>Demək olar ki, hər şeyi asanlıqla anlayır, incə məna fərqlərini ifadə edirsiniz.</p>

<h2>Bir səviyyədən digərinə nə qədər vaxt lazımdır</h2>
<p>Ortalama olaraq hər səviyyə üçün onlarla saat dərs və ondan qat-qat çox müstəqil təcrübə tələb olunur. Əsas amillər:</p>
<ul>
  <li>həftədə neçə saat ayırdığınız</li>
  <li>dərsdən kənar təcrübə (oxumaq, dinləmək, danışmaq)</li>
  <li>başlanğıc səviyyə — yuxarı səviyyələr daha uzun çəkir</li>
</ul>
<p>Diqqət: A2-dən B1-ə keçmək B2-dən C1-ə keçməkdən qat-qat sürətlidir. Yuxarı səviyyələrdə irəliləyiş yavaşlayır və bu normaldır.</p>

<h2>Öz səviyyənizi necə bilmək olar</h2>
<p>Ən sürətli yol — qısa səviyyə testi. <a href="/testler">Onlayn testimizi</a> keçib başlanğıc nöqtənizi görə bilərsiniz. Nəticə həm kurs seçimini, həm də real vaxt planını dəqiqləşdirir.</p>

<h2>Səviyyəyə uyğun addım</h2>
<ul>
  <li><strong>A1–A2:</strong> <a href="/kurslar/ingilis-dili-kurslari">ümumi ingilis dili</a> ilə təməl qurmaq</li>
  <li><strong>B1–B2:</strong> danışıq təcrübəsini artırmaq — <a href="/kurslar/conversation-club">Conversation Club</a></li>
  <li><strong>B2+:</strong> imtahan hazırlığına keçmək — <a href="/kurslar/ielts-kurslari">IELTS</a> və ya iş yönümlü <a href="/kurslar/biznes-ingilis-dili-kursu">Biznes İngilis dili</a></li>
</ul>
`),
  },

  {
    slug: "usaga-ingilis-dili-nece-yasdan",
    category: "dil-oyrenme",
    readMinutes: 6,
    title: az("Uşağa ingilis dili neçə yaşdan öyrətmək lazımdır?"),
    excerpt: az(
      "Erkən yaşda dil öyrənməyin real üstünlükləri, yaş qruplarına görə nəyin işlədiyi və valideynlərin ən çox etdiyi səhvlər.",
    ),
    tags: az("uşaq ingilis dili, erkən yaş, valideyn, dil öyrənmə"),
    seo: {
      keywords: az("uşaq ingilis dili, erkən yaş, valideyn, dil öyrənmə"),
      metaTitle: az("Uşağa ingilis dili neçə yaşdan? — valideyn bələdçisi"),
      metaDescription: az(
        "Uşaqlarda dil öyrənmənin yaş mərhələləri, hansı yaşda hansı metodun işlədiyi və valideynlərin ən çox etdiyi səhvlər.",
      ),
    },
    content: az(`
<p>Valideynlərdən ən çox eşitdiyimiz sual budur. Qısa cavab: erkən başlamaq faydalıdır, amma <strong>necə</strong> başlamaq <strong>nə vaxt</strong> başlamaqdan daha vacibdir.</p>

<h2>Yaş qruplarına görə nə işləyir</h2>
<h3>4–6 yaş</h3>
<p>Bu yaşda uşaq dili qayda ilə deyil, <em>təqlid</em> ilə öyrənir. Mahnı, hərəkət, oyun və təkrar əsasdır. Yazı və qrammatika bu mərhələdə məqsəd deyil.</p>
<p>Gözlənti realistik olmalıdır: uşaq cümlə qurmağa deyil, dilə <strong>alışmağa</strong> başlayır.</p>

<h3>7–10 yaş</h3>
<p>Oxu və yazı əlavə olunur. Uşaq artıq qaydaları da qavraya bilir, amma dərs hələ də oyun və vizual material üzərində qurulmalıdır. Bu yaş diksiya və tələffüz üçün ən əlverişli dövrdür.</p>

<h3>11–14 yaş</h3>
<p>Sistemli qrammatika işə düşür. Bu mərhələdə uşaq artıq beynəlxalq imtahanlara doğru istiqamətlənə bilər.</p>

<h2>Valideynlərin ən çox etdiyi dörd səhv</h2>
<ol>
  <li><strong>Tez nəticə gözləmək.</strong> Dil aylarla deyil, illərlə qurulur. Üç ayda danışan uşaq gözləntisi həm valideyni, həm uşağı yorur.</li>
  <li><strong>Dərsdən kənar təmasın olmaması.</strong> Həftədə iki dərs kifayət etmir. Cizgi filmi, mahnı, sadə kitab — təkrarı təmin edən əsl mühit budur.</li>
  <li><strong>Səhvə görə düzəliş etmək.</strong> Hər səhvi dərhal düzəltmək uşağı danışmaqdan çəkindirir. Bu yaşda axıcılıq dəqiqlikdən vacibdir.</li>
  <li><strong>Böyüklər metodikası ilə öyrətmək.</strong> Qrammatika cədvəli 6 yaşlı üçün işləmir.</li>
</ol>

<h2>Nəyə diqqət etmək lazımdır</h2>
<ul>
  <li>Qrupun yaşa görə bölünməsi — 6 və 11 yaş bir qrupda olmamalıdır</li>
  <li>Qrupun kiçik olması — hər uşağın danışmağa vaxtı çatmalıdır</li>
  <li>Müəllimin uşaqlarla işləmə təcrübəsi</li>
  <li>Nəticənin necə ölçülməsi — valideyn irəliləyişi görməlidir</li>
</ul>

<p><a href="/kurslar/usaq-ingilis-dili">Uşaqlar üçün İngilis dili</a> proqramımız yaş qruplarına görə ayrılıb. Məntiqi düşünməni gücləndirən <a href="/kurslar/usaq-mentiq">Uşaqlar üçün Məntiq</a> kursu isə yaxşı tamamlayıcıdır.</p>
`),
  },

  // ───────────────────────── KARYERA ─────────────────────────
  {
    slug: "excel-kursu-karyerada-ne-verir",
    category: "karyera",
    readMinutes: 6,
    title: az("Excel kursu karyerada nə verir və nədən başlamaq lazımdır?"),
    excerpt: az(
      "İşəgötürənlərin real olaraq gözlədiyi Excel bacarıqları, öyrənmə ardıcıllığı və hansı mərhələdən sonra CV-yə yazmağın mənası olduğu.",
    ),
    tags: az("Excel, ofis proqramları, karyera, MS Office, hesabat"),
    seo: {
      keywords: az("Excel, ofis proqramları, karyera, MS Office, hesabat"),
      metaTitle: az("Excel kursu — karyerada nə verir, nədən başlamalı"),
      metaDescription: az(
        "İş yerlərində real tələb olunan Excel bacarıqları: düsturlar, PivotTable, məlumat təmizləmə. Öyrənmə ardıcıllığı və kurs seçimi.",
      ),
    },
    content: az(`
<p>Excel demək olar ki, hər ofis vakansiyasının tələb siyahısındadır. Amma «Excel bilirəm» ifadəsi CV-də çox vaxt heç nə demir, çünki səviyyə göstərilmir.</p>

<h2>İşəgötürən əslində nə gözləyir</h2>
<p>Praktikada ən çox tələb olunanlar:</p>
<ul>
  <li>Məlumatı <strong>təmizləmək</strong> və düzgün formata salmaq</li>
  <li><strong>Düsturlarla</strong> hesablama — <code>IF</code>, <code>VLOOKUP</code>/<code>XLOOKUP</code>, <code>SUMIFS</code></li>
  <li><strong>PivotTable</strong> ilə tez hesabat qurmaq</li>
  <li>Nəticəni <strong>başa düşülən qrafikə</strong> çevirmək</li>
  <li>Şablon qurmaq — eyni işi hər ay təkrar etməmək</li>
</ul>
<p>Diqqət yetirin: siyahının çoxu «düstur bilmək» deyil, <em>məsələni Excel dili ilə həll etmək</em> bacarığıdır.</p>

<h2>Öyrənmə ardıcıllığı</h2>
<ol>
  <li><strong>İnterfeys və məlumat girişi</strong> — cədvəlin düzgün qurulması. Səhv qurulmuş cədvəl bütün sonrakı işi çətinləşdirir.</li>
  <li><strong>Əsas düsturlar</strong> — hesablama məntiqi.</li>
  <li><strong>Axtarış funksiyaları</strong> — iki cədvəli birləşdirmək.</li>
  <li><strong>PivotTable</strong> — böyük məlumatdan hesabat.</li>
  <li><strong>Qrafiklər və vizuallaşdırma</strong>.</li>
  <li><strong>Avtomatlaşdırma</strong> — şablonlar, şərti formatlaşdırma.</li>
</ol>

<h2>Nə vaxt CV-yə yazmaq olar</h2>
<p>PivotTable qura bilir, iki cədvəli axtarış funksiyası ilə birləşdirir və nəticəni qrafikə çevirə bilirsinizsə — bu, real «orta səviyyə»dir və CV-də yazmağın mənası var. Yalnız cəm və faiz hesablaya bilmək isə hələ başlanğıcdır.</p>

<h2>Ən sürətli irəliləyiş yolu</h2>
<p>Excel-i «öyrənmək» yox, <strong>öz işinizdəki bir məsələni həll etmək</strong> üçün işlədin. Real cədvəl üzərində çalışmaq nəzəri dərslərdən qat-qat sürətli nəticə verir.</p>

<p><a href="/kurslar/pesekar-excel-kursu">Peşəkar Excel kursumuz</a> məhz praktik məsələlər üzərində qurulub. Ofis proqramlarının hamısını əhatə edən <a href="/kurslar/ms-office">MS Office proqramları</a> kursu isə daha geniş başlanğıcdır.</p>
`),
  },
];

/**
 * İmport servisinin gördüyü YEGANƏ siyahı.
 *
 * Əhatə: saytdakı hər kurs və hər ölkə səhifəsinin ən azı bir yazısı var.
 * `tests/blogSeed.test.js` bunu canlı slug siyahısı ilə yoxlayır — yeni kurs
 * əlavə olunub yazısız qalsa test xəbər verir.
 */
export const BLOG_POSTS = [
  ...CORE_POSTS,
  ...LANGUAGE_POSTS_A,
  ...LANGUAGE_POSTS_B,
  ...EXAM_POSTS,
  ...CAREER_KIDS_POSTS,
  ...DESTINATION_POSTS,
];
