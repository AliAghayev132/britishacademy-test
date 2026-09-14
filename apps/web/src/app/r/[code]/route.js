// Next
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Lib
import { withUtm } from "@/lib";

/**
 * /r/<kod> — izlənilən kampaniya linki.
 *
 * NİYƏ NEXT TƏRƏFİNDƏ, API-də YOX:
 * Link reklamda çap olunur və paylaşılır — o, saytın öz domenində olmalıdır
 * (britishacademy.az/r/ig-sent), API portunda yox. Ona görə marşrut buradadır,
 * klik isə API-yə ötürülüb orada yazılır.
 *
 * NİYƏ ROUTE HANDLER, SƏHİFƏ YOX:
 * Səhifə olsaydı ziyarətçi əvvəlcə boş HTML görər, sonra JS yönləndirərdi —
 * gözlə görünən sıçrayış, üstəlik JS sönülü brauzerdə ümumiyyətlə işləməzdi.
 * Route handler cavab olaraq birbaşa 307 qaytarır.
 *
 * Bilinməyən kod 404 vermir, ana səhifəyə buraxır: reklamda səhv yazılmış
 * linkə görə adamı itirmək, onu ana səhifəyə göndərməkdən pisdir.
 */

// Server tərəfi — lib/api.js ilə eyni sıra: daxili ünvan nginx-dən keçmir.
const API_URL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

// SSR sorğuları API-nin IP limitinə düşməsin.
const INTERNAL_HEADERS = process.env.INTERNAL_API_KEY
  ? { "x-internal-key": process.env.INTERNAL_API_KEY }
  : {};

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { code } = await params;
  const h = await headers();

  let target = "/";
  try {
    const res = await fetch(`${API_URL}/api/track/${encodeURIComponent(code)}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        // Ziyarətçinin izləri ötürülür — API cihazı və mənbəyi onlardan çıxarır.
        // Birbaşa `request` header-lərindən götürülür, çünki bu fetch serverdən
        // gedir və öz User-Agent-i Node-undur.
        "user-agent": h.get("user-agent") || "",
        referer: h.get("referer") || "",
        "accept-language": h.get("accept-language") || "",
        // Ziyarətçinin IP-si. X-Real-IP-ni nginx özü qoyur; X-Forwarded-For-un
        // İLK dəyərini isə ziyarətçi yaza bilər, sonuncunu nginx əlavə edir.
        // API bu başlığa yalnız x-internal-key ilə inanır (audit #22).
        "x-client-ip": h.get("x-real-ip") || (h.get("x-forwarded-for") || "").split(",").pop().trim(),
        ...INTERNAL_HEADERS,
      },
    });
    const json = await res.json();
    // UTM — GA və «Konversiya» ziyarəti bu linkə bağlasın (bax lib/utm).
    // API tapılmayan kod üçün də `target: "/"` qaytarır — `found` yoxlanmasa
    // səhv yazılmış kod statistikada kampaniya kimi görünərdi.
    if (json?.data?.found && json.data.target) target = withUtm(json.data.target, code);
    else if (json?.data?.target) target = json.data.target;
  } catch {
    // API çatmırsa da ziyarətçi ana səhifəyə düşür — klik itir, adam yox.
  }

  redirect(target);
}
