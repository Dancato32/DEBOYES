import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navGroups = [
  {
    title: 'OVERVIEW',
    items: [
      { 
        id: 'dashboard', 
        label: 'Dashboard', 
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>, 
        path: '/admin' 
      },
    ]
  },
  {
    title: 'MANAGE',
    items: [
      { 
        id: 'orders', 
        label: 'Orders', 
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>, 
        path: '/admin/orders' 
      },
      { 
        id: 'customers', 
        label: 'Customers', 
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, 
        path: '/admin/customers' 
      },
      { 
        id: 'riders', 
        label: 'Riders', 
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>, 
        path: '/admin/riders' 
      },
      { 
        id: 'menu', 
        label: 'Menu Items', 
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>, 
        path: '/admin/menu' 
      },
      { 
        id: 'revenue', 
        label: 'Revenue', 
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>, 
        path: '/admin/revenue' 
      },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { 
        id: 'settings', 
        label: 'Settings', 
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>, 
        path: '/admin/settings' 
      },
    ]
  }
]

export default function AdminSidebar() {
  const location = useLocation()
  const { logout } = useAuth()

  return (
    <div className="flex w-64 flex-col border-r border-brand-dark-red bg-brand-red p-6 text-brand-cream/80 shadow-2xl relative z-20">
      <div className="flex items-center gap-3 px-2">
        <div className="bg-white rounded-full p-1 shadow-md">
          <img src="/logo.png" alt="De Boye's Logo" className="h-[40px] w-auto object-contain" />
        </div>
        <h1 className="text-xs font-bold text-white tracking-[0.25em] font-poppins uppercase">Admin</h1>
      </div>

      <nav className="mt-10 flex-1 space-y-8">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-4">
            <p className="px-2 text-[10px] font-bold uppercase tracking-[0.25em] text-brand-cream/60 font-inter">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold font-inter transition-all ${
                      isActive 
                        ? 'bg-brand-dark-red text-brand-gold ring-1 ring-brand-gold/30 shadow-[0_0_15px_rgba(245,181,10,0.1)]' 
                        : 'hover:bg-brand-dark-red hover:text-white'
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <button
        onClick={logout}
        className="mt-auto flex items-center gap-3 px-3 py-4 text-sm font-bold font-inter uppercase tracking-widest transition hover:text-white"
      >
        <span className="flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
        </span>
        Sign out
      </button>
    </div>
  )
}
