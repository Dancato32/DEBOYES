import { useEffect, useState } from 'react'
import { fetchAdminCustomers } from '../services/api'
import { toast } from 'react-toastify'

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
    <div className="space-y-10 py-6">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-brand-deep-dark tracking-tight uppercase">Customers</h1>
          <p className="mt-2 text-brand-charcoal font-medium">Manage your active customer base</p>
        </div>
        <div className="relative w-full max-w-sm">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔍</span>
          <input 
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border-[#F0E8D8] rounded-3xl pl-12 pr-4 py-3 placeholder:text-brand-charcoal/60 shadow-soft focus:border-brand-red focus:ring-brand-red text-brand-deep-dark"
          />
        </div>
      </header>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
           <p className="text-brand-charcoal">Loading customers...</p>
        ) : filteredCustomers.map((c) => (
          <div key={c.id} className="rounded-[2.5rem] bg-white p-6 shadow-soft border border-[#F0E8D8] hover:border-brand-red/30 transition-all group">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-cream text-brand-dark-red font-black text-lg border border-[#F0E8D8]">
                {c.initials}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold font-poppins text-brand-deep-dark tracking-tight">{c.username}</h3>
                <p className="text-xs text-brand-charcoal break-all">{c.email}</p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-[#F0E8D8] pt-6">
              <div>
                <p className="text-[10px] font-bold text-brand-charcoal/60 uppercase tracking-widest">Joined</p>
                <p className="mt-1 text-sm font-medium text-brand-deep-dark">{c.date_joined}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-brand-charcoal/60 uppercase tracking-widest">Orders</p>
                <p className="mt-1 text-sm font-black text-brand-red">{c.order_count}</p>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
