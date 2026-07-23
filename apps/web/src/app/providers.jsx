'use client'

import { Provider } from 'react-redux'

import { store } from '@/store'
import { SocketProvider } from '@/store/context/SocketContext'

/**
 * Global client-side providers. Rendered from the root layout (a Server
 * Component) so the Redux store and socket connection live on the client only.
 */
export function Providers({ children }) {
  return (
    <Provider store={store}>
      <SocketProvider>{children}</SocketProvider>
    </Provider>
  )
}
