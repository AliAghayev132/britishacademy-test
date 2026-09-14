import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";
import reducer, { setCredentials, logout } from "@/store/slices/authSlice";

/**
 * AUDİT #2 — admin tokenləri HttpOnly cookie-lərdə, JS-ə görünmür.
 */

const read = (f) => fs.readFileSync(f, "utf8");
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("authSlice tokensizdir", () => {
  it("giriş cavabında token gəlsə belə state-ə yazılmır", () => {
    const state = reducer(undefined, setCredentials({ user: { id: "1", role: "admin" }, tokens: { accessToken: "x", refreshToken: "y" } }));
    expect(state).toEqual({ user: { id: "1", role: "admin" }, isAuthenticated: true, role: "admin" });
    expect(reducer(state, logout())).toEqual({ user: null, isAuthenticated: false, role: null });
  });

  it("JS-in oxuduğu token cookie-si yazılmır, köhnəsi silinir", () => {
    const src = read("src/store/slices/authSlice.js");
    expect(src).not.toMatch(/setTokens|setTokenCookie/);
    expect(src).toMatch(/'accessToken' in stored \|\| 'refreshToken' in stored/);
    expect(src).toMatch(/token=; path=\/; max-age=0/);
  });
});

describe("sorğular cookie ilə gedir", () => {
  it("heç bir yerdə Authorization başlığı qurulmur", () => {
    for (const f of ["src/store/api/baseApi.js", "src/lib/uploadWithProgress.js", "src/store/context/SocketContext.jsx"]) {
      const src = read(f);
      expect(src, f).not.toMatch(/Authorization|accessToken|refreshToken/);
    }
    expect(read("src/store/context/SocketContext.jsx")).toMatch(/withCredentials: true/);
    expect(read("src/lib/uploadWithProgress.js")).toMatch(/xhr\.withCredentials = true/);
  });

  it("proxy tokensiz sessiya göstəricisinə baxır", () => {
    const src = read("src/proxy.js");
    expect(src).toMatch(/const SESSION_COOKIES = \['__starter_s', '__starter_at'\]/);
    expect(src).not.toMatch(/cookies\.get\('token'\)/);
  });
});

describe("refreshSession", () => {
  const load = async () => (await import("@/lib/session")).refreshSession;

  it("paralel 401-lər tək refresh sorğusu göndərir", async () => {
    let release;
    const fetchMock = vi.fn(() => new Promise((r) => { release = () => r({ ok: true, status: 200 }); }));
    vi.stubGlobal("fetch", fetchMock);
    const refreshSession = await load();
    const all = Promise.all([refreshSession(), refreshSession(), refreshSession()]);
    release();
    expect(await all).toEqual(["ok", "ok", "ok"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]).toEqual({ method: "POST", credentials: "include" });
  });

  it("yalnız 401/403 sessiyanın bitməsidir, şəbəkə xətası deyil", async () => {
    const refreshSession = await load();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    expect(await refreshSession()).toBe("expired");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 502 }));
    expect(await refreshSession()).toBe("error");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    expect(await refreshSession()).toBe("error");
  });

  it("baseApi yanlış parol kimi 401-lərdə refresh etmir", () => {
    const src = read("src/store/api/baseApi.js");
    expect(src).toMatch(/login\|register/);
    expect(src).toMatch(/if \(outcome === 'expired'\)/);
  });
});
