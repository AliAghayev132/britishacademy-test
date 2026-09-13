import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";
import { User, Course } from "#models";
import { AuthTokenService, socketService } from "#services";
import { config } from "#config";
import { clientIp, isInternalRequest } from "#utils";
import { SlugService } from "../services/SlugService.js";
import { removeUser } from "../controllers/userAdminController.js";

/**
 * AUDİT — üçüncü paket: #18 #21 #22 #24 #36 #38 #40 #42 #47 #48 #52.
 * (#26 reorder.test.js, #39 dateFilter.test.js, #41 siteEvent.test.js-dədir.)
 */

afterEach(() => vi.restoreAllMocks());
const read = (f) => fs.readFileSync(f, "utf8");

describe("#18 şablondan qalan /api/posts", () => {
  it("marşrut, controller və model yoxdur", () => {
    for (const f of ["routes/postRoutes.js", "controllers/postController.js", "models/post.model.js"]) {
      expect(fs.existsSync(f), f).toBe(false);
    }
    expect(read("app.js")).not.toMatch(/\/api\/posts/);
  });
});

describe("#21 socket", () => {
  const leanUser = (u) => ({ select: () => ({ lean: () => Promise.resolve(u) }) });
  const handshake = (token) => ({ handshake: { auth: {}, headers: { cookie: `${config.accessCookieName}=${token}` } }, data: {} });
  const connect = async (user, tokenVersion = 1) => {
    vi.spyOn(User, "findById").mockReturnValue(leanUser(user));
    const token = AuthTokenService.generateAccessToken({ id: "u1", role: "admin", tokenVersion });
    const socket = handshake(token);
    const next = vi.fn();
    await socketService.authMiddleware(socket, next);
    return { socket, err: next.mock.calls[0][0] };
  };

  it("aktiv panel istifadəçisi qoşulur, rol bazadan götürülür", async () => {
    const { socket, err } = await connect({ _id: "u1", role: "editor", status: "active", tokenVersion: 1, permissions: ["whatsapp"] });
    expect(err).toBeUndefined();
    expect(socket.data.user).toEqual({ id: "u1", role: "editor", permissions: ["whatsapp"] });
    expect(socket.data.exp).toBeGreaterThan(Date.now() / 1000);
  });

  it("çıxış etmiş, bloklanmış və panel rolu olmayan rədd edilir", async () => {
    const base = { _id: "u1", role: "admin", status: "active", tokenVersion: 1 };
    expect((await connect({ ...base, tokenVersion: 2 })).err).toBeInstanceOf(Error);
    expect((await connect({ ...base, status: "suspended" })).err).toBeInstanceOf(Error);
    expect((await connect({ ...base, isDeleted: true })).err).toBeInstanceOf(Error);
    expect((await connect({ ...base, role: "user" })).err).toBeInstanceOf(Error);
  });

  it("hadisə yalnız bölmə icazəsi olanlara gedir; istifadəçi kəsilə bilir", () => {
    const mk = (id, user) => ({ id, data: { user }, emit: vi.fn(), disconnect: vi.fn() });
    const a = mk("s1", { id: "1", role: "admin", permissions: ["leads"] });
    const b = mk("s2", { id: "2", role: "editor", permissions: ["whatsapp"] });
    const c = mk("s3", { id: "3", role: "developer", permissions: [] });
    const prev = socketService.io;
    socketService.io = { sockets: { sockets: new Map([[a.id, a], [b.id, b], [c.id, c]]) } };
    try {
      socketService.emitToSection("whatsapp", "bulk:progress", { x: 1 });
      expect(a.emit).not.toHaveBeenCalled();
      expect(b.emit).toHaveBeenCalledWith("bulk:progress", { x: 1 });
      expect(c.emit).toHaveBeenCalled();
      socketService.disconnectUser("2");
      expect(b.disconnect).toHaveBeenCalledWith(true);
      expect(a.disconnect).not.toHaveBeenCalled();
    } finally {
      socketService.io = prev;
    }
  });

  it("klientdən gələn otaq/mesaj relay-i yoxdur; dəyişiklikdə socket kəsilir", () => {
    const src = read("services/SocketService.js");
    expect(src).not.toMatch(/join:room|message:new/);
    expect(read("services/BulkQueueService.js")).not.toMatch(/emitToRole/);
    const users = read("controllers/userAdminController.js");
    expect(users.split("socketService.disconnectUser(user._id)").length - 1).toBe(2);
    expect(read("controllers/authController.js").split("socketService.disconnectUser(user._id)").length - 1).toBe(2);
  });
});

