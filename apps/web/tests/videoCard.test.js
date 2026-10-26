import { describe, it, expect } from "vitest";
import fs from "node:fs";

/**
 * VİDEO RƏY KARTI — media ünvanı.
 *
 * ── TAPILAN NASAZLIQ ──
 * `VideoCard` API-dən gələn yolu XAM işlədirdi:
 *
 *     const url = v.video?.url || "";      // "/uploads/videos/x.webm"
 *     <video src={url} poster={poster} />
 *
 * Nisbi ünvan SAYTIN öz originine həll olunur. İstehsalatda /uploads
 * təsadüfən eyni domendə verildiyi üçün işləyirdi, dev mühitində isə
 * `localhost:3000/uploads/...` → 404 və `MEDIA_ELEMENT_ERROR: Format error`.
 * Yəni video rəyləri lokalda HEÇ VAXT sınamaq mümkün olmayıb; media ayrı
 * hosta (`NEXT_PUBLIC_IMAGE_URL`) keçirilsə istehsalatda da sınardı.
 *
 * Brauzerdə ölçüldü: düzəlişdən əvvəl `readyState 0` + 404, sonra
 * `readyState 4`, xətasız, «Oynat»dan sonra `currentTime 2.53`.
 */

const src = fs.readFileSync("src/components/site/VideoCard.jsx", "utf8").replace(/\r\n/g, "\n");

describe("VideoCard media ünvanı", () => {
  it("video və poster `getImageUrl`-dan keçir", () => {
    expect(src).toMatch(/import \{ useT, getImageUrl \} from "@\/lib";/);
    expect(src).toMatch(/const url = getImageUrl\(v\.video\?\.url\) \|\| "";/);
    expect(src).toMatch(/const poster = getImageUrl\(v\.video\?\.poster\) \|\| "";/);
  });

  it("xam nisbi yol geri qayıtmır", () => {
    // Bu iki sətir qayıtsa video yenə dev-də 404 verəcək.
    expect(src).not.toMatch(/const url = v\.video\?\.url \|\| "";/);
    expect(src).not.toMatch(/const poster = v\.video\?\.poster \|\| "";/);
  });
});
