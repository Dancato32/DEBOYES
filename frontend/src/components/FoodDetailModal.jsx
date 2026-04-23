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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-slate-900 backdrop-blur-md transition-colors hover:bg-white border border-slate-200"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex h-48 w-full items-center justify-center bg-slate-100 overflow-hidden">
          {food.image ? (
            <img 
              src={food.image.startsWith('http') ? food.image : `${import.meta.env.VITE_API_URL || ''}${food.image}`}
              alt={food.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-6xl drop-shadow-sm">{getEmoji(food.name)}</span>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-poppins">{food.name}</h2>
              {food.category && (
                <span className="mt-1 inline-block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {food.category}
                </span>
              )}
            </div>
            <p className="text-xl font-bold text-brand-red font-poppins whitespace-nowrap">
              ₵{food.price}
            </p>
          </div>

          <p className="mt-4 text-sm text-slate-600 leading-relaxed">
            {food.description || "A delicious meal prepared with the freshest ingredients. Perfect for satisfying your cravings."}
          </p>

          <button
            onClick={() => {
              onAdd(food)
              onClose()
            }}
            className="mt-8 flex w-full items-center justify-center rounded-lg bg-brand-red py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-dark-red active:scale-[0.98]"
          >
            Add to Order
          </button>
        </div>
      </div>
    </div>
  )
}
