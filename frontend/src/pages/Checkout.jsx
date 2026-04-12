import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { placeOrder } from '../services/api'
import { toast } from 'react-toastify'
import L from 'leaflet'

export default function Checkout() {
  const navigate = useNavigate()
  const { cartItems, updateQty, total, clearCart } = useCart()

  const [address, setAddress] = useState('')
  const [area, setArea] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [locating, setLocating] = useState(false)
  const [coords, setCoords] = useState(null) // { lat, lng }
  const [showMap, setShowMap] = useState(false)

  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)

  const deliveryFee = 2.00
  const grandTotal = total > 0 ? total + deliveryFee : 0

  // Reverse geocode coords → address using Nominatim (free, no API key)
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      if (data && data.display_name) {
        const addr = data.address || {}
        // Build a clean address string
        const parts = [
          addr.road,
          addr.house_number,
          addr.neighbourhood || addr.suburb,
        ].filter(Boolean)
        const fullAddr = parts.length > 0 ? parts.join(', ') : data.display_name.split(',').slice(0, 3).join(',')
        setAddress(fullAddr)

        // Extract area/city
        const areaName = addr.suburb || addr.neighbourhood || addr.city_district || addr.city || addr.town || ''
        setArea(areaName)
      }
    } catch (err) {
      console.error('Reverse geocode failed:', err)
      toast.error('Could not resolve address from location')
    }
  }

  // Use browser Geolocation API
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setCoords({ lat, lng })
        setShowMap(true)
        await reverseGeocode(lat, lng)
        setLocating(false)
        toast.success('📍 Location detected!')
      },
      (error) => {
        setLocating(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Location access denied. Please enable location in your browser settings.')
            break
          case error.POSITION_UNAVAILABLE:
            toast.error('Location information unavailable.')
            break
          case error.TIMEOUT:
            toast.error('Location request timed out. Try again.')
            break
          default:
            toast.error('Failed to get your location.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  // Initialize / update the mini map when coords change
  useEffect(() => {
    if (!coords || !showMap || !mapRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: false,
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map)

      const marker = L.marker([coords.lat, coords.lng], {
        draggable: true,
        icon: L.divIcon({
          className: 'location-pin',
          html: `<div style="
            width: 24px; height: 24px;
            background: #ff5722;
            border: 4px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 12px rgba(255,87,34,0.4);
          "></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
      }).addTo(map)

      // Allow the user to drag the pin to fine-tune location
      marker.on('dragend', async () => {
        const pos = marker.getLatLng()
        setCoords({ lat: pos.lat, lng: pos.lng })
        await reverseGeocode(pos.lat, pos.lng)
      })

      markerRef.current = marker
      mapInstanceRef.current = map
    } else {
      mapInstanceRef.current.setView([coords.lat, coords.lng], 16)
      if (markerRef.current) {
        markerRef.current.setLatLng([coords.lat, coords.lng])
      }
    }
  }, [coords, showMap])

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    
    if (cartItems.length === 0) {
      toast.error('Your cart is empty!')
      return
    }

    if (!address.trim() || !area.trim()) {
      toast.error('Please provide delivery address and area')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        address,
        area,
        total_price: grandTotal.toFixed(2),
        items: cartItems.map(item => ({
          food_id: item.food_id,
          qty: item.qty
        }))
      }

      const res = await placeOrder(payload)
      clearCart()
      toast.success('Order placed successfully!', { position: 'top-center' })
      navigate(`/track/${res.data.order_id}`)
      
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.error || 'Failed to place order.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Redirect if cart is accessed while empty
  if (cartItems.length === 0 && !isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6">
        <span className="text-6xl mb-4">🛒</span>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Cart is Empty</h2>
        <p className="text-slate-500 mb-8 text-center text-sm">Looks like you haven't added anything to your cart yet.</p>
        <button 
          onClick={() => navigate('/customer')}
          className="bg-[#ff5722] text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-[#ff5722]/30 active:scale-95 transition-all"
        >
          Browse Menu
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-cream pb-32">
      {/* Header */}
      <header className="bg-white px-6 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate('/customer')} className="text-slate-500 hover:text-slate-800 transition-colors">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-slate-800">Checkout</h1>
        <div className="w-6"></div>
      </header>

      <div className="max-w-lg mx-auto pt-6 px-4 space-y-6">
        
        {/* Order Review List */}
        <div className="bg-white rounded-3xl p-5 shadow-sm space-y-4 border border-[#F0E8D8]">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand-red">Your Order</h2>
          
          <div className="space-y-5">
            {cartItems.map(item => (
              <div key={item.food_id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-orange-50 text-xl overflow-hidden shrink-0">
                     🍲
                   </div>
                   <div>
                     <p className="font-bold text-[15px] text-slate-800 leading-none">{item.name}</p>
                     <p className="text-sm font-black font-playfair text-brand-red mt-1">₵{item.price}</p>
                   </div>
                </div>

                <div className="flex items-center gap-3 bg-[#f2f4f6] rounded-full px-2 py-1">
                  <button 
                    onClick={() => updateQty(item.food_id, item.qty - 1)}
                    className="h-7 w-7 flex items-center justify-center rounded-full bg-white text-slate-600 shadow-sm active:scale-90 transition-transform"
                  >
                    -
                  </button>
                  <span className="font-bold pl-1 pr-1 text-sm">{item.qty.toString().padStart(2, '0')}</span>
                  <button 
                    onClick={() => updateQty(item.food_id, item.qty + 1)}
                    className="h-7 w-7 flex items-center justify-center rounded-full bg-brand-gold text-brand-deep-dark shadow-sm shadow-brand-gold/30 active:scale-90 transition-transform"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Details */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#F0E8D8] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand-red">Delivery Details</h2>
          </div>

          {/* USE MY LOCATION BUTTON */}
          <button
            onClick={handleUseLocation}
            disabled={locating}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-transparent border-2 border-brand-gold hover:bg-brand-gold/5 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            <div className={`h-10 w-10 flex items-center justify-center rounded-xl bg-brand-gold/20 text-brand-gold text-lg shrink-0 ${locating ? 'animate-pulse' : ''}`}>
              {locating ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
                </svg>
              ) : (
                '📍'
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-brand-deep-dark">
                {locating ? 'Detecting your location...' : 'Use My Live Location'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {locating ? 'Please wait a moment' : 'Auto-fill address using GPS • drag pin to adjust'}
              </p>
            </div>
          </button>

          {/* Mini map preview (only shown after location is detected) */}
          {showMap && coords && (
            <div className="rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm" style={{ height: '180px' }}>
              <div ref={mapRef} className="h-full w-full" />
            </div>
          )}

          {/* Detected location badge */}
          {coords && address && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-emerald-600 text-lg mt-0.5">✓</span>
              <div>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Detected Location</p>
                <p className="text-sm text-emerald-900 mt-0.5 leading-snug">{address}</p>
                {area && <p className="text-xs text-emerald-600 mt-0.5 font-bold">Area: {area}</p>}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">or enter manually</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Manual input fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 ml-1" htmlFor="address">Full Address</label>
              <input 
                id="address"
                type="text" 
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. 15B Oxford Street, Osu" 
                className="w-full bg-white border border-[#F0E8D8] rounded-2xl px-5 py-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-gold outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 ml-1" htmlFor="area">City / Zone</label>
              <input 
                id="area"
                type="text" 
                value={area}
                onChange={e => setArea(e.target.value)}
                placeholder="e.g. East Legon" 
                className="w-full bg-white border border-[#F0E8D8] rounded-2xl px-5 py-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-gold outline-none"
              />
            </div>
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#F0E8D8] space-y-3 mt-4">
           <div className="flex items-center justify-between text-sm font-bold text-slate-500">
             <span>Subtotal</span>
             <span className="text-slate-800">₵{total.toFixed(2)}</span>
           </div>
           <div className="flex items-center justify-between text-sm font-bold text-slate-500">
             <span>Delivery</span>
             <span className="text-slate-800">₵{deliveryFee.toFixed(2)}</span>
           </div>
           <div className="border-t border-[#F0E8D8] my-2 pt-3 flex items-center justify-between">
             <span className="text-lg font-black text-slate-800">Total</span>
             <span className="text-2xl font-black font-playfair text-brand-red">₵{grandTotal.toFixed(2)}</span>
           </div>
        </div>

      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button 
          onClick={handlePlaceOrder}
          disabled={isSubmitting}
          className="w-full max-w-lg mx-auto flex items-center justify-center rounded-[12px] bg-brand-gold py-4 text-brand-deep-dark shadow-xl hover:bg-brand-gold-light transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        >
          <span className="font-bold text-lg">{isSubmitting ? 'Processing...' : 'Place Official Order'}</span>
        </button>
      </div>
    </div>
  )
}
