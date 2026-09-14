'use client'

// React
import { useEffect, useState } from 'react'

// Next
import { usePathname, useRouter } from 'next/navigation'

// Libraries
import { useSelector, useDispatch } from 'react-redux'

// Store
import {
  logout,
  updateUser,
  baseApi,
  useLogoutMutation,
  useGetMeQuery,
  useAdminStatsQuery,
} from '@/store'

// Lib
import { canSee, NAV_TOP, NAV_GROUPS, NAV_BOTTOM } from '@/lib'

// Local
import DashboardHeader from './sidebar/DashboardHeader'
import SidebarBrand from './sidebar/SidebarBrand'
import SidebarLogout from './sidebar/SidebarLogout'
import SidebarNav from './sidebar/SidebarNav'
import SidebarSearchBox from './sidebar/SidebarSearchBox'
import SidebarSearchResults from './sidebar/SidebarSearchResults'
import navTitle from './sidebar/navTitle'
import useSidebarGroups from './sidebar/useSidebarGroups'
import useSidebarSearch from './sidebar/useSidebarSearch'

/**
 * The full dashboard shell: collapsible sidebar + top header + main content.
 * It wraps the protected route children (passed from the dashboard layout).
 */
export const DashboardSidebar = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)

  // authSlice ilkin vəziyyəti modul yüklənəndə localStorage-dan oxunur:
  // serverdə `user` null, brauzerdə isə dolu olur. Onu birinci render-də
  // göstərmək server/klient HTML fərqi yaradırdı (React #418 — hidratasiya
  // uğursuzluğu, bütün ağac yenidən qurulur).
  //
  // Store-a toxunmuruq — profil (icazələr, socket) dərhal əlçatan qalmalıdır.
  // Yalnız GÖSTƏRİLMƏSİNİ mount-dan sonraya saxlayırıq: ilk render hər iki
  // tərəfdə eyni (boş) olur.
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- mount qapısı: localStorage-dan gələn user SSR-də yoxdur, ilk render uyğun olmalıdır (React #418)
  useEffect(() => setMounted(true), [])
  const shownUser = mounted ? user : null

  // Sidebar yalnız icazə verilmiş bölmələri göstərir. Bu, YALNIZ görünüşdür —
  // əsl qoruma serverdədir (requireSection), çünki client kodu dəyişdirilə bilər.
  //
  // Mount-dan əvvəl user null olduğu üçün siyahı boş qalardı və hidratasiyadan
  // sonra sıçrayardı; ona görə mount olana qədər tam siyahı göstərilir və
  // filtrləmə klient tərəfdə tətbiq olunur.
  const allow = (i) => !mounted || !i.section || canSee(user, i.section)

  const topNav = NAV_TOP.filter(allow)
  const bottomNav = NAV_BOTTOM.filter(allow)
  // Boş qalan qrup ümumiyyətlə göstərilmir.
  const groups = NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter(allow) }))
    .filter((g) => g.items.length)

  // Başlıq axtarışı üçün düz siyahı.
  const flatNav = [...topNav, ...groups.flatMap((g) => g.items), ...bottomNav]

  const search = useSidebarSearch({ pathname, router, groups, topNav, bottomNav, openSidebar: setSidebarOpen })
  const [openGroups, toggleGroup] = useSidebarGroups()
  const [logoutApi] = useLogoutMutation()

  // Panel açılanda profil serverdən yenilənir. Başqa admin icazələri
  // dəyişibsə, menyu yalnız profil səhifəsinə girəndə yox, dərhal
  // uyğunlaşır (audit #28).
  const { data: meData } = useGetMeQuery()
  const freshUser = meData?.data?.user
  useEffect(() => {
    if (freshUser) dispatch(updateUser(freshUser))
  }, [freshUser, dispatch])

  // Yeni (baxılmamış) müraciət sayı — sidebar-da qırmızı badge. Status
  // dəyişəndə adminLeadStatus "stats" tag-ını invalidate etdiyi üçün yenilənir.
  const { data: stats } = useAdminStatsQuery()
  const newLeads = stats?.data?.newLeads ?? 0

  // Yeni müraciət sayı yalnız «Bütün müraciətlər» bəndində göstərilir.
  // Əvvəl bu, NAV_TOP render dövrəsinə sabit yazılmışdı; bənd qrupa köçəndə
  // rozetka itmişdi.
  const badgeOf = (item) => (item.href === '/dashboard/muracietler' ? newLeads : 0)

  const isActive = (item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)

  const currentTitle = navTitle(pathname, flatNav)

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap()
    } catch {
      // Ignore network errors; we clear the local session regardless.
    }
    dispatch(logout())
    // RTK keşi təmizlənir: eyni tabda sonra daxil olan (məhdud) istifadəçi
    // əvvəlkinin müraciətlərini və statistikasını görməsin (audit #28).
    dispatch(baseApi.util.resetApiState())
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      {/* En dəyişikliyi CSS keçidi ilə — framer-motion əvəzinə.
          overflow-hidden yığılanda mətnlərin kənara daşmasının qarşısını alır.

          `sticky top-0 h-screen` — sidebar EKRANDA QALIR, öz daxili scroll-u
          olur. Əvvəl hündürlüyü açıq idi: uzun səhifədə (loglar, müraciətlər)
          sidebar məzmunla birlikdə uzanırdı, `nav`-ın `overflow-y-auto`-su
          isə heç vaxt işə düşmürdü — aşağı sürüşəndə naviqasiya yuxarıda
          qalıb gözdən itirdi. */}
      <aside
        className="bg-white border-r border-gray-100 flex flex-col relative shadow-sm overflow-hidden transition-[width] duration-200 ease-in-out sticky top-0 h-screen flex-none"
        style={{ width: sidebarOpen ? 260 : 76 }}
      >
        <SidebarBrand open={sidebarOpen} />

        <SidebarSearchBox
          open={sidebarOpen}
          inputRef={search.searchRef}
          query={search.query}
          onQuery={search.setQuery}
          onKeyDown={search.onSearchKey}
          onClear={search.closeSearch}
          onExpand={search.expandAndFocus}
        />

        {/* Axtarış nəticələri — sorğu varkən adi naviqasiyanı əvəz edir */}
        {search.searching && sidebarOpen ? (
          <SidebarSearchResults results={search.results} activeIdx={search.activeIdx} onHover={search.setCursor} />
        ) : (
          <SidebarNav
            topNav={topNav}
            groups={groups}
            bottomNav={bottomNav}
            open={sidebarOpen}
            openGroups={openGroups}
            onToggleGroup={toggleGroup}
            isActive={isActive}
            badgeOf={badgeOf}
          />
        )}

        <SidebarLogout open={sidebarOpen} onLogout={handleLogout} />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          title={currentTitle}
          user={shownUser}
        />

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

export default DashboardSidebar
