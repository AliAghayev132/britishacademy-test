import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";
import { User } from "#models";
import { AuthTokenService } from "#services";
import { config, corsConfig } from "#config";
import { readCookie, accessTokenOf, setAuthCookies } from "#utils";
import { authenticate, authenticateRefreshToken } from "../middlewares/auth.js";

/**
 * AUDİT #2 — admin sessiyası HttpOnly cookie-lərdə, tokenlər JS-ə görünmür.
 */

afterEach(() => vi.restoreAllMocks());
const read = (f) => fs.readFileSync(f, "utf8");

const mockRes = () => {
  const res = { cookie: vi.fn(), clearCookie: vi.fn() };
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
};
const reqWith = (headers = {}, extra = {}) => ({
  headers,
  header: (n) => headers[n.toLowerCase()],
  ...extra,
});

describe("cookie oxunması", () => {
  it("adı dəqiq uyğun gələn ilk dəyəri qaytarır", () => {
    const h = "x__starter_at=no; __starter_rt=new; __starter_at=a%2Eb; __starter_rt=old";
    expect(readCookie(h, "__starter_at")).toBe("a.b");
    // Daha uzun path-li (yeni) cookie brauzerdə əvvəl gəlir.
    expect(readCookie(h, "__starter_rt")).toBe("new");
    expect(readCookie(h, "__starter_s")).toBeNull();
    expect(readCookie(undefined, "x")).toBeNull();
  });

  it("Authorization başlığı cookie-dən üstündür (skriptlər)", () => {
    const req = reqWith({ authorization: "Bearer H", cookie: "__starter_at=C" });
    expect(accessTokenOf(req)).toBe("H");
    expect(accessTokenOf(reqWith({ cookie: "__starter_at=C" }))).toBe("C");
  });
});

describe("authenticate", () => {
  it("HttpOnly cookie-dəki access token ilə keçir", async () => {
    const user = { _id: "u1", status: "active", isDeleted: false, tokenVersion: 3 };
    vi.spyOn(User, "findById").mockReturnValue({ select: () => Promise.resolve(user) });
    const token = AuthTokenService.generateAccessToken({ id: "u1", role: "admin", tokenVersion: 3 });
    const req = reqWith({ cookie: `${config.accessCookieName}=${token}` });
    const next = vi.fn();
    await authenticate(req, mockRes(), next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBe(user);
  });

  it("uğursuz refresh sessiya cookie-lərini silir (yönləndirmə dövrəsi olmasın)", async () => {
    const res = mockRes();
    await authenticateRefreshToken(reqWith({ cookie: `${config.refreshCookieName}=zibil` }), res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    const cleared = res.clearCookie.mock.calls.map(([n]) => n);
    expect(cleared).toEqual(expect.arrayContaining([config.accessCookieName, config.refreshCookieName, config.sessionCookieName]));
  });
});

describe("cookie parametrləri", () => {
  it("hamısı HttpOnly; refresh yalnız /api/auth; göstərici tokensizdir", () => {
    const res = mockRes();
    setAuthCookies({ secure: true }, res, { accessToken: "A", refreshToken: "R" }, 1000);
    const byName = Object.fromEntries(res.cookie.mock.calls.map(([n, v, o]) => [n, { v, o }]));
    for (const { o } of Object.values(byName)) {
      expect(o.httpOnly).toBe(true);
      expect(o.secure).toBe(true);
    }
    expect(byName[config.refreshCookieName].o.path).toBe("/api/auth");
    expect(byName[config.accessCookieName].o.path).toBe("/");
    expect(byName[config.sessionCookieName]).toMatchObject({ v: "1", o: { sameSite: "lax", maxAge: 1000 } });
  });

  it("HTTP sorğusunda Secure qoyulmur (yoxsa brauzer rədd edərdi)", () => {
    const res = mockRes();
    setAuthCookies({ secure: false }, res, { accessToken: "A", refreshToken: "R" }, 1000);
    expect(res.cookie.mock.calls.every(([, , o]) => o.secure === false)).toBe(true);
  });
});

describe("tokenlər cavab gövdəsində yoxdur", () => {
  it("giriş, qeydiyyat, refresh və parol dəyişmə tokenləri JSON-da qaytarmır", () => {
    const src = read("controllers/authController.js");
    expect(src).not.toMatch(/data: \{[^}]*\btokens\b/);
    expect(src).not.toMatch(/const tokens = issueTokens/);
  });

  it("çıxış bitmiş sessiyada da cookie-ləri silir", () => {
    expect(read("routes/authRoutes.js")).toMatch(/AuthRouter\.post\("\/logout", authController\.logout\)/);
    expect(read("controllers/authController.js")).toMatch(/clearAuthCookies\(req, res\);/);
  });

  it("socket cookie ilə doğrulanır", () => {
    expect(read("services/SocketService.js")).toMatch(/readCookie\(socket\.handshake\.headers\?\.cookie, config\.accessCookieName\)/);
  });
});

describe("CORS ağ siyahısı", () => {
  it("istənilən origin əks olunmur", () => {
    expect(Array.isArray(corsConfig.origin)).toBe(true);
    const allowed = (origin) => corsConfig.origin.some((o) => (o instanceof RegExp ? o.test(origin) : o === origin));
    expect(allowed("https://evil.example")).toBe(false);
    expect(allowed("http://localhost.evil.example")).toBe(false);
    expect(allowed("http://127.0.0.1:3599")).toBe(true);
    expect(corsConfig.origin.every((o) => o instanceof RegExp || /^https?:\/\/[^/]+$/.test(o))).toBe(true);
  });
});
