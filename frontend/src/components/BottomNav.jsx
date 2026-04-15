import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function BottomNav() {
  const location = useLocation()
  const { user } = useAuth()
  const navItems = user?.user_type === 'rider' ? [
    { id: 'hub', label: 'Hub', path: '/rider', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    )},
    { id: 'alerts', label: 'Alerts', path: '/rider/alerts', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h11zm0 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    )},
    { id: 'active', label: 'Active', path: '/rider/active', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
  ] : [
    { id: 'home', label: 'Home', path: '/customer', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )},
    { id: 'history', label: 'Orders', path: '/history', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )},
    { id: 'profile', label: 'Profile', path: '/profile', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )},
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 p-4 px-8 pb-7 backdrop-blur-2xl border-t border-[#F0E8D8] bg-white/90 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      <div className="mx-auto flex max-w-lg items-center justify-between">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${
                isActive 
                ? 'scale-110 text-brand-red drop-shadow-[0_0_8px_rgba(192,17,26,0.2)]' 
                : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="flex flex-col items-center">
                <div className={`${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {item.icon}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest mt-1 font-inter">{item.label}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
