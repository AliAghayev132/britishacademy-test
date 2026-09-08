import { describe, it, expect } from "vitest";
import fs from "node:fs";

/**
 * GTM ID-si `codeInjection` blokundadır — `seo`-da DEYİL.
 *
 * SƏBƏB SƏLAHİYYƏTDİR: GTM konteyneri sayta İXTİYARİ JavaScript yükləyir,
 * yəni `codeInjection` qədər həssasdır. `codeInjection` yalnız `admin` rolu
 * üçün açıqdır (ADMIN_ONLY_SETTING_FIELDS), `seo` isə `editor` üçün də.
 * `seo`-da saxlasaydıq, məzmun redaktoru saytı öz konteynerinə bağlaya və
 * beləliklə ixtiyari skript işlədə bilərdi.
 */

const model = fs.readFileSync("models/siteSetting.model.js", "utf8");
const controller = fs.readFileSync("controllers/adminController.js", "utf8");

/** `codeInjection: { … }` blokunun mətni. */
const codeBlock = (model.match(/codeInjection:\s*\{[\s\S]*?\n {4}\}/) || [""])[0];
const seoBlock = (model.match(/seo:\s*\{[\s\S]*?\n {4}\}/) || [""])[0];

describe("GTM tənzimləməsinin yeri", () => {
  it("`gtmId` sxemdədir", () => {
    expect(model).toMatch(/gtmId:\s*\{\s*type:\s*String/);
  });

  it("`codeInjection` blokundadır", () => {
    expect(codeBlock, "codeInjection bloku oxunmadı").toBeTruthy();
    expect(codeBlock).toMatch(/gtmId/);
  });

  it("`seo` blokunda DEYİL", () => {
    // Orada olsaydı editor rolu onu dəyişə bilərdi.
    expect(seoBlock).not.toMatch(/gtmId/);
  });

  it("`codeInjection` yalnız admin üçündür", () => {
    // Qorumanın özü — `gtmId`-nin bu blokda olmasının bütün mənası budur.
    const list = (controller.match(/ADMIN_ONLY_SETTING_FIELDS = \[[\s\S]*?\]/) || [""])[0];
    expect(list).toMatch(/"codeInjection"/);
  });

  it("defolt boşdur", () => {
    // Boş = GTM ümumiyyətlə yüklənmir. Yeni quraşdırmada təsadüfən kiminsə
    // konteynerinə bağlanmamalıdır.
    const line = (codeBlock.match(/gtmId:\s*\{[^}]*\}/) || [""])[0];
    expect(line).toMatch(/default:\s*""/);
  });
});
