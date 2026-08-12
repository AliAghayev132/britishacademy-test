// ── Localize response middleware (public) ──
// Public cavablardakı { az, en, ru } sahələrini seçilmiş dilə görə düz mətnə
// çevirir (AZ fallback). Dil `?lang=` query və ya `x-lang` header-dən gəlir.
import { deepLocalize, parseLocale } from "#utils";

export function localizeResponse(req, res, next) {
  const lang = parseLocale(req.query.lang || req.headers["x-lang"]);
  req.lang = lang;

  const orig = res.json.bind(res);
  res.json = (body) => {
    if (body && typeof body === "object" && "data" in body) {
      body = { ...body, data: deepLocalize(body.data, lang) };
    }
    return orig(body);
  };
  next();
}
