import { useEffect, useState } from 'react'
import { fetchAdminOrders, markOrderReady, confirmOrder, confirmPickup } from '../services/api'
import useAdminSocket from '../hooks/useAdminSocket'
import { toast } from 'react-toastify'

const statusFilters = ['All', 'New', 'Pending', 'Assigned', 'Ready', 'On The Way', 'Delivered']

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [activeFilter, setActiveFilter] = useState(() => {
    return localStorage.getItem('adminOrderFilter') || 'All'
  })
  const [loading, setLoading] = useState(true)
  const [notificationSound] = useState(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'))

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
    if (update.event === 'ORDER_PLACED') {
      notificationSound.play().catch(e => console.log('Audio playback blocked by browser'))
      loadOrders()
    } else if (update.event === 'ORDER_STATUS_UPDATED') {
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
    localStorage.setItem('adminOrderFilter', activeFilter)
    loadOrders()
  }, [activeFilter])

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto px-4 sm:px-6">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight font-inter">Orders History</h1>
          <p className="mt-1 text-slate-500 text-sm">Total {orders.length} orders found</p>
        </div>
        <div className="flex gap-2 p-1 rounded-lg bg-slate-100 overflow-x-auto no-scrollbar border border-slate-200">
          {statusFilters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all whitespace-nowrap ${
                activeFilter === f ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <section className="rounded-lg bg-white border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold text-slate-900">Order ID</th>
                <th className="px-6 py-3 font-semibold text-slate-900">Date & Time</th>
                <th className="px-6 py-3 font-semibold text-slate-900">Customer</th>
                <th className="px-6 py-3 font-semibold text-slate-900">Rider</th>
                <th className="px-6 py-3 font-semibold text-slate-900">Items</th>
                <th className="px-6 py-3 font-semibold text-slate-900">Price</th>
                <th className="px-6 py-3 font-semibold text-slate-900 text-center">Status</th>
                <th className="px-6 py-3 font-semibold text-slate-900 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                 <tr><td colSpan="8" className="px-6 py-10 text-center text-slate-500">Loading orders...</td></tr>
              ) : orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{order.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-900 font-medium">{order.date}</span>
                      <span className="text-slate-500 text-xs">{order.time}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-900 font-medium">{order.customer}</td>
                  <td className="px-6 py-4 text-emerald-600 font-medium">{order.rider}</td>
                  <td className="px-6 py-4 text-slate-500 max-w-[250px] truncate">{order.items}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">₵{order.total}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      order.status === 'Delivered'   ? 'bg-emerald-100 text-emerald-800' : 
                      order.status === 'On The Way'  ? 'bg-blue-100 text-blue-800' :
                      order.status === 'Ready'       ? 'bg-brand-red/10 text-brand-dark-red' :
                      order.status === 'New'         ? 'bg-purple-100 text-purple-800' :
                      order.status === 'Pending'     ? 'bg-orange-100 text-orange-800' :
                      order.status === 'Assigned'    ? 'bg-yellow-100 text-yellow-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {order.status === 'New' && (
                      <button 
                        onClick={() => handleConfirm(order.id)}
                        className="inline-flex items-center rounded-md border border-transparent bg-purple-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                      >
                        Confirm Order
                      </button>
                    )}
                    {(order.status === 'Pending') && (
                      <button 
                        onClick={() => handleReady(order.id)}
                        className="inline-flex items-center rounded-md border border-transparent bg-orange-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                      >
                        Mark as Ready
                      </button>
                    )}
                    {order.status === 'Assigned' && (
                      <button 
                        onClick={() => handlePickup(order.id)}
                        className="inline-flex items-center rounded-md border border-transparent bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
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
