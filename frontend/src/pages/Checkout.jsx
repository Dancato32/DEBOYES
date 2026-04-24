import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { placeOrder, estimateFee } from '../services/api'
import { toast } from '../utils/soundToast'
import L from 'leaflet'

export default function Checkout() {
  const navigate = useNavigate()
  const { cartItems, updateQty, total, clearCart } = useCart()

  const [address, setAddress] = useState('')
  const [area, setArea] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('pay_in_person') // 'pay_on_app', 'pay_in_person'
  const [locating, setLocating] = useState(false)
  const [coords, setCoords] = useState(null)
  const [showMap, setShowMap] = useState(false)

  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)

  const [deliveryFee, setDeliveryFee] = useState(0)
  const [feeZone, setFeeZone] = useState('')
  const [deliveryMeta, setDeliveryMeta] = useState(null)
  const [calculatingFee, setCalculatingFee] = useState(false)

  const grandTotal = total > 0 ? total + (deliveryFee || 0) : 0

  // On mount: pre-fill from cached location (set by LocationRequest on app open)
  useEffect(() => {
    const cached = localStorage.getItem('saved_location')
    if (cached) {
      try {
        const { lat, lng, address: savedAddress, area: savedArea } = JSON.parse(cached)
        if (savedAddress) setAddress(savedAddress)
        if (savedArea) setArea(savedArea)
        if (lat && lng) setCoords({ lat, lng })
      } catch (e) {
        console.error('Failed to parse saved location', e)
      }
    }
  }, [])

  const handleUseLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setCoords({ lat, lng })
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`)
          const data = await res.json()
          if (data?.display_name) {
            const addr = data.address || {}
            const parts = [addr.road, addr.house_number, addr.neighbourhood || addr.suburb].filter(Boolean)
            const newAddress = parts.join(', ') || data.display_name.split(',')[0]
            const newArea = addr.suburb || addr.neighbourhood || addr.city_district || addr.city || ''
            setAddress(newAddress)
            setArea(newArea)
            // Refresh the cached location with the latest detection
            localStorage.setItem('saved_location', JSON.stringify({ lat, lng, address: newAddress, area: newArea }))
          }
        } catch (err) {
          console.error(err)
        }
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true }
    )
  }

  useEffect(() => {
    const updateFee = async () => {
      if (!coords && !area) return
      setCalculatingFee(true)
      try {
        const res = await estimateFee({ lat: coords?.lat, lng: coords?.lng, area })
        setDeliveryFee(res.data.fee)
        setFeeZone(res.data.zone)
        setDeliveryMeta(res.data)
      } catch (err) {
        setDeliveryFee(20.00)
        setDeliveryMeta(null)
      } finally {
        setCalculatingFee(false)
      }
    }
    const timer = setTimeout(updateFee, 500)
    return () => clearTimeout(timer)
  }, [coords, area])

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0 || !address.trim() || !area.trim()) {
      toast.error('Please fill in all details')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await placeOrder({
        address,
        area,
        total_price: grandTotal.toFixed(2),
        lat: coords?.lat,
        lng: coords?.lng,
        payment_method: paymentMethod,
        items: cartItems.map(i => ({ food_id: i.food_id, qty: i.qty }))
      })
      clearCart()
      toast.success('Order placed!')
      navigate(`/track/${res.data.order_id}`)
    } catch (err) {
      toast.error('Failed to place order')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (cartItems.length === 0 && !isSubmitting) {
    return <div className="p-10 text-center font-inter">Cart is empty.</div>
  }

  return (
    <div className="min-h-screen bg-brand-cream pb-12 font-inter text-slate-800 relative overflow-hidden">
      {/* Background Watermark */}
      <div className="fixed top-20 -right-20 opacity-[0.03] pointer-events-none rotate-12">
        <img src="/logo.png" alt="" className="h-[600px] w-[600px] object-contain" />
      </div>

      {/* Top Header */}
      <div className="px-6 py-8 flex items-center justify-between sticky top-0 bg-brand-cream/90 backdrop-blur-xl z-[100] border-b border-white/20">
        <button onClick={() => navigate(-1)} className="h-11 w-11 rounded-full bg-white shadow-sm flex items-center justify-center border border-white active:scale-90 transition-all">
          <svg className="w-5 h-5 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex flex-col items-center">
           <img src="/logo.png" alt="Logo" className="h-7 w-auto object-contain mb-1" />
           <div className="flex gap-1">
              <div className="h-1 w-8 rounded-full bg-brand-red" />
              <div className="h-1 w-2 rounded-full bg-brand-red/10" />
           </div>
        </div>
        <div className="w-11"></div>
      </div>

      <div className="max-w-md mx-auto px-6 space-y-10 mt-6 relative z-10">
        
        {/* DELIVERY DESTINATION */}
        <section className="space-y-5">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-red/60 px-1 font-outfit">Delivery Destination</h2>
          <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/80 shadow-premium space-y-8">
            <div className="flex items-center justify-between border-b border-slate-50 pb-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-brand-red flex items-center justify-center text-brand-yellow shadow-brand">
                   <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                   </svg>
                </div>
                <div>
                   <p className="text-sm font-black text-slate-900 leading-none font-outfit">Live GPS Detection</p>
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mt-2">Satellite Precision</p>
                </div>
              </div>
              <button 
                onClick={handleUseLocation}
                className={`text-[9px] font-black uppercase tracking-widest px-6 py-3 rounded-xl border transition-all ${
                  locating ? 'bg-slate-50 text-slate-300 border-slate-50' : 'bg-white border-slate-100 text-brand-red hover:bg-brand-red hover:text-white hover:border-brand-red'
                }`}
              >
                {locating ? 'Detecting...' : 'Detect'}
              </button>
            </div>

            <div className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Street Address</label>
                 <input 
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="e.g. 12th Floor, Trade Tower"
                    className="w-full bg-slate-50/50 border-white focus:bg-white text-slate-900 font-bold"
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Neighbourhood</label>
                 <input 
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    placeholder="e.g. East Legon"
                    className="w-full bg-slate-50/50 border-white focus:bg-white text-slate-900 font-bold"
                 />
               </div>
            </div>
          </div>
        </section>

        {/* PAYMENT METHOD */}
        <section className="space-y-5">
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-red/60 px-1 font-outfit">Payment Method</h2>
           <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'pay_on_app', label: 'Pay on App', icon: '📱' },
                { id: 'pay_in_person', label: 'Pay in Person', icon: '💵' }
              ].map(method => (
                <button 
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] border transition-all duration-500 ${
                    paymentMethod === method.id 
                    ? 'bg-brand-red border-brand-red shadow-brand' 
                    : 'bg-white/60 border-white opacity-80 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <span className={`text-2xl transition-all duration-300 ${paymentMethod === method.id ? 'brightness-0 invert scale-110' : ''}`}>{method.icon}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${paymentMethod === method.id ? 'text-brand-yellow' : 'text-slate-400'}`}>{method.label}</span>
                </button>
              ))}
           </div>
        </section>

        {/* ORDER SUMMARY */}
        <section className="space-y-5">
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-red/60 px-1 font-outfit">Order Summary</h2>
           <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/60 shadow-premium space-y-8">
              <div className="space-y-5 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                 {cartItems.map(item => (
                   <div key={item.food_id} className="flex items-center justify-between gap-4 group">
                      <div className="flex items-center gap-4">
                         <div className="h-16 w-16 rounded-2xl bg-brand-cream/50 flex items-center justify-center text-2xl border border-white overflow-hidden shrink-0 shadow-sm transition-transform group-hover:scale-105">
                           {item.image ? <img src={`${import.meta.env.VITE_API_URL || ''}${item.image}`} className="h-full w-full object-cover" /> : '🍲'}
                         </div>
                         <div>
                            <p className="text-[15px] font-black text-slate-900 leading-tight tracking-tight font-outfit">{item.name}</p>
                            <p className="text-[10px] font-bold text-slate-300 mt-1.5 uppercase tracking-widest">₵{item.price} × {item.qty}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3 bg-brand-cream/40 p-1 rounded-xl border border-white/50">
                         <button onClick={() => updateQty(item.food_id, item.qty - 1)} className="h-8 w-8 rounded-lg bg-white shadow-sm text-slate-400 flex items-center justify-center text-lg font-bold hover:text-brand-red transition-all active:scale-90">−</button>
                         <span className="text-sm font-black w-4 text-center font-outfit">{item.qty}</span>
                         <button onClick={() => updateQty(item.food_id, item.qty + 1)} className="h-8 w-8 rounded-lg bg-white shadow-sm text-slate-400 flex items-center justify-center text-lg font-bold hover:text-brand-red transition-all active:scale-90">+</button>
                      </div>
                   </div>
                 ))}
              </div>

              <div className="pt-8 border-t border-dashed border-slate-100 space-y-4">
                 <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    <span>Subtotal</span>
                    <span className="text-slate-900 font-outfit">₵{total.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    <div className="flex flex-col gap-1.5">
                       <div className="flex items-center gap-2">
                          <span>Delivery</span>
                          {feeZone && <span className="bg-brand-red/5 text-brand-red px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-widest">{feeZone}</span>}
                       </div>
                       {deliveryMeta && (
                         <div className="flex items-center gap-3 text-[9px] opacity-60 font-black uppercase tracking-widest text-slate-400">
                            <span className="flex items-center gap-1"><span className="text-[10px]">📍</span> {deliveryMeta.distance_km}km</span>
                            <span className="flex items-center gap-1"><span className="text-[10px]">⏱️</span> {deliveryMeta.eta_mins}min</span>
                         </div>
                       )}
                    </div>
                    <span className={`${calculatingFee ? 'animate-pulse text-slate-200' : 'text-brand-red'} font-outfit font-black`}>
                      {deliveryFee === 0 && !calculatingFee ? 'FREE' : `₵${deliveryFee.toFixed(2)}`}
                    </span>
                 </div>
              </div>

              <div className="pt-6 flex justify-between items-center border-t border-slate-50">
                 <span className="text-[13px] font-black text-slate-400 uppercase tracking-[0.2em] font-outfit">Total Payable</span>
                 <span className="text-4xl font-black text-slate-900 font-outfit tracking-tighter italic">₵{grandTotal.toFixed(2)}</span>
              </div>
           </div>
        </section>

        {/* PLACE ORDER BUTTON */}
        <div className="space-y-5 pt-4">
           <button 
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full h-20 bg-brand-red text-brand-yellow rounded-3xl flex items-center justify-between px-8 active:scale-[0.96] transition-all shadow-brand disabled:opacity-50 group relative overflow-hidden"
           >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-[13px] font-black uppercase tracking-[0.3em] relative z-10">{isSubmitting ? 'Processing...' : 'Place order'}</span>
              <div className="bg-brand-yellow text-brand-red px-6 py-2.5 rounded-2xl text-[15px] font-black italic relative z-10 shadow-lg group-hover:scale-105 transition-transform font-outfit">
                 ₵{grandTotal.toFixed(2)}
              </div>
           </button>
           <p className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
              <span className="text-emerald-500 scale-125">🔒</span> Secured checkout
           </p>
        </div>

      </div>
    </div>
  )
}
