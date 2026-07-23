import { DashboardSidebar } from '@/components/DashboardSidebar'

// The dashboard is private — keep it out of search indexes.
export const metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

// Server Component wrapper that renders the client sidebar shell around every
// protected page. Route protection itself is enforced by middleware.js.
export default function DashboardLayout({ children }) {
  return <DashboardSidebar>{children}</DashboardSidebar>
}
