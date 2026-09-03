"use client";

// ── QR studiyası ──
//
// Kampaniya linkini çap materialına (afişa, flayer, vitrin) qoymaq üçün QR
// kod hazırlayır: rəng, forma, ortada logo və alt yazı.
//
// NİYƏ CANLI ÖNBAXIŞ: çap olunmuş QR-ı geri qaytarmaq mümkün deyil. Ortadakı
// logo böyüdükcə kod oxunmaz olur, ona görə nəticə dərhal göz önündə olmalıdır
// və logonun ölçüsü təhlükəsiz həddi keçəndə xəbərdarlıq çıxır.

// React
import { useEffect, useMemo, useRef, useState } from "react";
// Data
import { useAdminGetSettingsQuery } from "@/store/api/adminApi";
// Local
import {
  QR_DEFAULTS,
  LOGO_MAX,
  LOGO_SAFE,
  maxLogoScale,
  planQr,
  renderSvg,
  drawQr,
  loadImage,
  fetchAsDataUrl,
  downloadBlob,
} from "@/lib/qr";
import { getImageUrl } from "@/utils/getImageUrl";
import { notify } from "@/components/ui/feedback";
// Icons
import {
  X, Download, Copy, Check, QrCode, Upload, AlertTriangle, RotateCcw,
} from "lucide-react";

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

