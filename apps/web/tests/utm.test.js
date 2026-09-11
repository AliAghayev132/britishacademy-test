import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { withUtm } from "@/lib/utm";

/**
 * QISA LİNK → UTM.
 * Əvvəl /r/<kod> hədəfə UTM-siz yönləndirirdi: GA ziyarəti kampaniyaya
 * bağlaya bilmirdi, «Konversiya» klikdən sonrakı müraciəti görmürdü.
 */

describe("withUtm", () => {
  it("saytdaxili hədəfə kod UTM kimi əlavə olunur", () => {
    expect(withUtm("/kurslar/ielts-kurslari", "ig-sentyabr")).toBe(
      "/kurslar/ielts-kurslari?utm_source=ig-sentyabr&utm_medium=qisa-link&utm_campaign=ig-sentyabr",
    );
  });

  it("mövcud parametrlər və #hissə qalır", () => {
    expect(withUtm("/kurslar?kat=dil#qiymet", "fb-1")).toBe(
      "/kurslar?kat=dil&utm_source=fb-1&utm_medium=qisa-link&utm_campaign=fb-1#qiymet",
    );
  });

  it("öz domenimizin tam ünvanı da işarələnir", () => {
    expect(withUtm("https://www.britishacademy.az/xaricde-tehsil", "tt")).toBe(
      "https://www.britishacademy.az/xaricde-tehsil?utm_source=tt&utm_medium=qisa-link&utm_campaign=tt",
    );
  });

  it("əl ilə yazılmış UTM-ə toxunulmur", () => {
    const t = "/kurslar?utm_source=instagram&utm_campaign=yay";
    expect(withUtm(t, "ig")).toBe(t);
  });

  it("xarici sayta toxunulmur", () => {
    expect(withUtm("https://wa.me/994551234567", "wa")).toBe("https://wa.me/994551234567");
    expect(withUtm("//evil.com/x", "a")).toBe("//evil.com/x");
  });

  it("marşrut yalnız TAPILAN linkə UTM qoşur", () => {
    // API tapılmayan kod üçün də target: "/" qaytarır — found yoxlanmalıdır.
    const src = fs.readFileSync("src/app/r/[code]/route.js", "utf8");
    expect(src).toMatch(/if \(json\?\.data\?\.found && json\.data\.target\) target = withUtm\(json\.data\.target, code\)/);
  });
});

describe("link hesabatı", () => {
  it("modalda açılır, cədvəlin altında yox", () => {
    const src = fs.readFileSync("src/app/(protected)/dashboard/linkler/page.js", "utf8");
    expect(src).toMatch(/<Modal[\s\S]*?<LinkStats id=\{openLink\._id\} \/>/);
    expect(src).not.toMatch(/\{openId && <LinkStats/);
  });
});
