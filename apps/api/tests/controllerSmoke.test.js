import { describe, it, expect } from "vitest";
import { init, bulk, disconnect, logout } from "#controllers/whatsappController.js";
import { send as bulkSend } from "#controllers/bulkController.js";

/**
 * KONTROLLER ÇAĞIRIŞ TESTİ.
 *
 * middlewareSmoke.test.js middleware-ləri əhatə edir, bu isə kontrollerləri.
 * Səbəb: `hasRole` dörd kontrollerdə işlədilirdi, amma üçündə importu YOX idi.
 * Modul yüklənməsi buna görə sınmır — səhv yalnız handler işə düşəndə çıxır,
 * ona görə developer hesabı istehsalatda 500 alırdı.
 *
 * Aşağıdakı handler-lərin hamısında `hasRole` yoxlaması bazaya müraciətdən
 * ƏVVƏL gəlir, ona görə testin MongoDB-yə ehtiyacı yoxdur: admin olmayan
 * istifadəçi ilə çağırış 403-də dayanır və import zənciri tam icra olunur.
 */

function fakeRes() {
  const out = { code: 200, body: null };
  return {
    out,
    status(c) { out.code = c; return this; },
    json(b) { out.body = b; return this; },
  };
}

/** Handler-i icra et — asyncHandler səhvi `next`-ə ötürür, onu tuturuq. */
async function call(handler, user, body = {}) {
  const res = fakeRes();
  let err = null;
  await handler({ user, body, query: {}, params: {} }, res, (e) => { err = e; });
  return { err, ...res.out };
}

const EDITOR = { _id: "1", email: "editor@test.local", role: "editor" };

const HANDLERS = [
  ["whatsapp/init", init],
  ["whatsapp/bulk", bulk],
  ["whatsapp/disconnect", disconnect],
  ["whatsapp/logout", logout],
  ["bulk/send", bulkSend],
];

describe("hasRole işlədən kontrollerlər icra olunur", () => {
  it.each(HANDLERS)("%s — ReferenceError atmır, 403 qaytarır", async (_name, handler) => {
    const { err, code, body } = await call(handler, EDITOR);

    // Əsas iddia: import çatışmazlığından yaranan ReferenceError yoxdur.
    expect(err).toBeNull();
    expect(code).toBe(403);
    expect(body?.success).toBe(false);
  });
});
