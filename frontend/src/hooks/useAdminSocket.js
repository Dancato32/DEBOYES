import { useEffect, useRef } from 'react'
import { toast } from 'react-toastify'

export default function useAdminSocket(onUpdate) {
  const socketRef = useRef(null)

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    // Use window.location.host to work with the Vite proxy and different environments
    const socketUrl = `${protocol}://${window.location.host}/ws/admin/updates/`
    
    const connect = () => {
      console.log('Connecting to Admin WebSocket...')
      const socket = new WebSocket(socketUrl)
      socketRef.current = socket

      socket.onopen = () => {
        console.log('Admin WebSocket connected.')
      }

      socket.onmessage = (event) => {
        const data = jsonParse(event.data)
        if (data && onUpdate) {
            onUpdate(data)
        }
      }

      socket.onclose = () => {
        console.log('Admin WebSocket disconnected. Reconnecting in 3s...')
        setTimeout(connect, 3000)
      }

      socket.onerror = (err) => {
        console.error('Admin WebSocket error:', err)
        socket.close()
      }
    }

    connect()

    return () => {
      if (socketRef.current) {
        socketRef.current.close()
      }
    }
  }, [])

  const jsonParse = (str) => {
    try { return JSON.parse(str) }
    catch (e) { return null }
  }

  return socketRef.current
}
