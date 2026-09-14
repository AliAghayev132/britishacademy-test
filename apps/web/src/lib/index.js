// @/lib — avtomatik yaradılmış barrel (bax scratchpad codemod).
// Qovluqdan KƏNARDAKI fayllar buradan import edir; qovluğun içindəkilər
// bir-birini birbaşa import edir (dövri asılılıq olmasın).

export { NAV_BOTTOM, NAV_GROUPS, NAV_TOP, matchNavItem, searchNav } from "./adminNav";
export {
  ADMIN_RESOURCES,
  ORDERABLE,
  RESOURCE_FILTERS,
  field,
  isImagePath,
  pickAz,
  resourceLabel,
  thumbOf,
} from "./adminResources";
export { FormDirtyContext, useMarkDirty } from "./formDirty";
export {
  DEFAULT_NEWS_IMAGE,
  PLACEHOLDER_IMAGE,
  getImageUrl,
  getImageUrlWithFallback,
  isValidImageUrl,
} from "./getImageUrl";
export { gtmIdOf } from "./gtm";
export { DEFAULT_ORDER, HOME_SECTIONS, resolveSections, sectionEnabled } from "./homeSections";
export { IMAGE_SPECS, specSummary } from "./imageSpecs";
export { ldJson } from "./jsonLd";
export { LEGACY_REDIRECTS, legacyTarget } from "./legacyRoutes";
export {
  ROLE_LABELS,
  ROLE_RANK,
  SECTIONS,
  SEES_EVERYTHING,
  canAssignRole,
  canSee,
  sectionForPath,
} from "./permissions";
export {
  LOGO_MAX,
  LOGO_SAFE,
  QR_DEFAULTS,
  buildMatrix,
  downloadBlob,
  drawQr,
  escapeXml,
  fetchAsDataUrl,
  loadImage,
  maxLogoScale,
  planQr,
  renderSvg,
  safeColor,
  svgToDataUrl,
} from "./qr";
export { parseLines, parseSpreadsheet } from "./recipientParser";
export { safeRedirect } from "./safeRedirect";
export { redirectToLogin, refreshSession } from "./session";
export { isSfxOn, playSfx, setSfxOn, subscribeSfx, unlockSfx } from "./sfx";
export {
  getSid,
  pushDataLayer,
  thankYouPath,
  trackLeadSuccess,
  trackModalOpen,
  trackVisit,
} from "./track";
export {
  uploadDocumentForEditor,
  uploadImageForEditor,
  uploadVideoForEditor,
} from "./uploadDocumentForEditor";
export { uploadWithProgress } from "./uploadWithProgress";
export { withUtm } from "./utm";
export { API_ORIGIN, API_URL, IMAGE_URL, SITE_URL, default as variables } from "./variables";

// I18n
export { formatDate } from "./i18n/date";
export { LocaleContext, useLocale } from "./i18n/localeContext";
export {
  LOCALES,
  ROUTE_SLUGS,
  buildPath,
  canonicalPath,
  localeOfPath,
  localizePath,
  splitLocale,
  stripLocale,
  withLocale,
} from "./i18n/routes";
export { STRINGS, t } from "./i18n/strings";
export { useT } from "./i18n/useT";
