import { describe, it, expect } from "vitest";
import fs from "node:fs";

/**
 * AUDİT — üçüncü paket (web): #18 #21 #22 #24 #28 #42 #55.
 */

const read = (f) => fs.readFileSync(f, "utf8");

describe("#18 / #42 istifadə olunmayan API-lər", () => {
  it("postApi və köhnə WhatsApp toplu göndəriş endpoint-ləri yoxdur", () => {
    expect(fs.existsSync("src/store/api/postApi.js")).toBe(false);
    expect(read("src/store/api/index.js")).not.toMatch(/postApi/);
    expect(read("src/store/api/adminApi.js")).not.toMatch(/whatsapp\/bulk/);
  });
});

describe("#21 socket klienti", () => {
  it("server bağlantını kəsəndə sessiyanı yeniləyib yenidən qoşulur; otaq köməkçiləri yoxdur", () => {
    const src = read("src/store/context/SocketContext.jsx");
    expect(src).toMatch(/reason !== 'io server disconnect'/);
    expect(src).not.toMatch(/joinRoom|sendMessage/);
  });
});

describe("#22 qısa link IP-si", () => {
  it("X-Forwarded-For olduğu kimi ötürülmür, nginx-in qoyduğu IP x-client-ip ilə gedir", () => {
    const src = read("src/app/r/[code]/route.js");
    expect(src).toMatch(/"x-client-ip": h\.get\("x-real-ip"\)/);
    expect(src).not.toMatch(/"x-forwarded-for":/);
  });
});

describe("#24 istifadəçilər səhifəsi", () => {
  it("yüksək/bərabər rütbəli hesabda əməliyyat düymələri göstərilmir", () => {
    expect(read("src/app/(protected)/dashboard/istifadeciler/page.js")).toMatch(
      /!canAssignRole\(me\?\.role, u\.role\) \|\| String\(u\._id\) === String\(me\?\.id\)/,
    );
  });
});

describe("#28 keş və profil", () => {
  it("giriş və çıxışda RTK keşi təmizlənir, panel profili serverdən yeniləyir", () => {
    expect(read("src/app/(auth)/login/page.js")).toMatch(/dispatch\(baseApi\.util\.resetApiState\(\)\)\s*\n\s*dispatch\(setCredentials/);
    const sidebar = read("src/components/DashboardSidebar.jsx");
    expect(sidebar).toMatch(/dispatch\(logout\(\)\)[\s\S]{0,300}resetApiState\(\)/);
    expect(sidebar).toMatch(/useGetMeQuery\(\)/);
    expect(sidebar).toMatch(/dispatch\(updateUser\(freshUser\)\)/);
  });
});

describe("#55 bloq süzgəci", () => {
  it("kateqoriya encode olunur, səhifə nömrəsi məhduddur", () => {
    const src = read("src/app/(public)/bloq/page.js");
    expect(src).toMatch(/&category=\$\{encodeURIComponent\(category\)\}/);
    expect(src).toMatch(/Math\.min\(Math\.max\(parseInt\(sp\?\.seh, 10\) \|\| 1, 1\), 500\)/);
    expect(src).not.toMatch(/kateqoriya=\$\{(category|c\.slug)\}/);
  });
});
