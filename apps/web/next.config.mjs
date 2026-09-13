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

  // Uzaq şəkil nümunəsi YOXDUR. Əvvəl hostname ulduzlu (hər host) nümunə idi — /_next/image
  // istənilən saytın şəklini bizim serverdə ölçüləndirirdi (CPU və trafik
  // sui-istifadəsi). next/image saytda istifadə olunmur; lazım olsa yalnız
  // öz yükləmə hostumuzu əlavə edin.

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
