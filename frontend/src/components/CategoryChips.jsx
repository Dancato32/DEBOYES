export default function CategoryChips({ active, onChange, categories = [] }) {
  if (categories.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
      {categories.map((catName) => (
        <button
          key={catName}
          onClick={() => onChange(catName)}
          className={`flex items-center justify-center rounded-full px-5 py-2 text-xs font-semibold font-inter uppercase tracking-widest transition-all min-w-max border ${
            active === catName
              ? 'bg-brand-red text-white border-brand-red shadow-lg shadow-brand-red/20'
              : 'bg-white text-slate-500 border-[#F0E8D8] hover:bg-[#F0E8D8] hover:text-slate-800'
          }`}
        >
          {catName}
        </button>
      ))}
    </div>
  )
}
