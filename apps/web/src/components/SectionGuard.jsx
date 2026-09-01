"use client";

// React
import { useEffect, useState } from "react";
// Next
import { usePathname } from "next/navigation";
// Data
import { useSelector } from "react-redux";
// Icons
import { ShieldAlert } from "lucide-react";
// Local
import { canSee, sectionForPath } from "@/lib/permissions";

/**
 * Bölmə səviyyəsində route mühafizəsi.
 *
 * Sidebar-da gizlətmək kifayət deyildi: linki bilən istifadəçi ünvanı
 * birbaşa yaza bilirdi və səhifə açılırdı (sorğular 403 alsa da, boş cədvəl
 * və düymələr görünürdü).
 *
 * ƏSAS QORUMA SERVERDƏDİR (requireSection) — bu, yalnız istifadəçiyə aydın
 * mesaj göstərir. Client kodu dəyişdirilə bilər, ona görə buna təhlükəsizlik
 * kimi güvənmirik.
 *
 * Mount-dan əvvəl heç nə bloklanmır: `user` localStorage-dan gəlir və SSR-də
 * mövcud olmur — əks halda hər səhifə bir an «icazə yoxdur» göstərərdi.
 */
export function SectionGuard({ children }) {
  const pathname = usePathname();
  const { user } = useSelector((state) => state.auth);

  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- mount qapısı: SSR-də user yoxdur, hidratasiya uyğun qalmalıdır
  useEffect(() => setMounted(true), []);

  if (!mounted) return children;

  const section = sectionForPath(pathname);
  if (!section || canSee(user, section)) return children;

  return (
    <div className="grid min-h-[60vh] place-items-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="text-lg font-bold text-gray-900">Bu bölməyə icazəniz yoxdur</h1>
        <p className="mt-2 text-sm text-gray-600">
          Giriş hüququ super admin tərəfindən verilir. Sizə bu bölmə lazımdırsa
          onunla əlaqə saxlayın.
        </p>
      </div>
    </div>
  );
}
