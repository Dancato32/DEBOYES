import { useState } from 'react'

export default function FoodCard({ food, onAdd, darkMode = false }) {
  const [isLoaded, setIsLoaded] = useState(false)

  // Map food names to emojis for a high-quality visual feel if images are missing
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
    <div className={`relative flex flex-col overflow-hidden rounded-[20px] p-4 border-[2px] transition-transform hover:-translate-y-1 shadow-sm hover:shadow-md ${darkMode ? 'bg-brand-deep-dark border-brand-red/30' : 'bg-white border-[#F0E8D8]'}`}>
      {/* Circle Image Container */}
      <div className={`relative flex h-32 w-32 mx-auto items-center justify-center rounded-full overflow-hidden shrink-0 mt-2 ${darkMode ? 'bg-brand-charcoal' : 'bg-slate-50 shadow-inner'}`}>
        
        {/* Skeleton Pulsing Loader */}
        {!isLoaded && food.image && (
          <div className="absolute inset-0 animate-pulse bg-slate-200 dark:bg-slate-800" />
        )}

        {food.image ? (
          <img 
            src={food.image.startsWith('http') ? food.image : `${import.meta.env.VITE_API_URL || ''}${food.image}`} 
            alt={food.name} 
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            className={`h-full w-full object-cover transition-opacity duration-700 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-slate-50">
             <span className="text-6xl drop-shadow-md">{getEmoji(food.name)}</span>
          </div>
        )}
      </div>
      
      {/* Text Context */}
      <div className="mt-5 space-y-1 flex-1 flex flex-col justify-end">
        <h3 className={`text-[15px] font-bold font-poppins leading-tight truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{food.name}</h3>
        
        <div className="h-2"></div> {/* Added subtle spacing */}

        {/* Price and Add Button */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100/10">
          <p className="text-lg font-bold font-poppins text-brand-red">
            ₵{food.price}
          </p>
          <button
            onClick={() => onAdd(food)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-md transition-all active:scale-95 ${darkMode ? 'bg-brand-red text-white shadow-brand-red/30 hover:bg-brand-dark-red' : 'bg-brand-red text-white shadow-brand-red/30 hover:bg-brand-dark-red'}`}
            aria-label="Add to cart"
          >
            <span className="text-xl font-bold leading-none">+</span>
          </button>
        </div>
      </div>
    </div>
  )
}
