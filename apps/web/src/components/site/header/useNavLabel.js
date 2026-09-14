"use client";

// Lib
import { useT } from "@/lib";

// Standart nav bəndləri üçün tərcümə açarı (menyu EN/RU boş olsa belə tərcümə olsun).
const NAV_KEY_BY_HREF = {
  "/": "common.home",
  "/kurslar": "common.courses",
  "/muellimler": "common.teachers",
  "/filiallar": "page.branches.title",
  "/bloq": "home.blog.title",
  "/elaqe": "footer.link.contact",
  "/haqqimizda": "about.eyebrow",
  "/telebelerimiz": "page.students.title",
  "/xaricde-tehsil": "home.abroad.title",
};
function navKey(item) {
  if (item.variant === "mega") return "nav.services";
  if (item.variant === "destinations") return "home.abroad.title";
  return NAV_KEY_BY_HREF[item.href] || null;
}
/** Nav bəndinin göstəriləcək adı: tanınan standart bənd → t(); əks halda DB label. */
export default function useNavLabel(item) {
  const t = useT();
  const k = navKey(item);
  return k ? t(k) : item.label;
}
