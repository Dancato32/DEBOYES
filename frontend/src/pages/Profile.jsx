import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'

const ProfileItem = ({ label, value, icon, onClick, red }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-6 rounded-[2rem] border transition-all active:scale-[0.98] bg-white border-[#F0E8D8] hover:bg-slate-50 shadow-sm"
  >
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl bg-brand-cream">
        {icon}
      </div>
      <div className="text-left flex flex-col justify-center gap-0.5">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] font-dmsans text-slate-400">{label}</p>
        <p className={`font-bold font-dmsans text-sm ${red ? 'text-brand-red' : 'text-slate-800'}`}>{value}</p>
      </div>
    </div>
    <div className="text-slate-300">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </button>
)

export default function Profile() {
  const { user, logout } = useAuth()
  const isRider = user?.user_type === 'rider'
  const initials = user?.username?.slice(0, 2).toUpperCase() || 'U'

  return (
    <div className="min-h-screen pb-32 bg-brand-cream text-slate-800">
      <div className="mx-auto max-w-lg px-4 pt-16 space-y-10">
        
        {/* Profile Header */}
        <section className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
             <div className="flex h-28 w-28 items-center justify-center rounded-[2.5rem] text-4xl font-black font-playfair shadow-2xl italic bg-brand-red text-white shadow-brand-red/20">
               {initials}
             </div>
             <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl border-4 bg-white border-brand-cream text-brand-red">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
             </div>
          </div>
          <div>
            <h1 className="text-3xl font-black font-playfair tracking-tight">{user?.username}</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-1 font-dmsans text-slate-400">{isRider ? 'Certified Rider' : 'Valued Customer'}</p>
          </div>
        </section>

        {/* Stats Summary (Simulated) */}
        <section className="grid grid-cols-2 gap-4">
           <div className="p-5 rounded-[2rem] border text-center bg-white border-[#F0E8D8] shadow-sm">
              <p className="text-2xl font-black font-playfair text-brand-red">24</p>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1 font-dmsans">Active Days</p>
           </div>
           <div className="p-5 rounded-[2rem] border text-center bg-white border-[#F0E8D8] shadow-sm">
              <p className="text-2xl font-black font-playfair text-brand-red">Gold</p>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1 font-dmsans">Membership</p>
           </div>
        </section>

        {/* Action List */}
        <div className="space-y-4">
          <ProfileItem label="Email Address" value={user?.email} icon="📧" />
          {user?.phone && <ProfileItem label="Phone Number" value={user?.phone} icon="📱" />}
          <ProfileItem label="Support" value="Get Help" icon="🎧" />
          <ProfileItem label="Security" value="Logout" icon="🚪" red onClick={logout} />
        </div>

        <div className="mt-8 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] font-dmsans text-slate-400">De Boye's v1.2.4</p>
        </div>

      </div>
      <BottomNav />
    </div>
  )
}
