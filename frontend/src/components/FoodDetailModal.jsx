import { useEffect } from 'react'

export default function FoodDetailModal({ food, isOpen, onClose, onAdd }) {
  // Prevent scrolling on body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !food) return null

  // Map food names to emojis if missing image
  const getEmoji = (name) => {
    const n = name.toLowerCase()
    if (n.includes('pizza')) return '🍕'
    if (n.includes('burger')) return '🍔'
    if (n.includes('taco') || n.includes('mexican')) return '🌮'
    if (n.includes('noodle') || n.includes('asian')) return '🍜'
    if (n.includes('cake') || n.includes('dessert')) return '🍰'
    if (n.includes('salad')) return '🥗'
    return '🍲'
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Backdrop - darker for focus */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Detail Panel - Sharp & Structured */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-200">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-slate-900 backdrop-blur-md border border-slate-200 shadow-sm transition-all hover:bg-white hover:scale-105"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
 
        <div className="grid grid-cols-1 md:grid-cols-1 gap-0">
          {/* Image - Full Width Banner */}
          <div className="h-64 w-full bg-slate-50 border-b border-slate-100 overflow-hidden relative">
            {food.image ? (
              <img 
                src={food.image.startsWith('http') ? food.image : `${import.meta.env.VITE_API_URL || ''}${food.image}`}
                alt={food.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-7xl opacity-20">🍲</div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/40 to-transparent pointer-events-none" />
          </div>
 
          <div className="p-8">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-red">
                {food.category || 'Menu Item'}
              </span>
              <h2 className="text-2xl font-bold text-slate-900 font-inter tracking-tight leading-tight">
                {food.name}
              </h2>
            </div>
 
            <div className="mt-4 flex items-center gap-4">
              <span className="text-2xl font-black text-slate-900 font-inter">
                ₵{food.price}
              </span>
              <div className="h-4 w-[1px] bg-slate-200" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Freshly Prepared
              </span>
            </div>
 
            <div className="mt-6 border-t border-slate-100 pt-6">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 font-inter">Description</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-inter">
                {food.description || "A masterfully crafted dish using only the finest seasonal ingredients. Perfectly balanced flavor profiles designed to satisfy the most discerning palate."}
              </p>
            </div>
 
            <div className="mt-10 pt-6 border-t border-slate-100">
              <button
                onClick={() => {
                  onAdd(food)
                  onClose()
                }}
                className="flex w-full items-center justify-center rounded-lg bg-brand-red py-4 text-xs font-black uppercase tracking-[0.2em] text-brand-yellow shadow-lg shadow-brand-red/20 transition-all hover:bg-brand-dark-red hover:translate-y-[-1px] active:translate-y-[0px] active:scale-[0.98]"
              >
                Add to Basket — ₵{food.price}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
