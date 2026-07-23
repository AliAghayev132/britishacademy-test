/**
 * Centralized URL / ENV configuration for the editor + public render module.
 *
 * All API, image and site URLs are resolved here from public env vars. Next.js
 * only inlines `NEXT_PUBLIC_*` variables into client code, and they are frozen
 * at BUILD time — re-run the build after changing them.
 *
 * NOTE: The RTK base query (see store/api/baseApi.js) reads the SAME
 * `NEXT_PUBLIC_API_URL` and appends `/api`. To keep both consistent whether the
 * env var points at the server root (`http://localhost:5000`) or already
 * includes `/api`, `API_URL` below normalizes to always end with `/api`.
 */

const stripTrailingSlash = (url) =>
  typeof url === 'string' && url.endsWith('/') ? url.slice(0, -1) : url

// Raw value from the environment (or a sensible localhost default).
const RAW_API_URL = stripTrailingSlash(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
)

/**
 * Backend REST API root, guaranteed to end with `/api`.
 * Editor upload handlers POST to `${API_URL}/media/upload-image` etc.
 */
export const API_URL = RAW_API_URL.endsWith('/api')
  ? RAW_API_URL
  : `${RAW_API_URL}/api`

/**
 * Image host root (e.g. https://cdn.example.com). Relative `/uploads/...`
 * paths returned by the server are appended to this base.
 */
export const IMAGE_URL = stripTrailingSlash(
  process.env.NEXT_PUBLIC_IMAGE_URL || 'http://localhost:5000'
)

/** Canonical site root (SEO metadata, sitemap, robots). */
export const SITE_URL = stripTrailingSlash(
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
)

const variables = { API_URL, IMAGE_URL, SITE_URL }
export default variables
