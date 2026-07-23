import Link from 'next/link'

// Rendered for unmatched routes (/404).
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-6xl font-bold text-cyan-500">404</p>
      <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="max-w-md text-sm text-gray-500">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-600"
      >
        Back to home
      </Link>
    </div>
  )
}