/** Kiçik seçim düymələri sırası. */
function Choice({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((op) => (
        <button
          key={op.key ?? op.px}
          type="button"
          onClick={() => onChange(op.key ?? op.px)}
          title={op.hint}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
            value === (op.key ?? op.px)
              ? "border-[#00157A] bg-[#00157A] text-white"
              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
          }`}
        >
          {op.label}
        </button>
      ))}
    </div>
  );
}

function Row({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

/**
 * @param {string} value  QR-a yazılacaq mətn (tam link)
 * @param {string} name   fayl adının əsası
 * @param {string} title  başlıqda göstərilən kampaniya adı
 */
export function QrStudio({ value, name, title, onClose }) {
  const { data: settingsRes } = useAdminGetSettingsQuery();
  const brand = settingsRes?.data?.settings?.brand || {};

  // Sayt öz nişanını yükləyibsə o işlədilir, yoxdursa paketdəki fayl.
  //
  // `/assets/...` Next-in `public` qovluğundadır, API-də deyil. `getImageUrl`
  // onu şəkil hostuna yönəldir və dev-də :5000-dən 404 gəlir. Ona görə host
  // yalnız YÜKLƏNMİŞ fayllara (`/uploads/...`) əlavə olunur.
  const LOGO_SOURCES = useMemo(() => {
    const src = (v, fallback) => {
      const s = String(v || "").trim();
      if (!s) return fallback;
      return s.startsWith("/assets/") ? s : getImageUrl(s) || fallback;
    };
    return {
      none: "",
      shield: src(brand.shield, "/assets/shield.png"),
      logo: src(brand.logo, "/assets/logo.png"),
    };
  }, [brand.shield, brand.logo]);

  const [o, setO] = useState(() => ({
    ...QR_DEFAULTS,
    dark: "#00157A",
    logoKey: "shield",
    caption: "",
    ...loadPrefs(),
  }));
  // Hazır logo ilə istifadəçinin yüklədiyi AYRI saxlanılır: adam öz faylını
  // yükləyib «Nişan»a keçsə və geri qayıtsa, faylını yenidən seçməli olmasın.
  const [builtinData, setBuiltinData] = useState("");
  const [customData, setCustomData] = useState("");
  // Hansı hazır logo artıq gətirilib. «Yüklənir» halı bundan HESABLANIR —
  // ayrıca bayraq saxlansaydı effektin içində sinxron setState olardı.
  const [loadedKey, setLoadedKey] = useState("");
  const logoData =
    o.logoKey === "none" ? "" : o.logoKey === "custom" ? customData : builtinData;
  const logoBusy = Boolean(LOGO_SOURCES[o.logoKey]) && loadedKey !== o.logoKey;
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState("");
  const fileRef = useRef(null);

  const set = (k, v) => setO((p) => ({ ...p, [k]: v }));

  // Seçimlər yaddaşa yazılır (logonun özü yox — data URL meqabaytlarla ola bilər).
  useEffect(() => {
    try {
      const keep = Object.fromEntries(PREF_KEYS.map((k) => [k, o[k]]));
      window.localStorage.setItem(STORE_KEY, JSON.stringify(keep));
    } catch {
      // Yaddaş bağlıdırsa (gizli rejim) tənzimləmə sadəcə saxlanılmır.
    }
  }, [o]);

  // Logo `data:` URI-yə çevrilir: SVG faylı müstəqil olsun və canvas
  // «çirklənməsin» (tainted canvas → PNG endirilə bilmir).
  useEffect(() => {
    const src = LOGO_SOURCES[o.logoKey] || "";
    if (!src) return; // «none» və «custom» üçün yükləmə lazım deyil
    let alive = true;
    fetchAsDataUrl(src)
      .then((d) => alive && setBuiltinData(d))
      .catch(() => {
        if (!alive) return;
        setBuiltinData("");
        notify.error("Logo yüklənmədi — başqa logo seç və ya faylı özün yüklə");
      })
      .finally(() => alive && setLoadedKey(o.logoKey));
    return () => {
      alive = false;
    };
  }, [o.logoKey, LOGO_SOURCES]);

  const pickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return notify.error("Yalnız şəkil faylı");
    if (file.size > 2 * 1024 * 1024) return notify.error("Şəkil 2 MB-dan böyük olmamalıdır");
    const fr = new FileReader();
    fr.onload = () => {
      setCustomData(String(fr.result));
      set("logoKey", "custom");
    };
    fr.onerror = () => notify.error("Fayl oxunmadı");
    fr.readAsDataURL(file);
  };

  // Logonun en/hündürlük nisbəti ölçülür: üfüqi lövhə kvadrat yuvaya
  // sıxılsaydı oxunmaz dərəcədə kiçilərdi.
  const [logoAspect, setLogoAspect] = useState(1);
  useEffect(() => {
    if (!logoData) return;
    let alive = true;
    loadImage(logoData).then((img) => {
      if (!alive || !img) return;
      setLogoAspect((img.naturalWidth || 1) / (img.naturalHeight || 1));
    });
    return () => {
      alive = false;
    };
  }, [logoData]);

  // Çəkiliş parametrləri — `logoKey` deyil, həll olunmuş data URL göndərilir.
  const opts = useMemo(() => ({ ...o, logo: logoData, logoAspect }), [o, logoData, logoAspect]);

  const svg = useMemo(() => {
    try {
      return renderSvg(value, opts);
    } catch {
      return "";
    }
  }, [value, opts]);

  const plan = useMemo(() => {
    try {
      return planQr(value, opts);
    } catch {
      return null;
    }
  }, [value, opts]);

  const raster = async (mime, ext) => {
    setBusy(ext);
    try {
      const p = planQr(value, opts);
      const img = await loadImage(opts.logo);
      const canvas = document.createElement("canvas");
      drawQr(canvas, p, img, mime === "image/jpeg");
      const blob = await new Promise((res) => canvas.toBlob(res, mime, 0.92));
      if (!blob) throw new Error("Şəkil hazırlanmadı");
      return blob;
    } finally {
      setBusy("");
    }
  };

  const save = async (fmt) => {
    const base = `qr-${name || "link"}`;
    try {
      if (fmt === "svg") {
        const blob = new Blob([renderSvg(value, opts)], { type: "image/svg+xml;charset=utf-8" });
        downloadBlob(blob, `${base}.svg`);
        return;
      }
      const mime = fmt === "jpg" ? "image/jpeg" : "image/png";
      const blob = await raster(mime, fmt);
      downloadBlob(blob, `${base}-${plan?.width || o.size}.${fmt}`);
    } catch (e) {
      notify.error(e?.message || "Endirilə bilmədi");
    }
  };

  const copyImage = async () => {
    try {
      const blob = await raster("image/png", "copy");
      await navigator.clipboard.write([new window.ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      notify.error("Brauzer şəkil kopyalamağı dəstəkləmir — faylı endir");
    }
  };

  const reset = () => {
    setO({ ...QR_DEFAULTS, dark: "#00157A", logoKey: "shield", caption: "" });
  };

  // Hədd logonun formasına görə dəyişir — üfüqi logo eyni endə daha az sahə
  // örtdüyü üçün daha geniş ola bilər.
  const logoMax = maxLogoScale(logoAspect);
  const logoSafe = logoMax * (LOGO_SAFE / LOGO_MAX);
  const risky = Boolean(logoData) && o.logoScale > logoSafe;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="QR kod"
        className="mx-auto w-full max-w-4xl rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
              <QrCode className="h-5 w-5 text-gray-400" />
              QR kod
            </h2>
            <p className="mt-0.5 truncate text-xs text-gray-500">
              {title ? `${title} · ` : ""}
              <span className="font-mono">{value}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-none rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:bg-gray-50"
            aria-label="Bağla"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[300px_1fr]">
          {/* ── Önbaxış ── */}
          <div>
            <div
              className="rounded-xl border border-gray-200 p-3 [&_svg]:h-auto [&_svg]:w-full"
              style={{
                // Şəffaf fon seçiləndə dama-dama altlıq — ağ QR ağ səhifədə
                // görünməz olardı.
                backgroundImage: o.transparent
                  ? "linear-gradient(45deg,#e5e7eb 25%,transparent 25%),linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e7eb 75%),linear-gradient(-45deg,transparent 75%,#e5e7eb 75%)"
                  : undefined,
                backgroundSize: o.transparent ? "16px 16px" : undefined,
                backgroundPosition: o.transparent ? "0 0,0 8px,8px -8px,-8px 0" : undefined,
              }}
              // Sətir bu modulda qurulur; istifadəçi mətni `escapeXml` ilə
              // qaçırılır, rənglər hex şablonu ilə süzülür.
              dangerouslySetInnerHTML={{ __html: svg }}
            />
            <p className="mt-2 text-center text-xs text-gray-400">
              {plan ? `${plan.width} × ${plan.height} px · ${plan.modules} modul` : "—"}
              {logoBusy ? " · logo yüklənir…" : ""}
            </p>

            {risky && (
              <p className="mt-3 flex gap-2 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
                <span>
                  Logo böyükdür. Kod hələ oxuna bilər, amma zədəli və ya uzaqdan
                  çəkilmiş şəkildə tutulmaya bilər — <b>çapa göndərməzdən əvvəl
                  telefonla yoxla</b>.
                </span>
              </p>
            )}

            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                ["png", "PNG"],
                ["svg", "SVG"],
                ["jpg", "JPG"],
              ].map(([fmt, label]) => (
                <button
                  key={fmt}
                  onClick={() => save(fmt)}
                  disabled={busy === fmt}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#00157A] px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-[#001a99] disabled:opacity-60"
                >
                  <Download className="h-3.5 w-3.5" />
                  {busy === fmt ? "…" : label}
                </button>
              ))}
            </div>
            <button
              onClick={copyImage}
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" /> Kopyalandı
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Şəkli kopyala
                </>
              )}
            </button>
            <p className="mt-2 text-center text-[11px] leading-relaxed text-gray-400">
              SVG vektordur — çapda istənilən ölçüyə böyüdülə bilər.
              JPG şəffaflığı saxlamır.
            </p>
          </div>

          {/* ── Tənzimləmələr ── */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Row label="Ölçü (px)" hint="SVG-yə təsir etmir — o, vektordur.">
                <Choice options={SIZES} value={o.size} onChange={(v) => set("size", v)} />
              </Row>
              <Row label="Kənar boşluq" hint="Standart 4 moduldur; azaldılsa skan çətinləşir.">
                <input
                  type="range"
                  min={0}
                  max={8}
                  value={o.margin}
                  onChange={(e) => set("margin", Number(e.target.value))}
                  className="w-full accent-[#00157A]"
                />
              </Row>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Row label="Nöqtə forması">
                <Choice
                  options={MODULE_STYLES}
                  value={o.moduleStyle}
                  onChange={(v) => set("moduleStyle", v)}
                />
              </Row>
              <Row label="Künc gözləri">
                <Choice options={EYE_STYLES} value={o.eyeStyle} onChange={(v) => set("eyeStyle", v)} />
              </Row>
            </div>

            <Row label="Rəng" hint="Tünd rəng açıq fonda olmalıdır — əks halda skaner kodu tanımır.">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="color"
                  value={o.dark}
                  onChange={(e) => set("dark", e.target.value)}
                  className="h-9 w-14 cursor-pointer rounded-lg border border-gray-300 bg-white p-1"
                />
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set("dark", c)}
                    style={{ background: c }}
                    title={c}
                    className={`h-7 w-7 rounded-full border-2 transition ${
                      String(o.dark || "").toLowerCase() === c.toLowerCase()
                        ? "border-gray-900"
                        : "border-white shadow-sm"
                    }`}
                  />
                ))}
              </div>
            </Row>

            <div className="grid gap-4 sm:grid-cols-2">
              <Row label="Fon">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={o.light}
                    onChange={(e) => set("light", e.target.value)}
                    disabled={o.transparent}
                    className="h-9 w-14 cursor-pointer rounded-lg border border-gray-300 bg-white p-1 disabled:opacity-40"
                  />
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-gray-600">
                    <input
                      type="checkbox"
                      checked={o.transparent}
                      onChange={(e) => set("transparent", e.target.checked)}
                      className="h-4 w-4 accent-[#00157A]"
                    />
                    Şəffaf (PNG/SVG)
                  </label>
                </div>
              </Row>
              <Row label="Alt yazı" hint="Şəklin altına yazılır — afişada nə üçün olduğu bilinsin.">
                <input
                  value={o.caption}
                  onChange={(e) => set("caption", e.target.value.slice(0, 60))}
                  placeholder={title || "Skan et"}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-[#00157A] focus:ring-2 focus:ring-[#00157A]/10"
                />
              </Row>
            </div>

            <Row
              label="Ortadakı logo"
              hint="Kvadrat nişan mərkəzdə ən yaxşı oturur — uzun logo eyni təhlükəsizlikdə daha kiçik qalır."
            >
              <div className="flex flex-wrap gap-1.5">
                {[
                  ["none", "Yoxdur"],
                  ["shield", "Nişan"],
                  ["logo", "Logo"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => set("logoKey", key)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      o.logoKey === key
                        ? "border-[#00157A] bg-[#00157A] text-white"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    o.logoKey === "custom"
                      ? "border-[#00157A] bg-[#00157A] text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" /> Yüklə
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={pickFile}
                  className="hidden"
                />
              </div>
            </Row>

            {logoData && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Row
                  label={`Logo ölçüsü — ${Math.round(Math.min(o.logoScale, logoMax) * 100)}%`}
                  hint={`Təhlükəsiz hədd ${Math.round(logoSafe * 100)}%.`}
                >
                  <input
                    type="range"
                    min={8}
                    max={Math.round(logoMax * 100)}
                    value={Math.round(Math.min(o.logoScale, logoMax) * 100)}
                    onChange={(e) => set("logoScale", Number(e.target.value) / 100)}
                    className="w-full accent-[#00157A]"
                  />
                </Row>
                <Row label="Logo altlığı">
                  <Choice
                    options={LOGO_SHAPES}
                    value={o.logoShape}
                    onChange={(v) => set("logoShape", v)}
                  />
                </Row>
              </div>
            )}

            <div className="flex justify-end border-t border-gray-100 pt-3">
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition hover:text-gray-800"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Defolta qaytar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QrStudio;
