import { useEffect, useState } from 'react'
import { fetchMenu } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import FoodCard from '../components/FoodCard'
import SearchBar from '../components/SearchBar'
import CategoryChips from '../components/CategoryChips'
import BottomNav from '../components/BottomNav'
import useAdminSocket from '../hooks/useAdminSocket'
import { toast } from 'react-toastify'

export default function CustomerDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToCart, cartItems, total } = useCart()
  const [menu, setMenu] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const loadMenu = async () => {
    setLoading(true)
    try {
      const response = await fetchMenu()
      setMenu(response.data.items || [])
    } catch (error) {
      toast.error('Unable to load menu items')
    } finally {
      setLoading(false)
    }
  }

  useAdminSocket((update) => {
    if (update.event === 'MENU_UPDATED') {
      loadMenu()
    }
  })

  useEffect(() => {
    loadMenu()
  }, [])

  return (
    <div className="min-h-screen bg-brand-cream pb-32">
      {/* RED HERO SECTION */}
      <div className="bg-brand-red text-brand-cream px-6 pb-24 pt-12 rounded-b-[3.5rem] shadow-md relative overflow-hidden z-0">
        {/* Logo Watermark Background */}
        <div className="absolute inset-0 z-[-1] flex items-center justify-center opacity-[0.15] pointer-events-none scale-150 transform -rotate-12 translate-x-20">
           <img src="/logo.png" alt="" className="w-full h-auto object-contain" />
        </div>
        
        <div className="max-w-7xl mx-auto">
          <header className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                   <path fillRule="evenodd" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 font-inter">Delivery Location</span>
                <span className="font-bold text-white text-[12px] font-inter">Seth Nii Nartey St, Accra</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/checkout')}
                className="relative group transition-transform active:scale-90"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white shadow-sm hover:bg-white/20 backdrop-blur-md transition-colors border border-white/10">
                    <svg className="w-6 h-6 outline-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                {cartItems.length > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] font-black text-brand-red shadow-xl animate-in zoom-in duration-300">
                    {cartItems.length}
                  </span>
                )}
              </button>
            </div>
          </header>

          <h1 className="text-[42px] lg:text-[64px] leading-[1.1] font-bold font-poppins text-white tracking-tighter max-w-4xl">
            Taste the <span className="font-pacifico font-normal text-white/90 lowercase">Street.</span><br />
            Love the <span className="font-pacifico font-normal text-white/90 lowercase">Flavor.</span>
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 -mt-10 relative z-10 w-full">
        {/* Search Bar - Floated over transition */}
        <div className="bg-white rounded-3xl shadow-soft max-w-lg mx-auto lg:max-w-xl">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* Categories */}
        {menu.length > 0 && (
          <div className="mt-8 flex justify-center">
            <CategoryChips 
              active={activeCategory} 
              onChange={setActiveCategory} 
              categories={['All', ...Array.from(new Set(menu.map(i => i.category)))]}
            />
          </div>
        )}

        {/* Popular Section */}
        <section className="mt-8">
          <div className="flex items-center gap-3 mb-6 max-w-7xl mx-auto">
            <h2 className="text-xl font-bold font-poppins text-brand-deep-dark">Featured Menu</h2>
            <button className="text-[10px] font-bold uppercase tracking-wider text-brand-red flex items-center gap-0.5 ml-auto font-inter">
              5km
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-[2.5rem] bg-white shadow-soft border border-[#F0E8D8]" />
              ))
            ) : menu.length === 0 ? (
              <p className="col-span-full py-10 text-center text-slate-400 font-medium italic">No food items found.</p>
            ) : (
              menu
                .filter((food) => activeCategory === 'All' || food.category === activeCategory)
                .filter((food) => food.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((food) => (
                <FoodCard 
                  key={food.id} 
                  food={food} 
                  onAdd={(item) => {
                    addToCart({ 
                      food_id: item.id, 
                      name: item.name, 
                      price: Number(item.price), 
                      image: item.image,
                      qty: 1 
                    })
                    toast.success(`${item.name} added to basket`, {
                      position: "bottom-center",
                      autoClose: 1500,
                      hideProgressBar: true
                    })
                  }} 
                />
              ))
            )}
          </div>
        </section>
      </div>

      {/* Sticky Floating Checkout Bar */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-[88px] left-0 right-0 z-40 px-6 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <button 
            onClick={() => navigate('/checkout')}
            className="w-full max-w-lg mx-auto flex items-center justify-between rounded-[16px] bg-brand-red p-4 shadow-xl transition-transform active:scale-95 border-2 border-brand-red hover:bg-brand-dark-red"
          >
            <div className="flex items-center gap-3 text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 font-bold text-sm">
                {cartItems.length}
              </span>
              <span className="font-bold font-inter uppercase tracking-widest text-[10px]">Checkout</span>
            </div>
            <span className="font-bold font-poppins text-xl text-white">₵{total.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
