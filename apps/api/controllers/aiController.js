// Config
import { config } from "#config";

// Utils
import { asyncHandler } from "#utils";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MAX_CONTENT_LENGTH = 50000;

const LANG_NAMES = { az: "Azerbaijani", en: "English" };

/**
 * Strip a leading/trailing markdown code fence (```json ... ```), if present,
 * then parse. Returns the parsed value or the original string on failure.
 */
const tryParseJson = (raw) => {
  let cleaned = raw;
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    return raw;
  }
};

/**
 * AI content assistant (OpenRouter proxy).
 * POST /api/ai/process  (auth)
 * Body: { action, content?, fields?, sourceLang?, targetLang?, isHtml? }
 * Actions: translate | polish | generate-slug | generate-keywords |
 *          generate-excerpt | generate-seo
 * Response: { success, data: { result } } — `result` may be a string, object or array.
 */
const processAI = asyncHandler(async (req, res) => {
  // AI is optional: without an API key the feature is disabled.
  if (!config.ai.apiKey) {
    return res.status(503).json({
      success: false,
      message: "AI xidməti konfiqurasiya olunmayıb",
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

    default:
      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.ai.apiKey}`,
      "HTTP-Referer": config.appUrl,
      "X-Title": `${config.siteName} Admin`,
    },
    body: JSON.stringify({
      model: config.ai.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: action === "generate-slug" ? 0.1 : 0.3,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("OpenRouter error:", errorData);
    return res.status(response.status).json({
      success: false,
      message: errorData?.error?.message || "AI service error",
    });
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content?.trim() || "";

  // Parse JSON for actions that return structured data.
  let result = raw;
  const isFieldsBatch =
    (action === "translate" || action === "polish") &&
    typeof fields === "object" &&
    fields !== null;
  if (
    isFieldsBatch ||
    action === "generate-keywords" ||
    action === "generate-seo"
  ) {
    result = tryParseJson(raw);
  }

  return res.status(200).json({ success: true, data: { result } });
});

export { processAI as process };
