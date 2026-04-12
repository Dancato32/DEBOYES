export default function FoodCard({ food, onAdd, darkMode = false }) {
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
      {/* Heart Icon top right */}
      <button className="absolute top-4 right-4 z-10 text-slate-400 hover:text-brand-red transition-colors">
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
      </button>

      {/* Circle Image Container */}
      <div className={`flex h-32 w-32 mx-auto items-center justify-center rounded-full overflow-hidden shrink-0 mt-2 ${darkMode ? 'bg-brand-charcoal' : 'bg-slate-50'}`}>
        {food.image ? (
          <img src={`http://localhost:8000${food.image}`} alt={food.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-6xl">{getEmoji(food.name)}</span>
        )}
      </div>
      
      {/* Text Context */}
      <div className="mt-5 space-y-1 flex-1 flex flex-col justify-end">
        <h3 className={`text-[15px] font-bold leading-tight truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{food.name}</h3>
        
        {/* Time and Rating Mock Data */}
        <div className={`flex items-center gap-3 text-[11px] font-bold pt-1 pb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
           <span className="tracking-wider uppercase">20min</span>
           <span className="flex items-center gap-1 text-brand-gold">⭐ <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>4.5</span></span>
        </div>

        {/* Price and Add Button */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100/10">
          <p className="text-xl font-black font-playfair text-brand-red">
            ₵{food.price}
          </p>
          <button
            onClick={() => onAdd(food)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-md transition-all active:scale-95 ${darkMode ? 'bg-brand-gold text-brand-deep-dark shadow-brand-gold/30 hover:bg-brand-gold-light' : 'bg-brand-red text-white shadow-brand-red/30 hover:bg-brand-dark-red'}`}
            aria-label="Add to cart"
          >
            <span className="text-xl font-bold leading-none">+</span>
          </button>
        </div>
      </div>
    </div>
  )
}
