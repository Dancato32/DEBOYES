import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'

const ProfileRow = ({ label, value, icon, onClick, red }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between py-4 px-2 hover:bg-slate-50 transition-all border-b border-slate-100 last:border-0 group"
  >
    <div className="flex items-center gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-50 text-slate-400 group-hover:text-brand-red transition-colors">
        {icon}
      </div>
      <div className="text-left flex flex-col">
        <p className="text-[10px] font-black uppercase tracking-widest font-inter text-slate-400">{label}</p>
        <p className={`font-bold font-inter text-sm ${red ? 'text-brand-red' : 'text-slate-800'}`}>{value}</p>
      </div>
    </div>
    <div className="text-slate-200 group-hover:text-brand-red transition-colors">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </button>
)

export default function Profile() {
  const { user, logout } = useAuth()
  const isRider = user?.user_type === 'rider'
  const initials = user?.username?.slice(0, 2).toUpperCase() || 'U'

  const handleDeleteAccount = async () => {
    if (window.confirm("ARE YOU SURE? This will permanently delete your account and all associated data. This action cannot be undone.")) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/delete/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          toast.success("Account deleted successfully");
          logout();
        } else {
          toast.error("Failed to delete account");
        }
      } catch (err) {
        toast.error("Error connecting to server");
      }
    }
  }

  return (
    <div className="min-h-screen pb-32 bg-white text-slate-800 relative overflow-hidden font-inter">
      {/* SaaS Style Header */}
      <header className="bg-brand-red px-6 py-10 relative overflow-hidden shadow-xl">
        {/* Background Logo Watermark */}
        <div className="absolute right-[-10px] top-[-10px] opacity-[0.1] pointer-events-none rotate-12">
          <img src="/logo.png" alt="" className="h-48 w-48 object-contain brightness-0 invert" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 bg-white/20 rounded flex items-center justify-center backdrop-blur-md">
                <img src="/logo.png" alt="Logo" className="h-5 w-5 object-contain brightness-0 invert" />
             </div>
             <h1 className="text-xs font-black text-white/50 uppercase tracking-[0.3em]">Identity & Settings</h1>
          </div>
          <h2 className="text-4xl font-black text-brand-yellow tracking-tighter italic uppercase">Account Profile</h2>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-12 items-start">

          {/* LEFT: Identity Card */}
          <div className="space-y-8">
            <section className="flex flex-col items-center text-center space-y-6 border-b border-slate-100 pb-8">
              <div className="relative">
                 <div className="flex h-32 w-32 items-center justify-center rounded border-4 border-slate-50 text-4xl font-black font-inter shadow-2xl bg-brand-red text-white">
                   {initials}
                 </div>
                 <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded border-2 bg-brand-yellow border-white text-slate-900 shadow-xl">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                 </div>
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-black font-inter text-slate-900 tracking-tight uppercase italic">{user?.username}</h1>
                <p className="text-[10px] font-black uppercase font-inter text-brand-red tracking-[0.2em]">{isRider ? 'Logistics Partner' : 'Premier Client'}</p>
              </div>
            </section>


          </div>

          {/* RIGHT: Structured Options */}
          <div className="space-y-10">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 mb-4 border-b border-slate-900 pb-2">Information</h3>
              <div className="flex flex-col">
                <ProfileRow 
                  label="Verified Email" 
                  value={user?.email} 
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  } 
                />
                {user?.phone && (
                  <ProfileRow 
                    label="Contact Number" 
                    value={user?.phone} 
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    } 
                  />
                )}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 mb-4 border-b border-slate-900 pb-2">Support & Legal</h3>
              <div className="flex flex-col">
                <ProfileRow 
                  label="Help Center" 
                  value="Concierge Support" 
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  } 
                />
                <Link to="/privacy-policy">
                  <ProfileRow 
                    label="Compliance" 
                    value="Privacy Policy" 
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    } 
                  />
                </Link>
              </div>
            </div>

            <div className="pt-8">
              <button 
                onClick={logout}
                className="w-full h-14 rounded bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl active:scale-[0.98]"
              >
                Terminate Session
              </button>
              <button 
                onClick={handleDeleteAccount}
                className="w-full mt-4 text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline transition-all"
              >
                Permanently Delete Data
              </button>
            </div>
          </div>

        </div>
      </div>
      <BottomNav />
    </div>
  )
}
