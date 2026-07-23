# store/

## Məqsəd

Bu qovluq Redux Toolkit store-unun konfiqurasiyasını və global state qatını saxlayır. `index.js` `configureStore` ilə store-u qurur, RTK Query `baseApi` reducer-ini və middleware-ini, həmçinin `authSlice` reducer-ini bir yerə birləşdirir. Alt-qovluqlar məsuliyyəti bölür: `api/` (RTK Query endpoint-ləri), `slices/` (createSlice reducer-ləri), `context/` (React Context provider-ləri).

## Adlandırma / yazılış konvensiyası

- Kök fayl `index.js`-dir və store-u `export const store` kimi ixrac edir.
- Store `Providers` (Client Component) daxilində quraşdırıldığı üçün brauzerdə yaşayır; `authSlice` ilkin state-i SSR-təhlükəsiz şəkildə `localStorage`-dan oxuyur, ona görə serverdə import edilməsi zərərsizdir.
- Reducer-lər `[baseApi.reducerPath]` (RTK Query üçün) və adlandırılmış slice açarları (`auth`) ilə qeydiyyatdan keçir.
- Import-lar `@/store` alias-ı ilə yazılır.

## Nümunə

`index.js` store-u belə qurur:

```js
import { configureStore } from '@reduxjs/toolkit'
import { baseApi } from './api/baseApi'
import authReducer from './slices/authSlice'

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
})
```

Store `app/providers.jsx`-də `import { store } from '@/store'` ilə `<Provider>`-ə verilir.

## Yeni fayl necə əlavə olunur

1. Yeni state üçün `slices/` və ya `api/` altında müvafiq faylı yaradın.
2. `index.js`-də reducer-i import edin və `reducer` obyektinə açar kimi əlavə edin.
3. RTK Query API-si əlavə edirsinizsə, `baseApi.middleware` artıq qoşulub — sadəcə endpoint-ləri `injectEndpoints` ilə əlavə edin.
