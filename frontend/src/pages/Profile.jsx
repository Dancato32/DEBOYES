import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'

const ProfileItem = ({ label, value, icon, onClick, red }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 rounded-lg border transition-all active:scale-[0.98] bg-white border-slate-200 hover:bg-slate-50 shadow-sm"
  >
    <div className="flex items-center gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg text-lg bg-slate-50">
        {icon}
      </div>
      <div className="text-left flex flex-col justify-center gap-0.5">
        <p className="text-[10px] font-bold uppercase tracking-widest font-inter text-slate-400">{label}</p>
        <p className={`font-semibold font-inter text-sm ${red ? 'text-brand-red' : 'text-slate-800'}`}>{value}</p>
      </div>
    </div>
    <div className="text-slate-300">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
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
    <div className="min-h-screen pb-32 bg-slate-50 text-slate-800 relative overflow-hidden">
      {/* Background Watermark */}
      <div className="fixed top-20 -right-20 opacity-[0.03] pointer-events-none rotate-12">
        <img src="/logo.png" alt="" className="h-[600px] w-[600px] object-contain" />
      </div>

      <header className="bg-brand-red px-6 py-5 flex items-center justify-between sticky top-0 z-[100] shadow-lg overflow-hidden">
        {/* Background Logo Watermark */}
        <div className="absolute right-[-10px] top-[-10px] opacity-[0.1] pointer-events-none">
          <img src="/logo.png" alt="" className="h-32 w-32 object-contain brightness-0 invert" />
        </div>

        <div className="max-w-7xl mx-auto w-full flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
             <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain brightness-0 invert" />
             <h1 className="text-sm font-black font-inter text-white uppercase tracking-[0.2em]">Profile Settings</h1>
          </div>
          <Link 
            to="/customer"
            className="h-10 w-10 flex items-center justify-center text-white/70 rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">

          {/* LEFT: Avatar + Stats */}
          <div className="lg:sticky lg:top-8 space-y-6">
            {/* Profile Header */}
            <section className="flex flex-col items-center text-center space-y-4 bg-brand-red rounded-lg p-6 shadow-lg relative overflow-hidden">
              {/* Internal Watermark */}
              <div className="absolute right-[-10px] top-[-10px] opacity-[0.1] pointer-events-none">
                <img src="/logo.png" alt="" className="h-32 w-32 object-contain brightness-0 invert" />
              </div>

              <div className="relative z-10">
                 <div className="flex h-24 w-24 items-center justify-center rounded-lg text-3xl font-bold font-inter shadow-lg bg-brand-yellow text-slate-900 border-2 border-white/20">
                   {initials}
                 </div>
                 <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded border-2 bg-brand-red border-white text-white shadow-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                 </div>
              </div>
              <div className="relative z-10">
                <h1 className="text-2xl font-bold font-inter text-brand-yellow tracking-tight">{user?.username}</h1>
                <p className="text-[10px] font-bold uppercase mt-1 font-inter text-white/70 tracking-widest">{isRider ? 'Certified Rider' : 'Valued Customer'}</p>
              </div>
            </section>

            {/* Stats Summary */}
            <section className="grid grid-cols-2 gap-4">
               <div className="p-4 rounded-lg border text-center bg-white border-slate-200 shadow-sm">
                  <p className="text-xl font-bold font-inter text-brand-red">{user?.active_days || 1}</p>
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-1 font-inter">Active Days</p>
               </div>
               <div className="p-4 rounded-lg border text-center bg-white border-slate-200 shadow-sm">
                  <p className="text-xl font-bold font-inter text-brand-red">{user?.membership_status || 'Bronze'}</p>
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-1 font-inter">Membership</p>
               </div>
            </section>

            <div className="text-center hidden lg:block">
              <p className="text-[11px] font-medium tracking-[0.05em] font-inter text-slate-400">
                <span className="font-pacifico text-brand-red lowercase text-sm">De Boye's</span> v1.2.4
              </p>
            </div>
          </div>

          {/* RIGHT: Action List */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-inter px-1">Account Settings</p>
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 shadow-sm">
              <ProfileItem 
                label="Email Address" 
                value={user?.email} 
                icon={
                  <svg className="w-5 h-5 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                } 
              />
              {user?.phone && (
                <ProfileItem 
                  label="Phone Number" 
                  value={user?.phone} 
                  icon={
                    <svg className="w-5 h-5 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  } 
                />
              )}
            </div>

            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-inter px-1 pt-4">Support & Safety</p>
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 shadow-sm">
              <ProfileItem 
                label="Help Center" 
                value="Get Support" 
                icon={
                  <svg className="w-5 h-5 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                } 
              />
              <ProfileItem 
                label="Account Security" 
                value="Log Out" 
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                } 
                onClick={logout} 
              />
            </div>

            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-inter px-1 pt-4">Legal & Danger Zone</p>
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 shadow-sm">
              <Link to="/privacy-policy" className="block">
                <ProfileItem 
                  label="Legal" 
                  value="Privacy Policy" 
                  icon={
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  } 
                />
              </Link>
              <ProfileItem 
                label="Danger Zone" 
                value="Delete Account" 
                icon={
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                } 
                red 
                onClick={handleDeleteAccount} 
              />
            </div>

            <div className="mt-8 text-center lg:hidden">
              <p className="text-[11px] font-medium tracking-[0.05em] font-inter text-slate-400">
                <span className="font-pacifico text-brand-red lowercase text-sm">De Boye's</span> v1.2.4
              </p>
            </div>
          </div>

        </div>
      </div>
      <BottomNav />
    </div>
  )
}
