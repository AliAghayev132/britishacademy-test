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

// Raw value from the environment. BOŞ QALA BİLƏR — aşağıya bax.
const RAW_API_URL = stripTrailingSlash(process.env.NEXT_PUBLIC_API_URL || '')

/**
 * Backend REST API root, guaranteed to end with `/api`.
 * Editor upload handlers POST to `${API_URL}/media/upload-image` etc.
 *
 * DƏYİŞƏN BOŞDURSA NİSBİ YOL (`/api`) İŞLƏDİLİR.
 *
 * Niyə bu, mütləq ünvandan yaxşıdır: nginx `/api`-ni eyni domendə Express-ə
 * ötürür, ona görə nisbi yol həmişə səhifə ilə EYNİ sxem və host-a gedir.
 * Nəticədə:
 *   • domen dəyişəndə yenidən build lazım gəlmir (NEXT_PUBLIC_* build zamanı
 *     koda yazılır — istehsalatda bu, unudulan addım olub);
 *   • HTTPS səhifədən HTTP ünvana sorğu (mixed content) prinsipcə mümkün
 *     deyil. Əvvəl paketə `http://<ip>:30002` yazılmışdı və brauzer admin
 *     girişini bloklayırdı.
 * Dev mühitində client :3000, API :5000-dədir — orada dəyişən .env.development
 * ilə verilir və mütləq ünvan işlədilir.
 */
export const API_URL = !RAW_API_URL
  ? '/api'
  : RAW_API_URL.endsWith('/api')
    ? RAW_API_URL
    : `${RAW_API_URL}/api`

/**
 * Image host root (e.g. https://cdn.example.com). Relative `/uploads/...`
 * paths returned by the server are appended to this base.
 */
export const IMAGE_URL = stripTrailingSlash(
  // NEXT_PUBLIC_IMAGE_URL təyin olunmayıbsa API host-una düşürük — yüklənən
  // fayllar onsuz da orada saxlanılır (`app.use("/uploads", ...)`).
  //
  // Hər ikisi boşdursa NİSBİ qalır (boş sətir): şəkil ünvanı `/uploads/...`
  // olur və brauzer onu səhifə ilə eyni origin-də həll edir. nginx həmin yolu
  // Express-ə ötürür. API_URL-dəki eyni məntiq — səbəbi orada izah olunub.
  //
  // Əvvəl defolt sabit 'http://localhost:5000' idi: deploy-da bu dəyişən
  // qoyulmayanda BÜTÜN yüklənmiş şəkillər ziyarətçinin öz kompüterinə
  // (localhost:5000) işarə edirdi və heç nə görünmürdü.
  process.env.NEXT_PUBLIC_IMAGE_URL ||
    (RAW_API_URL.endsWith('/api') ? RAW_API_URL.slice(0, -4) : RAW_API_URL) ||
    ''
)

/** Canonical site root (SEO metadata, sitemap, robots). */
export const SITE_URL = stripTrailingSlash(
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
)

const variables = { API_URL, IMAGE_URL, SITE_URL }
export default variables
