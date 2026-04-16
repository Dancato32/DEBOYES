import { useState, useEffect } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'

export default function Onboarding() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  
  // Steps: 'LOADING' | 'ROLE' | 'METHOD'
  const [step, setStep] = useState('LOADING')
  const [role, setRole] = useState(null)

  useEffect(() => {
    // Navigate away if they are already logged in
    if (isAuthenticated && user && step !== 'LOADING') {
      const dest = user.user_type === 'admin' ? '/admin' : user.user_type === 'rider' ? '/rider' : '/customer'
      navigate(dest, { replace: true })
    }
  }, [isAuthenticated, user, step, navigate])

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
    setRole(selectedRole)
    setStep('METHOD')
  }

  const handleManualCreate = () => {
    navigate('/signup', { state: { role } })
  }

  const handleSocialWarning = () => {
    toast.info('Social login coming soon! Please use manual account creation for now.', {
      icon: '🚀'
    })
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

        {step === 'METHOD' && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mb-8">
              <button 
                onClick={() => setStep('ROLE')}
                className="flex items-center text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest font-inter mb-4"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                Back
              </button>
              <h2 className="text-2xl font-bold text-white font-poppins tracking-tight">Create Account</h2>
              <p className="text-sm text-slate-400 font-inter mt-1">Get started as a {role}</p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={handleSocialWarning}
                className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white px-4 py-4 transition hover:bg-slate-100"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                <span className="text-sm font-bold text-slate-800 font-inter">Continue with Google</span>
              </button>

              <button 
                onClick={handleSocialWarning}
                className="w-full flex items-center justify-center gap-3 rounded-2xl bg-slate-900 border border-slate-700 px-4 py-4 transition hover:bg-slate-800"
              >
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.74 3.58-.8 1.48-.05 2.66.52 3.42 1.46-3.12 1.76-2.58 5.86.37 7.02-.75 1.83-1.72 3.66-2.45 4.49zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.31 2.38-1.89 4.31-3.74 4.25z"/></svg>
                <span className="text-sm font-bold text-white font-inter">Continue with Apple</span>
              </button>

              <div className="relative py-4 flex items-center justify-center">
                <div className="absolute inset-x-0 h-px bg-slate-800"></div>
                <span className="relative bg-slate-950 px-4 text-xs font-bold text-slate-500 uppercase tracking-widest font-inter">Or</span>
              </div>

              <button 
                onClick={handleManualCreate}
                className="w-full rounded-2xl bg-brand-red px-4 py-4 text-xs font-bold font-inter uppercase tracking-[0.2em] text-white shadow-lg shadow-brand-red/30 transition hover:bg-brand-dark-red"
              >
                Create Account Manually
              </button>
            </div>
            
            <div className="mt-8 text-center text-sm text-slate-500 font-inter font-medium tracking-tight">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-white hover:text-brand-red underline decoration-brand-red/30 underline-offset-4">
                Sign in
              </Link>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
