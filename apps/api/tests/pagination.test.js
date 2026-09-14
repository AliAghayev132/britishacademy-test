import { describe, it, expect, vi } from "vitest";
import { pageInfo, parsePage, ok, fail } from "#utils";

describe("parsePage / pageInfo", () => {
  it("defolt və sərhədlər", () => {
    expect(parsePage({})).toEqual({ page: 1, limit: 20, skip: 0 });
    expect(parsePage({ page: "3", limit: "10" })).toEqual({ page: 3, limit: 10, skip: 20 });
    expect(parsePage({ page: "-2", limit: "0" })).toEqual({ page: 1, limit: 20, skip: 0 });
    expect(parsePage({ limit: "5000" }).limit).toBe(100);
    expect(parsePage({ limit: "abc" }, { defaultLimit: 9, maxLimit: 50 }).limit).toBe(9);
  });

  it("səhifə sayı yuxarı yuvarlanır", () => {
    expect(pageInfo({ page: 2, limit: 20 }, 41)).toEqual({ page: 2, limit: 20, total: 41, pages: 3 });
    expect(pageInfo({ page: 1, limit: 20 }, 0).pages).toBe(0);
  });
});

describe("ok / fail zərfi", () => {
  const mockRes = () => {
    const res = { json: vi.fn(() => res), status: vi.fn(() => res) };
    return res;
  };

  it("ok: 200-də status çağırılmır, message boşdursa yazılmır", () => {
    const res = mockRes();
    ok(res, { a: 1 });
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { a: 1 } });
  });

  it("ok: 201 və mesaj", () => {
    const res = mockRes();
    ok(res, { id: 1 }, "Yaradıldı", 201);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Yaradıldı", data: { id: 1 } });
  });

  it("fail: status, mesaj və errors", () => {
    const res = mockRes();
    fail(res, "Yanlış", 422, ["x"]);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Yanlış", errors: ["x"] });
  });
});

describe("SiteSetting oxu keşi", () => {
  it("saxlanışda və sorğu ilə yazıda təmizlənir", async () => {
    const { SiteSetting } = await import("#models");
    const hooks = SiteSetting.schema.s.hooks._posts;
    expect(hooks.get("save")?.length).toBeGreaterThan(0);
    for (const op of ["findOneAndUpdate", "updateOne", "deleteMany"]) {
      expect(hooks.get(op)?.length, op).toBeGreaterThan(0);
    }
    expect(typeof SiteSetting.getCached).toBe("function");
  });
});
