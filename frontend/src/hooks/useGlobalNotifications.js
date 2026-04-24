import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { toast } from '../utils/soundToast'

export default function useGlobalNotifications() {
  const { user, isAuthenticated } = useAuth()
  const socketRef = useRef(null)

  useEffect(() => {
    if (!isAuthenticated || !user || user.user_type !== 'customer') {
      if (socketRef.current) {
        socketRef.current.close()
        socketRef.current = null
      }
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/notifications/`

    const connect = () => {
      const socket = new WebSocket(wsUrl)
      socketRef.current = socket

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'notification') {
            const { message, status } = data.data
            
            // 1. Toast Notification
            toast.info(message, {
              icon: status === 'delivered' ? '✅' : '🛵',
              autoClose: 10000,
              position: 'top-center'
            })

            // 2. Browser Notification (if permission granted)
            if (Notification.permission === 'granted') {
              new Notification("De Boye's Order Update", {
                body: message,
                icon: '/logo.png'
              })
            }
          }
        } catch (err) {
          console.error('Notification error:', err)
        }
      }

      socket.onclose = () => {
        setTimeout(() => {
          if (isAuthenticated) connect()
        }, 5000)
      }
    }

    connect()

    // Request Notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.onclose = null
        socketRef.current.close()
        socketRef.current = null
      }
    }
  }, [isAuthenticated, user?.id])
}
