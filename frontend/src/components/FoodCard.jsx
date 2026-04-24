import { useState } from 'react'
 
export default function FoodCard({ food, onClick, onQuickAdd, darkMode = false }) {
  const [isLoaded, setIsLoaded] = useState(false)
 
  return (
    <div 
      onClick={() => onClick(food)}
      className={`group relative flex items-center gap-4 py-4 border-b transition-all cursor-pointer ${
        darkMode ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-100 hover:bg-slate-50'
      }`}
    >
      {/* Image Container - Fixed square, sharp corners */}
      <div className={`relative h-20 w-20 overflow-hidden rounded-md shrink-0 border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
        {!isLoaded && food.image && (
          <div className="absolute inset-0 animate-pulse bg-slate-200" />
        )}
        {food.image ? (
          <img 
            src={food.image.startsWith('http') ? food.image : `${import.meta.env.VITE_API_URL || ''}${food.image}`} 
            alt={food.name} 
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            className={`h-full w-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-2xl opacity-40">🍲</div>
        )}
      </div>
      
      {/* Text Content - Information Dense */}
      <div className="flex flex-1 flex-col justify-center min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className={`text-sm font-bold font-inter truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {food.name}
            </h3>
            {food.category && (
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {food.category}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className={`text-sm font-black font-inter ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              ₵{food.price}
            </p>
          </div>
        </div>
        
        {food.description && (
          <p className="mt-1 text-xs text-slate-500 line-clamp-1 font-inter leading-relaxed max-w-[80%]">
            {food.description}
          </p>
        )}
      </div>
 
      {/* Action Area */}
      <div className="ml-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onQuickAdd(food)
          }}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all active:scale-90 ${
            darkMode 
            ? 'bg-slate-800 border-slate-700 text-white hover:border-brand-red' 
            : 'bg-white border-slate-200 text-slate-400 hover:border-brand-red hover:text-brand-red shadow-sm'
          }`}
          aria-label="Add to cart"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  )
}
