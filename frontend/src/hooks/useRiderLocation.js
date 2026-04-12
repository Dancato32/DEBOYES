import { useState, useEffect, useRef } from 'react'

const ACCRA_AREAS = {
  'Accra Central':  { lat: 5.5500, lng: -0.2000 },
  'East Legon':     { lat: 5.6350, lng: -0.1570 },
  'Osu':            { lat: 5.5560, lng: -0.1810 },
  'Labone':         { lat: 5.5610, lng: -0.1750 },
  'Cantonments':    { lat: 5.5680, lng: -0.1770 },
  'Airport Area':   { lat: 5.6050, lng: -0.1700 },
  'Madina':         { lat: 5.6700, lng: -0.1670 },
  'Spintex':        { lat: 5.6350, lng: -0.1100 },
  'Tema':           { lat: 5.6700, lng: -0.0170 },
  'Dansoman':       { lat: 5.5360, lng: -0.2580 },
  'Achimota':       { lat: 5.6150, lng: -0.2270 },
  'Adenta':         { lat: 5.6900, lng: -0.1550 },
}

const getAreaName = (lat, lng) => {
  let closestArea = 'Accra Central'
  let minDistance = Infinity

  Object.entries(ACCRA_AREAS).forEach(([name, coords]) => {
    const dist = Math.sqrt(Math.pow(lat - coords.lat, 2) + Math.pow(lng - coords.lng, 2))
    if (dist < minDistance) {
      minDistance = dist
      closestArea = name
    }
  })
  
  return closestArea
}

export default function useRiderLocation(enabled = false) {
  const [location, setLocation] = useState(null)
  const [area, setArea] = useState('Off-grid')
  const [error, setError] = useState(null)
  const watchId = useRef(null)

  useEffect(() => {
    if (!enabled) {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
        watchId.current = null
      }
      setArea('Off-grid')
      return
    }

    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      return
    }

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setLocation({ lat: latitude, lng: longitude })
        setArea(getAreaName(latitude, longitude))
        setError(null)
      },
      (err) => {
        console.error('GPS Watch Error:', err)
        setError(err.message)
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
      }
    }
  }, [enabled])

  return { location, area, error }
}
