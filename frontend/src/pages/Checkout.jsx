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
  const [paymentMethod, setPaymentMethod] = useState('pay_in_person')
  const [locating, setLocating] = useState(false)
  const [coords, setCoords] = useState(null) // { lat, lng }
  const [showMap, setShowMap] = useState(false)

  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)

  const [deliveryFee, setDeliveryFee] = useState(0)
  const [feeZone, setFeeZone] = useState('')
  const [calculatingFee, setCalculatingFee] = useState(false)

  const grandTotal = total > 0 ? total + (deliveryFee || 0) : 0

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

  // Fetch delivery fee from backend when location changes
  useEffect(() => {
    const updateFee = async () => {
      if (!coords && !area) return
      setCalculatingFee(true)
      try {
        const res = await import('../services/api').then(m => m.estimateFee({
          lat: coords?.lat,
          lng: coords?.lng,
          area: area
        }))
        setDeliveryFee(res.data.fee)
        setFeeZone(res.data.zone)
      } catch (err) {
        console.error('Fee estimation failed:', err)
        setDeliveryFee(20.00) // Safe fallback
        setFeeZone('General')
      } finally {
        setCalculatingFee(false)
      }
    }

    const timer = setTimeout(updateFee, 500) // Debounce
    return () => clearTimeout(timer)
  }, [coords, area])

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
        lat: coords?.lat,
        lng: coords?.lng,
        payment_method: paymentMethod,
        items: cartItems.map(item => ({
          food_id: item.food_id,
          qty: item.qty
        }))
      }

      const res = await placeOrder(payload)
      clearCart()

      if (paymentMethod === 'pay_on_app' && res.data.payment?.authorization_url) {
        toast.info('Redirecting to payment...', { position: 'top-center' })
        window.location.href = res.data.payment.authorization_url
      } else {
        toast.success('Order placed successfully!', { position: 'top-center' })
        navigate(`/track/${res.data.order_id}`)
      }
      
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
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 items-start">
          
          {/* LEFT COLUMN: Delivery Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 space-y-6">
              {/* Integrated Header removed for cleaner look */}

              {/* USE MY LOCATION BUTTON */}
              {/* Simplified Location Button */}
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors group cursor-pointer" onClick={handleUseLocation}>
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 flex items-center justify-center rounded-lg bg-brand-red text-white transition-transform group-hover:scale-105 ${locating ? 'animate-spin' : ''}`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                       <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 font-inter">{locating ? 'Detecting...' : 'Locate Me'}</p>
                    <p className="text-[10px] text-slate-500 font-inter uppercase tracking-widest">{locating ? 'GPS Active' : 'Auto-detect Address'}</p>
                  </div>
                </div>
                <button className="text-brand-red font-bold text-xs uppercase tracking-widest bg-white px-3 py-1.5 rounded border border-slate-200">Detect</button>
              </div>

              {/* Mini map preview */}
              {showMap && coords && (
                <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500" style={{ height: '240px' }}>
                  <div ref={mapRef} className="h-full w-full" />
                </div>
              )}

              {/* Detected location badge */}
              {coords && address && (
                <div className="flex items-start gap-4 p-4 rounded-lg bg-emerald-50 border border-emerald-100 animate-in zoom-in-95 duration-300">
                  <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-base shrink-0 shadow-sm">✓</div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-inter">Auto-detected Address</p>
                    <p className="text-sm text-emerald-900 mt-1 font-semibold leading-snug font-inter">{address}</p>
                    {area && <p className="text-xs text-emerald-600 mt-1.5 font-bold uppercase tracking-widest font-inter flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      Zone: {area}
                    </p>}
                  </div>
                </div>
              )}

              <div className="h-2"></div>

              <div className="space-y-4">
                <div>
                  <input 
                    id="address"
                    type="text" 
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Full Address / Landmark" 
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-red outline-none font-inter transition-all shadow-sm"
                  />
                </div>
                <div>
                  <input 
                    id="area"
                    type="text" 
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    placeholder="Neighborhood / Area" 
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-red outline-none font-inter transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Review */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 space-y-6">
              <div className="flex items-center justify-between mb-2">
                 <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 font-inter">Order Summary</h2>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cartItems.length} Items</span>
              </div>
              
              <div className="divide-y divide-slate-100">
                {cartItems.map(item => (
                  <div key={item.food_id} className="py-4 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-slate-50 text-xl overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                         {item.image ? (
                           <img src={`${import.meta.env.VITE_API_URL || ''}${item.image}`} alt={item.name} className="h-full w-full object-cover" />
                         ) : (
                           '🍲'
                         )}
                       </div>
                       <div>
                         <p className="font-bold text-sm text-slate-900 leading-tight font-inter">{item.name}</p>
                         <p className="text-xs font-bold text-brand-red mt-1 font-inter uppercase tracking-widest">₵{item.price}</p>
                       </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-2 py-1 border border-slate-200">
                        <button 
                          onClick={() => updateQty(item.food_id, item.qty - 1)}
                          className="h-6 w-6 flex items-center justify-center rounded bg-white text-slate-600 shadow-sm active:scale-75 transition-transform border border-slate-200"
                        >
                          -
                        </button>
                        <span className="font-bold text-sm font-inter w-4 text-center">{item.qty}</span>
                        <button 
                          onClick={() => updateQty(item.food_id, item.qty + 1)}
                          className="h-6 w-6 flex items-center justify-center rounded bg-brand-red text-white shadow-sm active:scale-75 transition-transform"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Invoice Table */}
              <div className="pt-4 space-y-3">
                 <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest font-inter">
                   <span>Subtotal</span>
                   <span className="text-slate-800">₵{total.toFixed(2)}</span>
                 </div>
                 <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest font-inter">
                    <div className="flex items-center gap-2">
                      <span>Delivery</span>
                      {feeZone && (
                        <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[8px] font-bold border border-slate-200">
                          {feeZone}
                        </span>
                      )}
                    </div>
                    <span className={`${calculatingFee ? 'animate-pulse opacity-40' : 'text-emerald-600'} font-bold`}>
                      ₵{deliveryFee.toFixed(2)}
                    </span>
                  </div>
                 <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                   <span className="text-sm font-bold text-slate-900 font-inter uppercase">Grand Total</span>
                   <span className="text-2xl font-bold font-inter text-brand-red tracking-tight">₵{grandTotal.toFixed(2)}</span>
                 </div>
               {/* Payment Method Selector */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-inter">Payment Method</h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* Pay on App */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pay_on_app')}
                    className={`relative p-3 rounded-lg border transition-all duration-200 text-left ${
                      paymentMethod === 'pay_on_app'
                        ? 'border-brand-red bg-red-50'
                        : 'border-slate-200 bg-white hover:border-brand-red/30'
                    }`}
                  >
                    {paymentMethod === 'pay_on_app' && (
                      <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-brand-red flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                    <span className="text-xl block mb-1">📱</span>
                    <p className="text-xs font-bold text-slate-900 font-inter leading-tight">Pay on App</p>
                    <p className="text-[9px] text-slate-500 font-medium font-inter mt-1">MoMo • Card</p>
                  </button>
 
                  {/* Pay in Person */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pay_in_person')}
                    className={`relative p-3 rounded-lg border transition-all duration-200 text-left ${
                      paymentMethod === 'pay_in_person'
                        ? 'border-brand-red bg-red-50'
                        : 'border-slate-200 bg-white hover:border-brand-red/30'
                    }`}
                  >
                    {paymentMethod === 'pay_in_person' && (
                      <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-brand-red flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                    <span className="text-xl block mb-1">💵</span>
                    <p className="text-xs font-bold text-slate-900 font-inter leading-tight">Pay in Person</p>
                    <p className="text-[9px] text-slate-500 font-medium font-inter mt-1">Cash on Delivery</p>
                  </button>
                </div>
              </div>
 </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className={`w-full h-14 flex items-center justify-center rounded-lg text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 ${
                  paymentMethod === 'pay_on_app' 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : 'bg-brand-red hover:bg-brand-dark-red'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="font-bold text-sm font-inter uppercase tracking-widest">
                    {isSubmitting ? 'Processing...' : paymentMethod === 'pay_on_app' ? 'Pay Now' : 'Place Order'}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button (Only on small screens) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 p-4 shadow-lg">
        <button 
          onClick={handlePlaceOrder}
          disabled={isSubmitting}
          className={`w-full max-w-lg mx-auto flex items-center justify-center rounded-lg h-14 text-white shadow-lg active:scale-95 disabled:opacity-50 ${
            paymentMethod === 'pay_on_app' 
              ? 'bg-emerald-600' 
              : 'bg-brand-red'
          }`}
        >
          <span className="font-bold text-sm font-inter uppercase tracking-widest">
            {isSubmitting ? 'Processing...' : paymentMethod === 'pay_on_app' ? 'Pay Now — ₵' + grandTotal.toFixed(2) : 'Place Order — ₵' + grandTotal.toFixed(2)}
          </span>
        </button>
      </div>
    </div>
  )
}
