import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchOrderDetails } from '../services/api'
import useOrderTracking from '../hooks/useOrderTracking'
import MapTracker from '../components/MapTracker'
import { toast } from '../utils/soundToast'

export default function MapTrack() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const { position } = useOrderTracking(orderId)

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const response = await fetchOrderDetails(orderId)
        setOrder(response.data)
      } catch (error) {
        toast.error('Unable to load tracking data')
      } finally {
        setLoading(false)
      }
    }
    loadOrder()
    const interval = setInterval(loadOrder, 10000)
    return () => clearInterval(interval)
  }, [orderId])

  if (loading && !order) return null

  return (
    <div className="h-screen w-screen bg-white relative font-inter">
      <div className="absolute top-6 left-6 z-[1000]">
        <button 
          onClick={() => navigate(-1)}
          className="h-12 w-12 rounded-full bg-white shadow-xl flex items-center justify-center border border-slate-100 active:scale-90 transition-all"
        >
          <svg className="w-6 h-6 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="absolute top-6 right-6 z-[1000]">
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-white/20">
           <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Live Tracking</span>
           </div>
        </div>
      </div>

      <MapTracker
        position={position || { lat: order?.restaurant_lat, lng: order?.restaurant_lng }}
        destination={{ lat: order?.lat, lng: order?.lng }}
        restaurant={{ lat: order?.restaurant_lat, lng: order?.restaurant_lng }}
        darkMode={false}
        isRiderMoving={true}
      />

      {/* Floating Info */}
      <div className="absolute bottom-10 left-6 right-6 z-[1000]">
         <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-2xl border border-white/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="h-14 w-14 rounded-2xl bg-brand-red flex items-center justify-center text-white shadow-lg shadow-brand-red/20">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
               </div>
               <div>
                  <p className="text-sm font-black text-slate-900">Rider is approaching</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ETA: ~{order?.eta || '5'} mins</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}
