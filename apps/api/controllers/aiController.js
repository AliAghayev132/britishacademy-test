// Utils
import { asyncHandler } from "#utils";

// Services
import { aiChat, tryParseJson, resolveAiConfig, LANG_NAMES } from "#services";

const MAX_CONTENT_LENGTH = 50000;


/**
 * AI content assistant (OpenRouter proxy).
 * POST /api/ai/process  (auth)
 * Body: { action, content?, fields?, sourceLang?, targetLang?, isHtml? }
 * Actions: translate | polish | generate-slug | generate-keywords |
 *          generate-excerpt | generate-seo
 * Response: { success, data: { result } } — `result` may be a string, object or array.
 */
const processAI = asyncHandler(async (req, res) => {
  // Konfiqurasiya saytdan (Tənzimləmələr → AI) və ya ENV-dən gəlir.
  const aiCfg = await resolveAiConfig();
  if (!aiCfg.apiKey) {
    return res.status(503).json({
      success: false,
      message: "AI xidməti konfiqurasiya olunmayıb (Tənzimləmələr → AI)",
    });
  }

  const { action, fields, sourceLang, targetLang, content, isHtml } = req.body;

  if (!action) {
    return res
      .status(400)
      .json({ success: false, message: "Action is required" });
  }

  // Input length validation to prevent abuse.
  if (content && content.length > MAX_CONTENT_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters`,
    });
  }
  if (fields && JSON.stringify(fields).length > MAX_CONTENT_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Fields data exceeds maximum length of ${MAX_CONTENT_LENGTH} characters`,
    });
  }

  let systemPrompt = "";
  let userPrompt = "";

  switch (action) {
    case "translate": {
      const fromLang = LANG_NAMES[sourceLang] || sourceLang;
      const toLang = LANG_NAMES[targetLang] || targetLang;

      if (isHtml) {
        systemPrompt = `You are a professional translator. Translate HTML content from ${fromLang} to ${toLang}. Rules:
- Keep ALL HTML tags, attributes, classes, and structure exactly the same
- Only translate the visible text content
- Do NOT change img src, href links, style attributes, or any attribute values except alt attributes on images (translate those)
- Do NOT change any measurement values, numbers, or dates
- Maintain a clear, professional tone
- Return ONLY the translated HTML, no explanations`;
      } else {
        systemPrompt = `You are a professional translator. Translate text from ${fromLang} to ${toLang}. Rules:
- Maintain a clear, professional tone
- Keep proper nouns as they are (organization names, person names, etc.)
- Return ONLY the translated text, no explanations or quotes`;
      }

      if (typeof fields === "object" && fields !== null) {
        userPrompt = `Translate the following fields from ${fromLang} to ${toLang}. Return a valid JSON object with the same keys and translated values. Do NOT wrap in markdown code blocks.\n\n${JSON.stringify(fields, null, 2)}`;
        systemPrompt +=
          "\nReturn ONLY valid JSON with the same keys. No markdown, no code blocks, no explanations.";
      } else {
        userPrompt = content || "";
      }
      break;
    }

    case "polish": {
      const lang = LANG_NAMES[sourceLang] || sourceLang;

      if (isHtml) {
        systemPrompt = `You are a professional editor. Polish and improve the HTML content in ${lang}. Rules:
- Fix grammar, spelling, and punctuation errors
- Improve sentence structure and readability
- Maintain a clear, professional tone
- Keep ALL HTML tags, attributes, and structure exactly the same
- Do NOT change img src, href links, style attributes, or any attribute values except alt attributes
- Do NOT change any measurement values, numbers, or dates
- Return ONLY the polished HTML, no explanations`;
      } else {
        systemPrompt = `You are a professional editor. Polish and improve the text in ${lang}. Rules:
- Fix grammar, spelling, and punctuation errors
- Improve sentence structure and readability
- Maintain a clear, professional tone
- Keep proper nouns as they are
- Return ONLY the polished text, no explanations or quotes`;
      }

      if (typeof fields === "object" && fields !== null) {
        userPrompt = `Polish the following fields in ${lang}. Return a valid JSON object with the same keys and polished values. Do NOT wrap in markdown code blocks.\n\n${JSON.stringify(fields, null, 2)}`;
        systemPrompt +=
          "\nReturn ONLY valid JSON with the same keys. No markdown, no code blocks, no explanations.";
      } else {
        userPrompt = content || "";
      }
      break;
    }

    case "generate-slug": {
      systemPrompt = `Generate a URL-friendly slug from the given title. Rules:
- Lowercase only
- Replace spaces with hyphens
- Remove special characters (keep only letters, numbers, hyphens)
- Transliterate non-Latin characters to Latin equivalents (e.g., ə→e, ş→sh, ç→ch, ğ→gh, ı→i, ö→o, ü→u)
- Keep it concise (max 6-8 words)
- Return ONLY the slug, nothing else`;
      userPrompt = content || "";
      break;
    }

    case "generate-keywords": {
      systemPrompt = `You are an SEO expert. Generate relevant SEO keywords from the given content. Rules:
- Generate 5-10 keywords/phrases
- Include both specific and broad terms
- Generate keywords in BOTH Azerbaijani and English
- Return as JSON array of strings
- Return ONLY the JSON array, no explanations or markdown code blocks`;
      userPrompt = content || "";
      break;
    }

    case "generate-excerpt": {
      const lang = LANG_NAMES[sourceLang] || sourceLang;
      systemPrompt = `You are a content editor. Generate a concise excerpt/summary from the given content in ${lang}. Rules:
- Maximum 2-3 sentences
- Capture the main point of the content
- Maintain a clear, professional tone
- If the content is HTML, extract only the text meaning
- Return ONLY the excerpt text, no explanations or quotes`;
      userPrompt = content || "";
      break;
    }

    case "generate-seo": {
      const lang = LANG_NAMES[sourceLang] || sourceLang;
      systemPrompt = `You are an SEO expert. Generate SEO metadata from the given content in ${lang}. Rules:
- Generate a metaTitle (max 60 characters)
- Generate a metaDescription (max 160 characters)
- Generate 5-8 keywords
- Return as JSON: { "metaTitle": "...", "metaDescription": "...", "keywords": [...] }
- Return ONLY valid JSON, no markdown, no code blocks`;
      userPrompt = content || "";
      break;
    }

    /**
     * SEO dəsti — hər üç dil bir çağırışda.
     *
     * NİYƏ AYRICA `generate-seo`-dan: köhnə əməliyyat yalnız bir dil üçün
     * işləyirdi. Sayt üçdillidir, ona görə admin eyni düyməni üç dəfə basmalı
     * olurdu və EN/RU çox vaxt boş qalırdı. Bir çağırış həm ucuzdur, həm də
     * üç dilin bir-birinə uyğun olmasını təmin edir.
     *
     * EN/RU AZ-ın hərfi tərcüməsi DEYİL: hər auditoriya fərqli axtarır
     * («ingilis dili kursu» ≠ «English courses in Baku» ≠ «курсы английского
     * в Баку»), ona görə model hər dil üçün ayrıca açar söz seçir.
     */
    case "seo-suite": {
      const kind = String(req.body?.kind || "səhifə").slice(0, 40);
      const name = String(req.body?.title || "").slice(0, 200);

      systemPrompt = `You are an SEO specialist for the Azerbaijani market, writing for a language-school website based in Baku, Azerbaijan.

CONTEXT — how people in Azerbaijan actually search:
- Azerbaijani queries are usually plural and colloquial: "ingilis dili kursları", "IELTS hazırlıq", "xaricdə təhsil".
- A large share of users search in Russian, especially in Baku: "курсы английского в Баку".
- English queries come mostly from expats and study-abroad seekers.
- Location words matter: Bakı / Баку / Baku, and district names (Nərimanov, Əhmədli, Elmlər Akademiyası).
- Do NOT invent prices, guarantees, exam scores, rankings or awards.

TASK: produce SEO metadata in THREE languages for the given content.

RULES per language:
- metaTitle: max 60 characters, includes the main search term, no clickbait.
- metaDescription: max 160 characters, one concrete benefit, ends without a period-heavy sales tone.
- keywords: 6-10 items, comma-separated in ONE string (not an array), lowercase, no hashtags, no duplicates.
- az = Azerbaijani, en = English, ru = Russian.
- en and ru must be written the way THAT audience searches, not a literal translation of az.

Return ONLY valid JSON, no markdown, no code fences:
{"az":{"metaTitle":"","metaDescription":"","keywords":""},"en":{...},"ru":{...}}`;

      userPrompt = [
        `Content type: ${kind}`,
        name ? `Name/title: ${name}` : "",
        "",
        "Content:",
        content || "",
      ]
        .filter(Boolean)
        .join("\n");
      break;
    }


    default:
      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });
  }

  const ai = await aiChat({
    system: systemPrompt,
    user: userPrompt,
    temperature: action === "generate-slug" ? 0.1 : 0.3,
    // seo-suite bir cavabda ÜÇ dil qaytarır — defolt limit onu yarımçıq
    // kəsir və JSON parse olunmur.
    maxTokens: action === "seo-suite" ? 2200 : undefined,
  });
  if (!ai.ok) {
    return res.status(ai.status).json({ success: false, message: ai.message });
  }
  const raw = ai.text;


  // Parse JSON for actions that return structured data.
  let result = raw;
  const isFieldsBatch =
    (action === "translate" || action === "polish") &&
    typeof fields === "object" &&
    fields !== null;
  if (
    isFieldsBatch ||
    action === "generate-keywords" ||
    action === "generate-seo" ||
    action === "seo-suite"
  ) {
    result = tryParseJson(raw);
  }

  return res.status(200).json({ success: true, data: { result } });
});

/**
 * GET /api/ai/status  (auth)
 *
 * AI-ın işlək olub-olmadığını bildirir. Admin panel bunu düymələri
 * söndürmək üçün işlədir: əvvəl düymələr həmişə aktiv görünürdü və basanda
 * 503 gəlirdi — istifadəçi səbəbi yalnız səhv mesajından öyrənirdi.
 *
 * Açar QAYTARILMIR, yalnız mövcudluğu. Model adı göstərilir ki, admin hansı
 * modelin işlədiyini panelə baxmadan bilsin.
 */
const status = asyncHandler(async (_req, res) => {
  const cfg = await resolveAiConfig();
  const enabled = Boolean(cfg.apiKey);
  res.json({
    success: true,
    data: {
      enabled,
      model: enabled ? cfg.model : null,
      reason: enabled
        ? null
        : "AI açarı təyin olunmayıb — Tənzimləmələr → AI bölməsindən əlavə edin",
    },
  });
});

export { processAI as process, status };
