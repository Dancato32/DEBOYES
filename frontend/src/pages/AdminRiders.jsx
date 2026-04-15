import { useEffect, useState } from 'react'
import { fetchAdminRiders } from '../services/api'
import useAdminSocket from '../hooks/useAdminSocket'
import { toast } from 'react-toastify'

export default function AdminRidersPage() {
  const [riders, setRiders] = useState([])
  const [loading, setLoading] = useState(true)

  const loadRiders = async () => {
    setLoading(true)
    try {
      const response = await fetchAdminRiders()
      setRiders(response.data.riders)
    } catch (error) {
      toast.error('Failed to load riders')
    } finally {
      setLoading(false)
    }
  }

  useAdminSocket((update) => {
    if (update.event === 'RIDER_STATUS_CHANGE' || update.event === 'ORDER_ACCEPTED') {
      loadRiders()
    }
  })

  useEffect(() => {
    loadRiders()
  }, [])

  return (
    <div className="space-y-10 py-6">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-brand-deep-dark tracking-tight uppercase">Riders Fleet</h1>
          <p className="mt-2 text-brand-charcoal font-medium">{riders.filter(r => r.status === 'Online').length} riders currently online</p>
        </div>
        <div className="flex gap-4">
             {/* Future: Filter by area dropdown */}
        </div>
      </header>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-brand-charcoal">Loading riders...</p>
        ) : riders.map((r) => (
          <div key={r.id} className="rounded-[2.5rem] bg-white p-8 shadow-soft border border-[#F0E8D8] transition-all hover:border-brand-red/30">
            <div className="flex items-center justify-between">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-cream border border-[#F0E8D8] text-xl font-black text-brand-dark-red">
                {r.initials}
              </div>
              <span className={`rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest ${
                r.status === 'Online' ? 'bg-brand-red text-white shadow-md shadow-brand-red/20' : 'bg-[#E5DFD3] text-brand-charcoal'
              }`}>
                {r.status}
              </span>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-bold font-poppins text-brand-deep-dark tracking-tight">{r.username}</h3>
              <div className="mt-4 flex items-center gap-2 text-brand-charcoal">
                <span className="text-lg">📍</span>
                <span className="text-xs font-bold uppercase tracking-widest">{r.area || 'No Area Set'}</span>
              </div>
            </div>

            <div className="mt-8 border-t border-[#F0E8D8] pt-6 flex gap-4">
              <button className="flex-1 rounded-2xl bg-brand-cream/50 border border-[#F0E8D8] py-3 text-xs font-bold text-brand-charcoal hover:bg-brand-gold hover:border-brand-gold hover:text-brand-deep-dark transition-all">
                View History
              </button>
              <button className="rounded-2xl bg-brand-cream/50 border border-[#F0E8D8] px-4 py-3 text-sm hover:bg-brand-gold hover:border-brand-gold transition-all">
                📞
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
