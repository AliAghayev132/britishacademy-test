# store/context/

## Məqsəd

Bu qovluq Redux-dan kənar, React Context ilə idarə olunan global state-i saxlayır. Hazırda burada `SocketContext.jsx` var: `socket.io-client` bağlantısını qurur, autentifikasiya olunmuş istifadəçi üçün real-time socket yaradır və `joinRoom`, `leaveRoom`, `sendMessage` kimi köməkçiləri context vasitəsilə paylaşır. Redux serializable state üçündür; socket instansı kimi qeyri-serializable, canlı obyektlər isə Context-ə daha uyğundur.

## Adlandırma / yazılış konvensiyası

- Context faylları **PascalCase** və `.jsx` uzantısı ilə adlandırılır (`SocketContext.jsx`).
- Fayl brauzer hook-larından (`useState`, `useEffect`, `useSelector`) istifadə etdiyi üçün başında `'use client'` olmalıdır.
- Hər fayl Provider komponentini (`SocketProvider`) və istehlak hook-unu (`useSocket`) named export edir; hook Provider xaricində çağırılanda xəta atır.
- Bu qovluqda **barrel `index.js` YOXDUR** — birbaşa tam yolla import olunur: `@/store/context/SocketContext`.

## Nümunə

`SocketContext.jsx` provider və hook-u belə ixrac edir:

```js
'use client'

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const value = { socket, isConnected, joinRoom, sendMessage /* ... */ }
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export const useSocket = () => useContext(SocketContext)
```

`SocketProvider` `app/providers.jsx`-də `import { SocketProvider } from '@/store/context/SocketContext'` ilə Redux `<Provider>` içinə sarınır.

## Yeni fayl necə əlavə olunur

1. `PascalCase.jsx` faylı yaradın (məs. `ThemeContext.jsx`) və başına `'use client'` əlavə edin.
2. `createContext` ilə context, Provider komponenti və `useTheme` hook-unu yazın; hər ikisini named export edin.
3. Barrel olmadığı üçün birbaşa tam yolla import edin: `@/store/context/ThemeContext`.
4. Global olmalıdırsa, Provider-i `app/providers.jsx`-də ağaca əlavə edin.
