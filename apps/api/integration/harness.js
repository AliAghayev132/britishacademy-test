import http from "node:http";

/**
 * İnteqrasiya test mühiti: test bazası + keçici portda API.
 *
 * TƏHLÜKƏSİZLİK: baza adında «test» olmayan URI rədd edilir — səhvən
 * işlək bazanı silməmək üçün (hər fayl bazanı təmizləyir).
 */
export const TEST_URI = process.env.MONGODB_URI_TEST || "";
export const enabled = /test/i.test(new URL(TEST_URI || "mongodb://x/none").pathname);

export async function startApi() {
  process.env.NODE_ENV = "test";
  process.env.BA_NO_AUTOSTART = "1";
  process.env.MONGODB_URI = TEST_URI;
  process.env.INTERNAL_API_KEY = "";
  process.env.SMTP_USER = "";

  const { configureApp } = await import("../app.js");
  const { mongoDBService } = await import("#services");
  const { mongoose } = await import("#lib");

  await mongoDBService.connect();
  await mongoose.connection.db.dropDatabase();
  // Unikal indekslər (e-poçt, slug) test başlamazdan hazır olsun.
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes().catch(() => {})));

  const server = http.createServer(configureApp());
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;

  const stop = async () => {
    server.closeAllConnections?.();
    await new Promise((r) => server.close(r));
    await mongoose.connection.db.dropDatabase().catch(() => {});
    await mongoDBService.disconnect();
  };
  return { base, stop };
}

/** Cookie-ləri saxlayan sadə HTTP müştəri (brauzer kimi). */
export function client(base) {
  // Brauzer kimi AD + YOL cütünə görə: server refresh cookie-ni /api/auth ilə
  // yazıb köhnə «/» nüsxəsini silir — yalnız ada görə saxlasaq yenisi də gedərdi.
  const store = new Map(); // "ad|yol" → { name, value, path }
  const matching = (name) =>
    [...store.values()].filter((c) => c.name === name).sort((a, b) => b.path.length - a.path.length);
  const jar = {
    names: () => [...new Set([...store.values()].map((c) => c.name))].sort(),
    get: (name) => matching(name)[0],
    has: (name) => matching(name).length > 0,
    delete: (name) => { for (const c of matching(name)) store.delete(`${c.name}|${c.path}`); },
  };
  const cookieFor = (url) =>
    [...store.values()]
      .filter((c) => new URL(url).pathname.startsWith(c.path))
      .sort((a, b) => b.path.length - a.path.length)
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

  const request = async (method, p, { body, headers = {} } = {}) => {
    const url = `${base}${p}`;
    const res = await fetch(url, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(cookieFor(url) ? { Cookie: cookieFor(url) } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    for (const raw of res.headers.getSetCookie()) {
      const [pair, ...attrs] = raw.split(";").map((s) => s.trim());
      const [name, value] = [pair.slice(0, pair.indexOf("=")), pair.slice(pair.indexOf("=") + 1)];
      const pathAttr = attrs.find((a) => a.toLowerCase().startsWith("path="));
      const expired = attrs.some((a) => /^expires=/i.test(a) && new Date(a.slice(8)) < new Date());
      const cookiePath = pathAttr ? pathAttr.slice(5) : "/";
      if (!value || expired) store.delete(`${name}|${cookiePath}`);
      else store.set(`${name}|${cookiePath}`, { name, value, path: cookiePath });
    }
    let data = null;
    try { data = await res.json(); } catch { /* boş cavab */ }
    return { status: res.status, data, headers: res.headers };
  };

  return {
    jar,
    get: (p, o) => request("GET", p, o),
    post: (p, body, o) => request("POST", p, { ...o, body }),
    put: (p, body, o) => request("PUT", p, { ...o, body }),
    patch: (p, body, o) => request("PATCH", p, { ...o, body }),
    del: (p, o) => request("DELETE", p, o),
  };
}

export async function createUser({ email, password = "Sinaq-Parol-12345", role = "developer", permissions = [], allowedBranches = [] }) {
  const { User } = await import("#models");
  const { HashService } = await import("#services");
  return User.create({
    firstName: "Sınaq",
    lastName: role,
    email,
    password: await HashService.hashPassword(password),
    role,
    status: "active",
    permissions,
    allowedBranches,
  });
}
