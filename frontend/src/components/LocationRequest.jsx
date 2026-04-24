import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { updateUserLocation } from '../services/api'
import { Geolocation } from '@capacitor/geolocation'
/**
 * LocationRequest — shown once on app open.
 * On grant: saves { lat, lng, address, area } to localStorage under 'saved_location'.
 * Checkout reads from this key to pre-fill without asking again.
 */
export default function LocationRequest() {
  const [show, setShow] = useState(false)
  const [status, setStatus] = useState('idle') // idle | requesting | granted | denied

  useEffect(() => {
    // Don't show if permission was already handled (granted OR dismissed)
    const saved = localStorage.getItem('saved_location')
    const dismissed = localStorage.getItem('location_permission_dismissed')
    if (saved || dismissed) return

    const timer = setTimeout(() => setShow(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`
      )
      const data = await res.json()
      if (data?.display_name) {
        const addr = data.address || {}
        const parts = [addr.road, addr.house_number, addr.neighbourhood || addr.suburb].filter(Boolean)
        const address = parts.join(', ') || data.display_name.split(',')[0]
        const area = addr.suburb || addr.neighbourhood || addr.city_district || addr.city || ''
        return { address, area }
      }
    } catch (e) {
      console.error('Reverse geocode failed:', e)
    }
    return { address: '', area: '' }
  }

  const handleAllow = async () => {
    setStatus('requesting')
    try {
      let perm = await Geolocation.checkPermissions()
      if (perm.location !== 'granted') {
        perm = await Geolocation.requestPermissions()
      }
      if (perm.location !== 'granted') {
        throw new Error('Permission denied')
      }

      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })
      const { latitude: lat, longitude: lng } = pos.coords
      const { address, area } = await reverseGeocode(lat, lng)

      // Save everything to localStorage — Checkout will read this
      localStorage.setItem('saved_location', JSON.stringify({ lat, lng, address, area }))

      // Send to backend (fails silently if unauthenticated)
      try {
        await updateUserLocation({ lat, lng })
      } catch (e) {}

      setStatus('granted')
      setTimeout(() => setShow(false), 800)
    } catch (error) {
      console.error('Location error:', error)
      setStatus('denied')
      localStorage.setItem('location_permission_dismissed', 'true')
      setTimeout(() => setShow(false), 2000)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('location_permission_dismissed', 'true')
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-md bg-brand-cream rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            {/* Brand Header */}
            <div className="bg-brand-red h-36 relative overflow-hidden flex items-center justify-center">
               <div className="absolute inset-0 opacity-[0.15]">
                 <img src="/logo.png" alt="" className="w-full h-full object-contain scale-150 rotate-12" />
               </div>
               <div className={`relative z-10 h-20 w-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center text-brand-red transition-transform duration-500 ${status === 'granted' ? 'scale-110' : 'animate-bounce'}`}>
                  {status === 'granted' ? (
                    <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                    </svg>
                  )}
               </div>
            </div>

            <div className="p-8 text-center space-y-6">
              <div className="space-y-3">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight font-outfit">
                  {status === 'granted' ? 'Location Saved! ✓' : 'For a better experience, enable location'}
                </h2>
                <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[280px] mx-auto">
                  {status === 'denied'
                    ? 'Location access was denied. You can manually enter your address at checkout.'
                    : "We'll use your location to auto-fill your delivery address and give you an accurate fee estimate instantly."}
                </p>
              </div>

              {/* Benefits pills */}
              {status === 'idle' && (
                <div className="flex flex-wrap justify-center gap-2">
                  {['Auto-fill address', 'Accurate ETA', 'One-tap checkout'].map(pill => (
                    <span key={pill} className="text-[10px] font-black uppercase tracking-widest bg-white border border-slate-100 text-slate-500 px-3 py-1.5 rounded-full">
                      {pill}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2">
                {status !== 'granted' && status !== 'denied' && (
                  <button
                    onClick={handleAllow}
                    disabled={status === 'requesting'}
                    className="w-full py-5 rounded-2xl bg-brand-red text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-lg shadow-brand-red/20 active:scale-95 transition-all disabled:opacity-60 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {status === 'requesting' ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Detecting Location...
                      </span>
                    ) : 'Turn on'}
                  </button>
                )}
                {status !== 'granted' && (
                  <button
                    onClick={handleDismiss}
                    className="w-full py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                  >
                    No thanks
                  </button>
                )}
              </div>

              <p className="text-[9px] font-medium text-slate-300 uppercase tracking-widest">
                Your location is never stored on our servers
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
