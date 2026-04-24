import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import { toast } from '../utils/soundToast'
import { useNavigate } from 'react-router-dom'

const OrderRow = ({ order, navigate, isRider }) => {
  const isActive = !['Delivered', 'Cancelled'].includes(order.status)
  
  return (
    <div 
      onClick={() => {
        if (!isRider && (isActive || order.status === 'Delivered')) {
          navigate(`/track/${order.id}`)
        }
      }}
      className="group flex items-center justify-between py-4 px-2 hover:bg-slate-50 transition-all cursor-pointer border-b border-slate-100 last:border-0"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className={`h-12 w-12 flex flex-col items-center justify-center rounded border text-[10px] font-black transition-colors ${
          isActive ? 'bg-brand-red border-brand-red text-white' : 'bg-slate-50 border-slate-200 text-slate-400'
        }`}>
          <span className="opacity-50">ORD</span>
          <span>{order.id.toString().slice(-2)}</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-900 font-inter truncate">
              {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
            </h3>
            {isActive && (
              <span className="flex h-1.5 w-1.5 rounded-full bg-brand-red animate-pulse" />
            )}
          </div>
          <p className="text-[10px] font-medium text-slate-400 mt-0.5 font-inter uppercase tracking-widest">{order.date}</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</p>
           <p className="text-sm font-black text-slate-900 font-inter">₵{order.total}</p>
        </div>
        <div className="text-slate-300 group-hover:text-brand-red transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
    <div className="min-h-screen bg-white pb-32 relative overflow-hidden font-inter">
      {/* SaaS Style Header */}
      <header className="bg-brand-red px-6 py-10 relative overflow-hidden shadow-xl">
        {/* Background Logo Watermark */}
        <div className="absolute right-[-10px] top-[-10px] opacity-[0.1] pointer-events-none rotate-12">
          <img src="/logo.png" alt="" className="h-48 w-48 object-contain brightness-0 invert" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 bg-white/20 rounded flex items-center justify-center backdrop-blur-md">
                <img src="/logo.png" alt="Logo" className="h-5 w-5 object-contain brightness-0 invert" />
             </div>
             <h1 className="text-xs font-black text-white/50 uppercase tracking-[0.3em]">Transaction Portal</h1>
          </div>
          <h2 className="text-4xl font-black text-brand-yellow tracking-tighter italic uppercase">{isRider ? 'Trip History' : 'My Orders'}</h2>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pt-10">
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-16 rounded animate-pulse bg-slate-50" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center space-y-6">
            <div className="text-4xl">🧾</div>
            <div className="space-y-1">
              <p className="text-xs font-black text-slate-800 uppercase tracking-widest font-inter">No Data Found</p>
              <p className="text-[10px] text-slate-400 font-medium font-inter">You haven't placed any orders recently.</p>
            </div>
            <button 
              onClick={() => navigate('/customer')}
              className="px-8 py-3 rounded bg-brand-red text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-red/20 active:scale-95 transition-all"
            >
              Order Now
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Active Orders Section */}
            {orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2 border-b-2 border-slate-900 pb-2">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 font-inter">
                    {isRider ? 'In Progress' : 'Active Orders'}
                  </h2>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="flex flex-col">
                  {orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).map(order => (
                    <OrderRow key={order.id} order={order} navigate={navigate} isRider={isRider} />
                  ))}
                </div>
              </div>
            )}
 
            {/* Past Orders Section */}
            {orders.filter(o => ['Delivered', 'Cancelled'].includes(o.status)).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2 border-b border-slate-200 pb-2">
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 font-inter">
                    Archived {isRider ? 'Trips' : 'Orders'}
                  </h2>
                </div>
                <div className="flex flex-col">
                  {orders.filter(o => ['Delivered', 'Cancelled'].includes(o.status)).map(order => (
                    <OrderRow key={order.id} order={order} navigate={navigate} isRider={isRider} />
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
