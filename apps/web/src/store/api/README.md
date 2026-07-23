# store/api/

## Məqsəd

Bu qovluq RTK Query API qatını saxlayır. `baseApi.js` mərkəzi `createApi` instansını qurur (base query, avtomatik token refresh/reauth, `tagTypes`). Feature endpoint-ləri — `authApi.js` və `postApi.js` — `baseApi.injectEndpoints` ilə həmin tək instansa əlavə olunur. Bu, server API kontraktının bir yerdə cəmləşdiyi data-fetching qatıdır.

## Adlandırma / yazılış konvensiyası

- `baseApi.js` yeganə `createApi` instansını yaradır; feature fayllar (`authApi.js`, `postApi.js`) **camelCase** adlanır və `baseApi.injectEndpoints({ ... })` çağırır.
- Hər fayl həm API obyektini (`export const authApi`), həm də avtomatik generasiya olunan hook-ları (`useLoginMutation`, `useGetPostsQuery`) named export edir.
- `index.js` barrel `baseApi`-ni və hər feature faylını re-export edir (`export * from './authApi'`).
- Cache idarəsi üçün `providesTags` / `invalidatesTags` `baseApi`-dəki `tagTypes` (`'User'`, `'Post'`, `'Auth'`) ilə uyğun olmalıdır.
- Import-lar `@/store/api` alias-ı ilə yazılır.

## Nümunə

`postApi.js` endpoint-ləri `baseApi`-yə inject edir:

```js
import { baseApi } from './baseApi'

export const postApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: (params = {}) => ({ url: '/posts', params }),
      providesTags: [{ type: 'Post', id: 'LIST' }],
    }),
  }),
})

export const { useGetPostsQuery } = postApi
```

İstifadə: `import { useGetPostsQuery } from '@/store/api'`.

## Yeni fayl necə əlavə olunur

1. `camelCase` fayl yaradın (məs. `commentApi.js`).
2. `baseApi.injectEndpoints({ endpoints: (builder) => ({ ... }) })` yazın və hook-ları named export edin.
3. Yeni tag lazımdırsa, `baseApi.js`-dəki `tagTypes` massivinə əlavə edin.
4. `index.js`-ə `export * from './commentApi'` sətrini əlavə edin.
