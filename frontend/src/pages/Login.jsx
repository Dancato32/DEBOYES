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
      await login({ username, password })
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
            <h1 className="text-3xl font-semibold text-white mt-4">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-400">Sign in to continue browsing menus and tracking deliveries.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-sm font-medium text-slate-200">
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 focus:border-[#ff5722] focus:outline-none focus:ring-1 focus:ring-[#ff5722]"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-200">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 focus:border-[#ff5722] focus:outline-none focus:ring-1 focus:ring-[#ff5722]"
              required
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-3xl bg-[#ff5722] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#ff5722]/30 transition hover:bg-[#ff5722]/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="text-center text-sm text-slate-500">
          New here?{' '}
          <Link to="/signup" className="font-semibold text-white hover:text-[#ff5722]">
            Create an account
          </Link>
        </div>
      </div>
    </main>
  )
}
