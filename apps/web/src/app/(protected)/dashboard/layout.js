import { DashboardSidebar } from '@/components/DashboardSidebar'
import { SectionGuard } from '@/components/SectionGuard'
import { FeedbackHost } from '@/components/ui/feedback'

// The dashboard is private — keep it out of search indexes.
export const metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

// Server Component wrapper that renders the client sidebar shell around every
// protected page. Route protection itself is enforced by middleware.js.
export default function DashboardLayout({ children }) {
  return (
    <>
      {/* SectionGuard icazəsiz bölmələri bağlayır. Əsas qoruma serverdədir
          (requireSection); bu, istifadəçiyə boş səhifə əvəzinə aydın mesaj
          göstərir. */}
      <DashboardSidebar>
        <SectionGuard>{children}</SectionGuard>
      </DashboardSidebar>
      {/* Brand toast + confirm/alert host (custom, replaces SweetAlert) */}
      <FeedbackHost />
    </>
  )
}
