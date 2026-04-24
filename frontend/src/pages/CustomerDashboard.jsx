import { useEffect, useState } from 'react'
import { fetchMenu } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import FoodCard from '../components/FoodCard'
import SearchBar from '../components/SearchBar'
import CategoryChips from '../components/CategoryChips'
import BottomNav from '../components/BottomNav'
import FoodDetailModal from '../components/FoodDetailModal'
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
  const [selectedFood, setSelectedFood] = useState(null)

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

  const handleAddToCart = (item) => {
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
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Premium Red Header Section */}
      {/* Premium Red Header Section */}
      <div className="bg-brand-red px-6 py-10 relative overflow-hidden shadow-2xl">
        {/* Background Logo Watermark - Larger and more centered for visibility */}
        <div className="absolute -right-12 -top-12 opacity-[0.15] pointer-events-none rotate-12">
          <img src="/logo.png" alt="" className="h-96 w-96 object-contain brightness-0 invert" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <header className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15 text-brand-yellow backdrop-blur-xl border border-white/10">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                   <path fillRule="evenodd" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 font-inter">Delivery Address</span>
                <span className="font-bold text-white text-sm font-inter">Seth Nii Nartey St, Accra</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/checkout')}
                className="relative group transition-transform active:scale-90"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur-xl border border-white/10 hover:bg-white/25 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                {cartItems.length > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-yellow text-[10px] font-black text-slate-900 shadow-xl animate-in zoom-in duration-300 ring-2 ring-brand-red">
                    {cartItems.length}
                  </span>
                )}
              </button>
            </div>
          </header>

          <div className="space-y-3">
            <h1 className="text-4xl lg:text-5xl font-black font-inter text-brand-yellow tracking-tighter max-w-2xl leading-[0.95] italic uppercase">
              What are you<br />craving today?
            </h1>
            <p className="text-white/80 text-xs font-bold uppercase tracking-[0.15em] font-inter">Premium Street Flavors • Delivered to your door</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6 w-full">
        {/* Search Bar - Compact & Sharp */}
        <div className="max-w-xl">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
 
        {/* Categories - Minimal Pills */}
        {menu.length > 0 && (
          <div className="mt-6">
            <CategoryChips 
              active={activeCategory} 
              onChange={setActiveCategory} 
              categories={['All', ...Array.from(new Set(menu.map(i => i.category)))]}
            />
          </div>
        )}
 
        {/* Menu List - Structured & Dense */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-2 border-b border-slate-200 pb-2">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 font-inter">Featured Menu</h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available Now</span>
          </div>
 
          <div className="flex flex-col">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-24 animate-pulse border-b border-slate-100 flex items-center gap-4 py-4">
                  <div className="h-16 w-16 bg-slate-100 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 w-1/3 rounded" />
                    <div className="h-3 bg-slate-100 w-1/2 rounded" />
                  </div>
                </div>
              ))
            ) : menu.length === 0 ? (
              <div className="py-20 text-center">
                 <p className="text-sm font-medium text-slate-400 font-inter italic">No culinary treasures found today.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                {menu
                  .filter((food) => activeCategory === 'All' || food.category === activeCategory)
                  .filter((food) => food.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((food) => (
                  <FoodCard 
                    key={food.id} 
                    food={food} 
                    onClick={setSelectedFood}
                    onQuickAdd={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Detail Modal */}
      <FoodDetailModal 
        food={selectedFood}
        isOpen={!!selectedFood}
        onClose={() => setSelectedFood(null)}
        onAdd={handleAddToCart}
      />

      {/* Sticky Floating Checkout Bar */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-[88px] left-0 right-0 z-40 px-6 animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-none">
          <button 
            onClick={() => navigate('/checkout')}
            className="w-full max-w-lg mx-auto flex items-center justify-between rounded-xl bg-brand-red p-4 shadow-lg transition-transform active:scale-[0.98] pointer-events-auto hover:bg-brand-dark-red"
          >
            <div className="flex items-center gap-3 text-white">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20 font-bold text-xs">
                {cartItems.length}
              </span>
              <span className="font-semibold font-inter uppercase tracking-wide text-xs">Checkout</span>
            </div>
            <span className="font-bold font-inter text-lg text-white">₵{total.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
