// Config
import { config } from "#config";

// Models
import { SiteSetting } from "#models";

/**
 * AI (OpenRouter) — mərkəzi çağırış nöqtəsi.
 *
 * Konfiqurasiya əvvəlcə admin panelindən (Tənzimləmələr → AI, SiteSetting.ai),
 * yoxdursa ENV-dən götürülür. Həm `/api/ai/process` (redaktor düymələri), həm
 * də toplu tərcümə servisi bunu işlədir.
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export const LANG_NAMES = { az: "Azerbaijani", en: "English", ru: "Russian" };

/** Effektiv { apiKey, model } — DB üstünlüklə, sonra ENV. */
export async function resolveAiConfig() {
  let ai = {};
  try {
    const s = await SiteSetting.get();
    ai = s?.ai || {};
  } catch {
    ai = {};
  }
  const dbKey = ai.enabled ? ai.apiKey : "";
  return {
    apiKey: dbKey || config.ai.apiKey || "",
    model: ai.model || config.ai.model,
  };
}

/** Markdown code fence-i soy və JSON parse et; alınmasa xam mətni qaytar. */
export function tryParseJson(raw) {
  let cleaned = String(raw || "");
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    return raw;
  }
}

/**
 * OpenRouter chat çağırışı. Uğursuzluqda `{ ok:false, status, message }`,
 * uğurda `{ ok:true, text }` qaytarır (throw etmir).
 */
export async function aiChat({ system, user, temperature = 0.3, maxTokens = 1500 }) {
  const cfg = await resolveAiConfig();
  if (!cfg.apiKey) {
    return { ok: false, status: 503, message: "AI xidməti konfiqurasiya olunmayıb (Tənzimləmələr → AI)" };
  }

  let response;
  try {
    response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
        "HTTP-Referer": config.appUrl,
        "X-Title": `${config.siteName} Admin`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });
  } catch (err) {
    return { ok: false, status: 502, message: err?.message || "AI xidmətinə qoşulmaq alınmadı" };
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      ok: false,
      status: response.status,
      message: errorData?.error?.message || "AI service error",
    };
  }

  const data = await response.json();
  return { ok: true, text: data.choices?.[0]?.message?.content?.trim() || "" };
}

/**
 * Bir neçə sahəni birdən tərcümə et.
 *   fields: { "seo.metaTitle": "Mətn", "faq.0.question": "..." }
 * Eyni açarlarla tərcümə olunmuş obyekt qaytarır (alınmayan açar buraxılır).
 */
export async function translateFields(fields, targetLang, { isHtml = false } = {}) {
  const toLang = LANG_NAMES[targetLang] || targetLang;
  const system = `You are a professional translator. Translate the given JSON object's VALUES from Azerbaijani to ${toLang}.
Rules:
- Return a valid JSON object with EXACTLY the same keys
- Translate only the values; never translate or change the keys
- ${isHtml ? "Preserve ALL HTML tags, attributes and structure; translate only visible text and image alt attributes" : "Plain text values"}
- Keep proper nouns (British Academy, IELTS, TOEFL, city names, university names) unchanged
- Do NOT change numbers, dates, prices or measurement values
- Comma-separated lists stay comma-separated
- Maintain a clear, professional tone
- Return ONLY the JSON. No markdown, no code blocks, no explanations.`;

  const user = JSON.stringify(fields, null, 2);
  const res = await aiChat({ system, user, temperature: 0.2, maxTokens: 4000 });
  if (!res.ok) return res;

  const parsed = tryParseJson(res.text);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, status: 502, message: "AI düzgün JSON qaytarmadı" };
  }
  // Yalnız gözlənilən açarları və qeyri-boş mətnləri götür.
  const out = {};
  for (const k of Object.keys(fields)) {
    const v = parsed[k];
    if (typeof v === "string" && v.trim()) out[k] = v.trim();
  }
  return { ok: true, fields: out };
}
