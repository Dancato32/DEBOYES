import { useEffect, useState } from 'react'
import { fetchAdminOrders, markOrderReady, confirmOrder, confirmPickup } from '../services/api'
import useAdminSocket from '../hooks/useAdminSocket'
import { toast } from '../utils/soundToast'
import { playNotificationSound } from '../utils/notificationSound'

const statusFilters = ['All', 'New', 'Pending', 'Assigned', 'Ready', 'On The Way', 'Delivered']

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [activeFilter, setActiveFilter] = useState(() => {
    return localStorage.getItem('adminOrderFilter') || 'All'
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

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
      playNotificationSound('ring')
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

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.items.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.area.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-[100vw] overflow-x-hidden font-inter">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end justify-between bg-white p-6 lg:p-8 border-b border-slate-200">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-outfit">Orders Logistics</h1>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Global Fulfillment Command Center</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <input 
              type="text"
              placeholder="Search ID, customer, items..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-full sm:w-64 focus:bg-white focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all font-medium"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          
          <div className="flex gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200 overflow-x-auto no-scrollbar">
            {statusFilters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeFilter === f ? 'bg-white text-brand-red shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Table Interface */}
      <div className="bg-white border-y border-slate-200">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-slate-500">Order</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-slate-500">Customer Details</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-slate-500">Logistics</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-slate-500">Items Ordered</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-slate-500">Payment</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-slate-500 text-center">Fulfillment</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-24">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="h-10 w-10 rounded-full border-4 border-slate-100 border-t-brand-red animate-spin"></div>
                      <p className="text-sm font-medium text-slate-400">Loading order data...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-20 text-center text-slate-500 font-medium">No matching orders found in the system.</td></tr>
              ) : filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5 align-top">
                    <div className="font-mono text-xs font-bold text-brand-red bg-brand-red/5 px-2 py-1 rounded inline-block mb-1">
                      {order.id}
                    </div>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <span className="text-slate-900 font-medium text-sm">{order.date}</span>
                      <span className="text-slate-500 text-xs font-medium">{order.time}</span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-5 align-top">
                    <p className="text-sm font-semibold text-slate-900">{order.customer}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                       <span className={`h-1.5 w-1.5 rounded-full ${order.rider !== 'Unassigned' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                       <span className="text-xs font-medium text-slate-500">{order.rider}</span>
                    </div>
                  </td>

                  <td className="px-6 py-5 align-top max-w-[200px]">
                    <p className="text-sm font-medium text-slate-900 leading-snug whitespace-normal">{order.address}</p>
                    <p className="mt-1.5 inline-block bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {order.area}
                    </p>
                  </td>

                  <td className="px-6 py-5 align-top">
                    <div className="space-y-1.5 max-w-[250px]">
                      {order.items.split(',').map((item, idx) => (
                        <div key={idx} className="text-sm font-medium text-slate-700 flex items-start gap-2">
                          <span className="text-brand-red/60 shrink-0 mt-0.5">•</span>
                          <span className="whitespace-normal leading-tight">{item.trim()}</span>
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="px-6 py-5 align-top">
                    <div className="space-y-1.5">
                      <p className="text-sm font-bold text-slate-900">₵{order.total}</p>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-slate-500">{order.payment_method}</span>
                        <span className={`text-xs font-semibold ${
                          order.payment_status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'
                        }`}>{order.payment_status}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5 align-top text-center">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
                      order.status === 'Delivered'   ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 
                      order.status === 'On The Way'  ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      order.status === 'Ready'       ? 'bg-brand-red/10 text-brand-dark-red border border-brand-red/20' :
                      order.status === 'New'         ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                      order.status === 'Pending'     ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                      order.status === 'Assigned'    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}>
                      {order.status}
                    </span>
                  </td>

                  <td className="px-6 py-5 align-top text-right">
                    <div className="flex flex-col sm:flex-row justify-end gap-2">
                      {order.status === 'New' && (
                        <button 
                          onClick={() => handleConfirm(order.id)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-all"
                        >
                          Confirm
                        </button>
                      )}
                      {(order.status === 'Pending') && (
                        <button 
                          onClick={() => handleReady(order.id)}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-all"
                        >
                          Mark Ready
                        </button>
                      )}
                      {order.status === 'Assigned' && (
                        <button 
                          onClick={() => handlePickup(order.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-all"
                        >
                          Picked Up
                        </button>
                      )}
                    </div>
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
