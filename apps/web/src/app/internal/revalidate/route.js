import crypto from "node:crypto";
import { revalidatePath } from "next/cache";

/**
 * POST /internal/revalidate — API admin dəyişikliyindən sonra çağırır (audit #37).
 *
 * Gizli `x-internal-key` (INTERNAL_API_KEY, API ilə eyni) tələb olunur;
 * açar səhvdirsə 404 — marşrutun varlığı da bildirilmir.
 *
 * `revalidatePath("/", "layout")`: kök layout və altındakı BÜTÜN səhifələr,
 * sitemap və render zamanı çəkilən data növbəti ziyarətdə təzədən qurulur.
 * Əvvəl dəyişiklik saytda 60 saniyəyə, sitemap-da bir saata qədər gecikirdi.
 *
 * NİYƏ fetch `tags` + revalidateTag DEYİL: Next 16-da açıq etiketli fetch API
 * xəta (məs. 429) qaytaranda paralel render-lər ilişirdi — e2e-də səhifələr
 * 30 s-də açılmırdı, etiketlər çıxarılanda keçdi. Yol əsaslı yeniləmə Next-in
 * öz daxili etiketlərini işlədir.
 *
 * Qeyd: /api/* nginx-də Express-ə gedir, ona görə marşrut /api altında deyil.
 */
export const dynamic = "force-dynamic";

const sameSecret = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

export async function POST(request) {
  const key = process.env.INTERNAL_API_KEY;
  if (!key || !sameSecret(request.headers.get("x-internal-key") || "", key)) {
    return Response.json({ ok: false }, { status: 404 });
  }
  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
