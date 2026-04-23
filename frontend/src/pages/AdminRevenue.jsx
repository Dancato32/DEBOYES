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

  if (loading) return <div className="p-10 text-slate-500 font-medium animate-pulse flex justify-center">Loading financial data...</div>

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto px-4 sm:px-6">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight font-inter">Revenue Tracking</h1>
        <p className="mt-1 text-slate-500 text-sm">Detailed breakdown of all earnings by date and time.</p>
      </header>

      <section className="rounded-lg bg-white border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold text-slate-900 w-20">Order ID</th>
                <th className="px-6 py-3 font-semibold text-slate-900 w-32">Date & Time</th>
                <th className="px-6 py-3 font-semibold text-slate-900 w-40">Customer</th>
                <th className="px-6 py-3 font-semibold text-slate-900">Items</th>
                <th className="px-6 py-3 font-semibold text-slate-900 text-right pr-6 w-32">Total</th>
              </tr>
            </thead>
            <tbody>
              {revenueItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center text-sm text-slate-500">No revenue data available yet.</td>
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
                      <tr className="bg-slate-50 border-y border-slate-200">
                        <td colSpan="5" className="px-6 py-3 text-sm font-semibold text-slate-900">
                          {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </td>
                      </tr>
                      {/* Order Rows */}
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0">
                          <td className="px-6 py-4 font-mono text-xs text-slate-500">
                            {item.id}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-slate-900 font-medium">{item.date}</span>
                              <span className="text-slate-500 text-xs mt-0.5">{item.time}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-900 font-medium">
                            {item.customer}
                          </td>
                          <td className="px-6 py-4 text-slate-500 max-w-[300px] truncate">
                            {item.items}
                          </td>
                          <td className="px-6 py-4 text-right pr-6 font-medium text-slate-900">
                            ₵{parseFloat(item.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {/* Daily Summary Row */}
                      <tr className="bg-slate-50/50 border-y border-slate-200">
                        <td colSpan="4" className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Daily Total Revenue
                        </td>
                        <td className="px-6 py-4 text-right pr-6 text-base font-bold text-slate-900">
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
      
      <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 flex items-start gap-3">
        <svg className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <p className="text-sm text-blue-800">
          <strong className="font-semibold">Note:</strong> Only "Delivered" orders are counted as realized revenue.
        </p>
      </div>
    </div>
  )
}
