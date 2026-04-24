import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchAdminStats, fetchAdminOrders, fetchAdminRiders } from '../services/api'
import useAdminSocket from '../hooks/useAdminSocket'
import { toast } from '../utils/soundToast'
import { playNotificationSound } from '../utils/notificationSound'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ 
    total_orders: 0, 
    active_riders: 0, 
    total_revenue: '0.00',
    lifetime_revenue: '0.00',
    lifetime_deliveries: 0,
    today_deliveries: 0,
    order_trend: '...',
    revenue_trend: '...',
    rider_trend: '...'
  })
  const [orders, setOrders] = useState([])
  const [riders, setRiders] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [sRes, oRes, rRes] = await Promise.all([
        fetchAdminStats(),
        fetchAdminOrders('All'),
        fetchAdminRiders()
      ])
      setStats(sRes.data)
      setOrders(oRes.data.orders)
      setRiders(rRes.data.riders)
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useAdminSocket((update) => {
    if (update.event === 'ORDER_PLACED') {
      playNotificationSound('ring')
    }
    loadData()
  })

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto px-4 sm:px-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight font-inter">Overview</h1>
          <p className="mt-1 text-slate-500 text-sm">Here's what's happening with your store today.</p>
        </div>
        
        {/* Persistence Alert Helper */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
           <span className="text-amber-500 mt-0.5">⚠️</span>
           <div>
             <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Persistence Check</p>
             <p className="text-xs text-amber-700 mt-1">Ensure DATABASE_URL is set in Render for permanent storage.</p>
           </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { 
            label: 'Total orders today', 
            value: stats.total_orders, 
            trend: stats.order_trend, 
            path: '/admin/orders',
            icon: (
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            )
          },
          { 
            label: 'Active riders', 
            value: stats.active_riders, 
            trend: stats.rider_trend, 
            path: '/admin/riders',
            icon: (
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            )
          },
          { 
            label: `Revenue today`, 
            value: `₵${stats.total_revenue}`, 
            trend: `${stats.today_deliveries} deliveries`, 
            path: '/admin/revenue',
            icon: (
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )
          },
          { 
            label: `Lifetime Revenue`, 
            value: `₵${stats.lifetime_revenue}`, 
            trend: `${stats.lifetime_deliveries} total dlv`, 
            path: '/admin/revenue',
            icon: (
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            )
          },
        ].map((card, i) => (
          <Link 
            key={i} 
            to={card.path}
            className="group flex flex-col justify-between rounded-lg bg-white p-5 border border-slate-200 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              {card.icon}
            </div>
            <div className="mt-4">
              <h2 className="text-2xl font-bold text-slate-900 font-inter">{card.value}</h2>
              <p className="mt-1 text-xs text-slate-500 font-medium">{card.trend}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-lg bg-white border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">Recent Orders</h2>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Order</th>
                  <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Customer</th>
                  <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Items</th>
                  <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Total</th>
                  <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-slate-500 font-medium italic">No orders found.</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono text-[10px] font-black text-brand-red mb-1">#{order.id}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{order.time}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-900 font-black text-xs font-outfit">{order.customer}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs font-bold max-w-[300px] truncate">{order.items}</td>
                      <td className="px-6 py-4 font-black text-slate-900">₵{order.total}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                          order.status === 'Delivered'   ? 'bg-emerald-100 text-emerald-800' : 
                          order.status === 'New'         ? 'bg-purple-100 text-purple-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg bg-white border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">Active Riders</h2>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              {riders.length} Online
            </span>
          </div>

          <div className="divide-y divide-slate-200 flex-1">
            {riders.length === 0 ? (
               <div className="px-6 py-10 text-center text-sm text-slate-500">No active riders.</div>
            ) : (
              riders.map((r) => (
                <div key={r.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-medium text-slate-700">
                    {r.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{r.username}</p>
                    <p className="text-xs text-slate-500 truncate">{r.area}</p>
                  </div>
                  <div className={`h-2 w-2 rounded-full ${
                    r.status === 'Online' ? 'bg-emerald-500' : 'bg-slate-300'
                  }`} />
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
