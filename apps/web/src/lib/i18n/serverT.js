// Server komponentlər üçün tərcümə: getT() → t("key") funksiyası (cari dil).
import { headers } from "next/headers";
import { t as translate } from "./strings";

export async function getLocale() {
  try {
    return (await headers()).get("x-lang") || "az";
  } catch {
    return "az";
  }
}

export async function getT() {
  const locale = await getLocale();
  return (key) => translate(locale, key);
}
