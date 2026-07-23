# store/slices/

## Məqsəd

Bu qovluq Redux Toolkit `createSlice` reducer-lərini saxlayır — RTK Query cache-i ilə idarə olunmayan lokal/client state üçün. Hazırda burada `authSlice.js` var: autentifikasiya state-ini (`user`, `accessToken`, `refreshToken`, `isAuthenticated`, `role`) idarə edir, ilkin state-i SSR-təhlükəsiz şəkildə `localStorage`-dan oxuyur və token-i həmçinin cookie-yə yazır ki, Edge middleware qorunan route-ları yoxlaya bilsin.

## Adlandırma / yazılış konvensiyası

- Fayllar **camelCase** və `...Slice.js` şəkilçisi ilə adlandırılır (`authSlice.js`).
- Hər slice `createSlice({ name, initialState, reducers })` istifadə edir.
- **Default export** reducer-dir (`export default authSlice.reducer`); action creator-lər isə named export olunur (`export const { setCredentials, logout } = authSlice.actions`).
- Bu qovluqda **barrel `index.js` YOXDUR** — reducer və action-lar birbaşa tam yolla import olunur: `@/store/slices/authSlice`.
- Brauzer API-lərinə (`window`, `localStorage`, `document`) hər müraciət `typeof window !== 'undefined'` ilə qorunmalıdır ki, modul SSR/build zamanı import edilə bilsin.

## Nümunə

`authSlice.js` reducer-i və action-ları belə ixrac edir:

```js
import { createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => { state.user = null; state.isAuthenticated = false },
  },
})

export const { setCredentials, setTokens, updateUser, logout } = authSlice.actions
export default authSlice.reducer
```

Reducer `store/index.js`-də `import authReducer from './slices/authSlice'` ilə qeydiyyatdan keçir.

## Yeni fayl necə əlavə olunur

1. `...Slice.js` faylı yaradın (məs. `uiSlice.js`) və `createSlice` ilə qurun.
2. Reducer-i `export default`, action-ları `export const { ... } = slice.actions` kimi ixrac edin.
3. `store/index.js`-də reducer-i import edib `reducer` obyektinə açar (məs. `ui`) kimi əlavə edin.
