'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui'

// Global error boundary for the route segment. Must be a Client Component.
export default function Error({ error, reset }) {
  useEffect(() => {
    // Log to your monitoring service here.
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
      <p className="max-w-md text-sm text-gray-500">
        An unexpected error occurred. You can try again, or return to the home
        page.
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  )
}
