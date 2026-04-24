import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const OrderCard = ({ order, navigate, isRider }) => {
  const isActive = !['Delivered', 'Cancelled'].includes(order.status)
  
  return (
    <div 
      onClick={() => {
        if (!isRider && (isActive || order.status === 'Delivered')) {
          navigate(`/track/${order.id}`)
        }
      }}
      className="group flex items-center justify-between py-5 px-6 hover:bg-slate-50 transition-all cursor-pointer"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className={`h-10 w-10 flex items-center justify-center rounded-lg border text-sm font-black transition-colors ${
          isActive ? 'bg-brand-red border-brand-red text-white' : 'bg-slate-50 border-slate-200 text-slate-400'
        }`}>
          #{order.id.toString().slice(-2)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 font-inter truncate">
              {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
            </h3>
            <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${
              order.status === 'Delivered' 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
              : isActive 
              ? 'bg-amber-50 text-amber-600 border-amber-100'
              : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}>
              {order.status}
            </span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{order.date}</p>
        </div>
      </div>


      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</p>
           <p className="text-sm font-black text-slate-900">₵{order.total}</p>
        </div>
        <div className="text-slate-300 group-hover:text-brand-red transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function History() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const isRider = user?.user_type === 'rider'

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await api.get('/orders/history/')
        setOrders(res.data.orders || [])
      } catch (error) {
        toast.error('Failed to load history')
      } finally {
        setLoading(false)
      }
    }
    loadHistory()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 pb-32 relative overflow-hidden">
      {/* Background Watermark */}
      <div className="fixed top-20 -right-20 opacity-[0.03] pointer-events-none rotate-12">
        <img src="/logo.png" alt="" className="h-[600px] w-[600px] object-contain" />
      </div>

      <header className="bg-brand-red px-6 py-5 flex items-center justify-between sticky top-0 z-[100] shadow-lg overflow-hidden">
        {/* Background Logo Watermark */}
        <div className="absolute right-[-10px] top-[-10px] opacity-[0.1] pointer-events-none">
          <img src="/logo.png" alt="" className="h-32 w-32 object-contain brightness-0 invert" />
        </div>

        <div className="max-w-7xl mx-auto w-full flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
             <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain brightness-0 invert" />
             <h1 className="text-sm font-bold font-inter text-brand-yellow uppercase tracking-widest">{isRider ? 'Trip History' : 'My Orders'}</h1>
          </div>
          <button className="h-10 w-10 flex items-center justify-center text-white/70 rounded-lg border border-white/20 hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pt-8">
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 rounded-lg animate-pulse bg-white border border-slate-200" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="text-6xl opacity-20 grayscale">🧾</div>
            <p className="text-sm font-medium text-slate-400 font-inter">No past orders found in your records.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Orders Section */}
            {orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length > 0 && (
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-1 font-inter">
                  {isRider ? 'Active Trip' : 'Active Orders'}
                </h2>
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                  {orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).map(order => (
                    <OrderCard key={order.id} order={order} navigate={navigate} isRider={isRider} />
                  ))}
                </div>
              </div>
            )}
 
            {/* Past Orders Section */}
            {orders.filter(o => ['Delivered', 'Cancelled'].includes(o.status)).length > 0 && (
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-1 font-inter">
                  Past {isRider ? 'Trips' : 'Orders'}
                </h2>
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                  {orders.filter(o => ['Delivered', 'Cancelled'].includes(o.status)).map(order => (
                    <OrderCard key={order.id} order={order} navigate={navigate} isRider={isRider} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
