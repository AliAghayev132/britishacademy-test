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
import { useEffect, useMemo, useState } from "react";

// Icons
import { X, QrCode, RotateCcw } from "lucide-react";

// Components
import { notify } from "@/components/ui/feedback";

// Store
import { useAdminGetSettingsQuery } from "@/store";

// Lib
import {
  QR_DEFAULTS,
  LOGO_MAX,
  LOGO_SAFE,
  maxLogoScale,
  planQr,
  renderSvg,
  loadImage,
  fetchAsDataUrl,
  getImageUrl,
} from "@/lib";

// Local
import QrExportActions from "./qr-studio/QrExportActions";
import QrLogoPanel from "./qr-studio/QrLogoPanel";
import QrPreview from "./qr-studio/QrPreview";
import QrStylePanel from "./qr-studio/QrStylePanel";
import qrStudioConfig from "./qr-studio/qrStudioConfig";

const { STORE_KEY, PREF_KEYS, loadPrefs } = qrStudioConfig;

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
            <QrPreview
              svg={svg}
              transparent={o.transparent}
              plan={plan}
              logoBusy={logoBusy}
              risky={risky}
            />
            <QrExportActions value={value} name={name} opts={opts} plan={plan} size={o.size} />
          </div>

          {/* ── Tənzimləmələr ── */}
          <div className="space-y-4">
            <QrStylePanel o={o} set={set} title={title} />

            <QrLogoPanel
              o={o}
              set={set}
              setCustomData={setCustomData}
              logoData={logoData}
              logoMax={logoMax}
              logoSafe={logoSafe}
            />

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
