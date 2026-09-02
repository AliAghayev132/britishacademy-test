// RTK Query
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

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
const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    // Don't overwrite if already set (e.g. an explicit reset token).
    if (!headers.get('Authorization')) {
      const token = getState().auth?.accessToken
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
    }
    return headers
  },
})

// ============ REAUTH WRAPPER ============
// On a 401, try to refresh the access token once using the refresh token,
// then replay the original request. If refresh fails, force a logout.
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)

  if (result?.error?.status === 401) {
    const refreshToken = api.getState().auth?.refreshToken

    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          headers: { Authorization: `Bearer ${refreshToken}` },
        },
        api,
        extraOptions
      )

      if (refreshResult?.data) {
        api.dispatch({
          type: 'auth/setTokens',
          payload: refreshResult.data.data.tokens,
        })
        // Retry the original request with the new token.
        result = await baseQuery(args, api, extraOptions)
      } else {
        api.dispatch({ type: 'auth/logout' })
      }
    } else {
      api.dispatch({ type: 'auth/logout' })
    }
  }

  return result
}

// ============ API INSTANCE ============
// Feature endpoints are attached lazily via injectEndpoints (see authApi.js,
// postApi.js). Keep tagTypes generic to the starter domain.
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Post', 'Auth', 'Site', 'Course', 'Blog', 'Resource'],
  endpoints: () => ({}),
})
