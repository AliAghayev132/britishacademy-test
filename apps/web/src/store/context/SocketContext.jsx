'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react'
import { io } from 'socket.io-client'
import { useSelector } from 'react-redux'

const SocketContext = createContext(null)

// The socket server is the API root (Next inlines NEXT_PUBLIC_* at build time).
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const MAX_RECONNECT_ATTEMPTS = 5

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const { accessToken, user, role } = useSelector((state) => state.auth)
  const reconnectAttempts = useRef(0)

  useEffect(() => {
    // Only connect for authenticated users.
    if (!accessToken || !user) {
      return undefined
    }

    const newSocket = io(SOCKET_URL, {
      auth: {
        token: accessToken,
        role: role || 'user',
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    // Connection status is synced from event callbacks (allowed in effects).
    newSocket.on('connect', () => {
      setIsConnected(true)
      reconnectAttempts.current = 0
    })
    newSocket.on('disconnect', () => {
      setIsConnected(false)
    })
    newSocket.on('connect_error', () => {
      reconnectAttempts.current++
    })

    // Establishing the connection is a "subscribe to an external system"
    // effect; the instance is kept in state so consumers can read it from
    // context. Storing it here is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [accessToken, user, role])

  // ---- Generic `room` helpers (example real-time API) ----
  const joinRoom = useCallback(
    (roomId) => {
      if (socket && isConnected) socket.emit('join:room', roomId)
    },
    [socket, isConnected]
  )

  const leaveRoom = useCallback(
    (roomId) => {
      if (socket && isConnected) socket.emit('leave:room', roomId)
    },
    [socket, isConnected]
  )

  const startTyping = useCallback(
    (roomId) => {
      if (socket && isConnected) socket.emit('typing:start', roomId)
    },
    [socket, isConnected]
  )

  const stopTyping = useCallback(
    (roomId) => {
      if (socket && isConnected) socket.emit('typing:stop', roomId)
    },
    [socket, isConnected]
  )

  const sendMessage = useCallback(
    (roomId, message) => {
      if (socket && isConnected) socket.emit('message:new', { roomId, message })
    },
    [socket, isConnected]
  )

  const value = {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
    startTyping,
    stopTyping,
    sendMessage,
  }

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export default SocketContext
