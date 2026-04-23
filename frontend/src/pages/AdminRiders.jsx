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
    <div className="space-y-8 py-6 max-w-7xl mx-auto px-4 sm:px-6">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight font-inter">Riders Fleet</h1>
          <p className="mt-1 text-slate-500 text-sm">{riders.filter(r => r.status === 'Online').length} riders currently online</p>
        </div>
        <div className="flex gap-4">
             {/* Future: Filter by area dropdown */}
        </div>
      </header>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-slate-500">Loading riders...</p>
        ) : riders.map((r) => (
          <div key={r.id} className="rounded-lg bg-white p-6 border border-slate-200 transition-shadow hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-semibold text-lg">
                {r.initials}
              </div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                r.status === 'Online' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
              }`}>
                {r.status}
              </span>
            </div>
            
            <div className="mt-4">
              <h3 className="text-base font-semibold text-slate-900 font-inter">{r.username}</h3>
              <div className="mt-1 flex items-center gap-1.5 text-slate-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm">{r.area || 'No Area Set'}</span>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4 flex gap-3">
              <button className="flex-1 rounded-md bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors">
                View History
              </button>
              <button className="rounded-md bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors" title="Call Rider">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
