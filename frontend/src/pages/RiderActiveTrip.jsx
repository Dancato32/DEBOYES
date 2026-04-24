import { useEffect, useState } from 'react'
import { fetchAssignedOrders, confirmBatchStop, fetchRiderStats, startBatchTrip } from '../services/api'
import { toast } from '../utils/soundToast'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import MapTracker from '../components/MapTracker'
import ChatDialog from '../components/ChatDialog'
import useRiderSocket from '../hooks/useRiderSocket'
import useRiderLocation from '../hooks/useRiderLocation'
import { AnimatePresence } from 'framer-motion'

// Accra area coordinates for simulation — in production you'd use the device GPS
const ACCRA_AREAS = {
  'Accra Central':  { lat: 5.5500, lng: -0.2000 },
  'East Legon':     { lat: 5.6350, lng: -0.1570 },
  'Osu':            { lat: 5.5560, lng: -0.1810 },
  'Labone':         { lat: 5.5610, lng: -0.1750 },
  'Cantonments':    { lat: 5.5680, lng: -0.1770 },
  'Airport Area':   { lat: 5.6050, lng: -0.1700 },
  'Madina':         { lat: 5.6700, lng: -0.1670 },
  'Spintex':        { lat: 5.6350, lng: -0.1100 },
  'Tema':           { lat: 5.6700, lng: -0.0170 },
  'Dansoman':       { lat: 5.5360, lng: -0.2580 },
  'Achimota':       { lat: 5.6150, lng: -0.2270 },
  'Adenta':         { lat: 5.6900, lng: -0.1550 },
  'default':        { lat: 5.6037, lng: -0.1870 },
}

function getAreaCoords(area) {
  if (!area) return ACCRA_AREAS['default']
  const key = Object.keys(ACCRA_AREAS).find(
    k => area.toLowerCase().includes(k.toLowerCase())
  )
  return key ? ACCRA_AREAS[key] : ACCRA_AREAS['default']
}

// Simulate a slightly offset rider position (in production, use navigator.geolocation)
function getRiderPosition(destCoords) {
  return {
    lat: destCoords.lat + (Math.random() * 0.008 - 0.004) + 0.005,
    lng: destCoords.lng + (Math.random() * 0.008 - 0.004) - 0.005,
  }
}

