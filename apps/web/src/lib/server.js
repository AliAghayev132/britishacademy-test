// @/lib/server — avtomatik yaradılmış barrel (bax scratchpad codemod).
// Qovluqdan KƏNARDAKI fayllar buradan import edir; qovluğun içindəkilər
// bir-birini birbaşa import edir (dövri asılılıq olmasın).

export { apiGet, apiGetStatus, isMissing } from "./api";
export {
  DEFAULT_DESCRIPTION,
  DEFAULT_IMAGE,
  DEFAULT_TITLE,
  SITE_NAME,
  SITE_URL,
  absUrl,
  buildMetadata,
  defaultsFor,
  getSiteSettings,
  metaFromApi,
  resolveMetadata,
} from "./seo";

// I18n
export { getLocale, getT } from "./i18n/serverT";
