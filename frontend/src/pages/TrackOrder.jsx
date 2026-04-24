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

  const getStatusDisplay = (stepIndex) => {
    if (stepIndex < statusLevel) return { label: 'Done', color: 'text-brand-red' }
    if (stepIndex === statusLevel) return { label: 'Now', color: 'text-brand-red font-black' }
    return { label: '', color: 'text-slate-200' }
  }

  if (loading && !order) return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-10">
      <div className="text-center space-y-4">
        <div className="h-12 w-12 rounded-full border-4 border-brand-red border-t-transparent animate-spin mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Locating Shipment...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-inter text-slate-800 pb-24">
      {/* HEADER */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-[#FDFCF8]/80 backdrop-blur-md z-[100]">
        <button onClick={() => navigate(-1)} className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-100 active:scale-90 transition-all">
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold text-slate-800">My order</h1>
        <div className="flex items-center gap-1.5 bg-red-50 px-3 py-1 rounded-full">
           <div className="h-1.5 w-1.5 rounded-full bg-brand-red animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest text-brand-red">Live</span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 space-y-6">
        {/* TABS */}
        <div className="bg-slate-100/50 p-1 rounded-full flex items-center gap-1">
           <button 
             onClick={() => navigate('/history')}
             className="flex-1 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest text-slate-400"
           >
             Past
           </button>
           <button className="flex-1 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest bg-white text-slate-800 shadow-sm">
             Active
           </button>
        </div>

        {/* STATUS CARD */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-slate-50 space-y-8 relative overflow-hidden">
           <div className="flex justify-between items-start">
              <div className="flex items-baseline gap-2">
                 <span className="text-6xl font-black text-slate-900 tracking-tighter">18</span>
                 <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">min</span>
              </div>
              <div className="text-right">
                 <p className="text-sm font-black text-slate-900">{currentStatusLabel}</p>
                 <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">Ready for pickup</p>
              </div>
           </div>

           {/* VERTICAL TIMELINE */}
           <div className="space-y-6 relative pl-4">
              <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100" />
              {[
                { title: 'Order confirmed', time: '10:42 am · DeBoye\'s Kitchen' },
                { title: 'Preparing your food', time: 'Kitchen is cooking now' },
                { title: 'Rider picking up', time: 'Courier on the way to kitchen' },
                { title: 'Delivered to you', time: 'East Legon' }
              ].map((step, idx) => {
                const status = getStatusDisplay(idx)
                const isCompleted = idx <= statusLevel
                const isCurrent = idx === statusLevel

                return (
                  <div key={idx} className="flex justify-between items-start relative">
                    <div className="flex gap-6">
                       <div className={`z-10 h-3 w-3 rounded-full mt-1.5 border-2 transition-all duration-500 ${
                         isCompleted ? 'bg-brand-red border-brand-red scale-125' : 'bg-white border-slate-200'
                       } ${isCurrent ? 'ring-4 ring-brand-red/10' : ''}`} />
                       <div>
                          <p className={`text-sm font-bold leading-tight ${isCompleted ? 'text-slate-800' : 'text-slate-300'}`}>{step.title}</p>
                          <p className="text-[10px] font-medium text-slate-300 mt-1">{step.time}</p>
                       </div>
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest ${status.color}`}>{status.label}</span>
                  </div>
                )
              })}
           </div>

           {/* HORIZONTAL PROGRESS */}
           <div className="pt-8 border-t border-slate-50">
              <div className="bg-emerald-50/30 rounded-3xl p-6 space-y-6">
                 <div className="relative h-1 bg-slate-100 rounded-full">
                    <div 
                      className="absolute left-0 top-0 h-full bg-brand-red rounded-full transition-all duration-1000" 
                      style={{ width: `${(statusLevel + 1) * 20}%` }}
                    />
                    <div className="absolute -top-1 left-0 h-3 w-3 rounded-full bg-slate-800" />
                    <div 
                      className="absolute -top-2 h-5 w-5 rounded-full bg-brand-red border-4 border-white shadow-lg transition-all duration-1000" 
                      style={{ left: `calc(${(statusLevel + 1) * 20}% - 10px)` }}
                    />
                    <div className="absolute -top-1 right-0 h-3 w-3 rounded-full bg-brand-red" />
                 </div>
                 <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-emerald-700/60">
                    <span>DeBoye's</span>
                    <span>Your door</span>
                 </div>
              </div>
           </div>
        </div>

        {/* COURIER CARD */}
        <div className="bg-white rounded-[2rem] p-4 shadow-soft border border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center text-sm font-black text-slate-400 border border-slate-50">
                 RI
              </div>
              <div>
                 <p className="text-sm font-black text-slate-800 leading-tight">Courier Team</p>
                 <p className="text-[9px] font-black uppercase tracking-widest text-brand-red mt-1">Master Delivery Partner</p>
              </div>
           </div>
           <div className="flex gap-2">
              <button 
                onClick={() => setShowChat(true)}
                className="h-12 w-12 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-red transition-all shadow-sm"
              >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </button>
              <a href="tel:+233000000000" className="h-12 w-12 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-red transition-all shadow-sm">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </a>
           </div>
        </div>

        {/* ORDER SUMMARY */}
        <div className="bg-white rounded-[2rem] p-8 shadow-soft border border-slate-50 space-y-6">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order summary</h3>
           <div className="space-y-4">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Item</span>
                 <span className="text-sm font-bold text-slate-800">{order?.items_summary || 'Pork with Turkey Stew ×1'}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Order ID</span>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#DBK-{order?.id?.slice(-4) || '4821'}</span>
              </div>
           </div>
           <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total paid</span>
              <span className="text-lg font-black text-brand-red font-inter tracking-tight">₵{order?.total_price || '65.00'}</span>
           </div>
        </div>

        {/* MAP TOGGLE BUTTON (Since map is now optional based on status) */}
        {showMap && (
           <button 
              onClick={() => navigate(`/map-track/${orderId}`)} 
              className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all"
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