export default function RiderActiveTrip() {
  const navigate = useNavigate()
  const [activeBatch, setActiveBatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ earnings: 0, deliveries: 0 })
  const [confirming, setConfirming] = useState(false)
  const [riderPos, setRiderPos] = useState(null)
  const [chatOrderId, setChatOrderId] = useState(null)
  const [unreadMessages, setUnreadMessages] = useState({}) // {orderId: count}
  
  const currentStop = activeBatch?.orders?.[0]
  const isWaitingForPickup = currentStop?.status === 'assigned'
  const customerCoords = currentStop ? (currentStop.lat ? { lat: currentStop.lat, lng: currentStop.lng } : getAreaCoords(currentStop.area)) : null
  const restaurantCoords = currentStop ? { lat: currentStop.restaurant_lat, lng: currentStop.restaurant_lng } : null
  
  // Destination depends on whether we are picking up or delivering
  const activeDestination = isWaitingForPickup ? restaurantCoords : customerCoords

  const loadData = async () => {
    try {
      const res = await fetchAssignedOrders()
      const orders = res.data.orders.filter(o => o.status !== 'delivered')

      if (orders.length > 0) {
        const activeOrder = orders[0]
        setActiveBatch({
          id: activeOrder.batch_id || 'Current',
          orders: orders.sort((a, b) => a.stop_number - b.stop_number)
        })

        // Only set fallback position if GPS hasn't kicked in yet
        if (!riderPos) {
          const destCoords = getAreaCoords(activeOrder.area)
          setRiderPos(getRiderPosition(destCoords))
        }
      } else {
        setActiveBatch(null)
      }

      const statsRes = await fetchRiderStats()
      setStats({
        earnings: statsRes.data.today_earnings,
        deliveries: statsRes.data.total_deliveries
      })
    } catch (err) {
      toast.error('Failed to load active trip')
    } finally {
      setLoading(false)
    }
  }

  // Integrated real-time tracking
  const { location: currentPos, area: currentArea } = useRiderLocation(!!activeBatch)
  const { sendLocation } = useRiderSocket((data) => {
    if (data.event === 'ORDER_STATUS_UPDATED') {
      loadData()
    } else if (data.event === 'NEW_CHAT_MESSAGE') {
      const { order_id } = data.payload
      if (chatOrderId !== order_id) {
        setUnreadMessages(prev => ({
          ...prev,
          [order_id]: (prev[order_id] || 0) + 1
        }))
      }
    }
  }, !!activeBatch)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (chatOrderId) {
      setUnreadMessages(prev => ({ ...prev, [chatOrderId]: 0 }))
    }
  }, [chatOrderId])

  // Broadcast location to customers
  useEffect(() => {
    if (currentPos && activeBatch) {
      sendLocation(currentPos.lat, currentPos.lng)
      setRiderPos(currentPos)
    }
  }, [currentPos, !!activeBatch])

  const handleConfirmStop = async (orderId) => {
    setConfirming(true)
    try {
      const batchId = activeBatch.id
      const res = await confirmBatchStop(batchId, orderId)
      if (res.data.all_done) {
        toast.success('🏆 All stops complete! Great work!')
      } else {
        toast.success(`Stop confirmed! ${res.data.stops_remaining} remaining 🏁`)
      }
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to confirm delivery')
    } finally {
      setConfirming(false)
    }
  }

  const [isSimulating, setIsSimulating] = useState(false)
  const simulationInterval = useRef(null)
 
  const handleStartTrip = async () => {
    setConfirming(true)
    try {
      const res = await startBatchTrip(activeBatch.id)
      toast.success('🚀 ' + res.data.message)
      loadData()
      // Start simulation automatically on trip start for better UX demo
      setIsSimulating(true)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start trip')
    } finally {
      setConfirming(false)
    }
  }
 
  // Simulation Logic: Gradually move riderPos towards destCoords
  useEffect(() => {
    if (isSimulating && riderPos && destCoords) {
      simulationInterval.current = setInterval(() => {
        setRiderPos(prev => {
          if (!prev) return prev
          const latDiff = destCoords.lat - prev.lat
          const lngDiff = destCoords.lng - prev.lng
          
          // If close enough, stop simulation
          if (Math.abs(latDiff) < 0.0001 && Math.abs(lngDiff) < 0.0001) {
            setIsSimulating(false)
            return destCoords
          }
 
          // Move 1% of the distance each step (roughly every 2 seconds)
          return {
            lat: prev.lat + (latDiff * 0.01),
            lng: prev.lng + (lngDiff * 0.01)
          }
        })
      }, 2000)
    } else {
      clearInterval(simulationInterval.current)
    }
    return () => clearInterval(simulationInterval.current)
  }, [isSimulating, !!activeDestination])
 
  // Sync simulated position to server
  useEffect(() => {
    if (isSimulating && riderPos && activeBatch) {
      sendLocation(riderPos.lat, riderPos.lng)
    }
  }, [riderPos, isSimulating])

  const handleOpenMaps = (address, coords = null) => {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    const isAndroid = /Android/i.test(navigator.userAgent)

    if (coords && (isIOS || isAndroid)) {
      // Direct Native Navigation Intents
      if (isIOS) {
        // iOS Maps app
        window.location.href = `maps://?q=${coords.lat},${coords.lng}`
      } else {
        // Android Google Maps app direct navigation
        window.location.href = `google.navigation:q=${coords.lat},${coords.lng}&mode=d`
      }
      return
    }

    // Fallback for Desktop or missing coords
    const encoded = encodeURIComponent(address)
    const url = `https://www.google.com/maps/search/?api=1&query=${encoded}`
    
    if (isIOS || isAndroid) {
       // On mobile, try to open in app without new tab
       window.location.href = url
    } else {
       // On desktop, opening in a new tab is still the safest standard
       window.open(url, '_blank')
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-14 w-14 rounded-full border-4 border-brand-red border-t-transparent animate-spin mx-auto" />
        <p className="text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] italic">Establishing GPS Connection...</p>
      </div>
    </div>
  )

  if (!activeBatch || !currentStop) return (
    <div className="min-h-screen bg-brand-cream text-slate-800 flex flex-col items-center justify-center p-10 space-y-8 font-inter">
       <div className="text-7xl grayscale opacity-20">🛵</div>
       <div className="text-center space-y-2">
         <h2 className="text-xl font-bold tracking-tight font-poppins uppercase text-slate-800">No Active Deliveries</h2>
         <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest max-w-[200px] mx-auto font-inter">Your assigned trip will appear here when accepted.</p>
       </div>
       <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
         <div className="rounded-[2rem] bg-white border border-[#F0E8D8] p-6 text-center shadow-sm">
           <p className="text-[9px] font-bold uppercase text-slate-400 mb-1 font-inter tracking-widest">Today</p>
           <p className="text-2xl font-bold text-brand-red font-poppins">₵{stats.earnings}</p>
         </div>
         <div className="rounded-[2rem] bg-white border border-[#F0E8D8] p-6 text-center shadow-sm">
           <p className="text-[9px] font-bold uppercase text-slate-400 mb-1 font-inter tracking-widest">Total Delivered</p>
           <p className="text-2xl font-bold text-slate-800 font-poppins">{stats.deliveries}</p>
         </div>
       </div>
       <button
         onClick={() => navigate('/rider/alerts')}
         className="rounded-2xl bg-brand-red px-10 py-4 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-brand-red/20 hover:bg-brand-dark-red transition-all active:scale-95"
       >
         Find opportunities →
       </button>
       <BottomNav />
    </div>
  )



  return (
    <div className="min-h-screen bg-brand-cream text-slate-800 pb-32 font-inter overflow-x-hidden">
      <div className="mx-auto max-w-lg space-y-6">

        {/* Header */}
        <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-[2000] bg-brand-red shadow-lg text-white border-b border-white/10">
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-brand-red font-inter">Current Mission</p>
            <h1 className="text-2xl font-bold font-poppins uppercase tracking-tight">Active Trip</h1>
          </div>
          <div className="text-right space-y-0.5">
             <p className="text-[9px] font-bold uppercase text-white/50 tracking-widest font-inter">Remaining</p>
             <p className="text-2xl font-bold font-poppins">{activeBatch.orders.length}</p>
          </div>
        </header>

        <AnimatePresence>
          {chatOrderId && (
            <ChatDialog 
              orderId={chatOrderId}
              orderStatus="Rider"
              onClose={() => setChatOrderId(null)}
            />
          )}
        </AnimatePresence>

        <div className="px-4 space-y-6">
        {/* Status Phase Banner */}
        {isWaitingForPickup ? (
          <div className="rounded-[2rem] bg-white border border-[#F0E8D8] p-6 shadow-sm">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-brand-red/10 text-3xl shrink-0 animate-pulse border border-brand-red/20">
                🍳
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold uppercase tracking-widest text-brand-red font-inter">Point A: Pickup</p>
                <p className="text-[13px] font-bold text-slate-800 leading-tight font-inter">
                  Restaurant is preparing the order. Please head there now.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[2rem] bg-white border border-[#F0E8D8] p-5 flex items-center gap-5 shadow-sm">
            <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-brand-red/5 text-2xl shrink-0 border border-brand-red/10">🚀</div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-brand-red font-inter">Point B: Delivery</p>
              <p className="text-[13px] font-bold text-slate-800 font-inter">Heading to customer location. Drive safely!</p>
            </div>
          </div>
        )}

        {/* LIVE MAP */}
        <section className={`rounded-[2.5rem] bg-white overflow-hidden shadow-sm relative transition-all duration-1000 ease-in-out border border-[#F0E8D8] ${isWaitingForPickup ? 'h-[320px]' : 'h-[60vh] min-h-[480px]'}`}>
           {riderPos && (
              <MapTracker
                position={riderPos}
                destination={activeDestination}
                restaurant={restaurantCoords}
                isRiderMoving={true}
                darkMode={false}
              />
           )}

           {/* Overlay controls on top of map */}
           <div className="absolute top-5 left-5 right-5 z-[1000] flex items-center gap-4 rounded-2xl bg-white/95 backdrop-blur-md border border-[#F0E8D8] p-4 shadow-xl">
              <div className={`h-12 w-12 flex items-center justify-center rounded-xl text-2xl shrink-0 ${isWaitingForPickup ? 'bg-brand-red/10 text-brand-red' : 'bg-brand-red/10 text-brand-red'}`}>
                {isWaitingForPickup ? '🍽️' : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                  <p className={`text-[9px] font-bold uppercase tracking-widest font-inter ${isWaitingForPickup ? 'text-brand-red' : 'text-brand-red'}`}>
                    {isWaitingForPickup ? 'Pickup Location' : 'Destination'}
                  </p>
                  <p className="text-base font-bold font-poppins text-slate-800 truncate tracking-tight uppercase leading-none mt-1">{currentStop.address}</p>
              </div>
           </div>

           <div className="absolute bottom-5 left-5 right-5 z-[1000] flex justify-between gap-3">
               <div className="flex-1 rounded-2xl bg-white/95 backdrop-blur-md border border-[#F0E8D8] flex flex-col justify-center px-5 py-3 shadow-lg">
                 <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <span className={`h-2 w-2 rounded-full ${isSimulating ? 'bg-brand-red animate-pulse' : 'bg-emerald-500'}`} />
                       {isSimulating ? 'Simulating Delivery...' : 'Live GPS Tracking'}
                    </p>
                    {!isWaitingForPickup && (
                      <button 
                        onClick={() => setIsSimulating(!isSimulating)}
                        className={`text-[8px] font-black uppercase px-2 py-1 rounded border transition-colors ${
                          isSimulating ? 'bg-brand-red text-white border-brand-red' : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}
                      >
                        {isSimulating ? 'Stop Sim' : 'Start Sim'}
                      </button>
                    )}
                 </div>
              </div>
              <button
                onClick={() => handleOpenMaps(isWaitingForPickup ? "Restaurant" : currentStop.address, activeDestination)}
                className="rounded-2xl bg-brand-red px-8 py-3 text-[10px] font-bold text-white uppercase tracking-widest shadow-xl shadow-brand-red/20 hover:bg-brand-dark-red transition-all active:scale-95 font-inter"
              >
                Navigate ↗
              </button>
           </div>
        </section>

        {/* Current Stop Card */}
        <section className="bg-white rounded-[2.5rem] shadow-sm border border-[#F0E8D8] border-l-[8px] border-l-brand-red p-7 space-y-8">
           <div className="flex items-center justify-between border-b border-slate-50 pb-5">
              <span className="rounded-full bg-brand-red/5 px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-brand-red font-inter">
                Stop #{currentStop.stop_number}
              </span>
              <p className="text-base font-bold text-brand-red font-poppins uppercase tracking-tight">Earnings: ₵{currentStop.total}</p>
           </div>

           <div className="space-y-2 relative">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 font-inter">Recipient Name</p>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold font-poppins text-slate-800 tracking-tight">{currentStop.customer}</h2>
                  <p className="text-[13px] font-medium text-slate-500 font-inter">{currentStop.address}</p>
                </div>
                <button 
                  onClick={() => setChatOrderId(currentStop.id)}
                  className="relative h-14 w-14 rounded-full bg-brand-cream border border-[#F0E8D8] flex items-center justify-center text-brand-red hover:bg-brand-red hover:text-white transition-all shadow-sm active:scale-95"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {unreadMessages[currentStop.id] > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-red border-2 border-white text-[10px] text-white font-bold animate-pulse shadow-sm">
                      {unreadMessages[currentStop.id]}
                    </span>
                  )}
                </button>
              </div>
            </div>

           <div className="py-2 space-y-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-brand-red font-inter">Order Manifest</p>
              <div className="space-y-3 bg-brand-cream/30 rounded-[22px] p-5 border border-[#F0E8D8]">
                 {currentStop.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm font-bold border-b border-slate-100 last:border-0 pb-2 last:pb-0 font-inter">
                       <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg overflow-hidden bg-white/50 border border-slate-100 flex items-center justify-center shrink-0">
                             {item.image ? (
                               <img src={`${import.meta.env.VITE_API_URL || ''}${item.image}`} alt={item.food} className="h-full w-full object-cover" />
                             ) : (
                               '🍲'
                             )}
                          </div>
                          <span className="text-slate-700">{item.food}</span>
                       </div>
                       <span className="text-brand-red font-bold font-inter tracking-widest text-xs">×{item.qty}</span>
                    </div>
                 ))}
              </div>
           </div>

           {/* Delivery button */}
           {isWaitingForPickup ? (
             <div className="space-y-4 pt-4">
               <button
                 onClick={handleStartTrip}
                 disabled={confirming}
                 className="w-full rounded-[18px] bg-brand-red py-5 text-xs font-black uppercase tracking-[2px] text-white shadow-xl shadow-brand-red/30 hover:bg-brand-dark-red active:scale-[0.95] transition-all disabled:opacity-50"
               >
                 {confirming ? 'Initializing...' : 'Confirm Pickup & Start'}
               </button>
               <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirm arrival at restaurant to start delivery</p>
             </div>
           ) : (
             <div className="pt-4">
               <button
                 onClick={() => handleConfirmStop(currentStop.id)}
                 disabled={confirming}
                 className="w-full rounded-[18px] bg-brand-red py-5 text-xs font-black uppercase tracking-[2px] text-white shadow-xl shadow-brand-red/30 hover:bg-brand-dark-red active:scale-[0.95] transition-all disabled:opacity-50"
               >
                 {confirming ? 'Finalizing...' : 'Complete Delivery ✔'}
               </button>
             </div>
           )}
        </section>

        {/* Upcoming Stops */}
        {activeBatch.orders.slice(1).length > 0 && (
          <section className="space-y-4 pb-4">
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4 font-inter">Upcoming Sequence ({activeBatch.orders.slice(1).length})</h3>
             <div className="space-y-3">
                {activeBatch.orders.slice(1).map((o) => (
                  <div key={o.id} className="flex items-center gap-5 p-5 rounded-[22px] bg-white border border-[#F0E8D8] opacity-70 scale-95 origin-center">
                      <div className="h-10 w-10 flex items-center justify-center shrink-0 bg-slate-50 rounded-xl text-brand-red">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                           <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2 2.5 0 110-5 2.5 2.5 0 010 5z" />
                        </svg>
                      </div>
                     <div className="overflow-hidden space-y-0.5">
                        <p className="text-sm font-bold text-slate-800 truncate font-poppins tracking-tight uppercase">{o.customer}</p>
                        <p className="text-[9px] font-bold text-slate-400 truncate uppercase tracking-widest font-inter">{o.address}</p>
                     </div>
                  </div>
                ))}
             </div>
          </section>
        )}

        {activeBatch.orders.length === 1 && (
          <p className="text-center py-8 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-red/50 font-inter">— Final Destination —</p>
        )}

        </div> {/* Close padding wrapper */}

      </div>
      <BottomNav />
    </div>
  )
}
