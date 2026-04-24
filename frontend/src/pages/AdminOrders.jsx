import { useEffect, useState } from 'react'
import { fetchAdminOrders, markOrderReady, confirmOrder, confirmPickup } from '../services/api'
import useAdminSocket from '../hooks/useAdminSocket'
import { toast } from '../utils/soundToast'

const statusFilters = ['All', 'New', 'Pending', 'Assigned', 'Ready', 'On The Way', 'Delivered']

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [activeFilter, setActiveFilter] = useState(() => {
    return localStorage.getItem('adminOrderFilter') || 'All'
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
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

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.items.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.area.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-[100vw] overflow-x-hidden">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end justify-between bg-white p-6 lg:p-10 border-b border-slate-200">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight font-outfit">Orders Logistics</h1>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Global fulfillment command center</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <input 
              type="text"
              placeholder="Search ID, customer, items..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-50 border-slate-200 rounded-xl text-sm w-full sm:w-64 focus:bg-white transition-all font-medium"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          
          <div className="flex gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 overflow-x-auto no-scrollbar">
            {statusFilters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeFilter === f ? 'bg-white text-brand-red shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Table Interface - No rounded corners, full width approach */}
      <div className="bg-white border-y border-slate-200">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Order</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Customer Details</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Logistics</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Items Ordered</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Payment</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 text-center">Fulfillment</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                 <tr><td colSpan="7" className="px-6 py-20 text-center text-slate-300 font-black uppercase tracking-widest animate-pulse">Synchronizing Data...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-20 text-center text-slate-400 font-medium italic">No matching orders found in the system.</td></tr>
              ) : filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-6 align-top">
                    <div className="font-mono text-[11px] font-black text-brand-red bg-brand-red/5 px-2 py-1 rounded inline-block mb-2">
                      {order.id}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-900 font-bold text-xs">{order.date}</span>
                      <span className="text-slate-400 text-[10px] font-black uppercase tracking-tighter">{order.time}</span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-6 align-top">
                    <p className="text-sm font-black text-slate-900 font-outfit">{order.customer}</p>
                    <div className="mt-3 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                         <span className="h-1.5 w-1.5 rounded-full bg-brand-red animate-pulse" />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.rider}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-6 align-top max-w-[200px]">
                    <p className="text-xs font-bold text-slate-900 leading-relaxed whitespace-normal">{order.address}</p>
                    <p className="mt-2 inline-block bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                      {order.area}
                    </p>
                  </td>

                  <td className="px-6 py-6 align-top">
                    <div className="space-y-1 max-w-[300px]">
                      {order.items.split(',').map((item, idx) => (
                        <div key={idx} className="text-xs font-bold text-slate-600 flex items-start gap-2">
                          <span className="text-brand-red shrink-0">•</span>
                          <span className="whitespace-normal leading-tight">{item.trim()}</span>
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="px-6 py-6 align-top">
                    <div className="space-y-2">
                      <p className="text-sm font-black text-slate-900">₵{order.total}</p>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{order.payment_method}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${
                          order.payment_status === 'Paid' ? 'text-emerald-500' : 'text-amber-500'
                        }`}>{order.payment_status}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-6 align-top text-center">
                    <span className={`inline-flex items-center rounded-xl px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] shadow-sm ${
                      order.status === 'Delivered'   ? 'bg-emerald-500 text-white' : 
                      order.status === 'On The Way'  ? 'bg-blue-500 text-white' :
                      order.status === 'Ready'       ? 'bg-brand-red text-white' :
                      order.status === 'New'         ? 'bg-purple-500 text-white' :
                      order.status === 'Pending'     ? 'bg-orange-500 text-white' :
                      order.status === 'Assigned'    ? 'bg-yellow-400 text-slate-900' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {order.status}
                    </span>
                  </td>

                  <td className="px-6 py-6 align-top text-right">
                    <div className="flex flex-col sm:flex-row justify-end gap-2">
                      {order.status === 'New' && (
                        <button 
                          onClick={() => handleConfirm(order.id)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md active:scale-95 transition-all"
                        >
                          Confirm
                        </button>
                      )}
                      {(order.status === 'Pending') && (
                        <button 
                          onClick={() => handleReady(order.id)}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md active:scale-95 transition-all"
                        >
                          Mark Ready
                        </button>
                      )}
                      {order.status === 'Assigned' && (
                        <button 
                          onClick={() => handlePickup(order.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md active:scale-95 transition-all"
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
