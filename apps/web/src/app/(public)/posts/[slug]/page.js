import { notFound } from 'next/navigation'

import ArticleContent from '@/components/ArticleContent'
import { buildMetadata } from '@/lib/seo'
import { API_URL } from '@/lib/variables'

// The editor styles are shared between the admin editor and this public render.
import '@/styles/editor-content.css'

/**
 * Fetch a single published post by slug from the API.
 * Returns the post object or null (404 / network error).
 */
async function fetchPostBySlug(slug) {
  try {
    const res = await fetch(`${API_URL}/posts/slug/${encodeURIComponent(slug)}`, {
      // Always render the latest content; drop this for ISR if desired.
      cache: 'no-store',
    })
    if (!res.ok) return null
    const body = await res.json()
    return body?.data?.post || null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const post = await fetchPostBySlug(slug)

  if (!post) {
    return buildMetadata({ title: 'Post not found', noindex: true })
  }

  return buildMetadata({
    title: post.title,
    description: post.excerpt || undefined,
    path: `/posts/${slug}`,
  })
}

export default async function PostViewPage({ params }) {
  const { slug } = await params
  const post = await fetchPostBySlug(slug)

  if (!post) notFound()

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-3 text-lg text-gray-500">{post.excerpt}</p>
        )}
      </header>

      <ArticleContent html={post.content} className="ProseMirror news-content" />
    </article>
  )
}
