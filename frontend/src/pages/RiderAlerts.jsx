import { useEffect, useState } from 'react'
import { fetchAvailableBatches } from '../services/api'
import { Link } from 'react-router-dom'
import { toast } from '../utils/soundToast'
import BottomNav from '../components/BottomNav'
import useRiderSocket from '../hooks/useRiderSocket'

export default function RiderAlerts() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)

  const loadBatches = async () => {
    try {
      const res = await fetchAvailableBatches()
      setBatches(res.data.batches || [])
    } catch (err) {
      toast.error('Failed to load delivery alerts')
    } finally {
      setLoading(false)
    }
  }

  useRiderSocket((data) => {
    if (data.event === 'NEW_BATCH' || data.event === 'ORDER_TAKEN') {
      loadBatches()
      if (data.event === 'NEW_BATCH') {
        toast.info('New Super Order available! 🛰️', { position: "top-center" })
      }
    }
  })

  useEffect(() => {
    loadBatches()
    const interval = setInterval(loadBatches, 30000) // Increase polling interval since we have WS now
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-brand-cream text-slate-800 pb-32 font-inter">
      <div className="mx-auto max-w-lg px-6 pt-10 space-y-8">
        
        <header className="space-y-1">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 font-inter">Live Opportunities</p>
          <h1 className="text-3xl font-bold font-poppins text-brand-red uppercase tracking-tight">Delivery Alerts</h1>
        </header>

        {/* Availability Warning */}
        <Link 
          to="/rider"
          className="block rounded-[22px] bg-white border border-[#F0E8D8] p-5 group hover:bg-slate-50 transition-all shadow-sm"
        >
          <div className="flex items-center gap-4">
             <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-brand-red/5 text-brand-red text-xl">⚠️</div>
             <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-red mb-0.5 font-inter">Operational Status</p>
                <p className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors">Go to Hub to ensure you are 'Online' for real-time alerts.</p>
             </div>
          </div>
        </Link>

        {loading ? (
          <div className="py-20 text-center animate-pulse">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 italic font-inter">Scanning for batches...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="text-5xl opacity-10 grayscale">📡</div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic font-inter">No active Super Orders in your area.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {batches.map((batch) => (
              <Link 
                key={batch.id} 
                to={`/rider/batch/${batch.id}`}
                className="group relative rounded-[2.5rem] bg-brand-red border-[2px] border-white/20 p-7 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl text-white overflow-hidden"
              >
                {/* Visual Flair */}
                <div className="absolute -right-8 -bottom-8 text-9xl text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-1000">📦</div>

                {/* NEW Badge */}
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-white text-brand-red text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg border-2 border-brand-red">
                  NEW
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                     <div className="space-y-1">
                       <p className="text-[9px] font-bold uppercase tracking-widest text-white/80 font-inter">Super Order</p>
                       <p className="text-4xl font-bold font-poppins text-white flex items-center gap-2 italic">
                         ₵{batch.total_payout}
                       </p>
                     </div>
                     <span className="rounded-xl bg-white/10 px-4 py-2 text-[9px] font-bold uppercase text-white font-inter tracking-widest border border-white/20 backdrop-blur-sm">
                       {batch.stops_count} stops
                     </span>
                  </div>

                  <div className="bg-brand-deep-dark/30 rounded-[22px] p-5 space-y-4 mb-8 backdrop-blur-md border border-white/5">
                     <div className="flex justify-between items-center text-sm font-bold">
                       <span className="text-white/60 uppercase text-[9px] tracking-widest font-inter">Target Area</span>
                       <span className="font-poppins text-lg font-bold italic text-white">{batch.area}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm font-bold">
                       <span className="text-white/60 uppercase text-[9px] tracking-widest font-inter">Est. Duration</span>
                       <span className="text-sm text-slate-100 tracking-widest font-inter font-bold uppercase">~{batch.estimated_time} mins</span>
                     </div>
                  </div>

                  <div className="flex gap-4">
                     <div className="flex-1 flex items-center justify-center rounded-2xl bg-white text-brand-red py-4 text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl shadow-white/10 active:scale-95 font-inter">
                       Accept Batch
                     </div>
                     <div className="px-8 flex items-center justify-center rounded-2xl bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95 border border-white/10 font-inter">
                       Skip
                     </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
