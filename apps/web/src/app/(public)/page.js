import Link from 'next/link'
import { ArrowRight, Boxes, ShieldCheck, Zap } from 'lucide-react'

import { JsonLd } from '@/components/JsonLd'
import { buildMetadata, SITE_NAME, SITE_URL, DEFAULT_DESCRIPTION } from '@/lib/seo'

// Static metadata for the home page (Server Component).
export const metadata = buildMetadata({ path: '/' })

const features = [
  {
    icon: Boxes,
    title: 'Batteries included',
    description:
      'Redux Toolkit + RTK Query, socket.io, Tailwind CSS and a full auth flow wired up out of the box.',
  },
  {
    icon: ShieldCheck,
    title: 'Auth & route guards',
    description:
      'Token refresh, localStorage persistence and cookie-mirrored middleware protection for the dashboard.',
  },
  {
    icon: Zap,
    title: 'App Router + SEO',
    description:
      'Metadata API, sitemap, robots and JSON-LD structured data helpers ready to customize.',
  },
]

export default function HomePage() {
  // Example structured data (schema.org WebSite).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
  }

  return (
    <div className="min-h-screen">
      <JsonLd data={jsonLd} />

      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-lg font-bold text-gray-900">{SITE_NAME}</span>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-600"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <span className="inline-flex items-center rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700">
          Next.js App Router template
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Ship your next fullstack app faster
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-gray-500">
          {DEFAULT_DESCRIPTION}
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-cyan-600"
          >
            Create an account
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 inline-flex rounded-lg bg-cyan-50 p-3 text-cyan-500">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-gray-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
