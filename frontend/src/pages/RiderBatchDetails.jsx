import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchBatchDetails, acceptBatch } from '../services/api'
import { toast } from '../utils/soundToast'
import BottomNav from '../components/BottomNav'

export default function RiderBatchDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [batch, setBatch] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const res = await fetchBatchDetails(id)
        setBatch(res.data)
      } catch (err) {
        toast.error('Failed to load batch details')
      } finally {
        setLoading(false)
      }
    }
    loadDetails()
  }, [id])

  const handleAccept = async () => {
    try {
      await acceptBatch(id)
      toast.success('Batch accepted! 🚀')
      navigate('/rider/active')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to accept batch')
    }
  }

  if (loading) return <div className="min-h-screen bg-brand-cream flex items-center justify-center text-slate-400 italic uppercase text-[10px] font-black tracking-widest">Loading Details...</div>
  if (!batch) return <div className="min-h-screen bg-brand-cream flex items-center justify-center text-brand-red italic">Batch not found</div>

  return (
    <div className="min-h-screen bg-brand-cream text-slate-800 pb-32 font-inter">
      <div className="mx-auto max-w-lg px-6 pt-10 space-y-8">
        
        <header className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white border border-[#F0E8D8] hover:bg-slate-50 transition-colors text-brand-red shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-inter">Order Breakdown</p>
            <h1 className="text-2xl font-bold font-poppins text-slate-800 tracking-tight">#{batch.id} Route Detail</h1>
          </div>
        </header>

        {/* Route Visualization */}
        <section className="rounded-[22px] bg-white p-1 relative h-48 overflow-hidden shadow-sm border border-[#F0E8D8]">
           <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#C0111A 2px, transparent 2px)', backgroundSize: '20px 20px' }} />
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-full flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                   <div className="h-3 w-3 rounded-full bg-brand-red shadow-[0_0_15px_rgba(192,17,26,0.5)]" />
                   <div className="h-[2px] w-20 bg-brand-red/20 dashed" />
                   <div className="h-3 w-3 rounded-full bg-brand-red shadow-[0_0_15px_rgba(192,17,26,0.3)]" />
                   <div className="h-[2px] w-12 bg-brand-red/20 dashed" />
                   <div className="h-3 w-3 rounded-full bg-[#15803D] shadow-[0_0_15px_rgba(21,128,61,0.3)]" />
                </div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300 mt-4 italic font-inter">Optimized Path Analysis</p>
             </div>
           </div>
        </section>

        {/* Info Grid */}
        <section className="grid grid-cols-2 gap-4">
           <div className="rounded-[22px] bg-white border border-[#F0E8D8] p-6 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 font-inter">Total Payout</p>
              <p className="text-2xl font-bold font-poppins text-brand-red tracking-tight italic">₵{batch.total_payout}</p>
           </div>
           <div className="rounded-[22px] bg-white border border-[#F0E8D8] p-6 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 font-inter">Time Frame</p>
              <p className="text-2xl font-bold font-poppins text-slate-800 tracking-tight italic">~{batch.estimated_time}m</p>
           </div>
        </section>

        {/* Stops List */}
        <section className="space-y-5">
           <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 font-inter">Sequential Stops ({batch.stops.length})</h2>
           <div className="space-y-4">
              {batch.stops.map((stop, i) => (
                <div key={stop.id} className="group flex flex-col gap-4 p-6 rounded-[22px] bg-white border border-[#F0E8D8] border-l-[6px] border-l-brand-red shadow-sm hover:shadow-md transition-shadow">
                   <div className="flex items-center gap-4">
                     <div className="h-10 w-10 rounded-full bg-brand-red/5 flex items-center justify-center text-[12px] font-black text-brand-red shrink-0">
                       {i + 1}
                     </div>
                     <div>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-inter">Recipient</p>
                       <p className="text-base font-bold font-poppins text-slate-800 tracking-tight">{stop.customer}</p>
                     </div>
                   </div>
                   
                   <p className="text-[11px] font-bold text-slate-500 leading-relaxed bg-brand-cream/30 px-4 py-3 rounded-xl border border-[#F0E8D8] flex items-center gap-2">
                       <svg className="w-4 h-4 text-brand-red shrink-0" fill="currentColor" viewBox="0 0 24 24">
                         <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                       </svg>
                       {stop.address}
                    </p>

                   <div className="space-y-2 mt-1">
                     {stop.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">🍲</span>
                            <span className="text-sm font-bold text-slate-700">{item.food}</span>
                          </div>
                          <span className="text-xs font-black text-brand-red">x{item.qty}</span>
                        </div>
                     ))}
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* Actions */}
        <div className="pt-6">
          <button 
            onClick={handleAccept}
            className="w-full rounded-[16px] bg-brand-red py-5 text-xs font-bold uppercase tracking-widest text-white shadow-xl shadow-brand-red/20 hover:bg-brand-dark-red transition-all active:scale-[0.95] font-inter"
          >
            CONFIRM BATCH
          </button>
          <p className="text-center text-[10px] font-medium text-slate-400 mt-5 uppercase tracking-widest px-8 font-inter">Confirming will auto-assign all {batch.stops.length} routing stops to your device.</p>
        </div>

      </div>
      <BottomNav />
    </div>
  )
}
