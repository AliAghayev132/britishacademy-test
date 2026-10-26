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
 * Tərcümə / səliqə cavabı üçün token büdcəsi — giriş həcminə görə.
 *
 * NİYƏ: əvvəl hər cavaba sabit 1500 token verilirdi. 1148 sözlük bloq yazısının
 * ingiliscə tərcüməsi 758 sözdə, cümlənin ortasında kəsildi (6 başlıqdan 3-ü) —
 * və cavab UĞURLU (200) qayıtdı, admin yarımçıq mətni yadda saxladı.
 *
 * HESAB: Azərbaycan mətni + HTML təxminən 3 simvol/token; rus dili daha çox
 * token işlədir, «düşünən» modellər (Gemini 2.5) isə düşünmə tokenlərini də bu
 * limitdən xərcləyir. Ona görə giriş tokenlərinin ~1.5 qatı + ehtiyat verilir.
 * Yuxarı hədd 16000 — gpt-4o-mini kimi modellərin çıxış limiti.
 */
export function outputBudget(input, { min = 1500, max = 16000 } = {}) {
  const chars = typeof input === "string" ? input.length : JSON.stringify(input ?? "").length;
  return Math.min(max, Math.max(min, Math.ceil(chars / 2) + 1000));
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
  const choice = data.choices?.[0];
  // Limitə çatıb kəsilmiş cavab UĞUR DEYİL. Əvvəl yarımçıq mətn 200 ilə
  // qayıdırdı və sahəyə yazılırdı — admin bunu yalnız saytda mətnin yarıda
  // bitdiyini görəndə bilirdi.
  if (choice?.finish_reason === "length" || choice?.native_finish_reason === "MAX_TOKENS") {
    return {
      ok: false,
      status: 502,
      message: "AI cavabı uzunluq limitinə çatıb yarımçıq kəsildi — mətni hissələrə bölüb tərcümə edin",
    };
  }
  return { ok: true, text: choice?.message?.content?.trim() || "" };
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
  // Sabit 4000 idi — uzun bloq yazısının HTML-i ilə toplu tərcümədə də kəsilirdi.
  const res = await aiChat({ system, user, temperature: 0.2, maxTokens: outputBudget(user, { min: 4000 }) });
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
