import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";
import { FileService, HashService } from "#services";
import { setUploadHeaders } from "#middlewares";
import { OTP, User } from "#models";
import { config } from "#config";
import { unsafeBootstrapPassword, bootstrapAdmin } from "../services/BootstrapService.js";
import { initialPermissions } from "../utils/roles.js";

/**
 * FAZA 1 — AUDİTİN TƏHLÜKƏSİZLİK TAPINTILARI.
 *
 * #1 fayl yükləmə ilə saytın domenində skript, #3 şifrə bərpası kodunun
 * təxmin edilməsi, #4 standart parollar, #7 kod inyeksiyası, #8 yeni
 * istifadəçinin bütün bölmələrə girişi.
 */

afterEach(() => vi.restoreAllMocks());

describe("#1 fayl yükləmə — uzantı tipdən qurulur", () => {
  it("uzantı xəritədən gəlir, tanınmayan tip rədd edilir", () => {
    expect(FileService.extFor("image/png")).toBe(".png");
    expect(FileService.extFor("IMAGE/JPEG")).toBe(".jpg");
    expect(() => FileService.extFor("text/html")).toThrow();
    expect(() => FileService.extFor("image/svg+xml")).toThrow();
    expect(() => FileService.extFor(undefined)).toThrow();
  });

  it("icazəli hər tipin uzantısı var (yükləmə sınmasın)", () => {
    const { allowedImageTypes, allowedVideoTypes, allowedDocTypes } = config.upload;
    for (const t of [...allowedImageTypes, ...allowedVideoTypes, ...allowedDocTypes, ...FileService.allowedMimeTypes]) {
      expect(() => FileService.extFor(t), t).not.toThrow();
    }
    expect(FileService.allowedMimeTypes).not.toContain("image/svg+xml");
  });

  const fakeFile = (name, mimetype) => ({ name, mimetype, size: 10, mv: vi.fn().mockResolvedValue() });

  it("«x.html» adlı PNG .png kimi saxlanılır", async () => {
    vi.spyOn(FileService, "ensureUploadDir").mockReturnValue("tmp-test-dir");
    const file = fakeFile("evil.html", "image/png");
    const saved = await FileService.saveFile(file, "avatars/test");
    expect(saved.filename).toMatch(/\.png$/);
    expect(file.mv.mock.calls[0][0]).toMatch(/\.png$/);
  });

  it("media və sənəd yükləmələri də addakı uzantını saxlamır", async () => {
    vi.spyOn(FileService, "ensureUploadDir").mockReturnValue("tmp-test-dir");
    vi.spyOn(fs, "copyFileSync").mockImplementation(() => {});
    const url = await FileService.uploadImage(fakeFile("x.html", "image/webp"), "content");
    expect(url).toMatch(/\.webp$/);
    const doc = await FileService.uploadDocument(fakeFile("hesabat.html", "application/pdf"), "documents");
    expect(doc.url).toMatch(/-hesabat\.pdf$/);
  });
});

