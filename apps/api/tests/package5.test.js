import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import fs from "node:fs";
import { EventEmitter } from "node:events";
import { config } from "#config";
import { purgeSiteCache, flushSiteCache } from "#services";
import { revalidateOnWrite } from "#middlewares";

/**
 * AUDİT — beşinci paket (API): #37 sayt keşi dərhal, #44 Node versiyası.
 */

describe("#37 admin yazmasından sonra sayt keşi", () => {
  const prev = { key: config.internalApiKey, url: config.webInternalUrl };
  let fetchMock;

  beforeEach(() => {
    config.internalApiKey = "sirr";
    config.webInternalUrl = "http://web.test";
    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    config.internalApiKey = prev.key;
    config.webInternalUrl = prev.url;
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("bir neçə yazma bir sorğuya birləşir, gizli açarla gedir", async () => {
    vi.useFakeTimers();
    purgeSiteCache();
    purgeSiteCache();
    purgeSiteCache();
    await vi.advanceTimersByTimeAsync(1600);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe("http://web.test/internal/revalidate");
    expect(opts).toMatchObject({ method: "POST", headers: { "x-internal-key": "sirr" } });
  });

  it("açar yoxdursa sorğu getmir; Next əlçatmazdırsa xəta atılmır", async () => {
    config.internalApiKey = "";
    purgeSiteCache();
    await flushSiteCache();
    expect(fetchMock).not.toHaveBeenCalled();

    config.internalApiKey = "sirr";
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    purgeSiteCache();
    await expect(flushSiteCache()).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  const run = (method, status) => {
    const res = new EventEmitter();
    res.statusCode = status;
    const next = vi.fn();
    revalidateOnWrite({ method }, res, next);
    res.emit("finish");
    return next;
  };

  it("yalnız UĞURLU yazma keşi təmizləyir", async () => {
    vi.useFakeTimers();
    expect(run("GET", 200)).toHaveBeenCalled();
    run("PUT", 403);
    run("DELETE", 500);
    await vi.advanceTimersByTimeAsync(1600);
    expect(fetchMock).not.toHaveBeenCalled();

    run("PUT", 200);
    await vi.advanceTimersByTimeAsync(1600);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("middleware admin router-dən əvvəl qoşulub", () => {
    const app = fs.readFileSync("app/routes.js", "utf8");
    expect(app.indexOf('app.use("/api/admin", revalidateOnWrite)')).toBeGreaterThan(-1);
    expect(app.indexOf('app.use("/api/admin", revalidateOnWrite)')).toBeLessThan(app.indexOf('app.use("/api/admin", AdminRouter)'));
  });
});

describe("#44 Node versiyası", () => {
  it(".nvmrc, engines və CI eyni mənbədən", () => {
    expect(fs.readFileSync(".nvmrc", "utf8").trim()).toBe("22");
    expect(JSON.parse(fs.readFileSync("package.json", "utf8")).engines.node).toBe(">=20.9");
    expect(fs.readFileSync(".github/workflows/ci.yml", "utf8")).toMatch(/node-version-file: \.nvmrc/);
    expect(fs.readFileSync(".github/workflows/deploy-server.yml", "utf8")).toMatch(/WANT_NODE=/);
  });
});
