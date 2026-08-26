/** @type {import('next').NextConfig} */
const nextConfig = {
  // Do not advertise the framework in the response headers.
  poweredByHeader: false,

  // jsdom (isomorphic-dompurify vasitəsilə gəlir — bloq/səhifə HTML-ini
  // təmizləmək üçün) öz aktivlərini __dirname-ə nisbətən oxuyur, məsələn
  // browser/default-stylesheet.css. Webpack onu paketləyəndə həmin nisbi yol
  // sınır və build "ENOENT ... browser/default-stylesheet.css" ilə dayanır.
  //
  // Server paketi kimi xaricdə saxlayanda Next onu paketləmir — Node adi
  // require ilə yükləyir və fayl yolları düzgün qalır.
  serverExternalPackages: ['jsdom', 'isomorphic-dompurify'],

  // Fail-safe: keep React strict mode on for better warnings in development.
  reactStrictMode: true,

  images: {
    // Placeholder remote pattern. Tighten `hostname` to your real asset/CDN
    // host(s) before going to production (e.g. images.example.com).
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Basic security headers applied to every route. Extend as needed
  // (e.g. a strict Content-Security-Policy tuned to your app).
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
