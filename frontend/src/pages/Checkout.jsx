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
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-inter mb-4 px-1">Delivery Destination</h2>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 space-y-6">
                {/* USE MY LOCATION BUTTON - Sharper */}
                <div className="flex justify-between items-center bg-slate-50 p-5 rounded-lg border border-slate-100 hover:border-brand-red/30 transition-all group cursor-pointer" onClick={handleUseLocation}>
                  <div className="flex items-center gap-4">
                    <div className={`h-11 w-11 flex items-center justify-center rounded-lg bg-brand-red text-white transition-all group-hover:shadow-lg group-hover:shadow-brand-red/20 ${locating ? 'animate-spin' : ''}`}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                         <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 font-inter">{locating ? 'Detecting...' : 'Live GPS Detection'}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{locating ? 'Fetching Coords' : 'Precision Location'}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-red bg-white border border-slate-200 px-4 py-2 rounded-md group-hover:border-brand-red/50 transition-colors">Detect</span>
                </div>
 
                {/* Mini map preview */}
                {showMap && coords && (
                  <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500" style={{ height: '240px' }}>
                    <div ref={mapRef} className="h-full w-full" />
                  </div>
                )}
 
                {/* Detected location badge */}
                {coords && address && (
                  <div className="flex items-start gap-4 p-5 rounded-lg bg-emerald-50 border border-emerald-100 animate-in zoom-in-95 duration-300">
                    <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-base shrink-0 shadow-sm">✓</div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest font-inter">Verified Address</p>
                      <p className="text-sm text-emerald-900 mt-1 font-bold leading-relaxed font-inter">{address}</p>
                      {area && <p className="text-[9px] text-emerald-600 mt-2 font-black uppercase tracking-widest font-inter flex items-center gap-1.5 bg-emerald-100/50 w-fit px-2 py-0.5 rounded">
                        Zone: {area}
                      </p>}
                    </div>
                  </div>
                )}
 
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block px-1">Street Address</label>
                    <input 
                      id="address"
                      type="text" 
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="e.g. 12th Floor, Trade Tower" 
                      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red/40 outline-none font-inter transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block px-1">Neighborhood</label>
                    <input 
                      id="area"
                      type="text" 
                      value={area}
                      onChange={e => setArea(e.target.value)}
                      placeholder="e.g. East Legon" 
                      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red/40 outline-none font-inter transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </section>
  
          {/* RIGHT COLUMN: Order Review */}
          <div className="space-y-8 lg:sticky lg:top-24">
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-inter mb-4 px-1">Summary</h2>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 space-y-6">
                <div className="divide-y divide-slate-100">
                  {cartItems.map(item => (
                    <div key={item.food_id} className="py-4 flex items-center justify-between group first:pt-0">
                      <div className="flex items-center gap-4">
                         <div className="h-14 w-14 flex items-center justify-center rounded-lg bg-slate-50 text-xl overflow-hidden shrink-0 border border-slate-100">
                           {item.image ? (
                             <img src={`${import.meta.env.VITE_API_URL || ''}${item.image}`} alt={item.name} className="h-full w-full object-cover" />
                           ) : (
                             '🍲'
                           )}
                         </div>
                         <div>
                           <p className="font-bold text-sm text-slate-900 leading-tight font-inter">{item.name}</p>
                           <p className="text-[10px] font-black text-slate-400 mt-1 font-inter uppercase tracking-widest">₵{item.price} × {item.qty}</p>
                         </div>
                      </div>
 
                      <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-1.5 py-1 border border-slate-100">
                        <button 
                          onClick={() => updateQty(item.food_id, item.qty - 1)}
                          className="h-7 w-7 flex items-center justify-center rounded-md bg-white text-slate-600 shadow-sm active:scale-75 transition-transform border border-slate-200 text-sm font-bold"
                        >
                          -
                        </button>
                        <span className="font-black text-xs font-inter w-5 text-center">{item.qty}</span>
                        <button 
                          onClick={() => updateQty(item.food_id, item.qty + 1)}
                          className="h-7 w-7 flex items-center justify-center rounded-md bg-brand-red text-white shadow-sm active:scale-75 transition-transform text-sm font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
 
                {/* Invoice Table */}
                <div className="pt-4 space-y-4 border-t border-slate-100">
                   <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">
                     <span>Subtotal</span>
                     <span className="text-slate-900">₵{total.toFixed(2)}</span>
                   </div>
                   <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">
                      <div className="flex items-center gap-2">
                        <span>Delivery</span>
                        {feeZone && (
                          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[8px] font-black border border-slate-200">
                            {feeZone}
                          </span>
                        )}
                      </div>
                      <span className={`${calculatingFee ? 'animate-pulse opacity-40' : 'text-emerald-600'} font-black`}>
                        ₵{deliveryFee.toFixed(2)}
                      </span>
                    </div>
                   <div className="pt-4 flex items-center justify-between">
                     <span className="text-xs font-black text-slate-900 font-inter uppercase tracking-widest">Total</span>
                     <span className="text-3xl font-black font-inter text-brand-red tracking-tighter italic">₵{grandTotal.toFixed(2)}</span>
                   </div>
                </div>
 
                {/* Payment Method Selector */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-inter">Payment Method</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('pay_on_app')}
                      className={`relative flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                        paymentMethod === 'pay_on_app'
                          ? 'border-brand-red bg-brand-red/5 ring-1 ring-brand-red'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-xl">📱</span>
                        <div>
                          <p className="text-xs font-black text-slate-900 font-inter uppercase tracking-widest">Pay in App</p>
                          <p className="text-[9px] text-slate-500 font-bold font-inter mt-0.5 uppercase tracking-widest">Mobile Money • Bank Cards</p>
                        </div>
                      </div>
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        paymentMethod === 'pay_on_app' ? 'border-brand-red bg-brand-red' : 'border-slate-200'
                      }`}>
                        {paymentMethod === 'pay_on_app' && <div className="h-2 w-2 bg-white rounded-full" />}
                      </div>
                    </button>
   
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('pay_in_person')}
                      className={`relative flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                        paymentMethod === 'pay_in_person'
                          ? 'border-brand-red bg-brand-red/5 ring-1 ring-brand-red'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-xl">💵</span>
                        <div>
                          <p className="text-xs font-black text-slate-900 font-inter uppercase tracking-widest">Pay in Person</p>
                          <p className="text-[9px] text-slate-500 font-bold font-inter mt-0.5 uppercase tracking-widest">Cash on Delivery</p>
                        </div>
                      </div>
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        paymentMethod === 'pay_in_person' ? 'border-brand-red bg-brand-red' : 'border-slate-200'
                      }`}>
                        {paymentMethod === 'pay_in_person' && <div className="h-2 w-2 bg-white rounded-full" />}
                      </div>
                    </button>
                  </div>
                </div>
 
                <button 
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className={`w-full h-16 flex items-center justify-center rounded-lg shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 mt-4 ${
                    paymentMethod === 'pay_on_app' 
                      ? 'bg-slate-900 hover:bg-black text-white' 
                      : 'bg-brand-red hover:bg-brand-dark-red text-brand-yellow'
                  }`}
                >
                  <span className="font-black text-xs font-inter uppercase tracking-[0.25em]">
                    {isSubmitting ? 'Processing...' : paymentMethod === 'pay_on_app' ? 'Proceed to Payment' : 'Confirm Order'}
                  </span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button (Only on small screens) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 p-4 shadow-lg">
        <button 
          onClick={handlePlaceOrder}
          disabled={isSubmitting}
          className={`w-full max-w-lg mx-auto flex items-center justify-center rounded-lg h-14 shadow-lg active:scale-95 disabled:opacity-50 ${
            paymentMethod === 'pay_on_app' 
              ? 'bg-slate-900 text-white' 
              : 'bg-brand-red text-brand-yellow'
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
