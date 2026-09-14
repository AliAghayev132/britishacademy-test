// Libraries
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Lib
import { refreshSession, redirectToLogin } from '@/lib'

// Resolve the API base URL from the public env var. Next.js inlines
// NEXT_PUBLIC_* variables at build time so this works in the browser.
//
// BOŞDURSA NİSBİ `/api` işlədilir — sorğu səhifə ilə eyni origin-ə gedir və
// nginx onu Express-ə ötürür. Bu, iki nasazlığın qarşısını alır:
//   • domen dəyişəndə yenidən build unudulanda köhnə ünvan paketdə qalırdı;
//   • HTTPS səhifədən HTTP ünvana sorğu getdiyi üçün brauzer admin girişini
//     «Mixed Content» ilə bloklayırdı (paketdə http://<ip>:30002 yazılı idi).
// Dev-də dəyişən .env.development ilə verilir, mütləq ünvan işlədilir.
const RAW = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
const BASE_URL = RAW ? `${RAW}/api` : '/api'

// ============ BASE QUERY ============
// Sessiya HttpOnly cookie-lərdədir — brauzer onları `credentials: 'include'`
// ilə özü qoşur, token başlığı qurulmur (audit #2).
const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: 'include',
})

// Bu marşrutların 401-i sessiyanın bitməsi deyil (yanlış parol, səhv kod) —
// onlarda refresh edib təkrarlamaq mənasızdır.
const NO_REAUTH = /^\/?auth\/(login|register|verify-otp|resend-otp|forgot-password|verify-reset-otp|reset-password|change-password|refresh|logout)\b/
const urlOf = (args) => (typeof args === 'string' ? args : args?.url) || ''

// ============ REAUTH WRAPPER ============
// 401-də access token refresh cookie ilə bir dəfə yenilənir və sorğu
// təkrarlanır. Paralel 401-lər eyni refresh-i gözləyir (refreshSession mutex).
// İstifadəçi YALNIZ sessiya həqiqətən bitəndə çıxarılır — şəbəkə xətasında yox.
const baseQueryWithReauth = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions)

  if (result?.error?.status !== 401 || NO_REAUTH.test(urlOf(args))) {
    return result
  }

  const outcome = await refreshSession()
  if (outcome === 'ok') {
    return baseQuery(args, api, extraOptions)
  }
  if (outcome === 'expired') {
    api.dispatch({ type: 'auth/logout' })
    redirectToLogin()
  }
  return result
}

// ============ API INSTANCE ============
// Feature endpoints are attached lazily via injectEndpoints (see authApi.js,
// adminApi.js, publicApi.js).
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Auth', 'Site', 'Course', 'Blog', 'Resource'],
  endpoints: () => ({}),
})
