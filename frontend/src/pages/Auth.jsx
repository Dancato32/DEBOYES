import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import { GoogleLogin } from '@react-oauth/google'

export default function Auth() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, sendCode, login, loginWithGoogle, loginWithPassword, signup, loading: authLoading } = useAuth()

  // Steps: 'EMAIL' | 'OTP' | 'PROFILE' | 'PASSWORD'
  const [step, setStep] = useState('EMAIL')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('') // Kept for legacy/profile
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Login with Password fields
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  })
  
  // Profile fields for new users
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    phone: '',
    user_type: 'customer'
  })

  useEffect(() => {
    if (isAuthenticated && user) {
      const dest = user.user_type === 'admin' ? '/admin' : user.user_type === 'rider' ? '/rider' : '/customer'
      navigate(dest, { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }
    setLoading(true)
    try {
      await sendCode({ email })
      setStep('OTP')
    } catch (err) {
      // Error handled in context
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true)
    try {
      const result = await loginWithGoogle(credentialResponse.credential)
      if (result.status === 'partial') {
        setProfileData({
          ...profileData,
          email: result.email,
          username: result.suggested_username || ''
        })
        setStep('PROFILE')
      }
    } catch (err) {
      // Error handled in context
    } finally {
      setLoading(false)
    }
  }

  const handleOTPSubmit = async (e) => {
    e.preventDefault()
    if (code.length !== 4) return
    
    setLoading(true)
    try {
      const result = await login({ email }, code)
      if (result.status === 'partial') {
        setProfileData({ ...profileData, email: result.email })
        setStep('PROFILE')
      }
    } catch (err) {
      // Error handled in context
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await loginWithPassword(loginData.username, loginData.password)
    } catch (err) {
      // Error handled in context
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signup({
        email: profileData.email,
        phone: profileData.phone,
        username: profileData.username,
        user_type: profileData.user_type
      })
    } catch (err) {
      // Error handled in context
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      {/* Decorative Brand Gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <img src="/logo.png" alt="De Boye's" className="h-20 w-auto mb-4 drop-shadow-2xl" />
          <h1 className="font-pacifico text-white text-4xl lowercase tracking-tight">De Boye's</h1>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden min-h-[440px] flex flex-col">
          <AnimatePresence mode="wait">
            {step === 'EMAIL' && (
              <motion.div
                key="email"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="flex-1 flex flex-col h-full"
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2 leading-tight">Welcome to <br/>De Boye's</h2>
                  <p className="text-slate-400 text-sm">Enter your email to start.</p>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-6">
                  <div className="relative group">
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-800/30 border border-slate-800 rounded-2xl focus:border-emerald-500 transition-all text-white placeholder-slate-600 font-medium"
                      required
                      autoFocus
                    />
                  </div>
                  
                  <button
                    disabled={loading}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-slate-950 border-t-transparent animate-spin rounded-full" />
                    ) : (
                      <>
                        <span>Continue</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 flex flex-col items-center gap-4">
                  <div className="w-full flex items-center gap-4">
                    <div className="h-[1px] flex-1 bg-slate-800"></div>
                    <span className="text-xs text-slate-500 uppercase font-bold">Or</span>
                    <div className="h-[1px] flex-1 bg-slate-800"></div>
                  </div>

                  <div className="w-full flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => toast.error('Google Sign In failed')}
                      theme="filled_black"
                      shape="pill"
                      width="100%"
                    />
                  </div>

                  <button 
                    onClick={() => setStep('PASSWORD')}
                    className="text-white font-bold text-sm hover:text-emerald-500 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    Sign in with password
                  </button>
                  <p className="text-[11px] text-slate-500 text-center leading-relaxed max-w-[280px]">
                    By continuing you agree to De Boye's <span className="text-emerald-500 font-semibold underline underline-offset-4">Terms of Service</span> and <span className="text-emerald-500 font-semibold underline underline-offset-4">Privacy Policy</span>.
                  </p>
                </div>
              </motion.div>
            )}

            {step === 'OTP' && (
              <motion.div
                key="otp"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="flex-1 flex flex-col h-full"
              >
                <div className="mb-10">
                  <button 
                    onClick={() => setStep('EMAIL')}
                    className="mb-6 p-2 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                  </button>
                  <h2 className="text-2xl font-bold text-white mb-2">Verify Email</h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    We've sent a 4-digit code to <br/>
                    <span className="text-white font-semibold">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleOTPSubmit} className="space-y-8">
                  <div className="flex justify-center">
                    <input
                      type="text"
                      maxLength="4"
                      placeholder="••••"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      className="w-48 text-center text-4xl tracking-[0.5em] py-5 bg-slate-800/30 border border-slate-800 rounded-2xl focus:border-emerald-500 transition-all text-white placeholder-slate-700 font-bold"
                      required
                      autoFocus
                    />
                  </div>

                  <button
                    disabled={loading || code.length !== 4}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-slate-950 border-t-transparent animate-spin rounded-full" />
                    ) : 'Verify Code'}
                  </button>

                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-2">Didn't receive code?</p>
                    <button 
                      type="button"
                      onClick={() => sendCode({ email })}
                      className="text-white font-bold text-sm hover:text-emerald-500 transition-colors"
                    >
                      Resend code
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 'PASSWORD' && (
              <motion.div
                key="password"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="flex-1 flex flex-col h-full"
              >
                <div className="mb-10">
                  <button 
                    onClick={() => setStep('EMAIL')}
                    className="mb-6 p-2 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                  </button>
                  <h2 className="text-2xl font-bold text-white mb-2">Login</h2>
                  <p className="text-slate-400 text-sm leading-relaxed">Enter your credentials to continue.</p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 ml-1">Username</label>
                    <input
                      type="text"
                      placeholder="Username"
                      value={loginData.username}
                      onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-800/30 border border-slate-800 rounded-2xl focus:border-emerald-500 transition-all text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 ml-1">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-800/30 border border-slate-800 rounded-2xl focus:border-emerald-500 transition-all text-white"
                      required
                    />
                  </div>

                  <button
                    disabled={loading}
                    className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-slate-950 border-t-transparent animate-spin rounded-full mx-auto" />
                    ) : 'Sign In'}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'PROFILE' && (
              <motion.div
                key="profile"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="flex-1 flex flex-col h-full"
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2 leading-tight">Last Step</h2>
                  <p className="text-slate-400 text-sm">Tell us a bit about yourself to get started.</p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 ml-1">Username</label>
                    <input
                      type="text"
                      placeholder="e.g. JohnDoe"
                      value={profileData.username}
                      onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-800/30 border border-slate-800 rounded-2xl focus:border-emerald-500 transition-all text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 ml-1">Phone (Optional)</label>
                    <input
                      type="tel"
                      placeholder="e.g. 0244123456"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-800/30 border border-slate-800 rounded-2xl focus:border-emerald-500 transition-all text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 ml-1">I am a</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setProfileData({...profileData, user_type: 'customer'})}
                        className={`py-4 rounded-2xl font-bold text-sm border-2 transition-all ${
                          profileData.user_type === 'customer' 
                            ? 'bg-emerald-500 border-emerald-500 text-slate-950' 
                            : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        Customer
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileData({...profileData, user_type: 'rider'})}
                        className={`py-4 rounded-2xl font-bold text-sm border-2 transition-all ${
                          profileData.user_type === 'rider' 
                            ? 'bg-emerald-500 border-emerald-500 text-slate-950' 
                            : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        Rider
                      </button>
                    </div>
                  </div>

                  <button
                    disabled={loading || !profileData.username}
                    className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-slate-950 border-t-transparent animate-spin rounded-full mx-auto" />
                    ) : 'Complete Signup'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
