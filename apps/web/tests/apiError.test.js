import { describe, it, expect } from "vitest";
import { apiErrorMessage } from "@/utils/apiError";

describe("apiErrorMessage", () => {
  it("server mesajını qaytarır", () => {
    expect(apiErrorMessage({ status: 409, data: { message: "Slug artıq var" } }, "x")).toBe("Slug artıq var");
  });

  it("validasiya siyahısını ingiliscə «Validation error» əvəzinə göstərir", () => {
    const err = { status: 400, data: { message: "Validation error", errors: ["Ad tələb olunur", "Slug yanlışdır"] } };
    expect(apiErrorMessage(err, "x")).toBe("Ad tələb olunur; Slug yanlışdır");
  });

  it("yükləmə köməkçilərinin Error-unu oxuyur", () => {
    expect(apiErrorMessage(new Error("Fayl çox böyükdür"), "x")).toBe("Fayl çox böyükdür");
  });

  it("şəbəkə xətasında və boş cavabda fallback", () => {
    expect(apiErrorMessage({ status: "FETCH_ERROR", error: "TypeError: Failed to fetch" }, "Qoşulmaq alınmadı")).toBe("Qoşulmaq alınmadı");
    expect(apiErrorMessage({ status: 500, data: { message: "  " } }, "Alınmadı")).toBe("Alınmadı");
    expect(apiErrorMessage(undefined)).toBe("Xəta baş verdi");
  });
});
