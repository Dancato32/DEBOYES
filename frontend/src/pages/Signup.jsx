import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const { signup, isAuthenticated, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  // Default to customer, but ideally we get this from the onboarding flow
  const initialRole = location.state?.role || 'customer'
  
  const [formData, setFormData] = useState({ 
    username: '', 
    phone: '',
    password: '', 
    user_type: initialRole 
  })
  const [loading, setLoading] = useState(false)

  // Redirect back to onboarding if they got here directly without an intended role
  useEffect(() => {
    if (isAuthenticated && user) {
        const dest = user.user_type === 'admin' ? '/admin' : user.user_type === 'rider' ? '/rider' : '/customer'
        navigate(dest, { replace: true })
        return
    }
    if (!location.state?.role) {
      navigate('/')
    }
  }, [location, navigate, isAuthenticated, user])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      await signup(formData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <div className="space-y-8 rounded-[2rem] bg-slate-950/90 p-8 shadow-2xl ring-1 ring-slate-700 sm:p-10">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex justify-center">
            <img src="/logo.png" alt="De Boye's Logo" className="h-24 w-auto object-contain drop-shadow-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mt-4 font-poppins tracking-tight">Create account</h1>
            <p className="mt-2 text-sm text-slate-400 font-inter">Choose your role and start delivering or ordering food.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-inter">
            Username
            <input
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 font-inter text-sm focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red"
              required
            />
          </label>

          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-inter">
            Phone Number
            <input
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 font-inter text-sm focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red"
              required
            />
          </label>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-inter">
            Password
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 font-inter text-sm focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-brand-red px-4 py-4 text-xs font-bold font-inter uppercase tracking-[0.2em] text-white shadow-lg shadow-brand-red/30 transition hover:bg-brand-dark-red disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 font-inter font-medium tracking-tight">
          Already have an account?{' '}
          <Link to="/" className="font-bold text-white hover:text-brand-red underline decoration-brand-red/30 underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
