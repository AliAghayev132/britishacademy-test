// Lib
import { ADMIN_RESOURCES } from "@/lib";

/**
 * Başlıqdakı səhifə adı.
 *
 * Generic resource sub-pages (/dashboard/resurslar/<resource>) aren't all in
 * the sidebar, so resolve their header title from the resource registry.
 */
export default function navTitle(pathname, flatNav) {
  const resourceMatch = pathname.match(/^\/dashboard\/resurslar\/([^/]+)/);
  return resourceMatch
    ? ADMIN_RESOURCES[resourceMatch[1]]?.name || "Resurs"
    : [...flatNav]
        .reverse()
        .find((item) =>
          item.exact ? pathname === item.href : pathname.startsWith(item.href)
        )?.name || "Dashboard";
}
