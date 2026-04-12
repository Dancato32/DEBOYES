import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchAdminStats, fetchAdminOrders, fetchAdminRiders } from '../services/api'
import useAdminSocket from '../hooks/useAdminSocket'
import { toast } from 'react-toastify'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ 
    total_orders: 0, 
    active_riders: 0, 
    total_revenue: '0.00',
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
    // Refresh all data when any relevant event occurs
    loadData()
  })

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="space-y-10 py-6">
      <header>
        <h1 className="text-3xl font-bold font-playfair text-brand-deep-dark tracking-tight">Good morning, Admin</h1>
        <p className="mt-2 text-brand-charcoal font-medium">Here's what's happening with De Boye's today.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        {[
          { icon: '📊', label: 'Total orders today', value: stats.total_orders, trend: stats.order_trend, path: '/admin/orders' },
          { icon: '👥', label: 'Active riders', value: stats.active_riders, trend: stats.rider_trend, path: '/admin/riders' },
          { icon: '💰', label: `Revenue today (${stats.today_deliveries} deliveries)`, value: `₵${stats.total_revenue}`, trend: stats.revenue_trend, path: '/admin/revenue' },
        ].map((card, i) => (
          <Link 
            key={i} 
            to={card.path}
            className="group rounded-[2.5rem] bg-white p-8 shadow-soft border border-[#F0E8D8] transition-all hover:border-brand-red/50 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-cream text-xl transition-all group-hover:scale-110 group-hover:bg-brand-red/10">
              {card.icon}
            </div>
            <div className="mt-5">
              <p className="text-sm font-medium text-brand-charcoal">{card.label}</p>
              <h2 className="mt-2 text-4xl font-black font-playfair text-brand-deep-dark">{card.value}</h2>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-brand-red">{card.trend}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        {/* Orders Section */}
      <section className="rounded-[2.5rem] bg-white p-8 shadow-soft border border-[#F0E8D8]">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold font-playfair text-brand-deep-dark">Recent Orders</h2>
        </div>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#F0E8D8] text-[10px] font-bold uppercase tracking-[0.2em] text-brand-charcoal">
                  <th className="pb-4 pl-2">Order ID</th>
                  <th className="pb-4">Date & Time</th>
                  <th className="pb-4">Customer</th>
                  <th className="pb-4">Items</th>
                  <th className="pb-4 text-right pr-2">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E8D8]">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-sm text-brand-charcoal">No orders found.</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="group hover:bg-brand-cream/50 transition-colors">
                      <td className="py-5 pl-2 font-mono text-xs text-brand-charcoal/80">{order.id}</td>
                      <td className="py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-brand-deep-dark">{order.date}</span>
                          <span className="text-[10px] text-brand-charcoal">{order.time}</span>
                        </div>
                      </td>
                      <td className="py-5 text-sm font-semibold text-brand-deep-dark">{order.customer}</td>
                      <td className="py-5 text-sm text-brand-charcoal">{order.items}</td>
                      <td className="py-5 text-right pr-2 font-bold text-brand-red">₵{order.total}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Riders Section */}
        <section className="rounded-[2.5rem] bg-white p-8 shadow-soft border border-[#F0E8D8]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-playfair text-brand-deep-dark">Riders on duty</h2>
            <span className="text-[10px] font-bold text-brand-red">{riders.length} online</span>
          </div>

          <div className="mt-8 space-y-4">
            {riders.map((r) => (
              <div key={r.id} className="flex items-center gap-4 rounded-3xl bg-brand-cream/40 p-4 transition hover:bg-brand-cream">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-[#F0E8D8] font-black text-brand-dark-red">
                  {r.initials}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-brand-deep-dark">{r.username}</p>
                  <p className="text-[10px] text-brand-charcoal uppercase tracking-widest">{r.area}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                  r.status === 'Online' ? 'bg-brand-gold text-brand-deep-dark shadow-sm' : 'bg-[#E5DFD3] text-brand-charcoal'
                }`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
