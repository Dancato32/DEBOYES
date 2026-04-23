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
      {/* Clean Header Section */}
      <div className="bg-white border-b border-slate-200 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                   <path fillRule="evenodd" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-inter">Delivery Location</span>
                <span className="font-semibold text-slate-900 text-sm font-inter">Seth Nii Nartey St, Accra</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/checkout')}
                className="relative group transition-transform active:scale-95"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                    <svg className="w-5 h-5 outline-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                {cartItems.length > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white shadow-sm animate-in zoom-in duration-200">
                    {cartItems.length}
                  </span>
                )}
              </button>
            </div>
          </header>

          <h1 className="text-3xl lg:text-4xl font-bold font-inter text-slate-900 tracking-tight max-w-2xl">
            What are you craving today?
          </h1>
          <p className="mt-2 text-slate-500 text-sm">Discover the best street flavors delivered to your door.</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6 w-full">
        {/* Search Bar */}
        <div className="max-w-2xl">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* Categories */}
        {menu.length > 0 && (
          <div className="mt-8 border-b border-slate-200 pb-4">
            <CategoryChips 
              active={activeCategory} 
              onChange={setActiveCategory} 
              categories={['All', ...Array.from(new Set(menu.map(i => i.category)))]}
            />
          </div>
        )}

        {/* Menu Grid */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold font-inter text-slate-900">Featured Menu</h2>
            <span className="text-xs font-semibold text-slate-500">5km nearby</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {loading ? (
              Array(10).fill(0).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-lg bg-slate-200" />
              ))
            ) : menu.length === 0 ? (
              <p className="col-span-full py-10 text-center text-slate-400 font-medium">No food items found.</p>
            ) : (
              menu
                .filter((food) => activeCategory === 'All' || food.category === activeCategory)
                .filter((food) => food.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((food) => (
                <FoodCard 
                  key={food.id} 
                  food={food} 
                  onClick={setSelectedFood}
                  onQuickAdd={handleAddToCart}
                />
              ))
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
