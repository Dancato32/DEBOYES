import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom circular icons matching the requested UI (Blue/Solid)
const createCustomIcon = (iconName, bgColor = '#526DFF') => L.divIcon({
  className: 'custom-map-marker',
  html: `<div style="
    width: 36px; height: 36px;
    background: ${bgColor};
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    transition: all 1s linear;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: white;
    line-height: 30px;
  ">
    ${iconName}
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

const userIcon = createCustomIcon('📍', '#ed1c24') // Brand Red for user
const riderIcon = createCustomIcon('🛵', '#ffcb05') // Brand Yellow for rider
const restaurantIcon = createCustomIcon('🏪', '#1A0A0B') // Deep Dark for restaurant

export default function MapTracker({ position, destination, restaurant, isRiderMoving, darkMode = false }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const destMarkerRef = useRef(null)
  const restMarkerRef = useRef(null)
  const routeLineRef = useRef(null)
  
  // Custom styling for the tooltip
  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      .map-eta-tooltip {
        background: white;
        border: none;
        border-radius: 12px;
        padding: 8px 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        font-family: 'DM Sans', sans-serif;
        font-weight: 800;
      }
      .leaflet-tooltip-top:before { border-top-color: white; }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  const updateRoute = async (start, end, map) => {
    if (!start || !end || !map) return
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`)
      const data = await res.json()

      if (data.routes && data.routes[0]) {
        const route = data.routes[0]
        const coords = route.geometry.coordinates.map(c => [c[1], c[0]])
        
        if (routeLineRef.current) {
          routeLineRef.current.setLatLngs(coords)
        } else {
          const line = L.polyline(coords, { 
            color: '#526DFF', 
            weight: 5, 
            opacity: 0.6, 
            lineCap: 'round', 
            lineJoin: 'round' 
          }).addTo(map)
          routeLineRef.current = line
        }

        if (destMarkerRef.current) {
          const durationMins = Math.ceil(route.duration / 60)
          const tooltipContent = `<div style="color: #1e293b; font-size: 12px;">${durationMins} min</div>`
          destMarkerRef.current.bindTooltip(tooltipContent, {
            permanent: true,
            direction: 'top',
            className: 'map-eta-tooltip',
            offset: [0, -20]
          }).openTooltip()
        }
      }
    } catch (e) {
      console.error("Routing error:", e)
    }
  }

  useEffect(() => {
    if (!mapRef.current) return
    if (mapInstanceRef.current) return

    const center = [position?.lat || 5.6037, position?.lng || -0.1870]
    const map = L.map(mapRef.current, {
      center,
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    })

    if (darkMode) {
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map)
    } else {
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map)
    }

    // Centering controls button (visual only)
    L.Control.Center = L.Control.extend({
      onAdd: function() {
        const btn = L.DomUtil.create('button', 'h-10 w-10 bg-white rounded-full shadow-lg flex items-center justify-center border border-slate-100 mb-4 mr-4')
        btn.innerHTML = '🧭'
        btn.onclick = () => map.setView(center, 15)
        return btn
      }
    })
    new L.Control.Center({ position: 'bottomright' }).addTo(map)

    // Rider marker (only if moving)
    const marker = L.marker(center, { 
      icon: riderIcon, 
      zIndexOffset: 1000,
      opacity: isRiderMoving ? 1 : 0 
    }).addTo(map)
    markerRef.current = marker

    // Destination (Customer) marker
    if (destination?.lat && destination?.lng) {
      const dMarker = L.marker([destination.lat, destination.lng], { icon: userIcon }).addTo(map)
      destMarkerRef.current = dMarker
      updateRoute(position, destination, map)
    }

    // Restaurant marker
    if (restaurant?.lat && restaurant?.lng) {
      const rMarker = L.marker([restaurant.lat, restaurant.lng], { icon: restaurantIcon }).addTo(map)
      restMarkerRef.current = rMarker
    }

    // Fit bounds 
    const markers = [marker]
    if (destMarkerRef.current) markers.push(destMarkerRef.current)
    if (restMarkerRef.current) markers.push(restMarkerRef.current)
    const group = L.featureGroup(markers)
    map.fitBounds(group.getBounds().pad(0.3))

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!markerRef.current || !position?.lat || !position?.lng) return
    const newPos = [position.lat, position.lng]
    
    markerRef.current.setLatLng(newPos)
    markerRef.current.setOpacity(isRiderMoving ? 1 : 0)

    if (destination?.lat) {
       updateRoute(position, destination, mapInstanceRef.current)
    }

    // Centering/Fitting Logic
    if (mapInstanceRef.current) {
        const markers = [markerRef.current]
        if (destMarkerRef.current) markers.push(destMarkerRef.current)
        if (restMarkerRef.current) markers.push(restMarkerRef.current)
        
        const group = L.featureGroup(markers)
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.3), { animate: true })
    }
  }, [position?.lat, position?.lng, destination?.lat, restaurant?.lat])

  // React to Restaurant Prop changes
  useEffect(() => {
    if (!mapInstanceRef.current || !restaurant?.lat || !restaurant?.lng) return
    
    if (restMarkerRef.current) {
      restMarkerRef.current.setLatLng([restaurant.lat, restaurant.lng])
    } else {
      restMarkerRef.current = L.marker([restaurant.lat, restaurant.lng], { icon: restaurantIcon }).addTo(mapInstanceRef.current)
    }
  }, [restaurant?.lat, restaurant?.lng])

  return (
    <div ref={mapRef} className="h-full w-full" />
  )
}
