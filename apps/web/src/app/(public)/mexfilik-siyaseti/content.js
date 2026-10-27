/**
 * Məxfilik siyasətinin DEFOLT mətni — admin paneldə «mexfilik-siyaseti»
 * slug-lı səhifəyə mətn yazılana qədər göstərilir (bax page.js).
 *
 * Saytın REAL işləməsini təsvir edir: hansı formalar nə toplayır, reklam
 * mənbəyi razılıqla necə saxlanılır (lib/attribution.js), anonim ziyarət
 * sayğacı (lib/track.js). Kod dəyişəndə mətn də yenilənməlidir.
 *
 * {email} və {phone} saytın əlaqə məlumatı ilə əvəz olunur.
 */
export const PRIVACY = {
  az: {
    title: "Məxfilik siyasəti",
    lead: "British Academy saytında hansı məlumatların toplandığı, nə üçün istifadə edildiyi və bu barədə hansı hüquqlarınızın olduğu.",
    updated: "Son yenilənmə: 27 oktyabr 2026",
    sections: [
      {
        h: "Hansı məlumatları toplayırıq",
        p: [
          "Müraciət və ya əlaqə formasını doldurduqda: adınız, telefon nömrəniz, istəyə bağlı olaraq e-poçt ünvanınız, seçdiyiniz kurs, filial və ya ölkə, yazdığınız mesaj və formanı göndərdiyiniz səhifənin ünvanı.",
          "Razılıq verdiyiniz halda: sayta hansı reklam və ya mənbədən gəldiyiniz (reklam kampaniyasının, açar sözün və reklam qrupunun kodu, Google klik kodu, açılış səhifəsi, keçid etdiyiniz saytın domen adı).",
          "Anonim ziyarət statistikası: brauzerdə saxlanılan təsadüfi sessiya kodu (30 dəqiqə), baxılan səhifə, cihaz növü (mobil / kompüter) və ümumi mənbə. Bu statistikada ad, telefon və IP ünvanı saxlanılmır.",
        ],
      },
      {
        h: "Nə üçün istifadə edirik",
        p: [
          "Müraciətinizə cavab vermək, kurslar barədə məsləhət vermək və qeydiyyatı təşkil etmək üçün.",
          "Reklam kampaniyalarımızın effektivliyini ölçmək üçün: hansı kampaniyanın müraciət və qeydiyyat gətirdiyini görmək. Bu məqsədlə qeydiyyatdan keçmiş müraciətlərin Google klik kodu və qeydiyyat vaxtı Google Ads-ə ötürülə bilər — ad, telefon və e-poçt ötürülmür.",
          "Saytın işini yaxşılaşdırmaq üçün (anonim statistika).",
        ],
      },
      {
        h: "Brauzerdə nə saxlanılır",
        p: [
          "Reklam mənbəyi brauzerinizdə (localStorage) yalnız «Qəbul et» seçdikdə və 30 gün müddətinə saxlanılır. «Rədd et» seçsəniz cihazınıza heç nə yazılmır; mənbə yalnız açıq vərəqdə qalır və vərəq bağlandıqda silinir.",
          "Seçiminiz də brauzerdə yadda saxlanılır ki, banner hər dəfə görünməsin. Seçimi aşağıdakı düymə ilə istənilən vaxt dəyişə bilərsiniz.",
          "Saytda Google xidmətləri (məsələn, Google Tag Manager vasitəsilə) istifadə oluna bilər; onlar öz kukilərini Google-un məxfilik siyasətinə uyğun olaraq saxlayır.",
        ],
      },
      {
        h: "Məlumatları kimlə paylaşırıq",
        p: [
          "Məlumatlarınız satılmır və reklam məqsədilə üçüncü tərəflərə verilmir. Onlara yalnız müraciətlərlə işləyən əməkdaşlarımız baxa bilər.",
          "Məlumatlar bizim adımıza texniki xidmət göstərən təchizatçılarda (server, e-poçt) emal oluna bilər. Yuxarıda göstərildiyi kimi, Google Ads-ə yalnız klik kodu və qeydiyyat vaxtı ötürülür.",
        ],
      },
      {
        h: "Nə qədər saxlanılır",
        p: [
          "Müraciət məlumatları müraciətiniz üzrə əməkdaşlıq davam etdiyi müddətdə və Azərbaycan Respublikasının qanunvericiliyinin tələb etdiyi müddət ərzində saxlanılır. Reklam mənbəyi brauzerinizdə 30 gündən sonra nəzərə alınmır.",
        ],
      },
      {
        h: "Hüquqlarınız",
        p: [
          "Azərbaycan Respublikasının «Fərdi məlumatlar haqqında» Qanununa uyğun olaraq, haqqınızda saxlanılan məlumatlarla tanış olmaq, onların düzəldilməsini və ya silinməsini tələb etmək, razılığınızı geri götürmək hüququnuz var.",
          "Bunun üçün bizə yazın: {email} və ya zəng edin: {phone}.",
        ],
      },
    ],
    consentTitle: "Reklam ölçməsi seçimi",
    consentGranted: "Hazırda razılıq verilib.",
    consentDenied: "Hazırda rədd edilib.",
    consentNone: "Hələ seçim edilməyib.",
    consentReset: "Seçimi dəyiş",
  },

  en: {
    title: "Privacy policy",
    lead: "What information the British Academy website collects, why we use it and what rights you have.",
    updated: "Last updated: 27 October 2026",
    sections: [
      {
        h: "What we collect",
        p: [
          "When you fill in the application or contact form: your name, phone number, optionally your email address, the course, branch or country you choose, your message and the address of the page you submitted the form from.",
          "With your consent: which ad or source brought you to the site (the ad campaign, keyword and ad group codes, the Google click ID, the landing page and the domain of the referring site).",
          "Anonymous visit statistics: a random session code kept in your browser (30 minutes), the page viewed, the device type (mobile / desktop) and the general source. No name, phone number or IP address is stored in these statistics.",
        ],
      },
      {
        h: "Why we use it",
        p: [
          "To respond to your enquiry, advise you on courses and arrange your enrolment.",
          "To measure how well our ad campaigns work: which campaign brings enquiries and enrolments. For this, the Google click ID and enrolment time of enrolled enquiries may be sent to Google Ads — your name, phone number and email are not sent.",
          "To improve the website (anonymous statistics).",
        ],
      },
      {
        h: "What is stored in your browser",
        p: [
          "The ad source is stored in your browser (localStorage) only if you choose “Accept”, and for 30 days. If you choose “Decline”, nothing is written to your device; the source stays only in the open tab and is removed when the tab is closed.",
          "Your choice itself is remembered in the browser so the banner does not appear every time. You can change it at any time with the button below.",
          "The site may use Google services (for example via Google Tag Manager); they keep their own cookies under Google’s privacy policy.",
        ],
      },
      {
        h: "Who we share it with",
        p: [
          "Your data is not sold and is not given to third parties for advertising. Only our staff who handle enquiries can see it.",
          "Data may be processed by providers that run technical services on our behalf (servers, email). As described above, only the click ID and enrolment time are sent to Google Ads.",
        ],
      },
      {
        h: "How long we keep it",
        p: [
          "Enquiry data is kept while we work with you on your enquiry and for as long as the laws of the Republic of Azerbaijan require. The ad source in your browser is ignored after 30 days.",
        ],
      },
      {
        h: "Your rights",
        p: [
          "Under the Law of the Republic of Azerbaijan “On Personal Data”, you have the right to see the data we hold about you, to ask for it to be corrected or deleted, and to withdraw your consent.",
          "To do so, write to us at {email} or call {phone}.",
        ],
      },
    ],
    consentTitle: "Ad measurement choice",
    consentGranted: "You have currently given consent.",
    consentDenied: "You have currently declined.",
    consentNone: "No choice has been made yet.",
    consentReset: "Change choice",
  },

  ru: {
    title: "Политика конфиденциальности",
    lead: "Какие данные собирает сайт British Academy, для чего мы их используем и какие у вас есть права.",
    updated: "Последнее обновление: 27 октября 2026",
    sections: [
      {
        h: "Какие данные мы собираем",
        p: [
          "При заполнении формы заявки или обратной связи: ваше имя, номер телефона, по желанию адрес электронной почты, выбранный курс, филиал или страна, ваше сообщение и адрес страницы, с которой отправлена форма.",
          "С вашего согласия: с какой рекламы или источника вы пришли на сайт (коды рекламной кампании, ключевого слова и группы объявлений, идентификатор клика Google, страница входа и домен сайта, с которого был переход).",
          "Анонимная статистика посещений: случайный код сессии в браузере (30 минут), просмотренная страница, тип устройства (мобильный / компьютер) и общий источник. Имя, телефон и IP-адрес в этой статистике не хранятся.",
        ],
      },
      {
        h: "Для чего мы их используем",
        p: [
          "Чтобы ответить на вашу заявку, проконсультировать по курсам и оформить запись.",
          "Чтобы оценивать эффективность наших рекламных кампаний: какая кампания приносит заявки и записи. Для этого идентификатор клика Google и время записи по оформленным заявкам могут передаваться в Google Ads — имя, телефон и e-mail не передаются.",
          "Чтобы улучшать работу сайта (анонимная статистика).",
        ],
      },
      {
        h: "Что хранится в браузере",
        p: [
          "Источник рекламы сохраняется в вашем браузере (localStorage) только если вы выбрали «Принять», и на 30 дней. Если вы выбрали «Отклонить», на устройство ничего не записывается; источник остаётся только в открытой вкладке и удаляется при её закрытии.",
          "Ваш выбор тоже запоминается в браузере, чтобы баннер не появлялся каждый раз. Изменить его можно в любой момент кнопкой ниже.",
          "На сайте могут использоваться сервисы Google (например, через Google Tag Manager); они хранят собственные cookie в соответствии с политикой конфиденциальности Google.",
        ],
      },
      {
        h: "С кем мы делимся данными",
        p: [
          "Ваши данные не продаются и не передаются третьим лицам в рекламных целях. Их видят только сотрудники, работающие с заявками.",
          "Данные могут обрабатываться поставщиками, оказывающими нам технические услуги (сервер, электронная почта). Как указано выше, в Google Ads передаются только идентификатор клика и время записи.",
        ],
      },
      {
        h: "Сколько хранятся данные",
        p: [
          "Данные заявки хранятся, пока продолжается работа по вашей заявке, и в течение срока, установленного законодательством Азербайджанской Республики. Источник рекламы в браузере не учитывается по истечении 30 дней.",
        ],
      },
      {
        h: "Ваши права",
        p: [
          "В соответствии с Законом Азербайджанской Республики «О персональных данных» вы вправе ознакомиться с хранящимися о вас данными, потребовать их исправления или удаления, а также отозвать согласие.",
          "Для этого напишите нам: {email} или позвоните: {phone}.",
        ],
      },
    ],
    consentTitle: "Выбор по измерению рекламы",
    consentGranted: "Сейчас согласие дано.",
    consentDenied: "Сейчас вы отказались.",
    consentNone: "Выбор ещё не сделан.",
    consentReset: "Изменить выбор",
  },
};