describe("#22 həqiqi IP", () => {
  const req = (headers, ip = "10.0.0.5") => ({ headers, ip });

  it("ziyarətçinin yazdığı X-Forwarded-For nəzərə alınmır", () => {
    expect(clientIp(req({ "x-forwarded-for": "6.6.6.6, 10.0.0.5" }))).toBe("10.0.0.5");
    expect(clientIp(req({ "x-client-ip": "6.6.6.6" }))).toBe("10.0.0.5");
  });

  it("x-client-ip yalnız gizli açarla qəbul olunur", () => {
    const prev = config.internalApiKey;
    config.internalApiKey = "sirr-açar";
    try {
      expect(isInternalRequest(req({ "x-internal-key": "sirr-açar" }))).toBe(true);
      expect(isInternalRequest(req({ "x-internal-key": "sirr-açaR" }))).toBe(false);
      expect(clientIp(req({ "x-internal-key": "sirr-açar", "x-client-ip": "85.1.2.3" }))).toBe("85.1.2.3");
      expect(clientIp(req({ "x-internal-key": "sirr-açar", "x-client-ip": "<script>" }))).toBe("10.0.0.5");
    } finally {
      config.internalApiKey = prev;
    }
  });

  it("log, link və limit eyni köməkçini işlədir; duz gizli açardandır", () => {
    expect(read("services/LogService.js")).not.toMatch(/x-forwarded-for/);
    expect(read("controllers/linkController.js")).toMatch(/ip: clientIp\(req\)/);
    expect(read("middlewares/security.js")).toMatch(/skip: isInternalRequest/);
    expect(read("services/LinkTrackingService.js")).not.toMatch(/process.env.JWT_SECRET/);
  });
});

describe("#24 istifadəçi silmə", () => {
  it("superadmin developer-i silə bilmir", async () => {
    vi.spyOn(User, "findById").mockResolvedValue({ _id: "d1", role: "developer", isDeleted: false, save: vi.fn() });
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await removeUser({ user: { _id: "s1", role: "superadmin" }, params: { id: "d1" } }, res, (e) => { throw e; });
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe("#40 silinmiş sənədlər", () => {
  it("silinmiş sənədin slug-u yeni sənədə verilir", async () => {
    const chain = (doc) => ({ select: () => ({ lean: () => Promise.resolve(doc) }) });
    vi.spyOn(Course, "findOne").mockReturnValueOnce(chain({ _id: "abcdef123456", isDeleted: true }));
    const upd = vi.spyOn(Course, "updateOne").mockResolvedValue({});
    expect(await SlugService.unique(Course, "IELTS kursları")).toBe("ielts-kurslari");
    expect(upd).toHaveBeenCalledWith({ _id: "abcdef123456" }, { $set: { slug: "ielts-kurslari-silinib-123456" } });
  });

  it("aktiv sənədlə toqquşmada -2 qalır", async () => {
    const chain = (doc) => ({ select: () => ({ lean: () => Promise.resolve(doc) }) });
    vi.spyOn(Course, "findOne").mockReturnValueOnce(chain({ _id: "x", isDeleted: false })).mockReturnValueOnce(chain(null));
    expect(await SlugService.unique(Course, "IELTS")).toBe("ielts-2");
  });

  it("populate silinmişləri süzür, naməlum süzgəc boş qaytarır", () => {
    const src = read("controllers/publicController.js");
    expect(src).toMatch(/const LIVE = \{ isActive: true, isDeleted: false \};/);
    expect(src).toMatch(/populate\(live\("pricing\.branch"\)\)/);
    expect(src).toMatch(/if \(!cat\) return res\.json\(\{ success: true, data: \{ courses: \[\] \} \}\)/);
    expect(src).toMatch(/filter\.category = cat \? cat\._id : \{ \$in: \[\] \}/);
  });
});

describe("#42 tək toplu göndəriş növbəsi", () => {
  it("köhnə WhatsAppQueue və marşrutları yoxdur", () => {
    expect(fs.existsSync("services/WhatsAppQueueService.js")).toBe(false);
    expect(read("routes/adminRoutes.js")).not.toMatch(/whatsapp\/bulk/);
  });
});

describe("#36 #38 #47 #48 #52 server", () => {
  it("INTERNAL_API_KEY yoxdursa xəbərdarlıq edilir", () => {
    expect(read("app.js")).toMatch(/if \(!config\.internalApiKey\)/);
  });

  it("WhatsApp avtomatik bərpası geri çəkilir, Chrome yoxdursa dayanır", () => {
    const src = read("services/WhatsAppService.js");
    expect(src).toMatch(/AUTO_RETRY_MAX = 30 \* 60_000/);
    expect(src).toMatch(/this\._autoBlocked = "chrome"/);
    expect(src).toMatch(/if \(!this\._autoAllowed\(\)\) return;/);
  });

  it("audit jurnalının ömrü var", () => {
    expect(read("models/auditLog.model.js")).toMatch(/expireAfterSeconds: 60 \* 60 \* 24 \* 400/);
  });

  it("dayanmada socket, bağlantılar, WhatsApp və toplu göndəriş bağlanır", () => {
    const src = read("app.js");
    for (const re of [/socketService\.close\(\)/, /closeAllConnections/, /WhatsAppService\.shutdown\(\)/, /BulkQueue\.cancel\(\)/, /LibVersion\.stop\(\)/]) {
      expect(src).toMatch(re);
    }
  });

  it("fayl qəbulu qlobal deyil, autentifikasiyadan sonra və diskdə", () => {
    expect(read("app.js")).not.toMatch(/fileUpload\(/);
    expect(read("middlewares/upload.js")).toMatch(/useTempFiles: true/);
    expect(read("routes/mediaRoutes.js").split("receiveFiles,").length - 1).toBe(3);
    expect(read("routes/authRoutes.js")).toMatch(/"\/avatar", authenticate, receiveFiles/);
  });
});
