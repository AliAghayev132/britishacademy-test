"use client";

// next/link-in dil-agah variantı — daxili href-lərə cari dil prefiksi (/en, /ru)
// əlavə edir ki, naviqasiya zamanı dil qorunsun (SEO üçün ayrı URL).
import Link from "next/link";
import { useLocale, withLocale } from "./LocaleProvider";

export function LocaleLink({ href, ...rest }) {
  const locale = useLocale();
  return <Link href={withLocale(locale, href)} {...rest} />;
}

export default LocaleLink;
