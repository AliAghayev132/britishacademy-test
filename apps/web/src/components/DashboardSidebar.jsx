'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react'

import { logout } from '@/store/slices/authSlice'
import { useLogoutMutation } from '@/store/api'

// Generic dashboard navigation. Add resources here as the app grows.
const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { name: 'Posts', href: '/dashboard/posts', icon: FileText },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
]

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
  const [logoutApi] = useLogoutMutation()

  const isActive = (item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)

  const currentTitle =
    [...navItems]
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
      <motion.aside
        className="bg-white border-r border-gray-100 flex flex-col relative shadow-sm"
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 76 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
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
            className="flex items-center gap-2 overflow-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-500 text-white flex items-center justify-center font-bold shrink-0">
              S
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  className="text-lg font-semibold text-gray-900 whitespace-nowrap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Starter
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-hidden">
          {navItems.map((item) => {
            const active = isActive(item)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  active
                    ? 'bg-cyan-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      className="text-sm font-medium whitespace-nowrap"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  className="text-sm font-medium whitespace-nowrap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

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
            <div className="w-9 h-9 rounded-xl bg-cyan-500 overflow-hidden flex items-center justify-center text-white text-sm font-medium">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
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
