import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchAdminStats, fetchAdminOrders, fetchAdminRiders, fetchAdminSettings, updateAdminSetting } from '../services/api'
import useAdminSocket from '../hooks/useAdminSocket'
import { toast } from 'react-toastify'

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
  const [riders, setRiders] = useState([])
  const [settings, setSettings] = useState({ broadcast_message: '' })
  const [loading, setLoading] = useState(true)
  const [savingSetting, setSavingSetting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [sRes, oRes, rRes, setRes] = await Promise.all([
        fetchAdminStats(),
        fetchAdminOrders('All'),
        fetchAdminRiders(),
        fetchAdminSettings()
      ])
      setStats(sRes.data)
      setOrders(oRes.data.orders)
      setRiders(rRes.data.riders)
      setSettings(setRes.data.settings || { broadcast_message: '' })
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

  const handleUpdateBroadcast = async () => {
    setSavingSetting(true)
    try {
      await updateAdminSetting({ key: 'broadcast_message', value: settings.broadcast_message })
      toast.success('System announcement updated!')
    } catch (error) {
      toast.error('Failed to save announcement')
    } finally {
      setSavingSetting(false)
    }
  }

  return (
    <div className="space-y-10 py-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-poppins text-brand-deep-dark tracking-tight">Good morning, Admin</h1>
          <p className="mt-2 text-brand-charcoal font-medium font-inter text-sm">Here's what's happening with <span className="font-pacifico text-brand-red lowercase text-lg">De Boye's</span> today.</p>
        </div>
        
        {/* Persistence Alert Helper */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 flex items-center gap-3 animate-pulse">
           <span className="text-xl">⚠️</span>
           <div>
             <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest font-inter">Persistence Check</p>
             <p className="text-[11px] text-amber-700 font-medium font-inter">Ensure DATABASE_URL is set in Render for permanent storage.</p>
           </div>
        </div>
      </header>

      {/* Admin Broadcast Widget */}
      <section className="rounded-[2.5rem] bg-brand-deep-dark p-8 shadow-2xl shadow-brand-deep-dark/30 text-white overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none transform group-hover:scale-110 transition-transform">
          <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
        </div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-sm font-black uppercase tracking-[0.25em] text-brand-red mb-4">System Announcement (Broadcast)</h2>
          <p className="text-slate-300 text-sm font-medium mb-6 leading-relaxed">This message will "stay" here and be visible to all staff, even across logouts. Use it for instructions or daily notes.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              type="text" 
              value={settings.broadcast_message}
              onChange={(e) => setSettings({ ...settings, broadcast_message: e.target.value })}
              placeholder="Type persistent message here..."
              className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-red transition-all"
            />
            <button 
              onClick={handleUpdateBroadcast}
              disabled={savingSetting}
              className="bg-brand-red hover:bg-brand-dark-red text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-brand-red/20"
            >
              {savingSetting ? 'Saving...' : 'Save & Broadcast'}
            </button>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { 
            label: 'Total orders today', 
            value: stats.total_orders, 
            trend: stats.order_trend, 
            path: '/admin/orders',
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            )
          },
          { 
            label: 'Active riders', 
            value: stats.active_riders, 
            trend: stats.rider_trend, 
            path: '/admin/riders',
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            )
          },
          { 
            label: `Revenue today (${stats.today_deliveries} dlv)`, 
            value: `₵${stats.total_revenue}`, 
            trend: stats.revenue_trend, 
            path: '/admin/revenue',
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )
          },
          { 
            label: `Lifetime Revenue (${stats.lifetime_deliveries} total)`, 
            value: `₵${stats.lifetime_revenue}`, 
            trend: 'All-time performance', 
            path: '/admin/revenue',
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            )
          },
        ].map((card, i) => (
          <Link 
            key={i} 
            to={card.path}
            className="group rounded-[2.5rem] bg-white p-8 shadow-soft border border-[#F0E8D8] transition-all hover:border-brand-red/50 hover:shadow-lg"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-cream text-brand-red transition-all group-hover:scale-110 group-hover:bg-brand-red group-hover:text-white">
              {card.icon}
            </div>
            <div className="mt-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-charcoal font-inter">{card.label}</p>
              <h2 className="mt-1 text-4xl font-bold font-poppins text-brand-deep-dark tracking-tight">{card.value}</h2>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-brand-red font-inter">{card.trend}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-[2.5rem] bg-white p-8 shadow-soft border border-[#F0E8D8]">
          <h2 className="text-xl font-bold font-poppins text-brand-deep-dark">Recent Orders</h2>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#F0E8D8] text-[10px] font-bold uppercase tracking-widest text-brand-charcoal font-inter">
                  <th className="pb-5 pl-2">ID</th>
                  <th className="pb-5">Timestamp</th>
                  <th className="pb-5">Customer</th>
                  <th className="pb-5">Items</th>
                  <th className="pb-5 text-right pr-2">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E8D8]">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-sm font-medium text-brand-charcoal font-inter">No orders found.</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="group hover:bg-brand-cream/40 transition-colors">
                      <td className="py-6 pl-2 font-mono text-[11px] text-brand-charcoal/60">#{order.id}</td>
                      <td className="py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-brand-deep-dark font-inter">{order.date}</span>
                          <span className="text-[10px] text-brand-charcoal font-medium font-inter">{order.time}</span>
                        </div>
                      </td>
                      <td className="py-6 text-sm font-semibold text-brand-deep-dark font-inter">{order.customer}</td>
                      <td className="py-6 text-xs text-brand-charcoal font-medium font-inter leading-relaxed">{order.items}</td>
                      <td className="py-6 text-right pr-2 font-bold text-lg text-brand-red font-poppins">₵{order.total}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[2.5rem] bg-white p-8 shadow-soft border border-[#F0E8D8]">
          <div className="flex items-center justify-between border-b border-[#F0E8D8] pb-6">
            <h2 className="text-xl font-bold font-poppins text-brand-deep-dark">Riders Live</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-brand-red text-white px-3 py-1 rounded-full font-inter">{riders.length} Online</span>
          </div>

          <div className="mt-8 space-y-5">
            {riders.map((r) => (
              <div key={r.id} className="flex items-center gap-4 rounded-[1.5rem] bg-brand-cream/30 p-5 transition hover:bg-brand-cream/60 border border-transparent hover:border-brand-red/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-[#F0E8D8] font-bold text-brand-red font-poppins text-lg">
                  {r.initials}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-brand-deep-dark font-inter">{r.username}</p>
                  <p className="text-[10px] font-medium text-brand-charcoal uppercase tracking-widest font-inter">{r.area}</p>
                </div>
                <div className={`h-2.5 w-2.5 rounded-full ${
                  r.status === 'Online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse' : 'bg-[#E5DFD3]'
                }`} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
