/**
 * Müraciətin reklam kanalı — serverdə hesablanır (api/utils/leadAttribution.js,
 * ATTRIBUTION_CHANNELS). Burada yalnız ad və rəngdir; açar dəyişsə orada da
 * dəyişməlidir.
 */
export const AD_CHANNELS = [
  { key: "google-ads", label: "Google Ads", cls: "bg-blue-100 text-blue-700" },
  { key: "meta-ads", label: "Meta reklam", cls: "bg-indigo-100 text-indigo-700" },
  { key: "paid-other", label: "Digər reklam", cls: "bg-sky-100 text-sky-700" },
  { key: "organic", label: "Organik axtarış", cls: "bg-emerald-100 text-emerald-700" },
  { key: "social", label: "Sosial şəbəkə", cls: "bg-pink-100 text-pink-700" },
  { key: "referral", label: "Başqa sayt", cls: "bg-amber-100 text-amber-700" },
  { key: "email", label: "E-poçt", cls: "bg-teal-100 text-teal-700" },
  { key: "short-link", label: "Qısa link", cls: "bg-violet-100 text-violet-700" },
  { key: "campaign", label: "Kampaniya", cls: "bg-orange-100 text-orange-700" },
  { key: "direct", label: "Birbaşa", cls: "bg-gray-100 text-gray-600" },
];
export const AD_CHANNEL_OPTIONS = AD_CHANNELS.map((c) => ({ value: c.key, label: c.label }));
export const AD_CHANNEL_BY_KEY = Object.fromEntries(AD_CHANNELS.map((c) => [c.key, c]));
