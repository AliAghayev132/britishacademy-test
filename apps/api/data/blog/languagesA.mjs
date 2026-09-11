/**
 * Dil kursları üzrə bloq yazıları (1-ci hissə).
 * Faktlar kursun canlı səhifəsindən götürülüb (dərs müddəti, səviyyə, filial).
 * Qiymət qəsdən yazılmayıb — bax ../blogData.mjs başlığı.
 */
const az = (text) => ({ az: text, en: "", ru: "" });

export const LANGUAGE_POSTS_A = [
  {
    slug: "biznes-ingilis-dili-kimlere-lazimdir",
    category: "dil-oyrenme",
    readMinutes: 5,
    title: az("Biznes ingilis dili: kimlərə lazımdır və ümumi ingilis dilindən fərqi"),
    excerpt: az("İşgüzar yazışma, təqdimat və danışıqlar üçün ingilis dili nə ilə fərqlənir, Cambridge BEC nə verir və hansı səviyyədən başlamaq olar."),
    tags: az("biznes ingilis dili, Business English, Cambridge BEC, karyera"),
    seo: {
      keywords: az("biznes ingilis dili, Business English, Cambridge BEC, karyera"),
      metaTitle: az("Biznes ingilis dili — kimlər üçündür, nə öyrədir"),
      metaDescription: az("Biznes ingilis dili kursu nə öyrədir: işgüzar yazışma, təqdimat, danışıqlar və Cambridge BEC hazırlığı. Kimlər üçün uyğundur və necə başlamalı."),
    },
    content: az(`
<p>Gündəlik ingilis dili ilə iş yerində işlədilən ingilis dili eyni deyil. Dostla söhbət edə bilən adam müştəriyə rəsmi məktub yazanda, iclasda fikrini əsaslandıranda və ya danışıqda şərt irəli sürəndə çətinlik çəkə bilir.</p>

<h2>Fərq nədədir</h2>
<p>Biznes ingilis dili ayrıca dil deyil, eyni dilin konkret vəziyyətlərə uyğunlaşdırılmış istifadəsidir:</p>
<ul>
  <li><strong>Yazışma</strong> — rəsmi e-poçt, təklif, hesabat və şikayətə cavab</li>
  <li><strong>Təqdimat</strong> — fikri strukturla çatdırmaq, rəqəmləri izah etmək</li>
  <li><strong>İclas və danışıqlar</strong> — razılaşmaq, etiraz etmək, güzəşt təklif etmək</li>
  <li><strong>Telefon və video zənglər</strong> — qısa, dəqiq və nəzakətli ünsiyyət</li>
</ul>

<h2>Kimlər üçün uyğundur</h2>
<p>İş mühitində ingilis dilindən istifadə edən və ya bunu planlaşdıran hər kəs üçün: şirkət əməkdaşları, rəhbərlər, beynəlxalq layihələrdə çalışanlar və iş axtaran tələbələr. Kurs Cambridge <strong>BEC</strong> imtahanına hazırlaşanlar üçün də uyğundur.</p>

<h2>Necə qurulub</h2>
<p>Proqram CEFR səviyyələri üzrə (A1–C2) qurulub. Hər səviyyə orta hesabla 1,5–2 ay çəkir, dərs 90 dəqiqədir, cədvəl isə tələbələrin uyğunluğuna görə tərtib olunur. Kursun sonunda imtahan keçirilir və uğur qazananlara sertifikat verilir.</p>

<h2>Hansı səviyyədən başlamaq olar</h2>
<p>İşgüzar dili ən səmərəli şəkildə ümumi dilin möhkəm bazası üzərində qurulur. Səviyyənizdən əmin deyilsinizsə, əvvəlcə <a href="/testler">qısa səviyyə testini</a> keçin. Bazanı gücləndirmək lazımdırsa, <a href="/kurslar/ingilis-dili-kurslari">ümumi ingilis dili kursu</a> ilə başlamaq daha düzgündür.</p>

<p>Ətraflı məlumat və qeydiyyat üçün: <a href="/kurslar/biznes-ingilis-dili-kursu">Biznes İngilis dili kursu</a>.</p>
`),
  },

  {
    slug: "huquqsunaslar-ucun-ingilis-dili",
    category: "dil-oyrenme",
    readMinutes: 5,
    title: az("Hüquqşünaslar üçün ingilis dili: hüquqi terminologiya və TOLES"),
    excerpt: az("Hüquqi ingilis dili niyə ayrıca öyrənilir, müqavilə dili nə ilə fərqlənir və hüquqşünaslar üçün hansı beynəlxalq sertifikat mövcuddur."),
    tags: az("hüquqi ingilis dili, Legal English, TOLES, hüquqşünas"),
    seo: {
      keywords: az("hüquqi ingilis dili, Legal English, TOLES, hüquqşünas"),
      metaTitle: az("Hüquqşünaslar üçün ingilis dili — Legal English"),
      metaDescription: az("Hüquqi ingilis dili nə öyrədir: müqavilə dili, terminologiya, hüquqi yazışma. TOLES sertifikatı və hüquqşünaslar üçün hazırlıq yolu."),
    },
    content: az(`
<p>Hüquq sahəsində bir sözün səhv seçilməsi müqavilənin mənasını dəyişə bilər. Ona görə beynəlxalq şirkətlərdə, arbitrajda və xarici müştərilərlə işləyən hüquqşünaslar üçün ümumi ingilis dili kifayət etmir.</p>

<h2>Hüquqi ingilis dili nə ilə fərqlənir</h2>
<ul>
  <li><strong>Terminologiya</strong> — «consideration», «liability», «indemnity» kimi sözlərin gündəlik mənası ilə hüquqi mənası fərqlidir.</li>
  <li><strong>Müqavilə quruluşu</strong> — bəndlərin, şərtlərin və öhdəliklərin standart ifadə üsulları var.</li>
  <li><strong>Dəqiqlik</strong> — hüquqi mətndə qeyri-müəyyənlik riskdir, üslub buna görə sərt və formaldır.</li>
  <li><strong>Hüquq sistemləri</strong> — ingilis dilli sənədlərin çoxu ümumi hüquq (common law) məntiqi ilə yazılır.</li>
</ul>

<h2>Kimlər üçündür</h2>
<p>Hüquqşünaslar, hüquq fakültəsinin tələbələri, şirkətlərin hüquq şöbəsində çalışanlar və xaricdə hüquq üzrə magistratura planlaşdıranlar üçün.</p>

<h2>Sertifikat: TOLES</h2>
<p>Hüquqi ingilis dilini beynəlxalq səviyyədə təsdiqləmək üçün <strong>TOLES</strong> (Test of Legal English Skills) imtahanı mövcuddur. Onun haqqında ayrıca yazımız var — TOLES-in səviyyələri və hazırlıq yolu orada izah olunub. Hazırlıq üçün <a href="/kurslar/toles">TOLES kursumuza</a> baxın.</p>

<h2>Başlamazdan əvvəl</h2>
<p>Hüquqi dil ümumi dilin üzərində qurulur. Ən azı orta səviyyəyə (B1–B2) sahib olmaq tövsiyə olunur. Səviyyənizi <a href="/testler">onlayn testlə</a> yoxlaya bilərsiniz.</p>

<p>Kurs haqqında ətraflı: <a href="/kurslar/huquqsunaslar-ingilis-dili-kursu">Hüquqşünaslar üçün İngilis dili</a>.</p>
`),
  },

  {
    slug: "otel-ve-turizm-ucun-ingilis-dili",
    category: "karyera",
    readMinutes: 4,
    title: az("Otel və turizm sahəsi üçün ingilis dili: işdə lazım olan bacarıqlar"),
    excerpt: az("Resepsiyadan tur bələdçiliyinə qədər turizm sektorunda ingilis dili necə işlədilir və bu sahəyə uyğun dil hazırlığı nəyi əhatə edir."),
    tags: az("turizm ingilis dili, otel, resepsiya, qonaqpərvərlik"),
    seo: {
      keywords: az("turizm ingilis dili, otel, resepsiya, qonaqpərvərlik"),
      metaTitle: az("Otel və turizm üçün ingilis dili — iş bacarıqları"),
      metaDescription: az("Turizm və otel sahəsində ingilis dili: qonaq qarşılama, rezervasiya, şikayətlərin həlli və tur təqdimatı. Sahəyə uyğun dil hazırlığı."),
    },
    content: az(`
<p>Turizm sektorunda ingilis dili bir üstünlük deyil, işin özüdür. Qonaqla ilk təmas, rezervasiya, problem həlli və tövsiyələr çox vaxt ingilis dilində aparılır.</p>

<h2>İşdə hansı vəziyyətlər olur</h2>
<ul>
  <li><strong>Qarşılama və qeydiyyat</strong> — check-in, otaq təqdimatı, qaydaların izahı</li>
  <li><strong>Rezervasiya</strong> — telefon və e-poçtla sifariş qəbulu, dəyişiklik və ləğv</li>
  <li><strong>Şikayətlər</strong> — narazı qonaqla sakit və həll yönümlü danışmaq</li>
  <li><strong>Tövsiyə və bələdçilik</strong> — şəhəri, marşrutu, mətbəxi təqdim etmək</li>
  <li><strong>Restoran xidməti</strong> — menyunu izah etmək, sifariş qəbul etmək</li>
</ul>

<h2>Niyə ayrıca kurs</h2>
<p>Ümumi dil kursu bu vəziyyətləri ümumi şəkildə əhatə edir. Sahəyə yönəlmiş proqramda isə hər mövzu real iş ssenarisi üzərində məşq olunur — lüğət, nəzakət formaları və hazır ifadələr birbaşa işdə istifadə ediləcək formada öyrədilir.</p>

<h2>Kimlər üçündür</h2>
<p>Otel və restoran işçiləri, tur operatorları, bələdçilər, aviasiya və turizm ixtisası tələbələri, həmçinin bu sahədə iş axtaranlar üçün.</p>

<p>Danışıq təcrübəsini artırmaq üçün tələbələrimiz <a href="/kurslar/conversation-club">danışıq klublarına</a> da qoşula bilər. Kurs haqqında ətraflı: <a href="/kurslar/otel-turizm-ingilis-dili-kursu">Otel və Turizm üçün İngilis dili</a>.</p>
`),
  },

  {
    slug: "alman-dili-kursu-sifirdan-nece-baslamali",
    category: "dil-oyrenme",
    readMinutes: 5,
    title: az("Alman dilini sıfırdan necə öyrənmək olar: səviyyələr və vaxt planı"),
    excerpt: az("Alman dilinin çətin görünən tərəfləri, A1-dən B2-yə keçid ardıcıllığı və təhsil, iş və ya köç üçün hansı səviyyənin lazım olduğu."),
    tags: az("alman dili, alman dili kursu, A1, B2, Almaniya"),
    seo: {
      keywords: az("alman dili, alman dili kursu, A1, B2, Almaniya"),
      metaTitle: az("Alman dilini sıfırdan öyrənmək — səviyyələr və plan"),
      metaDescription: az("Alman dilini sıfırdan öyrənmək üçün yol xəritəsi: A1-dən B2-yə səviyyələr, hər mərhələnin müddəti və təhsil və iş üçün lazım olan səviyyə."),
    },
    content: az(`
<p>Alman dili ilk baxışdan çətin görünür: artikllar (der, die, das), hallar və uzun mürəkkəb sözlər. Amma dilin qaydaları ardıcıldır — sistemi bir dəfə qurduqdan sonra irəliləyiş sürətlənir.</p>

<h2>Başlanğıcda nəyə hazır olmaq lazımdır</h2>
<ul>
  <li><strong>Artikllar</strong> — hər ismi artikli ilə birlikdə əzbərləmək ən sağlam vərdişdir.</li>
  <li><strong>Hallar</strong> — Nominativ, Akkusativ, Dativ və Genitiv cümlədə sözün rolunu göstərir.</li>
  <li><strong>Söz sırası</strong> — fel cümlədə müəyyən yerdə dayanır, bu da əvvəlcə qeyri-adi gəlir.</li>
</ul>

<h2>Hansı məqsəd üçün hansı səviyyə</h2>
<ul>
  <li><strong>A1</strong> — sadə ünsiyyət; ailə birləşməsi vizası üçün tələb olunan minimum səviyyədir.</li>
  <li><strong>B1</strong> — gündəlik həyatda müstəqil ünsiyyət, bir çox peşə təlimi proqramı üçün kifayət edir.</li>
  <li><strong>B2–C1</strong> — alman dilində universitet təhsili üçün adətən tələb olunan səviyyə.</li>
</ul>

<h2>Kurs necə keçir</h2>
<p>Proqramımız CEFR standartına uyğundur və danışıq yönümlüdür. Hər səviyyə orta hesabla 1,5–2 ay çəkir, dərs 90 dəqiqədir. Kursun sonunda imtahan keçirilir, uğur qazananlara sertifikat verilir. Alman dili kursları <strong>Caspian Plaza filialında</strong> tədris olunur.</p>

<h2>Növbəti addım</h2>
<p>Almaniyada təhsil planlaşdırırsınızsa, <a href="/bloq/almaniyada-tehsil-sertler-ve-senedler">Almaniyada təhsil bələdçimizi</a> oxuyun. Rəsmi sertifikat lazımdırsa, <a href="/kurslar/beynelxalq-sertifikatli-alman-dili-kursu">beynəlxalq sertifikatlı proqrama</a> baxın.</p>

<p>Qeydiyyat: <a href="/kurslar/alman-dili-kursu">Alman dili kursu</a>.</p>
`),
  },

  {
    slug: "goethe-telc-testdaf-alman-dili-sertifikatlari",
    category: "imtahanlar",
    readMinutes: 5,
    title: az("Alman dili sertifikatları: Goethe, telc və TestDaF arasındakı fərq"),
    excerpt: az("Hansı alman dili sertifikatı hansı məqsəd üçün lazımdır — viza, universitet qəbulu və ya iş. Əsas imtahanların qısa müqayisəsi."),
    tags: az("Goethe-Zertifikat, telc, TestDaF, DSH, alman dili sertifikatı"),
    seo: {
      keywords: az("Goethe-Zertifikat, telc, TestDaF, DSH, alman dili sertifikatı"),
      metaTitle: az("Alman dili sertifikatları — Goethe, telc, TestDaF"),
      metaDescription: az("Goethe-Zertifikat, telc, TestDaF və DSH imtahanlarının fərqi: hansı sertifikat viza, universitet qəbulu və iş üçün tələb olunur."),
    },
    content: az(`
<p>«Alman dili bilirəm» demək rəsmi prosesdə kifayət etmir — viza, universitet və işəgötürən səviyyəni tanınmış sertifikatla görmək istəyir. Seçim məqsədinizdən asılıdır.</p>

<h2>Əsas imtahanlar</h2>
<h3>Goethe-Zertifikat</h3>
<p>Goethe İnstitutunun imtahanıdır, A1-dən C2-yə qədər hər səviyyə üçün ayrıca keçirilir. Ən geniş tanınan sertifikatlardandır və viza prosesində tez-tez istənilir.</p>

<h3>telc Deutsch</h3>
<p>Səviyyələr üzrə keçirilən digər geniş tanınan imtahandır. Bir sıra universitetlər və dövlət qurumları telc sertifikatını da qəbul edir.</p>

<h3>TestDaF və DSH</h3>
<p>Hər ikisi <strong>universitet qəbulu</strong> üçündür. TestDaF mərkəzləşdirilmiş imtahandır və bir çox ölkədə keçirilir; DSH isə adətən universitetin özündə, Almaniyada verilir.</p>

<h2>Hansını seçmək</h2>
<ul>
  <li><strong>Viza və ya ailə birləşməsi</strong> — adətən A1 səviyyəsində Goethe və ya telc</li>
  <li><strong>İş və peşə tanınması</strong> — sahədən asılı olaraq B1–B2</li>
  <li><strong>Universitet təhsili</strong> — TestDaF, DSH və ya C1 səviyyəli Goethe/telc</li>
</ul>
<p>Qərardan əvvəl müraciət edəcəyiniz qurumun konkret tələbini yoxlayın — hansı sertifikatı qəbul etdiyi və hansı səviyyəni istədiyi qurumdan quruma dəyişir.</p>

<h2>Hazırlıq</h2>
<p>Sertifikat imtahanı dil biliyi ilə yanaşı format bilgisi də tələb edir. <a href="/kurslar/beynelxalq-sertifikatli-alman-dili-kursu">Beynəlxalq sertifikatlı alman dili proqramımız</a> məhz bu hazırlıq üçündür. Dili sıfırdan başlayırsınızsa, əvvəlcə <a href="/kurslar/alman-dili-kursu">Alman dili kursuna</a> baxın.</p>
`),
  },

  {
    slug: "rus-dili-danisiq-yonumlu-oyrenmek",
    category: "dil-oyrenme",
    readMinutes: 4,
    title: az("Rus dilində sərbəst danışmaq: danışıq yönümlü öyrənmə necə işləyir"),
    excerpt: az("Rus dilini anlayıb danışa bilməmək niyə tez-tez rast gəlinir, danışıq yönümlü dərsin fərqi nədir və irəliləyişi necə sürətləndirmək olar."),
    tags: az("rus dili, rus dili kursu, danışıq, CEFR"),
    seo: {
      keywords: az("rus dili, rus dili kursu, danışıq, CEFR"),
      metaTitle: az("Rus dilində sərbəst danışmaq — danışıq yönümlü kurs"),
      metaDescription: az("Rus dilini anlayıb danışa bilməmək problemi və həlli: danışıq yönümlü dərslər, kiçik qruplar və danışıq klubu ilə sürətli irəliləyiş."),
    },
    content: az(`
<p>Azərbaycanda çoxları rus dilini anlayır, amma danışanda çətinlik çəkir. Səbəb adətən bilik çatışmazlığı yox, <strong>danışıq təcrübəsinin azlığıdır</strong> — dil passiv qalır.</p>

<h2>Danışıq yönümlü dərs nə deməkdir</h2>
<p>Dərsin böyük hissəsi tələbənin özünün danışmasına ayrılır. Qrammatika ayrıca mövzu kimi deyil, danışıq zamanı lazım olan anda izah edilir. Beləliklə bilik birbaşa istifadəyə keçir.</p>

<h2>Kurs necə qurulub</h2>
<ul>
  <li>Dərslər həftədə 2 dəfə, hər biri 90 dəqiqə</li>
  <li>Qruplar kiçikdir — 3–6 nəfər, hər kəsə danışmaq üçün vaxt qalır</li>
  <li>Qrup və ya fərdi format</li>
  <li>CEFR üzrə A1-dən C2-yə qədər səviyyələr; hər səviyyə orta hesabla 1,5–2 ay</li>
  <li>Kursun sonunda imtahan və sertifikat</li>
</ul>
<p>Nərimanov filialında həftədə 2 nəzəri dərsə əlavə olaraq həftə sonu <strong>danışıq klubu</strong> da təşkil olunur.</p>

<h2>İrəliləyişi sürətləndirmək üçün</h2>
<ul>
  <li>Hər gün qısa da olsa rusca nəsə dinləyin — podkast, xəbər, serial</li>
  <li>Səhv etməkdən çəkinməyin: danışıqda axıcılıq əvvəl gəlir, dəqiqlik sonra</li>
  <li>Yeni sözləri cümlə içində öyrənin, tək-tək yox</li>
</ul>

<p>Uşaqlar üçün ayrıca proqramımız da var: <a href="/kurslar/usaq-rus-dili">Uşaqlar üçün Rus dili</a>. Böyüklər üçün qeydiyyat: <a href="/kurslar/rus-dili-kursu">Rus dili kursu</a>.</p>
`),
  },
];
