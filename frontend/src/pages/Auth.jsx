import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'

export default function Auth() {
  const navigate = useNavigate()
  const { user, isAuthenticated, login, signup, loading: authLoading } = useAuth()

  const [mode, setMode] = useState('LOGIN') // 'LOGIN' or 'SIGNUP'
  const [loading, setLoading] = useState(false)
  
  // Form states
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState('customer')

  useEffect(() => {
    if (isAuthenticated && user) {
      const dest = user.user_type === 'admin' ? '/admin' : user.user_type === 'rider' ? '/rider' : '/customer'
      navigate(dest, { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'LOGIN') {
        await login(email, password)
      } else {
        await signup({ email, username, password, user_type: userType })
      }
    } catch (err) {
      // Errors are handled inside context via toast
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')
    setEmail('')
    setUsername('')
    setPassword('')
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
            <motion.div
              key={mode}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="flex-1 flex flex-col h-full"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
                  {mode === 'LOGIN' ? "Welcome back" : "Create an Account"}
                </h2>
                <p className="text-slate-400 text-sm">
                  {mode === 'LOGIN' ? "Enter your email and password to log in." : "Fill in your details to get started."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {mode === 'SIGNUP' && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 ml-1">Username</label>
                    <input
                      type="text"
                      placeholder="e.g. JohnDoe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-800/30 border border-slate-800 rounded-2xl focus:border-emerald-500 transition-all text-white placeholder-slate-600 font-medium"
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 ml-1">Email</label>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-800/30 border border-slate-800 rounded-2xl focus:border-emerald-500 transition-all text-white placeholder-slate-600 font-medium"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 ml-1">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-800/30 border border-slate-800 rounded-2xl focus:border-emerald-500 transition-all text-white placeholder-slate-600 font-medium"
                    required
                    minLength={6}
                  />
                </div>

                {mode === 'SIGNUP' && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 ml-1">I am a</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setUserType('customer')}
                        className={`py-4 rounded-2xl font-bold text-sm border-2 transition-all ${
                          userType === 'customer' 
                            ? 'bg-emerald-500 border-emerald-500 text-slate-950' 
                            : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        Customer
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserType('rider')}
                        className={`py-4 rounded-2xl font-bold text-sm border-2 transition-all ${
                          userType === 'rider' 
                            ? 'bg-emerald-500 border-emerald-500 text-slate-950' 
                            : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        Rider
                      </button>
                    </div>
                  </div>
                )}
                
                <button
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-slate-950 border-t-transparent animate-spin rounded-full" />
                  ) : (
                    <span>{mode === 'LOGIN' ? 'Sign In' : 'Create Account'}</span>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-slate-400">
                  {mode === 'LOGIN' ? "Don't have an account?" : "Already have an account?"}
                  <button 
                    onClick={toggleMode}
                    className="ml-2 text-white font-bold hover:text-emerald-500 transition-colors"
                  >
                    {mode === 'LOGIN' ? 'Sign Up' : 'Log In'}
                  </button>
                </p>
                <p className="text-[11px] text-slate-500 mt-6 leading-relaxed max-w-[280px] mx-auto">
                  By continuing you agree to De Boye's <span className="text-emerald-500 font-semibold underline underline-offset-4">Terms of Service</span> and <span className="text-emerald-500 font-semibold underline underline-offset-4">Privacy Policy</span>.
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
