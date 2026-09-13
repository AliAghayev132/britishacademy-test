// Redux Toolkit
import { createSlice } from '@reduxjs/toolkit'

// Key used for the persisted profile blob in localStorage.
const STORAGE_KEY = 'auth'

/*
 * Tokenlər burada SAXLANILMIR (audit #2). API onları HttpOnly cookie kimi
 * yazır — JS oxuya bilmir, ona görə saytdakı XSS sessiyanı oğurlaya bilməz.
 * localStorage-da yalnız profil (ad, rol, icazələr) qalır: sidebar və socket
 * bunu dərhal bilməlidir. Bu, qoruma deyil — əsl yoxlama API-dədir.
 */

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

/**
 * Köhnə versiyanın izləri: localStorage-da tokenlər və JS-in oxuduğu `token`
 * cookie-si. Onlar silinir; o sessiyanın HttpOnly cookie-si olmadığı üçün
 * istifadəçi bir dəfə yenidən daxil olur.
 */
const dropLegacySession = () => {
  if (!isBrowser()) return null
  const stored = getStoredAuth()
  if (stored && ('accessToken' in stored || 'refreshToken' in stored)) {
    clearStoredAuth()
  }
  if (/(?:^|;\s*)token=/.test(document.cookie)) {
    document.cookie = 'token=; path=/; max-age=0; SameSite=Lax'
  }
  return getStoredAuth()
}

// ============ INITIAL STATE ============
const storedAuth = dropLegacySession()

const initialState = {
  user: storedAuth?.user || null,
  isAuthenticated: !!storedAuth?.user,
  role: storedAuth?.role || null, // 'user' | 'admin'
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Expects the server auth envelope: { user } (tokenlər cookie-dədir)
    setCredentials: (state, action) => {
      const { user } = action.payload
      state.user = user
      state.isAuthenticated = true
      state.role = user?.role || 'user'

      persistAuth({ user, role: state.role })
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
      state.isAuthenticated = false
      state.role = null
      clearStoredAuth()
    },
  },
})

export const { setCredentials, updateUser, logout } = authSlice.actions
export default authSlice.reducer
