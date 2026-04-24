import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchOrderDetails, cancelOrder } from '../services/api'
import useOrderTracking from '../hooks/useOrderTracking'
import MapTracker from '../components/MapTracker'
import BottomNav from '../components/BottomNav'
import ChatDialog from '../components/ChatDialog'
import { toast } from '../utils/soundToast'
import { AnimatePresence } from 'framer-motion'


export default function TrackOrder() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showChat, setShowChat] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)
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

  const canContactRider = order?.status === 'on_the_way' || order?.status === 'delivered'
  const canCancelOrder = order?.status === 'new' || order?.status === 'pending'

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await cancelOrder(orderId)
      toast.success('Order cancelled successfully')
      setShowCancelModal(false)
      navigate('/history')
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not cancel order'
      toast.error(msg)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream font-inter text-slate-800 pb-24 relative overflow-hidden">
      {/* Background Watermark */}
      <div className="fixed top-20 -right-20 opacity-[0.03] pointer-events-none rotate-12">
        <img src="/logo.png" alt="" className="h-[600px] w-[600px] object-contain" />
      </div>

      {/* HEADER */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-brand-cream/80 backdrop-blur-md z-[100]">
        <button onClick={() => navigate(-1)} className="h-10 w-10 rounded-full bg-white flex items-center justify-center active:scale-90 transition-all">
          <svg className="w-5 h-5 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold text-slate-800">My order</h1>
        <div className="flex items-center gap-1.5 bg-brand-red/5 px-3 py-1 rounded-full border border-brand-red/10">
           <div className="h-1.5 w-1.5 rounded-full bg-brand-red animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest text-brand-red">Live</span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 space-y-8 relative z-10">
        {/* TABS */}
        <div className="bg-white/40 backdrop-blur-md p-1 rounded-full flex items-center gap-1 border border-white/60">
           <button 
             onClick={() => navigate('/history')}
             className="flex-1 py-3 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400"
           >
             Past
           </button>
           <button className="flex-1 py-3 rounded-full text-[10px] font-black uppercase tracking-widest bg-brand-red text-white shadow-lg shadow-brand-red/10">
             Active
           </button>
        </div>

        {/* INTEGRATED STATUS SECTION */}
        <div className="space-y-10 pt-4">
           <div className="flex justify-between items-start px-2">
              <div className="flex items-baseline gap-2">
                 <span className="text-7xl font-black text-slate-900 tracking-tighter">
                   {order?.status === 'on_the_way' ? (order?.eta || '12') : '18'}
                 </span>
                 <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">min</span>
              </div>
              <div className="text-right">
                 <p className="text-lg font-black text-slate-900 tracking-tight">{currentStatusLabel}</p>
                 <p className="text-[10px] font-bold text-brand-red uppercase tracking-widest mt-1">Ready for pickup</p>
              </div>
           </div>

           {/* VERTICAL TIMELINE - SEAMLESS */}
           <div className="space-y-8 relative pl-6">
              <div className="absolute left-[21px] top-2 bottom-2 w-0.5 bg-slate-200/50" />
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
                    <div className="flex gap-8">
                       <div className={`z-10 h-3.5 w-3.5 rounded-full mt-1.5 border-2 transition-all duration-700 ${
                         isCompleted ? 'bg-brand-red border-brand-red scale-125 shadow-[0_0_15px_rgba(255,59,48,0.3)]' : 'bg-white border-slate-200'
                       } ${isCurrent ? 'ring-4 ring-brand-red/10' : ''}`} />
                       <div>
                          <p className={`text-[15px] font-bold tracking-tight leading-tight ${isCompleted ? 'text-slate-900' : 'text-slate-300'}`}>{step.title}</p>
                          <p className="text-[11px] font-medium text-slate-400 mt-1.5">{step.time}</p>
                       </div>
                    </div>
                    {status.label && <span className={`text-[10px] font-black uppercase tracking-widest pt-2 ${status.color}`}>{status.label}</span>}
                  </div>
                )
              })}
           </div>

           {/* HORIZONTAL PROGRESS - SEAMLESS */}
           <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] p-10 space-y-8 border border-white/60">
              <div className="relative h-1.5 bg-slate-200/40 rounded-full overflow-hidden">
                 <div 
                   className="absolute left-0 top-0 h-full bg-brand-red rounded-full transition-all duration-1000 ease-linear" 
                   style={{ width: `${progressPercent}%` }}
                 />
              </div>
              <div className="flex items-center gap-4">
                 <div className="h-2 w-2 rounded-full bg-brand-charcoal" />
                 <div className="flex-1 h-[2px] bg-slate-100 relative">
                    <div 
                      className="absolute -top-[11px] h-6.5 w-6.5 rounded-full bg-brand-red border-[5px] border-white shadow-2xl flex items-center justify-center transition-all duration-1000"
                      style={{ left: `calc(${progressPercent}% - 13px)` }}
                    >
                       <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    </div>
                 </div>
                 <div className="h-2 w-2 rounded-full bg-brand-red" />
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.4em] text-slate-400/80">
                 <span className="text-brand-red">DeBoye's</span>
                 <span>Your door</span>
              </div>
           </div>
        </div>

        {/* CONDITIONALLY RENDERED COURIER SECTION - SEAMLESS */}
        {canContactRider && (
          <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-5 flex items-center justify-between border border-white/80">
             <div className="flex items-center gap-5">
                <div className="h-14 w-14 rounded-full bg-brand-cream flex items-center justify-center text-[12px] font-black text-brand-red border border-brand-red/10 shadow-inner">
                   {order?.rider?.slice(0, 2).toUpperCase() || 'RI'}
                </div>
                <div>
                   <p className="text-[15px] font-black text-slate-900 leading-tight">{order?.rider || 'Courier Team'}</p>
                   <p className="text-[10px] font-black uppercase tracking-widest text-brand-red mt-1.5">Master Delivery Partner</p>
                </div>
             </div>
             <div className="flex gap-2.5">
                <button 
                  onClick={() => setShowChat(true)}
                  className="h-13 w-13 rounded-full bg-white border border-white/40 flex items-center justify-center text-slate-400 hover:text-brand-red transition-all shadow-sm active:scale-90"
                >
                   <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </button>
                <a href={`tel:${order?.rider_phone || '+233000000000'}`} className="h-13 w-13 rounded-full bg-white border border-white/40 flex items-center justify-center text-slate-400 hover:text-brand-red transition-all shadow-sm active:scale-90">
                   <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </a>
             </div>
          </div>
        )}

        {/* INTEGRATED ORDER SUMMARY - SEAMLESS */}
        <div className="px-2 pt-4 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Order summary</h3>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">#DBK-{order?.id?.toString().slice(-4) || '4821'}</span>
           </div>
           <div className="space-y-5">
              <div className="flex justify-between items-center">
                 <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Item</span>
                 <span className="text-[14px] font-black text-slate-900">{order?.items_summary || 'Order Items'}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-200/50">
                 <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total paid</span>
                 <span className="text-xl font-black text-brand-red font-inter tracking-tight">₵{order?.total_price || '0.00'}</span>
              </div>
           </div>
        </div>

        {/* CANCEL ORDER */}
        {canCancelOrder && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="w-full py-4 rounded-3xl border-2 border-red-200 bg-red-50/60 text-brand-red text-[11px] font-black uppercase tracking-[0.4em] transition-all hover:bg-red-100 active:scale-[0.97]"
          >
            Cancel Order
          </button>
        )}
      </div>

      {/* CANCEL CONFIRMATION MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm px-4 pb-8">
          <div className="w-full max-w-sm bg-brand-cream rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
            <div className="text-center space-y-3">
              <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Cancel this order?</h2>
              <p className="text-[13px] font-medium text-slate-400 leading-relaxed">
                This cannot be undone. Your order will be cancelled and the kitchen will be notified.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-4 rounded-2xl bg-white border border-slate-100 text-[11px] font-black uppercase tracking-widest text-slate-500"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-4 rounded-2xl bg-brand-red text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-50 shadow-lg shadow-brand-red/20"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

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
