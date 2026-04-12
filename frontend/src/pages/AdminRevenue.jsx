import { useEffect, useState } from 'react'
import { fetchAdminRevenue } from '../services/api'
import { toast } from 'react-toastify'

export default function AdminRevenue() {
  const [revenueItems, setRevenueItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRevenue = async () => {
      try {
        const res = await fetchAdminRevenue()
        setRevenueItems(res.data.revenue_items)
      } catch (error) {
        toast.error('Failed to load revenue data')
      } finally {
        setLoading(false)
      }
    }
    loadRevenue()
  }, [])

  if (loading) return <div className="p-10 text-white">Loading financial data...</div>

  return (
    <div className="space-y-10 py-6">
      <header>
        <h1 className="text-3xl font-bold font-playfair text-brand-deep-dark tracking-tight">Revenue Tracking</h1>
        <p className="mt-2 text-brand-charcoal font-medium">Detailed breakdown of all earnings by date and time.</p>
      </header>

      <section className="rounded-[2.5rem] bg-white p-8 shadow-soft border border-[#F0E8D8]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#F0E8D8] text-[10px] font-bold uppercase tracking-[0.2em] text-brand-charcoal">
                <th className="pb-4 pl-2">Date / Time</th>
                <th className="pb-4">Order ID</th>
                <th className="pb-4">Customer</th>
                <th className="pb-4 text-right pr-2">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0E8D8]">
              {revenueItems.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center text-brand-charcoal">No revenue data available yet.</td>
                </tr>
              ) : (
                revenueItems.map((item) => (
                  <tr key={item.id} className="group hover:bg-brand-cream/50 transition-colors">
                    <td className="py-6 pl-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-brand-deep-dark">{item.date}</span>
                        <span className="text-[10px] uppercase tracking-widest text-brand-charcoal">{item.time}</span>
                      </div>
                    </td>
                    <td className="py-6 font-mono text-xs text-brand-charcoal/80 group-hover:text-brand-red transition-colors">{item.id}</td>
                    <td className="py-6 text-sm font-semibold text-brand-deep-dark">{item.customer}</td>
                    <td className="py-6 text-right pr-2 text-lg font-black font-playfair text-brand-gold">
                      ₵{parseFloat(item.amount).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      
      <div className="rounded-[2rem] bg-[#F0E8D8] p-6">
        <p className="text-sm text-brand-charcoal">
          <strong>Note:</strong> Only "Delivered" orders are counted as realized revenue.
        </p>
      </div>
    </div>
  )
}
