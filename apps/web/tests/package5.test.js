import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";

/**
 * AUDİT — beşinci paket (web): #29 «yadda saxlanmayıb», #37 keş, #44 Node.
 */

const read = (f) => fs.readFileSync(f, "utf8");

describe("#37 /internal/revalidate", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.doUnmock("next/cache");
  });

  const load = async () => {
    const revalidatePath = vi.fn();
    vi.doMock("next/cache", () => ({ revalidatePath }));
    const { POST } = await import("@/app/internal/revalidate/route.js");
    const call = (key) => POST(new Request("http://x/internal/revalidate", { method: "POST", headers: key ? { "x-internal-key": key } : {} }));
    return { POST, call, revalidatePath };
  };

  it("düzgün açarla keşi DƏRHAL köhnəldir", async () => {
    vi.stubEnv("INTERNAL_API_KEY", "sirr-açar");
    const { call, revalidatePath } = await load();
    const res = await call("sirr-açar");
    expect(res.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("açarsız, səhv açarla və server açarı yoxdursa 404", async () => {
    vi.stubEnv("INTERNAL_API_KEY", "sirr-açar");
    const { call, revalidatePath } = await load();
    expect((await call()).status).toBe(404);
    expect((await call("sirr-açaR")).status).toBe(404);
    vi.stubEnv("INTERNAL_API_KEY", "");
    expect((await call("")).status).toBe(404);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("fetch-lərdə açıq etiket yoxdur (xətada ilişmə), proxy daxili marşruta toxunmur", () => {
    const api = read("src/lib/api.js");
    expect(api).not.toMatch(/tags:/);
    expect(read("src/proxy.js")).toMatch(/pathname\.startsWith\('\/internal\/'\)\) return NextResponse\.next\(\)/);
  });
});

describe("#29 «yadda saxlanmayıb» xəbərdarlığı", () => {
  it("xüsusi idarəetmələr formanı dəyişmiş kimi işarələyir", () => {
    const kit = read("src/app/(protected)/dashboard/_forms/kit.jsx");
    expect(kit).toMatch(/<FormDirtyContext\.Provider value=\{markDirty\}>/);
    // NativeSelect, Toggle, MultiSelectChips, AddButton, RemoveButton, DirtyButton
    expect(kit.split("const markDirty = useMarkDirty();").length - 1).toBe(6);
    const loc = read("src/app/(protected)/dashboard/_forms/Localized.jsx");
    expect(loc.split("markDirty();").length - 1).toBeGreaterThanOrEqual(3);
    expect(read("src/components/ui/FileUpload.jsx")).toMatch(/const markDirty = useMarkDirty\(\);/);
  });

  it("mətn seçib siçanı fonda buraxmaq pəncərəni bağlamır", () => {
    const kit = read("src/app/(protected)/dashboard/_forms/kit.jsx");
    expect(kit).toMatch(/onMouseDown=\{\(e\) => \{ downOnBackdrop\.current = e\.target === e\.currentTarget; \}\}/);
    expect(kit).toMatch(/if \(e\.target === e\.currentTarget && downOnBackdrop\.current\) requestClose\(\);/);
  });
});

describe("#44 Node versiyası", () => {
  it(".nvmrc, engines, CI; artıq npm lockfile yoxdur", () => {
    expect(read(".nvmrc").trim()).toBe("22");
    expect(JSON.parse(read("package.json")).engines.node).toBe(">=20.9");
    expect(read(".github/workflows/ci.yml")).not.toMatch(/node-version: 22/);
    expect(fs.existsSync("package-lock.json")).toBe(false);
  });
});