describe("#1 /uploads başlıqları", () => {
  const headersFor = (p) => {
    const h = {};
    setUploadHeaders({ setHeader: (k, v) => { h[k] = v; } }, p);
    return h;
  };

  it("köhnə HTML/SVG faylı skript işlətmir və endirilir", () => {
    for (const p of ["uploads/avatars/1/a.html", "uploads/logo.svg", "uploads/x.js"]) {
      const h = headersFor(p);
      expect(h["X-Content-Type-Options"]).toBe("nosniff");
      expect(h["Content-Security-Policy"]).toMatch(/sandbox/);
      expect(h["Content-Disposition"]).toBe("attachment");
    }
  });

  it("şəkil və video brauzerdə açılır, amma sandbox altında", () => {
    const h = headersFor("uploads/content/a.png");
    expect(h["Content-Disposition"]).toBeUndefined();
    expect(h["Content-Security-Policy"]).toMatch(/sandbox/);
  });

  it("PDF görüntüləyicisi sındırılmır", () => {
    const h = headersFor("uploads/documents/a.pdf");
    expect(h["Content-Security-Policy"]).toBeUndefined();
    expect(h["Content-Disposition"]).toBeUndefined();
    expect(h["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("app.js başlıqları statik fayllara tətbiq edir", () => {
    const app = fs.readFileSync("app.js", "utf8");
    expect(app).toMatch(/express\.static\("uploads", \{ setHeaders: setUploadHeaders \}\)/);
  });
});

describe("#3 şifrə bərpası kodu", () => {
  const doc = (code) => ({ code, data: { userId: "u1" }, save: vi.fn().mockResolvedValue() });

  it("cəhd müqayisədən ƏVVƏL, atomik sayılır", async () => {
    const fau = vi.spyOn(OTP, "findOneAndUpdate").mockResolvedValue(doc("123456"));
    const r = await OTP.verifyOTP("A@B.az", "000000", "reset-password");
    expect(r.valid).toBe(false);
    const [filter, update] = fau.mock.calls[0];
    expect(filter).toMatchObject({ email: "a@b.az", type: "reset-password", verified: false, attempts: { $lt: 5 } });
    expect(update).toEqual({ $inc: { attempts: 1 } });
  });

  it("düzgün kod qəbul olunur", async () => {
    const d = doc("123456");
    vi.spyOn(OTP, "findOneAndUpdate").mockResolvedValue(d);
    const r = await OTP.verifyOTP("a@b.az", "123456", "reset-password");
    expect(r).toEqual({ valid: true, data: { userId: "u1" } });
    expect(d.save).toHaveBeenCalled();
  });

  it("limitə çatmış kod bloklanır və SİLİNMİR", async () => {
    vi.spyOn(OTP, "findOneAndUpdate").mockResolvedValue(null);
    vi.spyOn(OTP, "exists").mockResolvedValue({ _id: "x" });
    const del = vi.spyOn(OTP, "deleteOne");
    const r = await OTP.verifyOTP("a@b.az", "111111", "reset-password");
    expect(r.error).toMatch(/Too many/);
    expect(del).not.toHaveBeenCalled();
  });

  it("yeni kod cəhd sayğacını SIFIRLAMIR", async () => {
    vi.spyOn(OTP, "findOne").mockReturnValue({ select: () => ({ lean: async () => ({ attempts: 4 }) }) });
    vi.spyOn(OTP, "deleteMany").mockResolvedValue({});
    vi.spyOn(OTP, "create").mockImplementation(async (d) => d);
    const created = await OTP.createOTP("a@b.az", "reset-password", {});
    expect(created.attempts).toBe(4);
  });

  it("kod göndərən və yoxlayan marşrutlar limitlidir", () => {
    const routes = fs.readFileSync("routes/authRoutes.js", "utf8");
    for (const p of ["/register", "/resend-otp", "/forgot-password"]) {
      expect(routes).toMatch(new RegExp(`post\\("${p}", otpSendLimiter`));
    }
    for (const p of ["/verify-otp", "/verify-reset-otp"]) {
      expect(routes).toMatch(new RegExp(`post\\("${p}", otpVerifyLimiter`));
    }
  });
});

describe("#4 standart parollar", () => {
  const saved = { env: process.env.NODE_ENV, pass: process.env.DEFAULT_ADMIN_PASSWORD };
  afterEach(() => {
    process.env.NODE_ENV = saved.env;
    if (saved.pass === undefined) delete process.env.DEFAULT_ADMIN_PASSWORD;
    else process.env.DEFAULT_ADMIN_PASSWORD = saved.pass;
  });

  it("standart və boş parol təhlükəli sayılır", () => {
    expect(unsafeBootstrapPassword(undefined)).toBe(true);
    expect(unsafeBootstrapPassword("Admin123!")).toBe(true);
    expect(unsafeBootstrapPassword("Developer123!")).toBe(true);
    expect(unsafeBootstrapPassword("Qx7!-uzun-parol")).toBe(false);
  });

  it("canlıda parol yoxdursa hesab YARADILMIR", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.DEFAULT_ADMIN_PASSWORD;
    vi.spyOn(User, "findOne").mockResolvedValue(null);
    const create = vi.spyOn(User, "create");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await bootstrapAdmin();
    expect(create).not.toHaveBeenCalled();
  });

  it("superadmin varsa standart admin yenidən yaradılmır", async () => {
    const find = vi.spyOn(User, "findOne").mockResolvedValue({ email: "owner@x.az" });
    const create = vi.spyOn(User, "create");
    vi.spyOn(console, "log").mockImplementation(() => {});
    await bootstrapAdmin();
    expect(find.mock.calls[0][0]).toEqual({ role: { $in: ["admin", "superadmin"] } });
    expect(create).not.toHaveBeenCalled();
  });

  it("parol heç vaxt loga yazılmır", async () => {
    process.env.NODE_ENV = "development";
    vi.spyOn(User, "findOne").mockResolvedValue(null);
    vi.spyOn(HashService, "hashPassword").mockResolvedValue("hash");
    vi.spyOn(User, "create").mockResolvedValue({ email: config.defaultAdmin.email });
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await bootstrapAdmin();
    const printed = log.mock.calls.flat().join(" ");
    expect(printed).not.toContain(config.defaultAdmin.password);
  });
});

describe("#7 kod inyeksiyası", () => {
  it("yazmaq yalnız superadmin və yuxarısı üçündür", () => {
    const src = fs.readFileSync("controllers/adminController.js", "utf8");
    expect(src).toMatch(/if \(!hasRole\(req\.user, "superadmin"\)\) delete body\.codeInjection;/);
  });
});

describe("#8 yeni istifadəçinin icazələri", () => {
  it("yeni redaktor/admin yalnız «İdarə paneli» ilə yaranır", () => {
    expect(initialPermissions("editor", [])).toEqual(["dashboard"]);
    expect(initialPermissions("admin", [])).toEqual(["dashboard"]);
    expect(initialPermissions("admin", ["leads"])).toEqual(["leads"]);
  });

  it("superadmin və developer üçün siyahı dəyişmir", () => {
    expect(initialPermissions("superadmin", [])).toEqual([]);
    expect(initialPermissions("developer", [])).toEqual([]);
  });

  it("məhdud hesabı boşaltmaq (tam giriş vermək) rədd edilir", () => {
    const src = fs.readFileSync("controllers/userAdminController.js", "utf8");
    expect(src).toMatch(/initialPermissions\(role, cleanPermissions\(permissions\)\)/);
    expect(src).toMatch(/!next\.length && wasRestricted/);
  });
});
