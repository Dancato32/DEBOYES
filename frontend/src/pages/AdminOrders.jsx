import { useEffect, useState } from 'react'
import { fetchAdminOrders, markOrderReady, confirmOrder, confirmPickup } from '../services/api'
import useAdminSocket from '../hooks/useAdminSocket'
import { toast } from 'react-toastify'

const statusFilters = ['All', 'New', 'Pending', 'Assigned', 'Ready', 'On The Way', 'Delivered']

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [activeFilter, setActiveFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  const loadOrders = async () => {
    setLoading(true)
    try {
      const response = await fetchAdminOrders(activeFilter)
      setOrders(response.data.orders)
    } catch (error) {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useAdminSocket((update) => {
    if (update.event === 'ORDER_PLACED' || update.event === 'ORDER_STATUS_UPDATED') {
      loadOrders()
    }
  })

  const handleConfirm = async (orderIdRaw) => {
    try {
      const id = orderIdRaw.replace('QB-', '')
      await confirmOrder(id)
      toast.success('Order confirmed — riders have been notified!')
      loadOrders()
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to confirm order')
    }
  }

  const handleReady = async (orderIdRaw) => {
    try {
      const id = orderIdRaw.replace('QB-', '')
      await markOrderReady(id)
      toast.success('Order marked as ready — batch created for riders!')
      loadOrders()
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to update order status')
    }
  }

  const handlePickup = async (orderIdRaw) => {
    try {
      const id = orderIdRaw.replace('QB-', '')
      await confirmPickup(id)
      toast.success('Pickup confirmed — rider is now on the way! 🚀')
      loadOrders()
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to confirm pickup')
    }
  }

  useEffect(() => {
    loadOrders()
  }, [activeFilter])

  return (
    <div className="space-y-10 py-6">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-brand-deep-dark tracking-tight uppercase">Orders History</h1>
          <p className="mt-2 text-brand-charcoal font-medium">Total {orders.length} orders found</p>
        </div>
        <div className="flex gap-2 p-1 rounded-2xl bg-[#E8CCA6]/20 overflow-x-auto no-scrollbar ring-1 ring-[#E8CCA6]/40">
          {statusFilters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                activeFilter === f ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' : 'text-brand-charcoal hover:text-brand-deep-dark'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <section className="rounded-[2.5rem] bg-white p-8 shadow-soft border border-[#F0E8D8]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#F0E8D8] text-[10px] font-bold uppercase tracking-[0.2em] text-brand-charcoal">
                <th className="pb-4 pl-2">ORDER ID</th>
                <th className="pb-4">DATE & TIME</th>
                <th className="pb-4">CUSTOMER</th>
                <th className="pb-4">ITEMS</th>
                <th className="pb-4">PRICE</th>
                <th className="pb-4 text-center">STATUS</th>
                <th className="pb-4 text-right pr-2">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0E8D8]">
              {loading ? (
                 <tr><td colSpan="7" className="py-10 text-center text-brand-charcoal">Loading orders...</td></tr>
              ) : orders.map((order) => (
                <tr key={order.id} className="group hover:bg-brand-cream/50 transition-colors">
                  <td className="py-5 pl-2 font-mono text-xs text-brand-charcoal/80 group-hover:text-brand-red transition-colors">{order.id}</td>
                  <td className="py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-brand-deep-dark">{order.date}</span>
                      <span className="text-[10px] text-brand-charcoal">{order.time}</span>
                    </div>
                  </td>
                  <td className="py-5 text-sm font-semibold text-brand-deep-dark">{order.customer}</td>
                  <td className="py-5 text-sm text-brand-charcoal max-w-[300px] truncate">{order.items}</td>
                  <td className="py-5 text-sm font-bold text-brand-red">₵{order.total}</td>
                  <td className="py-5 text-center">
                    <span className={`rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                      order.status === 'Delivered'   ? 'bg-brand-red/10 text-brand-red' : 
                      order.status === 'On The Way'  ? 'bg-blue-500/10 text-blue-600' :
                      order.status === 'Ready'       ? 'bg-brand-red/20 text-brand-dark-red' :
                      order.status === 'New'         ? 'bg-violet-500/10 text-violet-700' :
                      order.status === 'Pending'     ? 'bg-blue-500/10 text-blue-600' :
                      order.status === 'Assigned'    ? 'bg-amber-500/10 text-amber-700' :
                      'bg-slate-200 text-brand-charcoal'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-5 text-right pr-2 space-x-2">
                    {order.status === 'New' && (
                      <button 
                        onClick={() => handleConfirm(order.id)}
                        className="bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-colors shadow-lg shadow-violet-500/20"
                      >
                        Confirm Order
                      </button>
                    )}
                    {(order.status === 'Pending') && (
                      <button 
                        onClick={() => handleReady(order.id)}
                        className="bg-[#ff5722] hover:bg-[#ff5722]/80 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-colors shadow-lg shadow-[#ff5722]/20"
                      >
                        Mark as Ready
                      </button>
                    )}
                    {order.status === 'Assigned' && (
                      <button 
                        onClick={() => handlePickup(order.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                      >
                        Confirm Pickup
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
