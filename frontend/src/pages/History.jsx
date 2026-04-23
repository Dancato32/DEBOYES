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
      className={`bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-4 border ${isActive ? 'border-brand-red ring-1 ring-brand-red/20' : 'border-slate-200'}`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-inter">{order.date}</p>
          <p className="text-base font-bold font-poppins text-slate-800 tracking-tight">{isRider ? `#QB-${order.id}` : `Order #${order.id}`}</p>
        </div>
        <span className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest font-inter ${
          order.status === 'Delivered' 
          ? 'bg-emerald-50 text-emerald-600' 
          : isActive 
          ? 'bg-brand-red text-white'
          : 'bg-slate-100 text-slate-500'
        }`}>
          {isActive && !isRider ? '● LIVE' : order.status}
        </span>
      </div>

      <div className="py-3 border-y border-slate-100 space-y-2">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm font-bold text-slate-700 font-inter">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-md overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                   {item.image ? (
                    <img src={`${import.meta.env.VITE_API_URL || ''}${item.image}`} alt={item.food} className="h-full w-full object-cover" />
                   ) : (
                     <span className="text-xs">🍲</span>
                   )}
                </div>
                <span>{item.food}</span>
              </div>
              <span className="text-slate-400 font-medium ml-1">x {item.qty}</span>
            </div>
          ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-inter">{isRider ? 'Total Earned' : 'Total Paid'}</p>
          <p className="text-2xl font-bold font-poppins text-brand-red">₵{order.total}</p>
        </div>
        <button 
          onClick={(e) => {
             if (isRider && order.status !== 'Delivered') {
               e.stopPropagation()
               navigate('/rider/active')
             }
          }}
          className={`px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors font-inter border ${
            isActive 
            ? 'bg-brand-red text-white border-brand-red hover:bg-brand-dark-red'
            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {isRider ? 'Details' : (isActive ? 'Track Live' : 'Receipt')}
        </button>
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

      <header className="bg-white px-6 py-5 flex items-center justify-between sticky top-0 z-[100] border-b border-slate-200">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
             <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain opacity-20" />
             <h1 className="text-sm font-bold font-inter text-slate-900 uppercase tracking-widest">{isRider ? 'Trip History' : 'My Orders'}</h1>
          </div>
          <button className="h-10 w-10 flex items-center justify-center text-slate-400 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pt-8">
        {/* Active Orders Section */}
        {orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length > 0 && (
           <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 pl-1 font-inter">{isRider ? 'Active Trip' : 'Active Orders'}</h2>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-48 rounded-[16px] animate-pulse bg-white border-2 border-[#F0E8D8] shadow-sm" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="text-6xl opacity-20 grayscale">🧾</div>
            <p className="text-sm font-medium text-slate-400 font-inter">No past orders found in your records.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {orders.map(order => 
              <OrderCard key={order.id} order={order} navigate={navigate} isRider={isRider} />
            )}
            
            {/* Divider for Past Orders */}
            {orders.filter(o => ['Delivered', 'Cancelled'].includes(o.status)).length > 0 && (
              <div className="col-span-full pt-8 pb-3">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1 font-inter">Past {isRider ? 'Trips' : 'Orders'}</h2>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
