'use client'

// Libraries
import { Provider } from 'react-redux'

// Store
import { store } from '@/store'

/**
 * Global client-side providers (Redux). Rendered from the root layout.
 *
 * Socket.IO BURADA DEYİL — (protected)/layout.js-də. Əvvəl kökdə idi və
 * socket.io-client ictimai saytın hər səhifəsinə yüklənirdi, halbuki yalnız
 * admin panelinin WhatsApp bölməsi üçündür (audit #16). Redux isə qalır:
 * ictimai müraciət formları və müəllim siyahısı onu işlədir.
 */
export function Providers({ children }) {
  return <Provider store={store}>{children}</Provider>
}
