import React, { useEffect, useState } from 'react'
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

  if (loading) return <div className="p-10 text-brand-red font-bold animate-pulse">Loading financial data...</div>

  return (
    <div className="space-y-10 py-6">
      <header>
        <h1 className="text-3xl font-bold font-poppins text-brand-deep-dark tracking-tight uppercase">Revenue Tracking</h1>
        <p className="mt-2 text-brand-charcoal font-medium font-inter text-sm">Detailed breakdown of all earnings by date and time.</p>
      </header>

      <section className="rounded-[2.5rem] bg-white p-4 sm:p-8 shadow-soft border border-[#F0E8D8] overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F0E8D8] text-[10px] font-bold uppercase tracking-widest text-brand-charcoal font-inter">
                <th className="pb-5 pl-2 w-20">ID</th>
                <th className="pb-5 w-32">DATE & TIME</th>
                <th className="pb-5 w-40">CUSTOMER</th>
                <th className="pb-5">ITEMS</th>
                <th className="pb-5 text-right pr-4 w-32">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {revenueItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center text-sm font-medium text-brand-charcoal font-inter">No revenue data available yet.</td>
                </tr>
              ) : (
                Object.entries(
                  revenueItems.reduce((acc, item) => {
                    if (!acc[item.date]) acc[item.date] = [];
                    acc[item.date].push(item);
                    return acc;
                  }, {})
                )
                .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
                .map(([date, items]) => {
                  const dayTotal = items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
                  return (
                    <React.Fragment key={date}>
                      {/* Section Header Row */}
                      <tr className="bg-brand-cream/40">
                        <td colSpan="5" className="py-4 pl-4 text-xl font-bold uppercase tracking-tight text-brand-red font-poppins border-y border-[#F0E8D8]/50">
                          {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </td>
                      </tr>
                      {/* Order Rows */}
                      {items.map((item) => (
                        <tr key={item.id} className="group hover:bg-brand-cream/50 transition-colors border-b border-[#F0E8D8]/30">
                          <td className="py-6 pl-2 font-mono text-xs text-brand-red font-bold group-hover:scale-105 transition-transform origin-left">
                            {item.id}
                          </td>
                          <td className="py-6">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-brand-deep-dark font-inter whitespace-nowrap">{item.date}</span>
                              <span className="text-[10px] text-brand-charcoal font-bold font-inter mt-0.5">{item.time}</span>
                            </div>
                          </td>
                          <td className="py-6 text-sm font-black text-brand-deep-dark font-inter uppercase tracking-tight">
                            {item.customer}
                          </td>
                          <td className="py-6 text-xs text-brand-charcoal font-bold font-inter leading-relaxed pr-8 uppercase">
                            {item.items}
                          </td>
                          <td className="py-6 text-right pr-4 text-xl font-bold font-poppins text-brand-red tracking-tighter">
                            ₵{parseFloat(item.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {/* Daily Summary Row */}
                      <tr className="bg-brand-red/[0.03] border-t-2 border-brand-red/10">
                        <td colSpan="4" className="py-5 pl-4 text-[10px] font-black uppercase tracking-[0.25em] text-brand-deep-dark font-inter">
                          Daily Total Revenue
                        </td>
                        <td className="py-5 text-right pr-4 text-xl font-black font-poppins text-brand-red underline decoration-[3px] underline-offset-[8px] decoration-brand-red/30">
                          ₵{dayTotal.toFixed(2)}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })
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
