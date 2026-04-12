import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <header className="border-b border-slate-800 bg-slate-950 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="De Boye's Logo" className="h-10 w-auto object-contain" />
        </Link>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-200">
                {user?.username} • {user?.user_type}
              </span>
              <button
                onClick={logout}
                className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-slate-200 hover:text-white">
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Signup
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
