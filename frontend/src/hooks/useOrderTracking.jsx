import { useEffect, useRef, useState } from 'react'

export default function useOrderTracking(orderId) {
  const [position, setPosition] = useState({ lat: 5.6037, lng: -0.1870 })
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!orderId) return

    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const socketUrl = `${wsProtocol}://${window.location.host}/ws/tracking/${orderId}/`
    const socket = new WebSocket(socketUrl)
    socketRef.current = socket

    socket.onopen = () => setConnected(true)
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setPosition({ lat: Number(data.lat), lng: Number(data.lng) })
      } catch (err) {
        console.error(err)
      }
    }
    socket.onerror = (event) => {
      console.error('WebSocket error', event)
      setError('WebSocket connection failed')
    }
    socket.onclose = () => setConnected(false)

    return () => {
      socket.close()
    }
  }, [orderId])

  const sendLocation = (lat, lng) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ lat, lng }))
    }
  }

  return { position, connected, error, sendLocation }
}
