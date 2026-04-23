import { useState, useEffect } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'

export default function Onboarding() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  
  // Steps: 'LOADING' | 'ROLE'
  const [step, setStep] = useState('LOADING')

  useEffect(() => {
    // Navigate away if they are already logged in — immediate check
    if (isAuthenticated && user) {
      const dest = user.user_type === 'admin' ? '/admin' : user.user_type === 'rider' ? '/rider' : '/customer'
      navigate(dest, { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  useEffect(() => {
    // Splash screen timer
    if (step === 'LOADING') {
      const timer = setTimeout(() => {
        setStep('ROLE')
      }, 2500) // 2.5 seconds splash
      return () => clearTimeout(timer)
    }
  }, [step])

  const handleRoleSelect = (selectedRole) => {
    navigate('/auth', { state: { role: selectedRole, mode: 'SIGNUP' } })
  }

  if (step === 'LOADING') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-red/10 animate-pulse mix-blend-screen pointer-events-none" />
        <div className="flex flex-col items-center gap-8 relative z-10">
          <div className="relative">
            <img
              src="/logo.png"
              alt="De Boye's"
              className="h-32 w-32 object-contain drop-shadow-2xl animate-[pulse_2s_ease-in-out_infinite]"
            />
            <div className="absolute inset-0 rounded-full bg-brand-red/20 blur-3xl animate-[pulse_2s_ease-in-out_infinite]" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="font-pacifico text-white text-4xl tracking-tight drop-shadow-md">De Boye's</span>
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-brand-red rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-brand-red rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-brand-red rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8 relative">
      {/* Decorative blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-96 h-96 bg-brand-red/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-96 h-96 bg-brand-red/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="space-y-8 rounded-[2rem] bg-slate-950/90 p-8 shadow-[0_0_50px_-12px_rgba(255,0,0,0.1)] ring-1 ring-slate-800/50 sm:p-10 relative z-10 backdrop-blur-sm transition-all duration-500">
        
        {step === 'ROLE' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4 text-center">
              <div className="mx-auto flex justify-center mb-6">
                <img src="/logo.png" alt="De Boye's Logo" className="h-20 w-auto object-contain drop-shadow-xl" />
              </div>
              <h1 className="text-3xl font-bold text-white mt-4 font-poppins tracking-tight">Welcome</h1>
              <p className="text-sm text-slate-400 font-inter max-w-[250px] mx-auto leading-relaxed">
                Choose how you want to interact with De Boye's today.
              </p>
            </div>

            <div className="mt-10 space-y-4">
              <button
                onClick={() => handleRoleSelect('customer')}
                className="w-full relative group overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-5 transition-all hover:border-brand-red/50 hover:shadow-[0_0_20px_-5px_rgba(255,0,0,0.3)] text-left flex items-center justify-between"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-red/10 to-transparent translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-500" />
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-white font-inter">Continue as Customer</h3>
                  <p className="text-xs text-slate-400 mt-1 font-inter">Order food and track deliveries</p>
                </div>
                <div className="relative z-10 h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-brand-red transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect('rider')}
                className="w-full relative group overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-5 transition-all hover:border-brand-red/50 hover:shadow-[0_0_20px_-5px_rgba(255,0,0,0.3)] text-left flex items-center justify-between"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-red/10 to-transparent translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-500" />
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-white font-inter">Continue as Rider</h3>
                  <p className="text-xs text-slate-400 mt-1 font-inter">Accept orders and earn money</p>
                </div>
                <div className="relative z-10 h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-brand-red transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
              </button>
            </div>
            
            <div className="mt-10 text-center text-sm text-slate-500 font-inter font-medium tracking-tight">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-white hover:text-brand-red underline decoration-brand-red/30 underline-offset-4">
                Sign in here
              </Link>
            </div>
          </div>
        )}



      </div>
    </main>
  )
}
