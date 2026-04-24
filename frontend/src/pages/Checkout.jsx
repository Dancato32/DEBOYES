import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { placeOrder, estimateFee } from '../services/api'
import { toast } from 'react-toastify'
import L from 'leaflet'

export default function Checkout() {
  const navigate = useNavigate()
  const { cartItems, updateQty, total, clearCart } = useCart()

  const [address, setAddress] = useState('')
  const [area, setArea] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash') // 'card', 'mobile', 'cash'
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

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`)
      const data = await res.json()
      if (data?.display_name) {
        const addr = data.address || {}
        const parts = [addr.road, addr.house_number, addr.neighbourhood || addr.suburb].filter(Boolean)
        setAddress(parts.join(', '))
        setArea(addr.suburb || addr.neighbourhood || addr.city_district || addr.city || '')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleUseLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setCoords({ lat, lng })
        setShowMap(true)
        await reverseGeocode(lat, lng)
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
        payment_method: paymentMethod === 'card' ? 'pay_on_app' : 'pay_in_person',
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
    <div className="min-h-screen bg-brand-cream pb-10 font-inter text-slate-800 relative overflow-hidden">
      {/* Background Watermark */}
      <div className="fixed top-20 -right-20 opacity-[0.02] pointer-events-none rotate-12">
        <img src="/logo.png" alt="" className="h-[600px] w-[600px] object-contain" />
      </div>

      {/* Top Header */}
      <div className="px-6 py-8 flex items-center justify-between sticky top-0 bg-brand-cream/80 backdrop-blur-md z-[100]">
        <button onClick={() => navigate(-1)} className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-100 active:scale-90 transition-all">
          <svg className="w-5 h-5 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex flex-col items-center">
           <img src="/logo.png" alt="Logo" className="h-6 w-auto object-contain mb-1" />
           <div className="flex gap-1.5">
              <div className="h-1 w-6 rounded-full bg-brand-red" />
              <div className="h-1 w-2 rounded-full bg-brand-red/20" />
           </div>
        </div>
        <div className="w-12"></div>
      </div>

      <div className="max-w-md mx-auto px-6 space-y-8 relative z-10">
        
        {/* DELIVERY DESTINATION */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-red">Delivery Destination</h2>
          <div className="bg-white rounded-[2rem] p-6 border border-brand-red/5 shadow-soft space-y-6">
            <div className="flex items-center justify-between border-b border-slate-50 pb-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-brand-red flex items-center justify-center text-brand-yellow shadow-lg shadow-brand-red/20">
                   <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                   </svg>
                </div>
                <div>
                   <p className="text-sm font-black text-slate-900 leading-none">Live GPS Detection</p>
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mt-1">Satellite Precision</p>
                </div>
              </div>
              <button 
                onClick={handleUseLocation}
                className={`text-[9px] font-black uppercase tracking-widest px-6 py-3 rounded-xl border transition-all ${
                  locating ? 'bg-slate-50 text-slate-300' : 'bg-white border-slate-100 text-brand-red hover:bg-brand-red hover:text-white'
                }`}
              >
                {locating ? 'Detecting...' : 'Detect'}
              </button>
            </div>

            <div className="space-y-4">
               <div className="space-y-1.5">
                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Street Address</label>
                 <input 
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="e.g. 12th Floor, Trade Tower"
                    className="w-full bg-brand-deep-dark text-white rounded-2xl px-5 py-4 text-sm font-bold placeholder:text-slate-600 border-none outline-none ring-offset-2 focus:ring-2 focus:ring-brand-red/40 transition-all"
                 />
               </div>
               <div className="space-y-1.5">
                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Neighbourhood</label>
                 <input 
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    placeholder="e.g. East Legon"
                    className="w-full bg-brand-deep-dark text-white rounded-2xl px-5 py-4 text-sm font-bold placeholder:text-slate-600 border-none outline-none ring-offset-2 focus:ring-2 focus:ring-brand-red/40 transition-all"
                 />
               </div>
            </div>
          </div>
        </section>

        {/* PAYMENT METHOD */}
        <section className="space-y-4">
           <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-red">Payment Method</h2>
           <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'card', label: 'Card', icon: '💳' },
                { id: 'mobile', label: 'Mobile', icon: '📱' },
                { id: 'cash', label: 'Cash', icon: '💵' }
              ].map(method => (
                <button 
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border transition-all duration-300 ${
                    paymentMethod === method.id 
                    ? 'bg-brand-red border-brand-red shadow-xl shadow-brand-red/20' 
                    : 'bg-white border-slate-50 opacity-60 hover:opacity-100 hover:border-slate-200'
                  }`}
                >
                  <span className={`text-xl ${paymentMethod === method.id ? 'brightness-0 invert' : ''}`}>{method.icon}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${paymentMethod === method.id ? 'text-brand-yellow' : 'text-slate-400'}`}>{method.label}</span>
                </button>
              ))}
           </div>
        </section>

        {/* ORDER SUMMARY */}
        <section className="space-y-4">
           <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-red">Order Summary</h2>
           <div className="bg-white rounded-[2rem] p-6 border border-brand-red/5 shadow-soft space-y-6">
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                 {cartItems.map(item => (
                   <div key={item.food_id} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                         <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl border border-slate-50 overflow-hidden shrink-0">
                           {item.image ? <img src={`${import.meta.env.VITE_API_URL || ''}${item.image}`} className="h-full w-full object-cover" /> : '🍲'}
                         </div>
                         <div>
                            <p className="text-sm font-black text-slate-900 leading-tight">{item.name}</p>
                            <p className="text-[10px] font-bold text-slate-300 mt-1 uppercase tracking-widest">₵{item.price} × {item.qty}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl">
                         <button onClick={() => updateQty(item.food_id, item.qty - 1)} className="h-8 w-8 rounded-lg bg-white shadow-sm text-slate-400 flex items-center justify-center text-lg font-bold hover:text-brand-red transition-colors">−</button>
                         <span className="text-sm font-black w-4 text-center">{item.qty}</span>
                         <button onClick={() => updateQty(item.food_id, item.qty + 1)} className="h-8 w-8 rounded-lg bg-white shadow-sm text-slate-400 flex items-center justify-center text-lg font-bold hover:text-brand-red transition-colors">+</button>
                      </div>
                   </div>
                 ))}
              </div>

              <div className="pt-6 border-t border-dashed border-slate-100 space-y-3">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Subtotal</span>
                    <span className="text-slate-900 font-inter">₵{total.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <div className="flex flex-col gap-1">
                       <div className="flex items-center gap-2">
                          <span>Delivery</span>
                          {feeZone && <span className="bg-brand-red/5 text-brand-red px-2 py-0.5 rounded text-[8px] tracking-normal">{feeZone}</span>}
                       </div>
                       {deliveryMeta && (
                         <div className="flex items-center gap-2 text-[8px] opacity-60 normal-case tracking-normal">
                            <span>📍 {deliveryMeta.distance_km} km</span>
                            <span>⏱️ {deliveryMeta.eta_mins} mins</span>
                         </div>
                       )}
                    </div>
                    <span className={`${calculatingFee ? 'animate-pulse' : 'text-brand-red'} font-inter`}>
                      {deliveryFee === 0 && !calculatingFee ? 'FREE' : `₵${deliveryFee.toFixed(2)}`}
                    </span>
                 </div>
              </div>

              <div className="pt-4 flex justify-between items-center border-t border-slate-50">
                 <span className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] italic">Total Payable</span>
                 <span className="text-3xl font-black text-slate-900 font-inter tracking-tighter italic">₵{grandTotal.toFixed(2)}</span>
              </div>
           </div>
        </section>

        {/* PLACE ORDER BUTTON */}
        <div className="space-y-4 pt-4">
           <button 
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full h-16 bg-brand-red text-brand-yellow rounded-2xl flex items-center justify-center gap-4 active:scale-[0.98] transition-all shadow-xl shadow-brand-red/20 disabled:opacity-50"
           >
              <span className="text-sm font-black uppercase tracking-[0.25em]">{isSubmitting ? 'Processing...' : 'Place order'}</span>
              <div className="bg-brand-yellow text-brand-red px-4 py-1.5 rounded-xl text-sm font-black italic">
                 ₵{grandTotal.toFixed(2)}
              </div>
           </button>
           <p className="flex items-center justify-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
              <span className="text-emerald-500">🔒</span> Secured & encrypted checkout
           </p>
        </div>

      </div>
    </div>
  )
}
