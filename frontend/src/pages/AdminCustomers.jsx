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
    <div className="space-y-6 max-w-[100vw] overflow-x-hidden font-inter">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end justify-between bg-white p-6 lg:p-8 border-b border-slate-200">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-outfit">Customers</h1>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Manage your active customer base</p>
        </div>
        <div className="relative w-full max-w-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input 
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-lg bg-slate-50 border border-slate-200 pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-all font-medium"
          />
        </div>
      </header>

      {/* Main Table Interface */}
      <div className="bg-white border-y border-slate-200">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-slate-500">Customer</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-slate-500">Contact Info</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-slate-500">Joined Date</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-slate-500 text-right">Total Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-24">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="h-10 w-10 rounded-full border-4 border-slate-100 border-t-brand-red animate-spin"></div>
                      <p className="text-sm font-medium text-slate-400">Loading customer data...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-20 text-center text-slate-500 font-medium">No matching customers found.</td></tr>
              ) : filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-sm">
                        {c.initials}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 font-outfit">{c.username}</h3>
                    </div>
                  </td>
                  
                  <td className="px-6 py-5 align-middle">
                    <p className="text-sm font-medium text-slate-500">{c.email}</p>
                  </td>

                  <td className="px-6 py-5 align-middle">
                    <p className="text-sm font-medium text-slate-900">{c.date_joined}</p>
                  </td>

                  <td className="px-6 py-5 align-middle text-right">
                    <span className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                      {c.order_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
