'use client'

// React
import { useEffect, useState } from 'react'

// Next
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

// Data
import { useSelector, useDispatch } from 'react-redux'

// Local
import { canSee } from '@/lib/permissions'

// UI / components

// Icons
import {
  FileText,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Inbox,
  GraduationCap,
  Users,
  Building2,
  CalendarClock,
  MessageSquareQuote,
  MessageCircle,
  Globe2,
  Boxes,
  Settings,
  Database,
  ShieldCheck,
  ScrollText,
  ChevronDown,
  BarChart3,
  Home,
  Tags,
  HelpCircle,
  Sparkles,
  Handshake,
  Menu as MenuIcon,
  Image as ImageIcon,
  FileStack,
Link2, ClipboardList, Rocket } from 'lucide-react'

// Utils
import { logout } from '@/store/slices/authSlice'
import { useLogoutMutation } from '@/store/api'
import { useAdminStatsQuery } from '@/store/api/adminApi'
import { ADMIN_RESOURCES } from '@/lib/adminResources'

// British Academy admin navigation. Resource pages use the generic browser
// at /dashboard/resurslar/<resource> (see resourceRegistry on the server).
// `section` icazə açarıdır — serverdəki adminSections ilə eyni.
// Profil hər kəsə açıqdır, ona görə onun bölməsi yoxdur.
/**
 * Naviqasiya QRUPLARA bölünüb.
 *
 * Əvvəl 16 element bir siyahıda idi və «Digər resurslar» adlı ümumi düymə
 * altında 8 bölmə gizlənirdi — istifadəçi nə olduğunu görmək üçün ora girib
 * axtarmalı olurdu. İndi hər bölmənin öz sətri var, oxşarlar isə açılan
 * qrupda toplanıb.
 *
 * `section` icazə açarıdır (serverdəki adminSections ilə eyni). Alt-resurslar
 * məntiqi valideynlərinin icazəsini paylaşır: kurs kateqoriyaları «courses»,
 * bloq kateqoriyaları «blog», qalanı isə «resources».
 */
const NAV_TOP = [
  { name: 'İdarə paneli', href: '/dashboard', icon: LayoutDashboard, exact: true, section: 'dashboard' },
  { name: 'Ana səhifə', href: '/dashboard/ana-sehife', icon: Home, section: 'home' },
]

const NAV_GROUPS = [
  // Müraciətlər ayrıca qrupdur: iki bənd var (ümumi və xaricdə təhsil) və
  // onların axını fərqlidir. Qrup ən yuxarıdadır — gündəlik ən çox açılan
  // bölmədir.
  {
    key: 'muracietler',
    label: 'Müraciətlər',
    icon: Inbox,
    items: [
      // `exact` vacibdir: alt bənd açılanda startsWith yoxlaması ikisini
      // birdən aktiv göstərərdi.
      { name: 'Bütün müraciətlər', href: '/dashboard/muracietler', icon: Inbox, exact: true, section: 'leads' },
      { name: 'Xaricdə təhsil', href: '/dashboard/muracietler/xaricde-tehsil', icon: Globe2, section: 'leads-abroad' },
    ],
  },
  {
    key: 'tedris',
    label: 'Tədris',
    icon: GraduationCap,
    items: [
      { name: 'Kurslar', href: '/dashboard/resurslar/courses', icon: GraduationCap, section: 'courses' },
      { name: 'Kurs kateqoriyaları', href: '/dashboard/resurslar/course-categories', icon: Tags, section: 'courses' },
      { name: 'Dərs qrafiki', href: '/dashboard/resurslar/course-groups', icon: CalendarClock, section: 'course-groups' },
      { name: 'Müəllimlər', href: '/dashboard/resurslar/teachers', icon: Users, section: 'teachers' },
      { name: 'Filiallar', href: '/dashboard/resurslar/branches', icon: Building2, section: 'branches' },
      { name: 'Testlər', href: '/dashboard/testler', icon: ClipboardList, section: 'quizzes' },
      { name: 'Test kateqoriyaları', href: '/dashboard/resurslar/quiz-categories', icon: Tags, section: 'quizzes' },
    ],
  },
  {
    key: 'mezmun',
    label: 'Məzmun',
    icon: FileText,
    items: [
      { name: 'Bloq yazıları', href: '/dashboard/resurslar/blog-posts', icon: FileText, section: 'blog' },
      { name: 'Bloq kateqoriyaları', href: '/dashboard/resurslar/blog-categories', icon: Tags, section: 'blog' },
      { name: 'Rəylər', href: '/dashboard/resurslar/testimonials', icon: MessageSquareQuote, section: 'testimonials' },
      { name: 'Xaricdə təhsil', href: '/dashboard/resurslar/destinations', icon: Globe2, section: 'destinations' },
        { name: 'Layihələr', href: '/dashboard/resurslar/projects', icon: Rocket, section: 'projects' },
      { name: 'Səhifələr', href: '/dashboard/resurslar/pages', icon: FileStack, section: 'resources' },
      { name: 'FAQ', href: '/dashboard/resurslar/faqs', icon: HelpCircle, section: 'resources' },
      { name: 'Üstünlüklər', href: '/dashboard/resurslar/advantages', icon: Sparkles, section: 'resources' },
      { name: 'Tərəfdaşlar', href: '/dashboard/resurslar/partners', icon: Handshake, section: 'resources' },
      { name: 'Menyu', href: '/dashboard/resurslar/menu-items', icon: MenuIcon, section: 'resources' },
      { name: 'Media', href: '/dashboard/resurslar/media', icon: ImageIcon, section: 'resources' },
    ],
  },
  {
    key: 'sistem',
    label: 'Sistem',
    icon: Settings,
    items: [
      { name: 'WhatsApp', href: '/dashboard/whatsapp', icon: MessageCircle, section: 'whatsapp' },
      { name: 'İstifadəçilər', href: '/dashboard/istifadeciler', icon: ShieldCheck, section: 'users' },
      { name: 'Statistika', href: '/dashboard/statistika', icon: BarChart3, section: 'stats' },
      { name: 'İzlənilən linklər', href: '/dashboard/linkler', icon: Link2, section: 'links' },
      { name: 'Loglar', href: '/dashboard/loglar', icon: ScrollText, section: 'logs' },
      { name: 'Tənzimləmələr', href: '/dashboard/tenzimlemeler', icon: Settings, section: 'settings' },
      { name: 'Developer', href: '/dashboard/developer', icon: Database, section: 'developer' },
    ],
  },
]

