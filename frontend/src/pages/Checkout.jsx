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
      <header className="bg-white px-6 py-5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <button onClick={() => navigate('/customer')} className="text-slate-500 hover:text-slate-800 transition-colors">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-xl font-bold text-slate-800 font-poppins tracking-tight">Checkout</h1>
          <div className="w-6"></div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto pt-8 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-10 items-start">
          
          {/* LEFT COLUMN: Delivery Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-[#F0E8D8] space-y-8">
              {/* Integrated Header removed for cleaner look */}

              {/* USE MY LOCATION BUTTON */}
              {/* Simplified Location Button */}
              <div className="flex justify-between items-center bg-brand-cream/30 p-4 rounded-2xl border border-brand-cream hover:bg-brand-cream/50 transition-colors group cursor-pointer" onClick={handleUseLocation}>
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 flex items-center justify-center rounded-xl bg-brand-red text-white transition-transform group-hover:scale-110 ${locating ? 'animate-spin' : ''}`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                       <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-deep-dark font-poppins">{locating ? 'Detecting...' : 'Locate Me'}</p>
                    <p className="text-[10px] text-slate-400 font-inter uppercase tracking-widest">{locating ? 'GPS Active' : 'Auto-detect Address'}</p>
                  </div>
                </div>
                <button className="text-brand-red font-black text-[10px] uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg shadow-sm border border-brand-red/10">Detect</button>
              </div>

              {/* Mini map preview */}
              {showMap && coords && (
                <div className="rounded-[2rem] overflow-hidden border-2 border-[#F0E8D8] shadow-inner animate-in fade-in slide-in-from-top-4 duration-500" style={{ height: '240px' }}>
                  <div ref={mapRef} className="h-full w-full" />
                </div>
              )}

              {/* Detected location badge */}
              {coords && address && (
                <div className="flex items-start gap-4 p-5 rounded-3xl bg-emerald-50 border border-emerald-100 animate-in zoom-in-95 duration-300">
                  <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xl shrink-0 shadow-sm">✓</div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest font-inter">Auto-detected Address</p>
                    <p className="text-base text-emerald-900 mt-1 font-bold leading-snug font-inter">{address}</p>
                    {area && <p className="text-xs text-emerald-600 mt-1.5 font-black uppercase tracking-widest font-inter flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      Zone: {area}
                    </p>}
                  </div>
                </div>
              )}

              <div className="h-2"></div>

              <div className="space-y-6">
                <div>
                  <input 
                    id="address"
                    type="text" 
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Full Address / Landmark" 
                    className="w-full bg-slate-50 border border-[#F0E8D8] rounded-[20px] px-6 py-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-red outline-none font-inter transition-all shadow-sm"
                  />
                </div>
                <div>
                  <input 
                    id="area"
                    type="text" 
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    placeholder="Neighborhood / Area" 
                    className="w-full bg-slate-50 border border-[#F0E8D8] rounded-[20px] px-6 py-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-red outline-none font-inter transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Review */}
          <div className="space-y-6 lg:sticky lg:top-28">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-[#F0E8D8] space-y-8">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-sm font-black uppercase tracking-widest text-brand-deep-dark font-poppins">Order Summary</h2>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cartItems.length} Items</span>
              </div>
              
              <div className="divide-y divide-[#F0E8D8]">
                {cartItems.map(item => (
                  <div key={item.food_id} className="py-5 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                       <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-brand-cream text-2xl overflow-hidden shrink-0 border border-[#F0E8D8] shadow-sm transform transition-transform group-hover:scale-105">
                         {item.image ? (
                           <img src={`http://localhost:8000${item.image}`} alt={item.name} className="h-full w-full object-cover" />
                         ) : (
                           '🍲'
                         )}
                       </div>
                       <div>
                         <p className="font-black text-base text-brand-deep-dark leading-tight font-poppins">{item.name}</p>
                         <p className="text-xs font-black text-brand-red mt-1 font-inter uppercase tracking-widest">₵{item.price}</p>
                       </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-4 bg-brand-cream/50 rounded-2xl px-3 py-1.5 border border-[#F0E8D8]">
                        <button 
                          onClick={() => updateQty(item.food_id, item.qty - 1)}
                          className="h-6 w-6 flex items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm active:scale-75 transition-transform border border-[#F0E8D8]"
                        >
                          -
                        </button>
                        <span className="font-black text-sm font-inter w-6 text-center">{item.qty}</span>
                        <button 
                          onClick={() => updateQty(item.food_id, item.qty + 1)}
                          className="h-6 w-6 flex items-center justify-center rounded-lg bg-brand-red text-white shadow-md shadow-brand-red/20 active:scale-75 transition-transform"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Invoice Table */}
              <div className="pt-6 space-y-4">
                 <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-inter">
                   <span>Items Subtotal</span>
                   <span className="text-slate-800 font-black">₵{total.toFixed(2)}</span>
                 </div>
                 <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-[0.2em] font-inter">
                   <span>Delivery Service</span>
                   <span className="text-emerald-500 font-black">₵{deliveryFee.toFixed(2)}</span>
                 </div>
                 <div className="border-t-2 border-brand-cream pt-6 flex items-center justify-between">
                   <span className="text-lg font-black text-brand-deep-dark font-poppins tracking-tighter uppercase underline decoration-brand-red/30 decoration-4">Grand Total</span>
                   <span className="text-3xl font-black font-poppins text-brand-red tracking-tighter animate-pulse">₵{grandTotal.toFixed(2)}</span>
                 </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full h-16 flex items-center justify-center rounded-2xl bg-brand-red text-white shadow-2xl shadow-brand-red/30 hover:bg-brand-dark-red transition-all active:scale-[0.97] disabled:opacity-50"
              >
                <div className="flex flex-col items-center">
                  <span className="font-black text-xs font-inter uppercase tracking-[0.3em]">{isSubmitting ? 'Finalizing...' : 'Send Official Order'}</span>
                  {!isSubmitting && <span className="text-[9px] opacity-70 uppercase tracking-widest font-inter mt-0.5">Accra • Ghana</span>}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button (Only on small screens) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-t border-slate-100 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button 
          onClick={handlePlaceOrder}
          disabled={isSubmitting}
          className="w-full max-w-lg mx-auto flex items-center justify-center rounded-2xl bg-brand-red h-16 text-white shadow-xl active:scale-95 disabled:opacity-50"
        >
          <span className="font-black text-xs font-inter uppercase tracking-[0.3em]">{isSubmitting ? 'Processing...' : 'Place Official Order'}</span>
        </button>
      </div>
    </div>
  )
}
