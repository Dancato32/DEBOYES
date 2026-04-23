import { useState } from 'react'

export default function FoodCard({ food, onClick, onQuickAdd, darkMode = false }) {
  const [isLoaded, setIsLoaded] = useState(false)

  // Map food names to emojis
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
    <div 
      onClick={() => onClick(food)}
      className={`group relative flex flex-col overflow-hidden rounded-lg border transition-all hover:border-slate-300 hover:shadow-sm cursor-pointer ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
    >
      {/* Image Container */}
      <div className={`relative flex h-40 w-full items-center justify-center overflow-hidden shrink-0 ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
        {!isLoaded && food.image && (
          <div className="absolute inset-0 animate-pulse bg-slate-200 dark:bg-slate-800" />
        )}
        {food.image ? (
          <img 
            src={food.image.startsWith('http') ? food.image : `${import.meta.env.VITE_API_URL || ''}${food.image}`} 
            alt={food.name} 
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
             <span className="text-5xl drop-shadow-sm transition-transform duration-500 group-hover:scale-110">{getEmoji(food.name)}</span>
          </div>
        )}
      </div>
      
      {/* Text Content */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 className={`text-sm font-semibold font-inter leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{food.name}</h3>
          {food.category && (
            <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500 font-medium">
              {food.category}
            </p>
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <p className="text-base font-bold text-slate-900 font-inter">
            ₵{food.price}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onQuickAdd(food)
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-700 transition-colors hover:bg-brand-red hover:text-white"
            aria-label="Quick add to cart"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
