export default function CategoryChips({ active, onChange, categories = [] }) {
  if (categories.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
      {categories.map((catName) => (
        <button
          key={catName}
          onClick={() => onChange(catName)}
          className={`flex items-center justify-center rounded-lg px-6 py-2.5 text-[10px] font-black font-inter uppercase tracking-[0.15em] transition-all min-w-max border ${
            active === catName
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-brand-yellow ring-offset-1'
              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-800'
          }`}
        >
          {catName}
        </button>
      ))}
    </div>
  )
}
