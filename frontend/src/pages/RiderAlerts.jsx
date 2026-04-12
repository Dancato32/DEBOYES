import { useEffect, useState } from 'react'
import { fetchAvailableBatches } from '../services/api'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
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
    <div className="min-h-screen bg-brand-cream text-slate-800 pb-32 font-dmsans">
      <div className="mx-auto max-w-lg px-6 pt-10 space-y-8">
        
        <header className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-slate-400">Live Opportunities</p>
          <h1 className="text-4xl font-black font-playfair text-brand-red italic">Delivery Alerts</h1>
        </header>

        {/* Availability Warning */}
        <Link 
          to="/rider"
          className="block rounded-[22px] bg-white border border-[#F0E8D8] p-5 group hover:bg-slate-50 transition-all shadow-sm"
        >
          <div className="flex items-center gap-4">
             <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-brand-red/5 text-brand-red text-xl">⚠️</div>
             <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-0.5">Operational Status</p>
                <p className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors">Go to Hub to ensure you are 'Online' for real-time alerts.</p>
             </div>
          </div>
        </Link>

        {loading ? (
          <div className="py-20 text-center animate-pulse">
            <p className="text-xs font-black uppercase tracking-widest text-slate-300 italic">Scanning for batches...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="text-5xl opacity-10 grayscale">📡</div>
            <p className="text-xs font-black text-slate-300 uppercase tracking-widest italic">No active Super Orders in your area.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {batches.map((batch) => (
              <Link 
                key={batch.id} 
                to={`/rider/batch/${batch.id}`}
                className="group relative rounded-[2.5rem] bg-brand-red border-[2px] border-brand-gold p-7 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl text-white overflow-hidden"
              >
                {/* Visual Flair */}
                <div className="absolute -right-8 -bottom-8 text-9xl text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-1000">📦</div>

                {/* NEW Badge */}
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-brand-gold text-brand-deep-dark text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg border-2 border-brand-red">
                  NEW
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                     <div className="space-y-1">
                       <p className="text-[10px] font-bold uppercase tracking-[2px] text-brand-gold">Super Order</p>
                       <p className="text-5xl font-black font-playfair text-white flex items-center gap-2 italic">
                         ₵{batch.total_payout}
                       </p>
                     </div>
                     <span className="rounded-xl bg-white/10 px-4 py-2 text-[10px] font-black uppercase text-brand-gold font-dmsans tracking-widest border border-brand-gold/30 backdrop-blur-sm">
                       {batch.stops_count} stops
                     </span>
                  </div>

                  <div className="bg-brand-deep-dark/30 rounded-[22px] p-5 space-y-4 mb-8 backdrop-blur-md border border-white/5">
                     <div className="flex justify-between items-center text-sm font-bold">
                       <span className="text-brand-gold uppercase text-[10px] tracking-widest">Target Area</span>
                       <span className="font-playfair text-xl italic">{batch.area}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm font-bold">
                       <span className="text-brand-gold uppercase text-[10px] tracking-widest">Est. Duration</span>
                       <span className="text-base text-slate-100 tracking-wide font-dmsans">~{batch.estimated_time} mins</span>
                     </div>
                  </div>

                  <div className="flex gap-4">
                     <div className="flex-1 flex items-center justify-center rounded-2xl bg-brand-gold py-4 text-xs font-black uppercase tracking-widest text-brand-deep-dark transition-all shadow-xl shadow-brand-gold/20 active:scale-95">
                       Accept Batch
                     </div>
                     <div className="px-8 flex items-center justify-center rounded-2xl bg-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95 border border-white/10">
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
