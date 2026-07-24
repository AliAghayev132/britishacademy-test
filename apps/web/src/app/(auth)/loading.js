import { PageLoader } from '@/components/ui'

// Route-level loading UI shown during navigation / streaming.
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <PageLoader />
    </div>
  )
}
