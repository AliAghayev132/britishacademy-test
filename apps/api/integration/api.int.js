import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { enabled, startApi, client, createUser } from "./harness.js";

/**
 * API-nin kritik yolları HTTP səviyyəsində, real MongoDB ilə (audit #49).
 *
 * Unit testlər funksiyaları təcrid olunmuş yoxlayır; burada isə marşrut,
 * middleware, cookie, baza indeksləri və icazələr BİRLİKDƏ işləyir — əvvəlki
 * auditdə tapılan xətaların çoxu məhz bu birləşmədə idi.
 */
describe.skipIf(!enabled)("API inteqrasiyası", () => {
  let api;
  let ctx;

  beforeAll(async () => {
    api = await startApi();
    const { Branch } = await import("#models");
    const [b1, b2] = await Promise.all([
      Branch.create({ name: { az: "Filial Bir" }, isActive: true }),
      Branch.create({ name: { az: "Filial İki" }, isActive: true }),
    ]);
    await createUser({ email: "dev@test.local", role: "developer" });
    await createUser({ email: "editor@test.local", role: "editor", permissions: ["dashboard"] });
    await createUser({ email: "menecer@test.local", role: "editor", permissions: ["dashboard", "leads"], allowedBranches: [b1._id] });
    ctx = { b1, b2 };
  });

  afterAll(async () => {
    await api?.stop();
  });

  const login = async (email, password = "Sinaq-Parol-12345") => {
    const c = client(api.base);
    const res = await c.post("/api/auth/login", { email, password });
    return { c, res };
  };

  describe("sessiya (HttpOnly cookie)", () => {
    it("səhv parol 401, düzgün parol cookie verir, token gövdədə yoxdur", async () => {
      expect((await login("dev@test.local", "yanlis")).res.status).toBe(401);
      const { c, res } = await login("dev@test.local");
      expect(res.status).toBe(200);
      expect(res.data.data.user.email).toBe("dev@test.local");
      expect(res.data.data.tokens).toBeUndefined();
      expect(c.jar.names()).toEqual(["__starter_at", "__starter_rt", "__starter_s"]);
      expect(c.jar.get("__starter_rt").path).toBe("/api/auth");
    });

    it("cookie ilə /auth/me işləyir, cookie-siz 401", async () => {
      const { c } = await login("dev@test.local");
      expect((await c.get("/api/auth/me")).status).toBe(200);
      expect((await client(api.base).get("/api/auth/me")).status).toBe(401);
    });

    it("access bitəndə refresh cookie yeni access verir", async () => {
      const { c } = await login("dev@test.local");
      c.jar.delete("__starter_at");
      expect((await c.get("/api/auth/me")).status).toBe(401);
      expect((await c.post("/api/auth/refresh")).status).toBe(200);
      expect((await c.get("/api/auth/me")).status).toBe(200);
    });

    it("çıxışdan sonra köhnə token da işləmir (tokenVersion)", async () => {
      const { c } = await login("dev@test.local");
      const stolen = c.jar.get("__starter_at").value;
      expect((await c.post("/api/auth/logout")).status).toBe(200);
      expect(c.jar.has("__starter_at")).toBe(false);
      const replay = await client(api.base).get("/api/auth/me", { headers: { Cookie: `__starter_at=${stolen}` } });
      expect(replay.status).toBe(401);
    });
  });

  describe("müraciət formu", () => {
    it("düzgün müraciət yazılır, natamam 400, honeypot yazılmır", async () => {
      const anon = client(api.base);
      const ok = await anon.post("/api/leads", { name: "Əli Sınaq", phone: "+994501112233", branch: String(ctx.b1._id), interest: "IELTS" });
      expect(ok.status).toBe(201);
      expect(ok.data.data.id).toBeTruthy();
      expect((await anon.post("/api/leads", { name: "Telefonsuz" })).status).toBe(400);
      const bot = await anon.post("/api/leads", { name: "Bot", phone: "1", website: "http://spam" });
      expect(bot.status).toBe(201);

      const { Lead } = await import("#models");
      expect(await Lead.countDocuments({ name: "Bot" })).toBe(0);
      expect(await Lead.countDocuments({ name: "Əli Sınaq" })).toBe(1);
    });
  });

  describe("icazələr və əhatə", () => {
    it("admin marşrutları girişsiz bağlıdır", async () => {
      expect((await client(api.base).get("/api/admin/leads")).status).toBe(401);
    });

    it("müraciət icazəsi olmayan redaktor müraciətləri görmür", async () => {
      const { c } = await login("editor@test.local");
      expect((await c.get("/api/admin/leads")).status).toBe(403);
      expect((await c.get("/api/admin/users")).status).toBe(403);
    });

    it("filial meneceri yalnız öz filialının müraciətinə çatır", async () => {
      const anon = client(api.base);
      const own = (await anon.post("/api/leads", { name: "Öz filial", phone: "+994500000001", branch: String(ctx.b1._id), interest: "IELTS" })).data.data.id;
      const other = (await anon.post("/api/leads", { name: "Başqa filial", phone: "+994500000002", branch: String(ctx.b2._id), interest: "IELTS" })).data.data.id;

      const { c } = await login("menecer@test.local");
      const list = await c.get("/api/admin/leads?limit=100");
      expect(list.status).toBe(200);
      const names = list.data.data.items.map((l) => l.name);
      expect(names).toContain("Öz filial");
      expect(names).not.toContain("Başqa filial");

      expect((await c.patch(`/api/admin/leads/${own}/status`, { status: "contacted" })).status).toBe(200);
      expect((await c.patch(`/api/admin/leads/${other}/status`, { status: "contacted" })).status).toBe(404);
      expect((await c.del(`/api/admin/leads/${other}`)).status).toBe(404);
    });

    it("sistem sahələri klientdən yazılmır", async () => {
      const { c } = await login("dev@test.local");
      const created = await c.post("/api/admin/faqs", { question: { az: "Sual?" }, answer: { az: "Cavab" }, views: 999, isDeleted: true });
      expect(created.status).toBe(201);
      const item = created.data.data.item;
      expect(item.isDeleted).toBe(false);
      expect(item.views ?? 0).not.toBe(999);
    });
  });

  describe("audit düzəlişləri", () => {
    it("müraciət kursa bağlanır və statistikada görünür (id və ya kurs adı ilə)", async () => {
      const { Course, CourseCategory } = await import("#models");
      const category = await CourseCategory.create({ name: { az: "Statistika kateqoriyası" }, isActive: true });
      const course = await Course.create({ title: { az: "Statistika Sınaq Kursu", en: "Stats Test Course" }, category: category._id, isActive: true });
      const anon = client(api.base);
      const byId = await anon.post("/api/leads", { name: "İd ilə", phone: "+994500000011", course: String(course._id), interest: "Statistika Sınaq Kursu" });
      const byTitle = await anon.post("/api/leads", { name: "Adla", phone: "+994500000012", interest: "Stats Test Course" });
      expect(byId.status).toBe(201);
      expect(byTitle.status).toBe(201);

      const { Lead } = await import("#models");
      const saved = await Lead.findById(byTitle.data.data.id).lean();
      expect(String(saved.course)).toBe(String(course._id));

      const { c } = await login("dev@test.local");
      const stats = await c.get("/api/admin/stats/content");
      expect(stats.status).toBe(200);
      const row = stats.data.data.leadsByCourse.find((r) => r.title === "Statistika Sınaq Kursu");
      expect(row).toMatchObject({ kind: "course", count: 2 });
    });

    it("yanlış ObjectId 500 yox, 400 qaytarır", async () => {
      const { c } = await login("dev@test.local");
      const res = await c.get("/api/admin/faqs/bu-id-deyil");
      expect(res.status).toBe(400);
    });

    it("silinmiş sənəd id ilə açılmır, ikinci dəfə silinmir", async () => {
      const { c } = await login("dev@test.local");
      const id = (await c.post("/api/admin/faqs", { question: { az: "Silinəcək?" }, answer: { az: "Bəli" } })).data.data.item._id;
      expect((await c.del(`/api/admin/faqs/${id}`)).status).toBe(200);
      expect((await c.get(`/api/admin/faqs/${id}`)).status).toBe(404);
      expect((await c.del(`/api/admin/faqs/${id}`)).status).toBe(404);
    });

    it("parol sıfırlama tokeni birdəfəlikdir", async () => {
      const user = await createUser({ email: "sifirla@test.local", role: "editor", permissions: ["dashboard"] });
      const { AuthTokenService } = await import("#services");
      const token = AuthTokenService.generateResetToken({ email: user.email, userId: user._id, tv: user.tokenVersion || 0 });
      const anon = client(api.base);
      expect((await anon.post("/api/auth/reset-password", { resetToken: token, newPassword: "Yeni-Parol-12345" })).status).toBe(200);
      expect((await anon.post("/api/auth/reset-password", { resetToken: token, newPassword: "Oğru-Parol-12345" })).status).toBe(401);
      expect((await login("sifirla@test.local", "Yeni-Parol-12345")).res.status).toBe(200);
    });

    it("tənzimləmə dəyişikliyi /api/site-da dərhal görünür (oxu keşi təmizlənir)", async () => {
      const anon = client(api.base);
      await anon.get("/api/site"); // keşi doldur
      const { c } = await login("dev@test.local");
      expect((await c.put("/api/admin/settings", { marquee: { az: "KEŞ SINAĞI" } })).status).toBe(200);
      const site = await anon.get("/api/site?lang=az");
      expect(site.data.data.settings.marquee).toBe("KEŞ SINAĞI");
    });

    it("test balı verilən sual sayına bölünür, cavablananlara yox", async () => {
      const { Quiz } = await import("#models");
      const question = (n) => ({
        text: { az: `Sual ${n}` },
        options: [{ text: { az: "Düz" } }, { text: { az: "Səhv" } }],
        correctIndex: 0,
      });
      const quiz = await Quiz.create({
        slug: "inteqrasiya-bal", title: { az: "Bal testi" }, isActive: true,
        questions: [1, 2, 3, 4].map(question),
      });
      const q0 = quiz.questions[0];
      const res = await client(api.base).post("/api/quizzes/inteqrasiya-bal/submit", {
        answers: [{ questionId: String(q0._id), optionId: String(q0.options[0]._id) }],
      });
      expect(res.status).toBe(200);
      expect(res.data.data).toMatchObject({ score: 1, total: 4, percent: 25 });
    });
  });

  describe("təhlükəsizlik başlıqları", () => {
    it("yad origin CORS almır, /api/posts yoxdur", async () => {
      const res = await client(api.base).get("/api/site", { headers: { Origin: "https://evil.example" } });
      expect(res.headers.get("access-control-allow-origin")).toBeNull();
      expect((await client(api.base).get("/api/posts")).status).toBe(404);
    });
  });
});
