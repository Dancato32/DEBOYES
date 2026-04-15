import { useState, useEffect } from 'react'
import { fetchRiderStats, toggleAvailability, fetchAvailableBatches } from '../services/api'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../context/AuthContext'
import useRiderLocation from '../hooks/useRiderLocation'
import useRiderSocket from '../hooks/useRiderSocket'

export default function RiderDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    today_earnings: 0,
    total_deliveries: 0,
    rating: 4.9,
    is_available: false
  })
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Real-time tracking hook
  const { location, area, error: lError } = useRiderLocation(stats.is_available)
  const { sendLocation } = useRiderSocket((data) => {
    if (data.event === 'NEW_BATCH') {
      loadData()
    }
  }, stats.is_available)

  const loadData = async () => {
    try {
      const [statsRes, batchesRes] = await Promise.all([
        fetchRiderStats(),
        fetchAvailableBatches()
      ])
      setStats(statsRes.data)
      setBatches(batchesRes.data.batches || [])
    } catch (err) {
      toast.error('Failed to sync dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Broadcast location when it changes
  useEffect(() => {
    if (location && stats.is_available && sendLocation) {
      sendLocation(location.lat, location.lng)
    }
  }, [location, stats.is_available, sendLocation])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleToggleActive = async () => {
    try {
      const newStatus = !stats.is_available
      
      // If turning ON, show a toast about location
      if (newStatus) {
        toast.info('Activating live logistics tracking...')
      }

      await toggleAvailability({ is_available: newStatus })
      setStats(prev => ({ ...prev, is_available: newStatus }))
      toast.success(newStatus ? 'You are now LIVE' : 'Logged Off')
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  if (loading && !stats) return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-10">
      <div className="h-14 w-14 rounded-full border-4 border-brand-red border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-brand-cream font-inter text-slate-800 overflow-x-hidden uppercase-none leading-relaxed">
      
      {/* BRAND HEADER SECTION */}
      <section className="px-6 pt-12 pb-20 relative overflow-hidden bg-brand-red shadow-lg">
        {/* Logo Watermark Background */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.15] pointer-events-none scale-150 transform rotate-45 translate-x-32 translate-y-10">
           <img src="/logo.png" alt="" className="w-full h-auto object-contain" />
        </div>
        {/* Abstract Background Illustration - Premium Scooter */}
        <div className="absolute -right-4 top-10 opacity-60 pointer-events-none transform translate-x-4 select-none">
           <svg width="320" height="320" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
             <defs>
               <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                 <stop offset="0%" stopColor="#FF4D4D" />
                 <stop offset="100%" stopColor="#D31212" />
               </linearGradient>
               <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                 <stop offset="0%" stopColor="#FF6B6B" />
                 <stop offset="100%" stopColor="#B30000" />
               </linearGradient>
               <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                 <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                 <feOffset dx="2" dy="2" result="offsetblur" />
                 <feComponentTransfer>
                   <feFuncA type="linear" slope="0.3" />
                 </feComponentTransfer>
                 <feMerge>
                   <feMergeNode />
                   <feMergeNode in="SourceGraphic" />
                 </feMerge>
               </filter>
             </defs>
             {/* Rear Wheel Shadow */}
             <circle cx="155" cy="155" r="22" fill="#000" fillOpacity="0.1" />
             {/* Front Wheel Shadow */}
             <circle cx="45" cy="155" r="22" fill="#000" fillOpacity="0.1" />
             
             {/* Rear Wheel */}
             <circle cx="150" cy="150" r="22" fill="#2D2D2D" />
             <circle cx="150" cy="150" r="14" fill="#4A4A4A" />
             <circle cx="150" cy="150" r="6" fill="#888" />
             
             {/* Front Wheel */}
             <circle cx="40" cy="150" r="22" fill="#2D2D2D" />
             <circle cx="40" cy="150" r="14" fill="#4A4A4A" />
             <circle cx="40" cy="150" r="6" fill="#888" />
             
             {/* Main Chassis Connect */}
             <rect x="40" y="140" width="110" height="12" rx="6" fill="url(#bodyGradient)" />
             
             {/* Seat Base */}
             <path d="M80 140h60l10-40H90l-10 40z" fill="#B30000" />
             
             {/* Seat Top */}
             <path d="M75 105c0-10 10-15 30-15s45 5 45 15v10H75v-10z" fill="#2D2D2D" />
             
             {/* Front Shield / Body */}
             <path d="M40 150l10-80c0-10 10-20 20-20h20l-10 100H40z" fill="url(#shieldGradient)" filter="url(#shadow)" />
             
             {/* Handlebars Column */}
             <path d="M75 50l-5-25h10l5 25z" fill="#4A4A4A" />
             <rect x="60" y="20" width="30" height="6" rx="3" fill="#2D2D2D" />
             
             {/* Headlight */}
             <circle cx="70" cy="55" r="8" fill="#FFF9C4" filter="url(#shadow)" />
             <circle cx="70" cy="55" r="4" fill="white" />
             
             {/* Delivery Box (Rear) */}
             <rect x="120" y="60" width="45" height="45" rx="8" fill="url(#bodyGradient)" filter="url(#shadow)" />
             <rect x="125" y="65" width="35" height="5" rx="2" fill="white" fillOpacity="0.2" />
             
             {/* Brand Logo Dot on Box */}
             <circle cx="142" cy="82" r="8" fill="#C0111A" />
             <path d="M138 82h8M142 78v8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
           </svg>
        </div>

        <div className="relative z-10 space-y-12">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
               <p className="text-[9px] font-bold uppercase tracking-widest text-white/70 font-inter">Live Location <span className="text-brand-red ml-1">●</span></p>
               <div className="flex items-center gap-2">
                 <div className="h-2.5 w-2.5 rounded-full bg-brand-red shadow-[0_0_12px_rgba(192,17,26,0.8)] animate-pulse" />
                 <p className="text-base font-bold text-white font-poppins tracking-tight">
                   {lError ? 'GPS Required' : area}
                 </p>
               </div>
            </div>
            {/* Availability Toggle */}
            <button 
              onClick={handleToggleActive}
              className={`h-8 w-14 rounded-full p-1.5 transition-all duration-500 shadow-inner ${stats.is_available ? 'bg-brand-red' : 'bg-white/20'}`}
            >
               <div className={`h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 transform ${stats.is_available ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="space-y-2">
             <div className="flex items-center gap-3">
               <div className="h-4 w-[2px] bg-brand-red opacity-80" />
               <p className="text-xs text-white font-medium uppercase tracking-widest font-inter">Status: <span className="text-white font-bold">{stats.is_available ? 'Active & Tracking' : 'Offline'}</span></p>
             </div>
             <div>
               <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest font-inter">Today's Earnings</p>
               <div className="flex items-baseline gap-1">
                 <h2 className="text-6xl font-bold text-brand-red tracking-tighter drop-shadow-sm font-poppins">₵{stats.today_earnings?.toFixed(2)}</h2>
               </div>
               <p className="text-2xl font-bold text-white mt-1 font-poppins tracking-tight italic opacity-90">{user?.name || 'Alexander C.'}</p>
             </div>
          </div>
        </div>
      </section>

      {/* JOBS SECTION (CREAM CONTAINER) */}
      <section className="bg-brand-cream rounded-t-[3.5rem] -mt-8 min-h-[60vh] px-6 pt-12 pb-32 relative z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-10">
           <h3 className="text-xl font-bold text-slate-800 tracking-tight font-poppins italic uppercase">New Job Opportunities</h3>
           <Link to="/rider/alerts" className="text-[9px] font-bold text-brand-red uppercase tracking-widest border-b-2 border-brand-red/10 pb-1 font-inter">See More</Link>
        </div>

        <div className="space-y-6">
           {batches.length === 0 ? (
             <div className="py-24 text-center">
               <div className="mx-auto w-20 h-20 bg-brand-cream border border-slate-100 rounded-full flex items-center justify-center mb-6 opacity-40">
                 <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.414 8.414c5.858-5.857 15.356-5.857 21.213 0" />
                 </svg>
               </div>
               <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.25em] italic">Waiting for updates...</p>
             </div>
           ) : (
             batches.map((batch) => (
               <div key={batch.id} className="bg-white border border-[#F0E8D8] rounded-[2.5rem] p-5 shadow-sm space-y-6 hover:shadow-md transition-shadow">
                 <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-[2rem] bg-brand-cream flex items-center justify-center text-3xl shadow-inner border border-[#F0E8D8]">
                      🍔
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                         <h4 className="text-base font-bold text-slate-800 font-poppins tracking-tight">{batch.store_name || "De Boye's Partner"}</h4>
                         <div className="bg-brand-red px-3 py-1 rounded-xl text-[9px] font-bold text-white font-inter uppercase tracking-wider">2.6 KM</div>
                      </div>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest font-inter mt-0.5">{batch.area}</p>
                    </div>
                 </div>

                 {/* Segment Divider */}
                 <div className="border-t border-dashed border-[#F0E8D8]" />

                 <div className="flex items-center justify-between bg-brand-cream/50 rounded-2xl p-4 border border-[#F0E8D8]">
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-xs shadow-sm border border-[#F0E8D8]">👤</div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 font-inter">Super Order</p>
                          <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest font-inter mt-1">Batch ID #{batch.id}</p>
                        </div>
                    </div>
                    <div className="bg-brand-red px-4 py-2 rounded-xl text-[9px] font-bold text-white uppercase tracking-widest shadow-sm font-inter">
                       Earn ₵{batch.total_payout}
                    </div>
                 </div>

                 <div className="flex gap-3">
                    <Link 
                      to={`/rider/batch/${batch.id}`}
                      className="flex-1 bg-brand-red rounded-[1.5rem] py-4 flex items-center justify-center gap-4 text-white font-bold uppercase tracking-widest text-[10px] font-inter hover:bg-red-800 transition-all active:scale-95 shadow-lg shadow-brand-red/20"
                    >
                       <span>Accept Batch</span>
                       <div className="h-6 w-6 rounded-full bg-white text-brand-red flex items-center justify-center text-[10px]">»</div>
                    </Link>
                    <button className="px-8 rounded-[1.5rem] bg-white border border-[#F0E8D8] text-slate-400 text-[10px] font-bold uppercase tracking-widest active:scale-95 hover:bg-slate-50 transition-colors font-inter">
                       Skip
                    </button>
                 </div>
               </div>
             ))
           )}
        </div>
      </section>

      <BottomNav />
    </div>
  )
}
