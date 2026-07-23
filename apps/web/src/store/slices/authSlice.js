// Redux Toolkit
import { createSlice } from '@reduxjs/toolkit'

// Key used for the persisted auth blob in localStorage.
const STORAGE_KEY = 'auth'
// Cookie the Edge middleware reads to guard protected routes (see middleware.js).
const TOKEN_COOKIE = 'token'

// ============ SSR-SAFE STORAGE HELPERS ============
// Every browser API access is guarded with `typeof window !== 'undefined'` so
// the reducer can be imported and its initial state computed during SSR/build.
const isBrowser = () => typeof window !== 'undefined'

const getStoredAuth = () => {
  if (!isBrowser()) return null
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

const persistAuth = (data) => {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Ignore quota / privacy-mode errors.
  }
}

const clearStoredAuth = () => {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore.
  }
}

// Mirror the access token into a cookie so the (Edge) middleware — which cannot
// read localStorage — can perform server-side route protection.
const setTokenCookie = (token) => {
  if (!isBrowser() || !token) return
  // 7 days; SameSite=Lax is enough for a first-party UX guard.
  document.cookie = `${TOKEN_COOKIE}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
}

const clearTokenCookie = () => {
  if (!isBrowser()) return
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}

// ============ INITIAL STATE ============
const storedAuth = getStoredAuth()

const initialState = {
  user: storedAuth?.user || null,
  accessToken: storedAuth?.accessToken || null,
  refreshToken: storedAuth?.refreshToken || null,
  isAuthenticated: !!storedAuth?.accessToken,
  role: storedAuth?.role || null, // 'user' | 'admin'
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Expects the server auth envelope: { user, tokens }
    setCredentials: (state, action) => {
      const { user, tokens } = action.payload
      state.user = user
      state.accessToken = tokens.accessToken
      state.refreshToken = tokens.refreshToken
      state.isAuthenticated = true
      state.role = user?.role || 'user'

      persistAuth({
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        role: state.role,
      })
      setTokenCookie(tokens.accessToken)
    },

    // Used by the reauth flow after a token refresh.
    setTokens: (state, action) => {
      const { accessToken, refreshToken } = action.payload
      state.accessToken = accessToken
      state.refreshToken = refreshToken

      const stored = getStoredAuth()
      if (stored) {
        persistAuth({ ...stored, accessToken, refreshToken })
      }
      setTokenCookie(accessToken)
    },

    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }

      const stored = getStoredAuth()
      if (stored) {
        persistAuth({ ...stored, user: state.user })
      }
    },

    logout: (state) => {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.role = null
      clearStoredAuth()
      clearTokenCookie()
    },
  },
})

export const { setCredentials, setTokens, updateUser, logout } =
  authSlice.actions
export default authSlice.reducer
