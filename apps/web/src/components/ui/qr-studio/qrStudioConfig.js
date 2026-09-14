// QR studiyasının seçim siyahıları və yaddaş açarları.
// Default ixrac: `@/components` barrel-i adlı ixracları toplayır — SIZES və
// SWATCHES kimi ümumi adlar oraya düşüb başqa modullarla toqquşmasın.

// Tənzimləmələr brauzerdə saxlanılır: bir kampaniyada onlarla link olur və
// hər dəfə rəngi, formanı yenidən seçmək əziyyətdir.
const STORE_KEY = "ba.qr.prefs";

const SIZES = [
  { px: 512, label: "512", hint: "sosial şəbəkə" },
  { px: 1024, label: "1024", hint: "adi çap" },
  { px: 2048, label: "2048", hint: "böyük afişa" },
];

const MODULE_STYLES = [
  { key: "square", label: "Kvadrat" },
  { key: "soft", label: "Yumşaq" },
  { key: "dots", label: "Nöqtə" },
];

const EYE_STYLES = [
  { key: "square", label: "Kvadrat" },
  { key: "soft", label: "Yumşaq" },
  { key: "circle", label: "Dairə" },
];

const LOGO_SHAPES = [
  { key: "rounded", label: "Yumşaq" },
  { key: "circle", label: "Dairə" },
  { key: "square", label: "Kvadrat" },
];

const SWATCHES = ["#00157A", "#000000", "#1F2937", "#7C1D1D", "#065F46", "#7C2D12"];

const PREF_KEYS = [
  "size", "margin", "dark", "light", "transparent",
  "moduleStyle", "eyeStyle", "logoKey", "logoScale", "logoShape",
];

function loadPrefs() {
  if (typeof window === "undefined") return {};
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORE_KEY) || "{}");
    // Yalnız tanınan açarlar götürülür — köhnə və ya zədələnmiş yaddaş
    // formanı sındırmasın.
    return Object.fromEntries(PREF_KEYS.filter((k) => k in raw).map((k) => [k, raw[k]]));
  } catch {
    return {};
  }
}

const qrStudioConfig = {
  STORE_KEY,
  SIZES,
  MODULE_STYLES,
  EYE_STYLES,
  LOGO_SHAPES,
  SWATCHES,
  PREF_KEYS,
  loadPrefs,
};

export default qrStudioConfig;
