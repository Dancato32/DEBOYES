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
    <div className="min-h-screen bg-brand-cream font-dmsans text-slate-800 overflow-x-hidden">
      
      {/* BRAND HEADER SECTION */}
      <section className="px-6 pt-12 pb-20 relative overflow-hidden bg-brand-red shadow-lg">
        {/* Abstract Background Illustration - Scooter */}
        <div className="absolute -right-6 top-12 opacity-80 pointer-events-none transform translate-x-4">
           <svg width="280" height="280" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M160 140c0 11.046-8.954 20-20 20s-20-8.954-20-20 8.954-20 20-20 20 8.954 20 20z" fill="#3D2B3D"/>
             <path d="M60 140c0 11.046-8.954 20-20 20s-20-8.954-20-20 8.954-20 20-20 20 8.954 20 20z" fill="#3D2B3D"/>
             <path d="M140 135c0 8.284-6.716 15-15 15s-15-6.716-15-15 6.716-15 15-15 15 6.716 15 15z" fill="#6B4F6B"/>
             <path d="M40 135c0 8.284-6.716 15-15 15s-15-6.716-15-15 6.716-15 15-15 15 6.716 15 15z" fill="#6B4F6B"/>
             <path d="M50 140h80v-40H50v40z" fill="#E91E63"/>
             <path d="M130 100c0-22.091-17.909-40-40-40s-40 17.909-40 40h80z" fill="#FF4081"/>
             <path d="M130 100V80h10a10 10 0 0110 10v10h-20z" fill="#C2185B"/>
             <path d="M100 60V50a10 10 0 0110-10h20v20h-30z" fill="#3D2B3D"/>
             <path d="M150 100v10h10v-10h-10z" fill="#FFD54F"/>
           </svg>
        </div>

        <div className="relative z-10 space-y-12">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
               <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Live Location <span className="text-brand-gold ml-1">●</span></p>
               <div className="flex items-center gap-2">
                 <div className="h-2.5 w-2.5 rounded-full bg-brand-gold shadow-[0_0_12px_rgba(245,181,10,0.8)] animate-pulse" />
                 <p className="text-lg font-black text-white">
                   {lError ? 'GPS Required' : area}
                 </p>
               </div>
            </div>
            {/* Availability Toggle */}
            <button 
              onClick={handleToggleActive}
              className={`h-8 w-14 rounded-full p-1.5 transition-all duration-500 shadow-inner ${stats.is_available ? 'bg-brand-gold' : 'bg-white/20'}`}
            >
               <div className={`h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 transform ${stats.is_available ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="space-y-2">
             <div className="flex items-center gap-3">
               <div className="h-4 w-[2px] bg-brand-gold opacity-60" />
               <p className="text-sm text-white font-bold italic tracking-wide">Status: <span className="text-white/90 font-black">{stats.is_available ? 'Active & Tracking' : 'Offline'}</span></p>
             </div>
             <div>
               <p className="text-sm font-bold text-white/80">Today's Earning</p>
               <div className="flex items-baseline gap-1">
                 <h2 className="text-7xl font-black text-brand-gold tracking-tighter drop-shadow-sm">₵{stats.today_earnings?.toFixed(2)}</h2>
               </div>
               <p className="text-4xl font-bold text-white mt-1 italic font-playfair tracking-tight">{user?.name || 'Alexander C.'}</p>
             </div>
          </div>
        </div>
      </section>

      {/* JOBS SECTION (CREAM CONTAINER) */}
      <section className="bg-brand-cream rounded-t-[3.5rem] -mt-8 min-h-[60vh] px-6 pt-12 pb-32 relative z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-10">
           <h3 className="text-2xl font-black text-slate-800 tracking-tight font-playfair italic">Your New Jobs</h3>
           <Link to="/rider/alerts" className="text-[10px] font-black text-brand-red uppercase tracking-[0.2em] border-b-2 border-brand-red/10 pb-1">See More</Link>
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
                         <h4 className="text-lg font-black text-slate-800 font-playfair">{batch.store_name || "De Boye's Partner"}</h4>
                         <div className="bg-brand-gold px-3 py-1 rounded-xl text-[10px] font-black text-brand-red">2.6 KM</div>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight font-dmsans">{batch.area}</p>
                    </div>
                 </div>

                 {/* Segment Divider */}
                 <div className="border-t border-dashed border-[#F0E8D8]" />

                 <div className="flex items-center justify-between bg-brand-cream/50 rounded-2xl p-4 border border-[#F0E8D8]">
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-xs shadow-sm border border-[#F0E8D8]">👤</div>
                       <div>
                         <p className="text-sm font-black text-slate-800">Super Order</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase">Batch ID #{batch.id}</p>
                       </div>
                    </div>
                    <div className="bg-brand-red px-4 py-2 rounded-xl text-[9px] font-black text-brand-gold uppercase tracking-widest shadow-sm">
                       Earn ₵{batch.total_payout}
                    </div>
                 </div>

                 <div className="flex gap-3">
                    <Link 
                      to={`/rider/batch/${batch.id}`}
                      className="flex-1 bg-brand-red rounded-[1.5rem] py-4 flex items-center justify-center gap-4 text-white font-black uppercase tracking-widest text-xs hover:bg-red-800 transition-all active:scale-95 shadow-lg shadow-brand-red/20"
                    >
                       <span>Accept Batch</span>
                       <div className="h-6 w-6 rounded-full bg-brand-gold text-brand-red flex items-center justify-center text-[10px]">»</div>
                    </Link>
                    <button className="px-8 rounded-[1.5rem] bg-white border border-[#F0E8D8] text-slate-400 text-xs font-black uppercase tracking-widest active:scale-95 hover:bg-slate-50 transition-colors">
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
