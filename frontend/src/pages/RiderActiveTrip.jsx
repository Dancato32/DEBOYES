import { useEffect, useState } from 'react'
import { fetchAssignedOrders, confirmBatchStop, fetchRiderStats, startBatchTrip } from '../services/api'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import MapTracker from '../components/MapTracker'
import useRiderSocket from '../hooks/useRiderSocket'
import useRiderLocation from '../hooks/useRiderLocation'

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
    }
  }, !!activeBatch)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

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

  const handleStartTrip = async () => {
    setConfirming(true)
    try {
      const res = await startBatchTrip(activeBatch.id)
      toast.success('🚀 ' + res.data.message)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start trip')
    } finally {
      setConfirming(false)
    }
  }

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

  if (!activeBatch) return (
    <div className="min-h-screen bg-brand-cream text-slate-800 flex flex-col items-center justify-center p-10 space-y-8 font-dmsans">
       <div className="text-7xl grayscale opacity-20">🛵</div>
       <div className="text-center space-y-2">
         <h2 className="text-2xl font-black italic tracking-tighter font-playfair">No Active Deliveries</h2>
         <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest max-w-[200px] mx-auto">Your assigned trip will appear here when accepted.</p>
       </div>
       <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
         <div className="rounded-[2rem] bg-white border border-[#F0E8D8] p-6 text-center shadow-sm">
           <p className="text-[9px] font-bold uppercase text-slate-400 mb-1">Today</p>
           <p className="text-2xl font-black text-brand-red font-playfair">₵{stats.earnings}</p>
         </div>
         <div className="rounded-[2rem] bg-white border border-[#F0E8D8] p-6 text-center shadow-sm">
           <p className="text-[9px] font-bold uppercase text-slate-400 mb-1">Total Delivered</p>
           <p className="text-2xl font-black text-slate-800 font-playfair">{stats.deliveries}</p>
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

  const currentStop = activeBatch.orders[0]
  const isWaitingForPickup = currentStop.status === 'assigned'
  const destCoords = getAreaCoords(currentStop.area)

  return (
    <div className="min-h-screen bg-brand-cream text-slate-800 pb-32 font-dmsans overflow-x-hidden">
      <div className="mx-auto max-w-lg space-y-6">

        {/* Header */}
        <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-[2000] bg-brand-red shadow-lg text-white">
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold uppercase tracking-[2px] text-brand-gold">Current Mission</p>
            <h1 className="text-3xl font-black font-playfair italic">Active Trip</h1>
          </div>
          <div className="text-right space-y-0.5">
             <p className="text-[10px] font-bold uppercase text-white/60 tracking-wider">Remaining</p>
             <p className="text-2xl font-black font-playfair">{activeBatch.orders.length}</p>
          </div>
        </header>

        <div className="px-4 space-y-6">
        {/* Status Phase Banner */}
        {isWaitingForPickup ? (
          <div className="rounded-[2rem] bg-white border border-[#F0E8D8] p-6 shadow-sm">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-brand-gold/10 text-3xl shrink-0 animate-pulse border border-brand-gold/20">
                🍳
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-gold">Point A: Pickup</p>
                <p className="font-bold text-slate-800 leading-tight">
                  Restaurant is preparing the order. Please head there now.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[2rem] bg-white border border-[#F0E8D8] p-5 flex items-center gap-5 shadow-sm">
            <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-brand-red/5 text-2xl shrink-0 border border-brand-red/10">🚀</div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-red">Point B: Delivery</p>
              <p className="text-sm font-bold text-slate-800">Heading to customer location. Drive safely!</p>
            </div>
          </div>
        )}

        {/* LIVE MAP */}
        <section className={`rounded-[2.5rem] bg-white overflow-hidden shadow-sm relative transition-all duration-1000 ease-in-out border border-[#F0E8D8] ${isWaitingForPickup ? 'h-[320px]' : 'h-[60vh] min-h-[480px]'}`}>
           {riderPos && (
             <MapTracker
               position={riderPos}
               destination={destCoords}
               darkMode={false}
             />
           )}

           {/* Overlay controls on top of map */}
           <div className="absolute top-5 left-5 right-5 z-[1000] flex items-center gap-4 rounded-2xl bg-white/95 backdrop-blur-md border border-[#F0E8D8] p-4 shadow-xl">
              <div className={`h-12 w-12 flex items-center justify-center rounded-xl text-2xl shrink-0 ${isWaitingForPickup ? 'bg-brand-gold/10 text-brand-gold' : 'bg-brand-red/10 text-brand-red'}`}>
                {isWaitingForPickup ? '🍽️' : '📍'}
              </div>
              <div className="flex-1 overflow-hidden">
                 <p className={`text-[10px] font-black uppercase tracking-widest ${isWaitingForPickup ? 'text-brand-gold' : 'text-brand-red'}`}>
                   {isWaitingForPickup ? 'Pickup Location' : 'Destination'}
                 </p>
                 <p className="text-base font-black font-playfair text-slate-800 truncate italic">{currentStop.address}</p>
              </div>
           </div>

           <div className="absolute bottom-5 left-5 right-5 z-[1000] flex justify-between gap-3">
              <div className="flex-1 rounded-2xl bg-white/95 backdrop-blur-md border border-[#F0E8D8] flex flex-col justify-center px-5 py-3 shadow-lg">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <span className={`h-2 w-2 rounded-full ${isWaitingForPickup ? 'bg-brand-gold animate-pulse' : 'bg-emerald-500'}`} />
                   {isWaitingForPickup ? 'Waiting at Pick-up' : 'Live GPS Tracking'}
                </p>
              </div>
              <button
                onClick={() => handleOpenMaps(currentStop.address, destCoords)}
                className="rounded-2xl bg-brand-gold px-8 py-3 text-[11px] font-black text-brand-deep-dark uppercase tracking-widest shadow-xl shadow-brand-gold/20 hover:bg-brand-gold-light transition-all active:scale-95"
              >
                Navigate ↗
              </button>
           </div>
        </section>

        {/* Current Stop Card */}
        <section className="bg-white rounded-[2.5rem] shadow-sm border border-[#F0E8D8] border-l-[8px] border-l-brand-red p-7 space-y-8">
           <div className="flex items-center justify-between border-b border-slate-50 pb-5">
              <span className="rounded-full bg-brand-red/5 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-brand-red">
                Stop #{currentStop.stop_number}
              </span>
              <p className="text-lg font-black text-brand-red font-playfair italic">Earnings: ₵{currentStop.total}</p>
           </div>

           <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recipient Name</p>
              <p className="text-4xl font-black font-playfair text-slate-800 italic tracking-tighter">{currentStop.customer}</p>
              <p className="text-base font-medium text-slate-500">{currentStop.address}</p>
           </div>

           <div className="py-2 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-gold">Order Manifest</p>
              <div className="space-y-3 bg-brand-cream/30 rounded-[22px] p-5 border border-[#F0E8D8]">
                 {currentStop.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm font-bold border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                       <span className="text-slate-700">🍲 {item.food}</span>
                       <span className="text-brand-red font-black font-dmsans">×{item.qty}</span>
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
                 className="w-full rounded-[18px] bg-brand-gold py-5 text-xs font-black uppercase tracking-[2px] text-brand-deep-dark shadow-xl shadow-brand-gold/20 hover:bg-brand-gold-light active:scale-[0.95] transition-all disabled:opacity-50"
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
             <h3 className="text-[11px] font-black uppercase tracking-[2px] text-slate-400 px-4">Upcoming Sequence ({activeBatch.orders.slice(1).length})</h3>
             <div className="space-y-3">
                {activeBatch.orders.slice(1).map((o) => (
                  <div key={o.id} className="flex items-center gap-5 p-5 rounded-[22px] bg-white border border-[#F0E8D8] opacity-70 scale-95 origin-center">
                     <div className="h-10 w-10 text-2xl flex items-center justify-center shrink-0 bg-slate-50 rounded-xl">
                       📍
                     </div>
                     <div className="overflow-hidden space-y-0.5">
                        <p className="text-sm font-black text-slate-800 truncate font-playfair">{o.customer}</p>
                        <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest">{o.address}</p>
                     </div>
                  </div>
                ))}
             </div>
          </section>
        )}

        {activeBatch.orders.length === 1 && (
          <p className="text-center py-8 text-[11px] font-black uppercase tracking-[3px] text-brand-gold/50">— Final Destination —</p>
        )}

        </div> {/* Close padding wrapper */}

      </div>
      <BottomNav />
    </div>
  )
}
