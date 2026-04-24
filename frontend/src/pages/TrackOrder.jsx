import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchOrderDetails } from '../services/api'
import useOrderTracking from '../hooks/useOrderTracking'
import MapTracker from '../components/MapTracker'
import BottomNav from '../components/BottomNav'
import ChatDialog from '../components/ChatDialog'
import { toast } from 'react-toastify'
import { AnimatePresence } from 'framer-motion'


export default function TrackOrder() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showChat, setShowChat] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { position, connected, incomingMessage } = useOrderTracking(orderId)

  // Track incoming WebSocket messages
  useEffect(() => {
    if (incomingMessage) {
      if (!showChat) setUnreadCount(prev => prev + 1)
    }
  }, [incomingMessage])

  useEffect(() => {
    if (showChat) setUnreadCount(0)
  }, [showChat])

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
  const showMap = order?.status === 'on_the_way' || order?.status === 'delivered'

  const getStatusDisplay = (stepIndex) => {
    if (stepIndex < statusLevel) return { label: 'Done', color: 'text-brand-red' }
    if (stepIndex === statusLevel) return { label: 'Now', color: 'text-brand-red font-black' }
    return { label: '', color: 'text-slate-200' }
  }

  const calculateProgress = () => {
    if (!order) return 0
    if (order.status === 'delivered') return 100
    if (order.status === 'on_the_way') {
       if (!position || !order.restaurant_lat || !order.lat) return 60 // Default on the way
       const totalDist = Math.sqrt(Math.pow(order.lat - order.restaurant_lat, 2) + Math.pow(order.lng - order.restaurant_lng, 2))
       const riderDist = Math.sqrt(Math.pow(position.lat - order.restaurant_lat, 2) + Math.pow(position.lng - order.restaurant_lng, 2))
       return Math.min(95, Math.max(60, (riderDist / totalDist) * 100))
    }
    const map = { new: 10, pending: 25, assigned: 40, ready: 55 }
    return map[order.status] || 10
  }

  const progressPercent = calculateProgress()

  if (loading && !order) return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-10">
      <div className="text-center space-y-4">
        <div className="h-12 w-12 rounded-full border-4 border-brand-red border-t-transparent animate-spin mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Locating Shipment...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-brand-cream font-inter text-slate-800 pb-24 relative overflow-hidden">
      {/* Background Watermark */}
      <div className="fixed top-20 -right-20 opacity-[0.03] pointer-events-none rotate-12">
        <img src="/logo.png" alt="" className="h-[600px] w-[600px] object-contain" />
      </div>

      {/* HEADER */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-brand-cream/80 backdrop-blur-md z-[100]">
        <button onClick={() => navigate(-1)} className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-100 active:scale-90 transition-all">
          <svg className="w-5 h-5 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold text-slate-800">My order</h1>
        <div className="flex items-center gap-1.5 bg-brand-red/5 px-3 py-1 rounded-full">
           <div className="h-1.5 w-1.5 rounded-full bg-brand-red animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest text-brand-red">Live</span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 space-y-6 relative z-10">
        {/* TABS */}
        <div className="bg-white/50 backdrop-blur-sm p-1.5 rounded-full flex items-center gap-1 border border-white/20">
           <button 
             onClick={() => navigate('/history')}
             className="flex-1 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest text-slate-400"
           >
             Past
           </button>
           <button className="flex-1 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest bg-brand-red text-white shadow-lg shadow-brand-red/20">
             Active
           </button>
        </div>

        {/* STATUS CARD */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-brand-red/5 space-y-8 relative overflow-hidden">
           <div className="flex justify-between items-start">
              <div className="flex items-baseline gap-2">
                 <span className="text-6xl font-black text-slate-900 tracking-tighter">
                   {order?.status === 'on_the_way' ? (order?.eta || '12') : '18'}
                 </span>
                 <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">min</span>
              </div>
              <div className="text-right">
                 <p className="text-sm font-black text-slate-900">{currentStatusLabel}</p>
                 <p className="text-[10px] font-bold text-brand-red uppercase tracking-widest mt-1">Ready for pickup</p>
              </div>
           </div>

           {/* VERTICAL TIMELINE */}
           <div className="space-y-6 relative pl-4">
              <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100" />
              {[
                { title: 'Order confirmed', time: '10:42 am · DeBoye\'s Kitchen' },
                { title: 'Preparing your food', time: 'Kitchen is cooking now' },
                { title: 'Rider picking up', time: 'Courier on the way to kitchen' },
                { title: 'Delivered to you', time: 'Destination reached' }
              ].map((step, idx) => {
                const status = getStatusDisplay(idx)
                const isCompleted = idx <= statusLevel
                const isCurrent = idx === statusLevel

                return (
                  <div key={idx} className="flex justify-between items-start relative">
                    <div className="flex gap-6">
                       <div className={`z-10 h-3 w-3 rounded-full mt-1.5 border-2 transition-all duration-500 ${
                         isCompleted ? 'bg-brand-red border-brand-red scale-125' : 'bg-white border-slate-200'
                       } ${isCurrent ? 'ring-4 ring-brand-red/20' : ''}`} />
                       <div>
                          <p className={`text-sm font-bold leading-tight ${isCompleted ? 'text-slate-800' : 'text-slate-300'}`}>{step.title}</p>
                          <p className="text-[10px] font-medium text-slate-300 mt-1">{step.time}</p>
                       </div>
                    </div>
                    {status.label && <span className={`text-[10px] font-black uppercase tracking-widest ${status.color}`}>{status.label}</span>}
                  </div>
                )
              })}
           </div>

           {/* HORIZONTAL PROGRESS */}
           <div className="pt-8 border-t border-slate-50">
              <div className="bg-brand-red/[0.02] rounded-3xl p-8 space-y-6 border border-brand-red/[0.05]">
                 <div className="relative h-1.5 bg-slate-100 rounded-full">
                    <div 
                      className="absolute left-0 top-0 h-full bg-brand-red rounded-full transition-all duration-1000 ease-linear" 
                      style={{ width: `${progressPercent}%` }}
                    />
                    <div className="absolute -top-1.5 left-0 h-4 w-4 rounded-full bg-brand-charcoal border-4 border-white shadow-sm" />
                    <div 
                      className="absolute -top-2.5 h-6.5 w-6.5 rounded-full bg-brand-red border-4 border-white shadow-xl transition-all duration-1000 ease-linear" 
                      style={{ left: `calc(${progressPercent}% - 13px)` }}
                    />
                    <div className="absolute -top-1.5 right-0 h-4 w-4 rounded-full bg-brand-red border-4 border-white" />
                 </div>
                 <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                    <span className="text-brand-red">DeBoye's</span>
                    <span>Your door</span>
                 </div>
              </div>
           </div>
        </div>

        {/* COURIER CARD */}
        <div className="bg-white rounded-[2rem] p-4 shadow-soft border border-brand-red/5 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-brand-cream flex items-center justify-center text-sm font-black text-brand-red border border-brand-red/10">
                 {order?.rider?.slice(0, 2).toUpperCase() || 'RI'}
              </div>
              <div>
                 <p className="text-sm font-black text-slate-800 leading-tight">{order?.rider || 'Courier Team'}</p>
                 <p className="text-[9px] font-black uppercase tracking-widest text-brand-red mt-1">Master Delivery Partner</p>
              </div>
           </div>
           <div className="flex gap-2">
              <button 
                onClick={() => setShowChat(true)}
                className="h-12 w-12 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-red transition-all shadow-sm active:scale-90"
              >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </button>
              <a href={`tel:${order?.rider_phone || '+233000000000'}`} className="h-12 w-12 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-red transition-all shadow-sm active:scale-90">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </a>
           </div>
        </div>

        {/* ORDER SUMMARY */}
        <div className="bg-white rounded-[2rem] p-8 shadow-soft border border-brand-red/5 space-y-6">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order summary</h3>
           <div className="space-y-4">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Item</span>
                 <span className="text-sm font-black text-slate-800">{order?.items_summary || 'Order Items'}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Order ID</span>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#DBK-{order?.id?.toString().slice(-4) || '4821'}</span>
              </div>
           </div>
           <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total paid</span>
              <span className="text-lg font-black text-brand-red font-inter tracking-tight">₵{order?.total_price || '0.00'}</span>
           </div>
        </div>

        {/* MAP TOGGLE BUTTON */}
        {showMap && (
           <button 
              onClick={() => navigate(`/map-track/${orderId}`)} 
              className="w-full py-5 bg-brand-charcoal text-brand-yellow rounded-3xl text-[10px] font-black uppercase tracking-[0.4em] shadow-xl active:scale-95 transition-all border border-brand-red/10"
           >
              Open Live Tracking Map
           </button>
        )}
      </div>

      <AnimatePresence>
        {showChat && (
          <ChatDialog 
            orderId={orderId}
            orderStatus={order?.status}
            onClose={() => setShowChat(false)}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}
