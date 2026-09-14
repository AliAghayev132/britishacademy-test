// Libraries
import { configureStore } from '@reduxjs/toolkit'

// Local
import { baseApi } from './api/baseApi'
import authReducer from './slices/authSlice'

// ============ STORE ============
// The store is instantiated on the client (Providers is a Client Component).
// The auth slice reads its initial state from localStorage in an SSR-safe way,
// so importing this module during a server render / build is harmless.
export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
})
