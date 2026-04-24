import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LocationRequest() {
  const [show, setShow] = useState(false)
  const [status, setStatus] = useState('idle') // idle, requesting, granted, denied

  useEffect(() => {
    // Check if permission was already handled in this session or previously
    const permissionHandled = localStorage.getItem('location_permission_handled')
    
    if (!permissionHandled) {
      // Small delay for better UX after splash/loading
      const timer = setTimeout(() => {
        setShow(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAllow = () => {
    setStatus('requesting')
    if (!navigator.geolocation) {
      setStatus('denied')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStatus('granted')
        localStorage.setItem('location_permission_handled', 'true')
        setShow(false)
        // You could also store coordinates globally here if needed
      },
      (error) => {
        console.error('Location error:', error)
        setStatus('denied')
        localStorage.setItem('location_permission_handled', 'true')
        // We don't hide immediately to allow user to see it failed or retry
        setTimeout(() => setShow(false), 2000)
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )
  }

  const handleDismiss = () => {
    localStorage.setItem('location_permission_handled', 'true')
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            {/* Brand Header */}
            <div className="bg-brand-red h-32 relative overflow-hidden flex items-center justify-center">
               <div className="absolute inset-0 opacity-10">
                 <img src="/logo.png" alt="" className="w-full h-full object-contain scale-150 rotate-12" />
               </div>
               <div className="relative z-10 h-16 w-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-brand-red animate-bounce">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M11.545 20.91c-.008.006-.015.012-.022.017a.774.774 0 01-.039.027.505.505 0 01-.059.035c-.082.041-.2.09-.35.135a2.73 2.73 0 01-1.026.19c-.368 0-.728-.063-1.025-.19a2.887 2.887 0 01-.35-.135 1.582 1.582 0 01-.098-.062l-.022-.017C7.75 20.245 2.5 15.05 2.5 9.5a9.5 9.5 0 1119 0c0 5.55-5.25 10.745-6.045 11.41zM12 13.5a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" />
                  </svg>
               </div>
            </div>

            <div className="p-8 text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-black font-poppins text-slate-800 uppercase tracking-tight">Enable Location</h2>
                <p className="text-sm text-slate-500 font-inter leading-relaxed max-w-[280px] mx-auto">
                  To provide accurate delivery times and track your rider in real-time, we need to access your location.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={handleAllow}
                  disabled={status === 'requesting'}
                  className="w-full py-4 rounded-2xl bg-brand-red text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-red/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {status === 'requesting' ? 'Requesting...' : status === 'granted' ? 'Location Enabled!' : 'Allow Location Access'}
                </button>
                <button
                  onClick={handleDismiss}
                  className="w-full py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Not Now
                </button>
              </div>

              <p className="text-[9px] font-medium text-slate-300 uppercase tracking-widest">
                You can change this anytime in settings
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
