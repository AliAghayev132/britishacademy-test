import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { buildRecipientTemplate, parseSpreadsheet, TEMPLATE_HEADERS } from "@/lib/recipientParser";

/** Workbook → parseSpreadsheet-in gözlədiyi File-a bənzər obyekt. */
const asFile = (wb) => {
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return { arrayBuffer: async () => buf };
};

describe("toplu göndəriş Excel şablonu", () => {
  it("birinci vərəq «Alıcılar», başlıqlar parserin tanıdığı adlardır", async () => {
    const wb = buildRecipientTemplate();
    expect(wb.SheetNames).toEqual(["Alıcılar", "Təlimat"]);
    const { rows, headerDetected } = await parseSpreadsheet(asFile(wb));
    expect(headerDetected).toBe(true);
    // Boş şablonda heç bir alıcı yoxdur — nümunə nömrələrə mesaj getmir.
    expect(rows).toEqual([]);
    expect(TEMPLATE_HEADERS).toEqual(["Ad", "Nömrə", "E-poçt"]);
  });

  it("nömrə sütunu mətn formatındadır (baştakı 0 itmir)", () => {
    const ws = buildRecipientTemplate().Sheets["Alıcılar"];
    expect(ws.B2.z).toBe("@");
    expect(ws.C2.z).toBe("@");
  });

  it("doldurulmuş şablon düzgün oxunur", async () => {
    const wb = buildRecipientTemplate();
    const ws = wb.Sheets["Alıcılar"];
    XLSX.utils.sheet_add_aoa(ws, [["Aynur", "0501234567", "aynur@mail.com"], ["Elvin", "0552124151", ""]], { origin: "A2" });
    const { rows } = await parseSpreadsheet(asFile(wb));
    expect(rows).toEqual([
      { name: "Aynur", phone: "0501234567", email: "aynur@mail.com" },
      { name: "Elvin", phone: "0552124151", email: "" },
    ]);
  });
});
