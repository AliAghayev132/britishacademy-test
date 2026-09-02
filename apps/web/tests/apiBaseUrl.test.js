import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * API və şəkil ünvanlarının nisbi/mütləq həlli.
 *
 * KONKRET NASAZLIQ: `NEXT_PUBLIC_API_URL` build zamanı koda yazılır. Domen
 * IP-dən britishacademy.az-a keçəndə yenidən build unuduldu və paketdə
 * `http://169.58.130.173:30002` qaldı. HTTPS səhifədən HTTP ünvana sorğu
 * gedirdi, brauzer isə onu bloklayırdı:
 *
 *   Mixed Content: ... requested an insecure resource
 *   'http://169.58.130.173:30002/api/auth/login'. This request has been blocked.
 *
 * Admin panelinə giriş tamamilə mümkün olmurdu. İndi dəyişən boş qalanda
 * NİSBİ yol işlədilir — sorğu həmişə səhifə ilə eyni sxem və host-a gedir,
 * ona görə bu səhv prinsipcə mümkün deyil.
 */

const ENV_KEYS = ["NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_IMAGE_URL"];

/** Modulları verilmiş env ilə təzədən yüklə (dəyərlər modul yüklənəndə oxunur). */
async function loadWith(env) {
  vi.resetModules();
  for (const k of ENV_KEYS) vi.stubEnv(k, env[k] ?? "");
  return import("@/lib/variables");
}

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllEnvs());

describe("API_URL", () => {
  it("dəyişən boş olanda nisbi /api işlədir", async () => {
    const { API_URL } = await loadWith({});
    expect(API_URL).toBe("/api");
  });

  it("mütləq ünvan verilsə ona /api əlavə edir", async () => {
    const { API_URL } = await loadWith({ NEXT_PUBLIC_API_URL: "http://localhost:5000" });
    expect(API_URL).toBe("http://localhost:5000/api");
  });

  it("ünvan artıq /api ilə bitirsə təkrarlamır", async () => {
    const { API_URL } = await loadWith({ NEXT_PUBLIC_API_URL: "https://x.az/api" });
    expect(API_URL).toBe("https://x.az/api");
  });

  it("sondakı «/» nəzərə alınmır", async () => {
    const { API_URL } = await loadWith({ NEXT_PUBLIC_API_URL: "https://x.az/" });
    expect(API_URL).toBe("https://x.az/api");
  });
});

describe("IMAGE_URL", () => {
  it("heç nə verilməyəndə boş qalır — şəkillər nisbi olur", async () => {
    const { IMAGE_URL } = await loadWith({});
    expect(IMAGE_URL).toBe("");
  });

  it("API ünvanından törəyir və /api hissəsi kəsilir", async () => {
    const { IMAGE_URL } = await loadWith({ NEXT_PUBLIC_API_URL: "https://x.az/api" });
    expect(IMAGE_URL).toBe("https://x.az");
  });

  it("öz dəyişəni verilsə ona üstünlük verilir", async () => {
    const { IMAGE_URL } = await loadWith({
      NEXT_PUBLIC_API_URL: "https://x.az",
      NEXT_PUBLIC_IMAGE_URL: "https://cdn.x.az",
    });
    expect(IMAGE_URL).toBe("https://cdn.x.az");
  });

  it("localhost defoltu QALMAYIB — deploy-da şəkilləri ziyarətçinin öz maşınına yönəldirdi", async () => {
    const { IMAGE_URL } = await loadWith({});
    expect(IMAGE_URL).not.toContain("localhost");
  });
});

describe("getImageUrl nisbi bazada", () => {
  it("nisbi /uploads yolu qaytarır", async () => {
    vi.resetModules();
    for (const k of ENV_KEYS) vi.stubEnv(k, "");
    const { getImageUrl } = await import("@/utils/getImageUrl");
    expect(getImageUrl("/uploads/flags/tr.png")).toBe("/uploads/flags/tr.png");
  });

  it("mütləq ünvana toxunmur", async () => {
    vi.resetModules();
    for (const k of ENV_KEYS) vi.stubEnv(k, "");
    const { getImageUrl } = await import("@/utils/getImageUrl");
    expect(getImageUrl("https://cdn.x.az/a.png")).toBe("https://cdn.x.az/a.png");
  });
});
