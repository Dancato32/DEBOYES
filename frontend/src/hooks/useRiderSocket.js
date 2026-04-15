import { useEffect, useRef, useCallback } from 'react'

export default function useRiderSocket(onMessage, enabled = true) {
  const socketRef = useRef(null)
  const onMessageRef = useRef(onMessage)

  // Keep ref up to date without triggering effects
  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    if (!enabled) {
      if (socketRef.current) {
        socketRef.current.close()
        socketRef.current = null
      }
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const area = 'global'
    const wsUrl = `${protocol}//${window.location.host}/ws/riders/orders/${area}/`

    const connect = () => {

      socketRef.current = new WebSocket(wsUrl)

      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (onMessageRef.current) onMessageRef.current(data)
        } catch (err) {
          console.error('Error parsing socket message:', err)
        }
      }

      socketRef.current.onclose = () => {

        setTimeout(() => {
          if (enabled) connect()
        }, 5000)
      }

      socketRef.current.onerror = (err) => {
        console.error('Rider Socket error:', err)
        socketRef.current.close()
      }
    }

    connect()

    return () => {
      if (socketRef.current) {
        socketRef.current.onclose = null
        socketRef.current.close()
        socketRef.current = null
      }
    }
  }, [enabled])

  const sendLocation = useCallback((lat, lng) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ 
        type: 'location_update',
        lat, 
        lng 
      }))
    }
  }, [])

  return { socket: socketRef.current, sendLocation }
}
