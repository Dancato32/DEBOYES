
export default function SearchBar() {
  return (
    <div className="relative w-full group flex items-center bg-[#f2f4f6] rounded-full px-5 py-4">
      <span className="text-slate-400 text-lg mr-3">🔍</span>
      <input
        type="search"
        className="w-full bg-transparent border-none p-0 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
        placeholder="Search your favourite food"
      />
      <div className="ml-3 pl-3 border-l border-slate-300">
        <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
        </svg>
      </div>
    </div>
  )
}
