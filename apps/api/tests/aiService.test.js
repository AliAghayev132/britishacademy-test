import { describe, it, expect, vi, afterEach } from "vitest";
import { aiChat, outputBudget } from "../services/AiService.js";
import { SiteSetting } from "#models";

/**
 * AI cavabının yarımçıq kəsilməsi.
 *
 * Canlıda: 1148 sözlük bloq yazısının ingiliscə tərcüməsi 758 sözdə, cümlənin
 * ortasında dayandı, server isə 200 qaytardı və mətn sahəyə yazıldı. İki səbəb:
 * sabit 1500 token limiti və `finish_reason: "length"`-in yoxlanmaması.
 */

describe("outputBudget", () => {
  it("qısa mətn üçün minimum saxlanılır", () => {
    expect(outputBudget("Salam")).toBe(1500);
  });

  it("uzun bloq yazısına kifayət qədər büdcə verir", () => {
    // Kəsilən yazı 10 971 simvol idi — köhnə 1500 limitindən xeyli çox lazımdır.
    expect(outputBudget("x".repeat(10971))).toBeGreaterThanOrEqual(6000);
  });

  it("yuxarı hədd keçilmir", () => {
    expect(outputBudget("x".repeat(200000))).toBe(16000);
  });

  it("obyekt (fields) də ölçülür", () => {
    expect(outputBudget({ content: "x".repeat(10000) })).toBeGreaterThan(1500);
  });
});

describe("aiChat — kəsilmiş cavab", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const mockReply = (choice) => {
    vi.spyOn(SiteSetting, "get").mockResolvedValue({ ai: { enabled: true, apiKey: "test", model: "m" } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [choice] }) }));
  };

  it("finish_reason=length uğur sayılmır", async () => {
    mockReply({ finish_reason: "length", message: { content: "<p>Yarımçıq" } });
    const res = await aiChat({ system: "s", user: "u" });
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/yarımçıq/);
  });

  it("normal bitən cavab qaytarılır", async () => {
    mockReply({ finish_reason: "stop", message: { content: " Tam mətn " } });
    const res = await aiChat({ system: "s", user: "u" });
    expect(res).toEqual({ ok: true, text: "Tam mətn" });
  });
});
