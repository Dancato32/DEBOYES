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
      } catch (err) {
        setDeliveryFee(20.00)
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
    <div className="min-h-screen bg-[#FDFCF8] pb-10 font-inter text-slate-800">
      {/* Top Header */}
      <div className="px-6 py-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-100 active:scale-90 transition-all">
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex gap-1.5">
           <div className="h-1.5 w-6 rounded-full bg-brand-red opacity-70" />
           <div className="h-1.5 w-2 rounded-full bg-slate-200" />
           <div className="h-1.5 w-2 rounded-full bg-slate-200" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 space-y-8">
        
        {/* DELIVERY DESTINATION */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Delivery Destination</h2>
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-50 pb-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-brand-red/5 flex items-center justify-center text-brand-red shadow-inner">
                   <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                   </svg>
                </div>
                <div>
                   <p className="text-sm font-black text-slate-900 leading-none">Live GPS Detection</p>
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mt-1">Precision Location</p>
                </div>
              </div>
              <button 
                onClick={handleUseLocation}
                className="text-[9px] font-black uppercase tracking-widest px-6 py-3 rounded-xl border border-slate-100 text-slate-200 hover:text-brand-red transition-colors"
              >
                {locating ? '...' : 'Detect'}
              </button>
            </div>

            <div className="space-y-4">
               <div className="space-y-1.5">
                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Street Address</label>
                 <input 
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="e.g. 12th Floor, Trade Tower"
                    className="w-full bg-[#333333] text-white rounded-xl px-4 py-4 text-sm font-bold placeholder:text-slate-500 border-none outline-none ring-offset-2 focus:ring-2 focus:ring-brand-red/20 transition-all"
                 />
               </div>
               <div className="space-y-1.5">
                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Neighbourhood</label>
                 <input 
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    placeholder="e.g. East Legon"
                    className="w-full bg-[#333333] text-white rounded-xl px-4 py-4 text-sm font-bold placeholder:text-slate-500 border-none outline-none ring-offset-2 focus:ring-2 focus:ring-brand-red/20 transition-all"
                 />
               </div>
            </div>
          </div>
        </section>

        {/* PAYMENT METHOD */}
        <section className="space-y-4">
           <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Payment Method</h2>
           <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'card', label: 'Card', icon: '💳' },
                { id: 'mobile', label: 'Mobile', icon: '📱' },
                { id: 'cash', label: 'Cash', icon: '💵' }
              ].map(method => (
                <button 
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-300 ${
                    paymentMethod === method.id 
                    ? 'bg-white border-brand-red shadow-lg shadow-brand-red/5' 
                    : 'bg-white border-slate-50 opacity-60'
                  }`}
                >
                  <span className="text-xl grayscale-[0.5] group-hover:grayscale-0">{method.icon}</span>
                  <span className={`text-[10px] font-bold ${paymentMethod === method.id ? 'text-brand-red' : 'text-slate-400'}`}>{method.label}</span>
                </button>
              ))}
           </div>
        </section>

        {/* ORDER SUMMARY */}
        <section className="space-y-4">
           <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Order Summary</h2>
           <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
              <div className="space-y-4">
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
                      <div className="flex items-center gap-3">
                         <button onClick={() => updateQty(item.food_id, item.qty - 1)} className="h-8 w-8 rounded-lg border border-slate-50 text-slate-200 flex items-center justify-center text-lg font-bold hover:bg-slate-50 transition-colors">−</button>
                         <span className="text-sm font-black w-4 text-center">{item.qty}</span>
                         <button onClick={() => updateQty(item.food_id, item.qty + 1)} className="h-8 w-8 rounded-lg border border-slate-50 text-slate-200 flex items-center justify-center text-lg font-bold hover:bg-slate-50 transition-colors">+</button>
                      </div>
                   </div>
                 ))}
              </div>

              <div className="pt-6 border-t border-dashed border-slate-100 space-y-3">
                 <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span>Subtotal</span>
                    <span>₵{total.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span>Delivery</span>
                    <span className="bg-emerald-50 text-emerald-500 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest">Free</span>
                 </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                 <span className="text-base font-black text-slate-900 italic uppercase">Total</span>
                 <span className="text-2xl font-black text-slate-900 font-inter">₵{grandTotal.toFixed(2)}</span>
              </div>
           </div>
        </section>

        {/* PLACE ORDER BUTTON */}
        <div className="space-y-4 pt-4">
           <button 
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full h-16 bg-[#222222] text-white rounded-2xl flex items-center justify-center gap-4 active:scale-[0.98] transition-all shadow-2xl disabled:opacity-50"
           >
              <span className="text-sm font-black uppercase tracking-[0.2em]">Place order</span>
              <div className="bg-slate-700/50 px-3 py-1.5 rounded-lg text-sm font-black text-white/90">
                 ₵{grandTotal.toFixed(2)}
              </div>
           </button>
           <p className="flex items-center justify-center gap-2 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
              <span>🔒</span> Secured & encrypted checkout
           </p>
        </div>

      </div>
    </div>
  )
}
