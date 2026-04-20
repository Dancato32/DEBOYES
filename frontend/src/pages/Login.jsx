import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, isAuthenticated, user } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Already logged in? Send them straight home — no login screen needed
  if (isAuthenticated && user) {
    const dest = user.user_type === 'admin' ? '/admin' : user.user_type === 'rider' ? '/rider' : '/customer'
    return <Navigate to={dest} replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      await login({ username: username.trim().toLowerCase(), password })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <div className="space-y-10 rounded-[2rem] bg-slate-950/90 p-8 shadow-2xl ring-1 ring-slate-700 sm:p-10">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex justify-center">
            <img src="/logo.png" alt="De Boye's Logo" className="h-24 w-auto object-contain drop-shadow-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mt-4 font-poppins tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-400 font-inter">Sign in to continue browsing menus and tracking deliveries.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-inter">
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red font-inter text-sm"
              required
            />
          </label>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-inter">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red font-inter text-sm"
              required
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-brand-red px-4 py-4 text-xs font-bold font-inter uppercase tracking-[0.2em] text-white shadow-lg shadow-brand-red/30 transition hover:bg-brand-dark-red disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="text-center text-sm text-slate-500 font-inter font-medium tracking-tight">
          New here?{' '}
          <Link to="/" className="font-bold text-white hover:text-brand-red underline decoration-brand-red/30 underline-offset-4">
            Create an account
          </Link>
        </div>
      </div>
    </main>
  )
}
