import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchOrderDetails } from '../services/api'
import useOrderTracking from '../hooks/useOrderTracking'
import MapTracker from '../components/MapTracker'
import BottomNav from '../components/BottomNav'
import { toast } from 'react-toastify'

// Simulated destination — in production you'd geocode the actual delivery address
const DESTINATION = { lat: 5.5580, lng: -0.1920 }

export default function TrackOrder() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const { position, connected } = useOrderTracking(orderId)

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true)
      try {
        const response = await fetchOrderDetails(orderId)
        setOrder(response.data)
      } catch (error) {
        toast.error('Unable to load order details')
      } finally {
        setLoading(false)
      }
    }
    loadOrder()

    // Poll for updates
    const interval = setInterval(loadOrder, 10000)
    return () => clearInterval(interval)
  }, [orderId])

  const statusSteps = [
    { label: 'Order Received',   desc: 'Your order has been received', icon: '📋' },
    { label: 'Being Prepared',   desc: 'Restaurant is preparing your food', icon: '👨‍🍳' },
    { label: 'Rider Assigned',   desc: 'A rider has been assigned to you', icon: '🛵' },
    { label: 'Food Ready',       desc: 'Food is ready for pickup', icon: '✅' },
    { label: 'On The Way',       desc: 'Rider is heading to you now', icon: '🚀' },
    { label: 'Delivered',        desc: 'Order delivered successfully', icon: '🎉' },
  ]

  const getStatusLevel = () => {
    if (!order) return -1
    const map = { new: 0, pending: 1, assigned: 2, ready: 3, on_the_way: 4, delivered: 5 }
    return map[order.status] ?? -1
  }

  const statusLevel = getStatusLevel()
  const currentStatusDesc = statusSteps[statusLevel]?.desc || 'Updating status...'
  const currentStatusLabel = statusSteps[statusLevel]?.label || 'Tracking Order'

  // Progress segments logic
  const segments = [1, 2, 3, 4, 5, 6]

  if (loading && !order) return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-10">
      <div className="text-center space-y-4">
        <div className="h-12 w-12 rounded-full border-4 border-brand-red border-t-transparent animate-spin mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Locating Shipment...</p>
      </div>
    </div>
  )

  return (
    <div className="h-screen w-screen bg-white relative overflow-hidden font-dmsans">
      {/* FULL BLEED MAP BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <MapTracker
          position={position}
          destination={DESTINATION}
          restaurant={{ lat: 5.5500, lng: -0.2000 }} // Simulated restaurant
          darkMode={false}
        />
      </div>

      {/* TOP TABS NAVIGATION */}
      <div className="absolute top-4 left-0 right-0 z-50 flex justify-center px-6">
        <div className="bg-white/90 backdrop-blur-xl rounded-full p-1.5 shadow-2xl flex items-center gap-1 border border-white/20">
          <button 
            onClick={() => navigate('/history')}
            className="px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
          >
            Past
          </button>
          <button className="px-10 py-2.5 rounded-full text-xs font-black uppercase tracking-widest bg-brand-red text-white shadow-lg shadow-brand-red/20 transition-all">
            Active
          </button>
        </div>
      </div>

      {/* FLOATING STATUS CARD (TOP) */}
      <div className="absolute top-24 left-6 right-6 z-50">
        <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black font-playfair text-slate-800">
                {order?.batch_info?.is_batched ? Math.max(5, order.batch_info.estimated_wait + 5) : 12}
              </span>
              <span className="text-sm font-black text-slate-400 uppercase tracking-widest">min</span>
            </div>
            <div className="text-right">
              <p className="text-base font-black text-slate-800 leading-tight">{currentStatusLabel}</p>
              <p className="text-[10px] font-bold text-slate-400 truncate uppercase mt-0.5">{currentStatusDesc}</p>
            </div>
          </div>

          {/* SEGMENTED PROGRESS BAR */}
          <div className="flex gap-1.5 h-1.5 w-full">
            {segments.map((s, i) => (
              <div 
                key={i} 
                className={`flex-1 rounded-full transition-all duration-700 ${
                  i <= statusLevel ? 'bg-[#526DFF]' : 'bg-slate-100'
                }`} 
              />
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between text-slate-400 group cursor-pointer border-t border-slate-50 pt-5">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-slate-50 flex items-center justify-center text-xs border border-slate-100">ℹ</div>
              <span className="text-xs font-black uppercase tracking-widest">Order details</span>
            </div>
            <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* COURIER INFO CARD (BOTTOM) */}
      <div className="absolute bottom-28 left-6 right-6 z-50">
        <div className="bg-white rounded-[2rem] p-4 shadow-2xl border border-slate-100 flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-slate-50 overflow-hidden relative border border-slate-100 shrink-0">
             <img 
               src={`https://ui-avatars.com/api/?name=${order?.rider || 'Rider'}&background=random&color=fff`} 
               alt="Rider"
               className="h-full w-full object-cover"
             />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-slate-800">{order?.rider || 'Courier Team'}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Master Delivery Partner</p>
          </div>
          <a 
            href={`tel:+233000000000`}
            className="h-12 w-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-red transition-all shadow-sm active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </a>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
