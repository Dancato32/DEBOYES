import { useState, useEffect } from 'react'
import { fetchRiderStats, toggleAvailability, fetchAvailableBatches, fetchAssignedOrders } from '../services/api'
import api from '../services/api'
import { toast } from '../utils/soundToast'
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
  const [activeOrders, setActiveOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const { location, area, error: lError } = useRiderLocation(stats.is_available)
  const { sendLocation } = useRiderSocket((data) => {
    if (data.event === 'NEW_BATCH') loadData()
  }, stats.is_available)

  const loadData = async () => {
    try {
      const [statsRes, batchesRes, assignedRes] = await Promise.all([
        fetchRiderStats(),
        fetchAvailableBatches(),
        fetchAssignedOrders()
      ])
      setStats(statsRes.data)
      setBatches(batchesRes.data.batches || [])
      setActiveOrders(assignedRes.data.orders || [])
    } catch (err) {
      toast.error('Failed to sync dashboard')
    } finally {
      setLoading(false)
    }
  }

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
      if (newStatus) toast.info('Activating live logistics tracking...')
      await toggleAvailability({ is_available: newStatus })
      setStats(prev => ({ ...prev, is_available: newStatus }))
      toast.success(newStatus ? 'You are now LIVE' : 'Logged Off')
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  if (loading && !stats) return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center">
      <div className="h-12 w-12 rounded-full border-4 border-brand-red border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-inter">

      {/* ─── BRAND HERO HEADER ──────────────────────────────────── */}
      <div className="bg-brand-red px-6 py-10 relative overflow-hidden shadow-2xl">
        {/* Logo watermark */}
        <div className="absolute -right-12 -top-12 opacity-[0.25] pointer-events-none rotate-12">
          <img src="/logo.png" alt="" className="h-96 w-96 object-contain brightness-0 invert" />
        </div>

        <div className="relative z-10">
          {/* Top bar */}
          <header className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-white/15 text-brand-yellow backdrop-blur-xl border border-white/10">
                {/* Location pin icon */}
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Live Location</span>
                <span className="font-bold text-white text-sm truncate max-w-[180px]">
                  {lError ? 'GPS Required' : (area || 'Detecting...')}
                </span>
              </div>
            </div>

            {/* Availability toggle */}
            <button
              onClick={handleToggleActive}
              className={`h-9 w-16 rounded-full p-1.5 transition-all duration-500 relative ${
                stats.is_available ? 'bg-brand-yellow' : 'bg-white/20'
              }`}
            >
              <div className={`h-6 w-6 rounded-full shadow-md transition-all duration-400 transform ${
                stats.is_available ? 'translate-x-7 bg-brand-red' : 'translate-x-0 bg-white'
              }`} />
            </button>
          </header>

          {/* Hero content */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className={`h-2 w-2 rounded-full ${stats.is_available ? 'bg-brand-yellow animate-pulse' : 'bg-white/30'}`} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                {stats.is_available ? 'Active & Tracking' : 'Offline'}
              </span>
            </div>
            <h1 className="text-4xl font-black text-brand-yellow tracking-tighter italic uppercase leading-[0.95]">
              Today's<br />Earnings
            </h1>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white tracking-tighter">
                ₵{Number(stats.today_earnings || 0).toFixed(2)}
              </span>
            </div>
            <p className="text-white/70 text-xs font-bold uppercase tracking-[0.15em]">
              {stats.total_deliveries} deliveries · {stats.rating} ★ rating
            </p>
          </div>
        </div>
      </div>

      {/* ─── CREAM CONTENT AREA ─────────────────────────────────── */}
      <div className="bg-brand-cream rounded-t-[3.5rem] -mt-6 min-h-[60vh] px-6 pt-10 pb-32 relative z-10">

        {/* Quick stats row — seamless */}
        <div className="flex items-center justify-between px-2 mb-10">
          <div className="text-center">
            <p className="text-2xl font-black text-slate-900 tracking-tighter">{stats.total_deliveries}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Deliveries</p>
          </div>
          <div className="h-8 w-px bg-slate-200/60" />
          <div className="text-center">
            <p className="text-2xl font-black text-brand-red tracking-tighter">{stats.rating || '4.9'}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Rating</p>
          </div>
          <div className="h-8 w-px bg-slate-200/60" />
          <div className="text-center">
            <p className={`text-2xl font-black tracking-tighter ${stats.is_available ? 'text-emerald-500' : 'text-slate-300'}`}>
              {stats.is_available ? 'ON' : 'OFF'}
            </p>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Status</p>
          </div>
        </div>

        {/* ─── ACTIVE ORDERS BANNER ────────────────────────────── */}
        {activeOrders.length > 0 && (
          <Link 
            to="/rider/active"
            className="mb-10 block bg-brand-red p-6 rounded-[2rem] shadow-xl shadow-brand-red/20 text-white relative overflow-hidden group"
          >
            <div className="absolute right-0 bottom-0 opacity-10">
              <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
              </svg>
            </div>
            <div className="relative z-10 flex items-center justify-between">
               <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Current Active Mission</p>
                 <h4 className="text-xl font-black italic uppercase tracking-tight">{activeOrders.length} Order{activeOrders.length !== 1 ? 's' : ''} in Progress</h4>
               </div>
               <div className="h-10 w-10 rounded-full bg-brand-yellow flex items-center justify-center text-brand-red shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
               </div>
            </div>
          </Link>
        )}

        {/* Section heading */}
        <div className="flex items-center justify-between mb-8 px-1">
          <h3 className="text-xl font-black text-slate-900 tracking-tight italic uppercase">
            Job Opportunities
          </h3>
          <Link
            to="/rider/alerts"
            className="text-[10px] font-black text-brand-red uppercase tracking-widest border-b-2 border-brand-red/20 pb-0.5"
          >
            See All
          </Link>
        </div>

        {/* ─── JOBS LIST — no cards ──────────────────────────────── */}
        {batches.length === 0 ? (
          <div className="py-24 text-center space-y-4">
            <div className="mx-auto h-20 w-20 rounded-full bg-white/50 flex items-center justify-center opacity-40">
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">No jobs right now</p>
            <p className="text-[10px] font-medium text-slate-300">New orders will appear here instantly</p>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-slate-200/40">
            {batches.map((batch, idx) => (
              <div key={batch.id} className="py-7 space-y-5">
                {/* Batch header row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-white/60 flex items-center justify-center text-2xl border border-white/80 shadow-sm">
                      🍔
                    </div>
                    <div>
                      <p className="text-[15px] font-black text-slate-900 leading-tight tracking-tight font-outfit">
                        {batch.store_name || "De Boye's Kitchen"}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                        {batch.stops_count} stop{batch.stops_count !== 1 ? 's' : ''} · {batch.area || 'Accra'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-brand-red tracking-tight font-outfit">₵{batch.total_payout}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Payout</p>
                  </div>
                </div>

                {/* Meta row — seamless */}
                <div className="flex items-center gap-6 px-1">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-red" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      ~{batch.estimated_time || 25} min
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Batch #{batch.id}
                    </span>
                  </div>
                </div>

                {/* Action row — seamless */}
                <div className="flex items-center gap-3">
                  <Link
                    to={`/rider/batch/${batch.id}`}
                    className="flex-1 h-14 bg-brand-red rounded-2xl flex items-center justify-between px-6 text-white active:scale-[0.97] transition-all shadow-lg shadow-brand-red/20 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] relative z-10">Accept Job</span>
                    <div className="h-7 w-7 rounded-full bg-brand-yellow flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform">
                      <svg className="w-4 h-4 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                  <button className="h-14 px-6 rounded-2xl bg-white/60 border border-white text-[11px] font-black uppercase tracking-widest text-slate-400 active:scale-95 transition-all">
                    Skip
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
