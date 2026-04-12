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
      <div className="bg-brand-red text-brand-cream px-6 pb-24 pt-12 rounded-b-[2.5rem] shadow-md relative z-0">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-gold" fill="currentColor" viewBox="0 0 24 24">
               <path fillRule="evenodd" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" clipRule="evenodd" />
            </svg>
            <span className="font-bold text-white tracking-wide text-sm uppercase">Habiganj City</span>
          </div>
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white shadow-sm transition-transform active:scale-90">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h10M4 18h16" />
               </svg>
            </div>
            {cartItems.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-gold text-[10px] font-black text-brand-deep-dark shadow-sm">
                {cartItems.length}
              </span>
            )}
          </div>
        </header>

        <h1 className="text-[38px] leading-tight font-black font-playfair text-white tracking-tight">
          Find The <span className="text-brand-gold">Best<br />Food</span> Around You
        </h1>
      </div>

      <div className="mx-auto max-w-lg px-6 -mt-10 relative z-10">
        {/* Search Bar - Floated over transition */}
        <div className="bg-white rounded-3xl shadow-soft">
          <SearchBar />
        </div>

        {/* Categories */}
        {menu.length > 0 && (
          <div className="mt-8">
            <CategoryChips 
              active={activeCategory} 
              onChange={setActiveCategory} 
              categories={['All', ...Array.from(new Set(menu.map(i => i.category)))]}
            />
          </div>
        )}

        {/* Popular Section */}
        <section className="mt-8">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold font-playfair text-brand-deep-dark">Featured Menu</h2>
            <button className="text-[11px] font-bold uppercase tracking-wider text-brand-red flex items-center gap-0.5 ml-auto">
              5km
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-[2.5rem] bg-white shadow-soft border border-[#F0E8D8]" />
              ))
            ) : menu.length === 0 ? (
              <p className="col-span-2 py-10 text-center text-slate-400 font-medium italic">No food items found.</p>
            ) : (
              menu.filter((food) => activeCategory === 'All' || food.category === activeCategory).map((food) => (
                <FoodCard 
                  key={food.id} 
                  food={food} 
                  onAdd={(item) => {
                    addToCart({ 
                      food_id: item.id, 
                      name: item.name, 
                      price: Number(item.price), 
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
            className="w-full max-w-lg mx-auto flex items-center justify-between rounded-[16px] bg-brand-gold p-4 shadow-xl transition-transform active:scale-95 border-2 border-brand-gold hover:bg-brand-gold-light"
          >
            <div className="flex items-center gap-3 text-brand-deep-dark">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-deep-dark/10 font-bold text-sm">
                {cartItems.length}
              </span>
              <span className="font-bold uppercase tracking-wider text-sm">Checkout</span>
            </div>
            <span className="font-black font-playfair text-xl text-brand-deep-dark">₵{total.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