const NAV_BOTTOM = [{ name: 'Profil', href: '/dashboard/profile', icon: User }]

/**
 * Sidebar-ın tək naviqasiya sətri.
 *
 * Əvvəl bu markup nav dövrünün içində idi; qruplar əlavə olunanda üç yerdə
 * təkrarlanmalı olardı, ona görə ayrıca komponentə çıxarıldı.
 *
 * `open` — sidebar açıqdırmı (yığılanda yalnız ikon görünür).
 */
function NavLink({ item, active, open, badge = 0 }) {
  return (
    <Link
      href={item.href}
      title={!open ? item.name : undefined}
      style={active ? { background: '#00157A', color: '#fff' } : undefined}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
        active ? 'shadow-md shadow-[#00157A]/25' : 'text-gray-700 hover:bg-[#00157A] hover:text-white'
      }`}
    >
      <item.icon
        className="h-5 w-5 shrink-0 group-hover:text-white"
        style={active ? { color: '#fff' } : undefined}
      />
      <span
        className={`overflow-hidden whitespace-nowrap text-[15px] font-bold transition-all duration-200 group-hover:text-white ${
          open ? 'max-w-[170px] opacity-100' : 'max-w-0 opacity-0'
        }`}
        style={active ? { color: '#fff' } : undefined}
        aria-hidden={!open}
      >
        {item.name}
      </span>

      {/* Yeni müraciət sayı */}
      {badge > 0 &&
        (open ? (
          <span className="ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        ) : (
          <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
        ))}
    </Link>
  )
}

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
  // Store-a toxunmuruq — token dərhal əlçatan qalmalıdır, yoxsa ilk sorğular
  // Authorization başlığı olmadan gedər. Yalnız GÖSTƏRİLMƏSİNİ mount-dan
  // sonraya saxlayırıq: ilk render hər iki tərəfdə eyni (boş) olur.
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

  // Qruplar AÇIQ başlayır. Bağlı başlasaydı, silinən «Digər resurslar»
  // düyməsinin problemini təkrarlayardıq: bölmələr yenə gizli qalardı.
  // İstifadəçi bağlayanda seçim localStorage-da saxlanılır ki, hər səhifə
  // keçidində açılmasın.
  const [openGroups, setOpenGroups] = useState(() =>
    Object.fromEntries(NAV_GROUPS.map((g) => [g.key, true])),
  )

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ba-nav-groups') || 'null')
      if (saved && typeof saved === 'object') {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage yalnız brauzerdə oxunur; SSR-də defolt (hamısı açıq) qalmalıdır
        setOpenGroups((prev) => ({ ...prev, ...saved }))
      }
    } catch {
      // Pozulmuş dəyər — defolt saxlanılır.
    }
  }, [])

  const toggleGroup = (key) =>
    setOpenGroups((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      try {
        localStorage.setItem('ba-nav-groups', JSON.stringify(next))
      } catch {
        // Quota/privat rejim — yaddaş olmadan da işləməlidir.
      }
      return next
    })
  const [logoutApi] = useLogoutMutation()

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

  // Generic resource sub-pages (/dashboard/resurslar/<resource>) aren't all in
  // the sidebar, so resolve their header title from the resource registry.
  const resourceMatch = pathname.match(/^\/dashboard\/resurslar\/([^/]+)/)
  const currentTitle = resourceMatch
    ? ADMIN_RESOURCES[resourceMatch[1]]?.name || 'Resurs'
    : [...flatNav]
        .reverse()
        .find((item) =>
          item.exact ? pathname === item.href : pathname.startsWith(item.href)
        )?.name || 'Dashboard'

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap()
    } catch {
      // Ignore network errors; we clear the local session regardless.
    }
    dispatch(logout())
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      {/* En dəyişikliyi CSS keçidi ilə — framer-motion əvəzinə.
          overflow-hidden yığılanda mətnlərin kənara daşmasının qarşısını alır. */}
      <aside
        className="bg-white border-r border-gray-100 flex flex-col relative shadow-sm overflow-hidden transition-[width] duration-200 ease-in-out"
        style={{ width: sidebarOpen ? 260 : 76 }}
      >
        {/* Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors shadow-sm z-10"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Brand */}
        <div className="h-16 flex items-center px-4 border-b border-gray-100">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 overflow-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-[#00157A] text-white flex items-center justify-center shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/shield.png" alt="British Academy" className="w-6 h-6 object-contain" />
            </div>
            <span
              className={`text-[15px] font-bold text-[#00157A] whitespace-nowrap leading-tight transition-opacity duration-200 ${
                sidebarOpen ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ fontFamily: "'Poppins', sans-serif" }}
              aria-hidden={!sidebarOpen}
            >
              British Academy
            </span>
          </Link>
        </div>

        {/* Navigation — qruplu */}
        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-3">
          {topNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item)}
              open={sidebarOpen}
              badge={badgeOf(item)}
            />
          ))}

          {groups.map((g) => {
            const hasActive = g.items.some((i) => isActive(i))
            // Sidebar yığılanda başlıqlar yer tutmasın — elementlər düz sıralanır.
            if (!sidebarOpen) {
              return g.items.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(item)} open={false} badge={badgeOf(item)} />
              ))
            }
            const expanded = openGroups[g.key] || hasActive
            return (
              <div key={g.key} className="pt-2">
                <button
                  type="button"
                  onClick={() => toggleGroup(g.key)}
                  aria-expanded={expanded}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 transition hover:text-gray-600"
                >
                  <g.icon className="h-3.5 w-3.5" />
                  <span>{g.label}</span>
                    {/* Qrup bağlı olanda yeni müraciət tamamilə görünməz
                        qalardı — say başlıqda da göstərilir. */}
                    {!expanded && g.items.some((it) => badgeOf(it) > 0) && (
                      <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {g.items.reduce((sum, it) => sum + badgeOf(it), 0)}
                      </span>
                    )}
                  <ChevronDown
                    className={`ml-auto h-3.5 w-3.5 transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`}
                  />
                </button>
                {expanded && (
                  <div className="mt-1 space-y-1">
                    {g.items.map((item) => (
                      <NavLink key={item.href} item={item} active={isActive(item)} open badge={badgeOf(item)} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {bottomNav.length > 0 && (
            <div className="mt-2 border-t border-gray-100 pt-2">
              {bottomNav.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(item)} open={sidebarOpen} badge={badgeOf(item)} />
              ))}
            </div>
          )}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? 'Çıxış' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-semibold"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span
              className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-200 ${
                sidebarOpen ? 'opacity-100 max-w-[120px]' : 'opacity-0 max-w-0'
              }`}
              aria-hidden={!sidebarOpen}
            >
              Çıxış
            </span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-gray-800">
            {currentTitle}
          </h2>
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-[#00157A] overflow-hidden flex items-center justify-center text-white text-sm font-semibold">
              {shownUser?.firstName?.[0]}
              {shownUser?.lastName?.[0]}
            </div>
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {shownUser?.firstName} {shownUser?.lastName}
              </p>
              <p className="text-xs text-gray-500">{shownUser?.email}</p>
            </div>
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

export default DashboardSidebar
