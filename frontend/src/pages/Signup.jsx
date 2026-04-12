import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const { signup } = useAuth()
  const [formData, setFormData] = useState({ username: '', email: '', password: '', user_type: 'customer' })
  const [loading, setLoading] = useState(false)

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
            <h1 className="text-3xl font-semibold text-white mt-4">Create account</h1>
            <p className="mt-2 text-sm text-slate-400">Choose your role and start delivering or ordering food.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-sm font-medium text-slate-200">
            Username
            <input
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-200">
            Email
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-200">
            Password
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-200">
            Role
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {['customer', 'rider'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData((current) => ({ ...current, user_type: type }))}
                  className={`rounded-3xl border px-4 py-3 text-sm font-semibold transition ${formData.user_type === type ? 'border-emerald-500 bg-emerald-500 text-slate-950' : 'border-slate-700 bg-slate-900 text-slate-200'}`}
                >
                  {type === 'customer' ? 'Customer' : 'Rider'}
                </button>
              ))}
            </div>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-3xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-md transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Have an account?{' '}
          <Link to="/login" className="font-semibold text-white hover:text-emerald-300">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
