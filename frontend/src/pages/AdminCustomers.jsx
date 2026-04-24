import { useEffect, useState } from 'react'
import { fetchAdminCustomers } from '../services/api'
import { toast } from '../utils/soundToast'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const response = await fetchAdminCustomers()
      setCustomers(response.data.customers)
    } catch (error) {
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const filteredCustomers = customers.filter(c => 
    c.username.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto px-4 sm:px-6">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight font-inter">Customers</h1>
          <p className="mt-1 text-slate-500 text-sm">Manage your active customer base</p>
        </div>
        <div className="relative w-full max-w-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input 
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-md border border-slate-300 pl-10 pr-3 py-2 text-sm placeholder-slate-400 focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red sm:text-sm"
          />
        </div>
      </header>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
           <p className="text-slate-500">Loading customers...</p>
        ) : filteredCustomers.map((c) => (
          <div key={c.id} className="rounded-lg bg-white p-6 border border-slate-200 hover:shadow-sm transition-shadow group flex flex-col">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-semibold text-lg">
                {c.initials}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-slate-900 font-inter truncate">{c.username}</h3>
                <p className="text-sm text-slate-500 truncate">{c.email}</p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
              <div>
                <p className="text-xs font-medium text-slate-500">Joined</p>
                <p className="mt-0.5 text-sm font-medium text-slate-900">{c.date_joined}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-slate-500">Orders</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{c.order_count}</p>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
