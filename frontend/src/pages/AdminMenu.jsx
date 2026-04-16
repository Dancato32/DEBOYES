import { useEffect, useState, useRef } from 'react'
import { fetchAdminMenu, manageAdminMenu, deleteMenuItem } from '../services/api'
import useAdminSocket from '../hooks/useAdminSocket'
import { toast } from 'react-toastify'

export default function AdminMenu() {
  const [menu, setMenu] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    image: null
  })

  const loadMenu = async () => {
    setLoading(true)
    try {
      const response = await fetchAdminMenu()
      setMenu(response.data.items)
    } catch (error) {
      toast.error('Failed to load menu')
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

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    setFormData({ ...formData, image: file })
    if (file) {
        const reader = new FileReader()
        reader.onloadend = () => setImagePreview(reader.result)
        reader.readAsDataURL(file)
    }
  }

  const handleEditClick = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      price: item.price,
      category: item.category,
      description: item.description || '',
      image: null // We don't populate the file input with existing image
    })
    setImagePreview(item.image ? (item.image.startsWith('http') ? item.image : `${import.meta.env.VITE_API_URL || ''}${item.image}`) : null)
    setIsCustomCategory(!categories.includes(item.category))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setFormData({ name: '', price: '', category: categories.length > 0 ? categories[0] : '', description: '', image: null })
    setEditingItem(null)
    setImagePreview(null)
    setIsCustomCategory(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return
    try {
      await deleteMenuItem(id)
      toast.success('Item removed')
      loadMenu()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to remove item: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    const data = new FormData()
    data.append('name', formData.name)
    data.append('price', formData.price)
    data.append('category', formData.category)
    data.append('description', formData.description)
    if (formData.image) {
      data.append('image', formData.image)
    }

    try {
      await manageAdminMenu(data, editingItem?.id)
      toast.success(editingItem ? 'Item updated successfully' : 'Successfully added to menu')
      resetForm()
      loadMenu()
    } catch (error) {
      console.error('Submit item error:', error)
      toast.error(`Failed to ${editingItem ? 'update' : 'add'} item: ` + (error.response?.data?.error || error.message))
    } finally {
      setSubmitting(false)
    }
  }

  // Get unique categories from existing menu for the dropdown
  const categories = Array.from(new Set(menu.map(i => i.category)))
  
  // Auto-switch to custom if there are no categories yet
  useEffect(() => {
    if (!loading && categories.length === 0 && !isCustomCategory) {
      setIsCustomCategory(true)
    }
  }, [loading, categories.length, isCustomCategory])

  return (
    <div className="space-y-10 py-6">
      <header>
        <h1 className="text-2xl font-bold font-poppins text-brand-deep-dark tracking-tight uppercase">Menu Items</h1>
        <p className="mt-2 text-brand-charcoal font-medium">Add, edit, or remove items customers can order.</p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        {/* Add New Item Form */}
        <section className="rounded-[2.5rem] bg-white p-8 shadow-soft border border-[#F0E8D8]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-poppins text-brand-deep-dark uppercase tracking-wide">
                {editingItem ? 'Edit item' : 'Add new item'}
            </h2>
            {editingItem && (
               <button 
                 onClick={resetForm}
                 className="text-[10px] font-black uppercase text-brand-charcoal/40 hover:text-brand-red transition-colors"
                >
                 Cancel Edit
               </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="mt-8 space-y-6 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-charcoal/60 pl-2">Item photo</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`group relative flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed transition-all overflow-hidden ${
                  imagePreview ? 'border-brand-red/50 bg-[#F0E8D8]' : 'border-[#F0E8D8] bg-brand-cream hover:border-brand-red/50 hover:bg-[#F0E8D8]'
                }`}
              >
                {imagePreview ? (
                   <>
                     <img src={imagePreview} alt="Preview" className="h-full w-full object-cover opacity-80" />
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-2xl">📸</span>
                        <p className="mt-1 text-[10px] font-bold text-white uppercase tracking-wider">Change photo</p>
                     </div>
                   </>
                ) : (
                  <>
                    <span className="text-4xl text-brand-charcoal/40 transition-transform group-hover:scale-110">🖼️</span>
                    <p className="mt-2 text-xs text-brand-charcoal/60 font-medium">Click to upload photo</p>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-charcoal/60 pl-2">Item name</label>
                <input 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-brand-cream border-[#F0E8D8] rounded-2xl px-4 py-3 placeholder-brand-charcoal/40 text-brand-deep-dark focus:border-brand-red focus:ring-brand-red" 
                  placeholder="e.g. Extra Spicy Wings" 
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between pl-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-charcoal/60">Category</label>
                    <button 
                        type="button"
                        onClick={() => setIsCustomCategory(!isCustomCategory)}
                        className="text-[9px] font-black uppercase text-brand-red hover:text-brand-dark-red"
                    >
                        {isCustomCategory ? 'Select existing' : '+ Add custom'}
                    </button>
                </div>
                {isCustomCategory ? (
                   <input 
                     value={formData.category}
                     onChange={(e) => setFormData({...formData, category: e.target.value})}
                     className="w-full bg-brand-cream border-brand-red/50 rounded-2xl px-4 py-3 text-brand-dark-red font-bold focus:border-brand-red focus:ring-brand-red"
                     placeholder="Type new category..."
                     autoFocus
                   />
                ) : (
                    <select 
                       value={formData.category}
                       onChange={(e) => setFormData({...formData, category: e.target.value})}
                       className="w-full bg-brand-cream border-[#F0E8D8] rounded-2xl px-4 py-3 text-brand-deep-dark focus:border-brand-red focus:ring-brand-red"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-charcoal/60 pl-2">Description</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full h-32 bg-brand-cream border-[#F0E8D8] rounded-2xl px-4 py-3 placeholder-brand-charcoal/40 text-brand-deep-dark resize-none focus:border-brand-red focus:ring-brand-red" 
                placeholder="Shortly describe the ingredients..."
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-charcoal/60 pl-2">Price (₵)</label>
                <input 
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full bg-brand-cream border-[#F0E8D8] rounded-2xl px-4 py-3 font-bold text-brand-deep-dark focus:border-brand-red focus:ring-brand-red" 
                  placeholder="45" 
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={submitting}
                className={`self-end h-[54px] rounded-2xl font-black text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 ${editingItem ? 'bg-brand-deep-dark shadow-brand-deep-dark/20 hover:bg-slate-800' : 'bg-brand-red shadow-brand-red/20 hover:bg-brand-dark-red'}`}
              >
                {submitting ? (editingItem ? 'Updating...' : 'Adding...') : (editingItem ? 'Save Changes' : '+ Add to menu')}
              </button>
            </div>
          </form>
        </section>

        {/* Current Menu Feed */}
        <section className="rounded-[2.5rem] bg-white p-8 shadow-soft border border-[#F0E8D8] overflow-hidden flex flex-col h-[700px]">
          <h2 className="text-lg font-bold font-poppins text-brand-deep-dark uppercase tracking-wide">Current menu</h2>
          <div className="mt-8 space-y-4 overflow-y-auto pr-2 no-scrollbar flex-1">
            {loading ? (
                <p className="text-brand-charcoal text-center py-10">Loading menu...</p>
            ) : menu.length === 0 ? (
                <p className="text-brand-charcoal text-center py-10">No items available</p>
            ) : menu.map((item) => (
              <div key={item.id} className="flex items-center gap-4 rounded-3xl bg-brand-cream/50 p-4 border border-[#F0E8D8] hover:border-brand-red/30 transition-all">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E5DFD3] overflow-hidden border border-[#F0E8D8]">
                  {item.image ? (
                    <img 
                      src={item.image.startsWith('http') ? item.image : `${import.meta.env.VITE_API_URL || ''}${item.image}`} 
                      alt={item.name} 
                      className="h-full w-full object-cover" 
                    />
                  ) : (
                    <span className="text-2xl drop-shadow-sm">🍲</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-brand-deep-dark">{item.name}</p>
                    <span className="text-[8px] font-black uppercase text-brand-red border border-brand-red/20 px-1.5 py-0.5 rounded-md">{item.category}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] font-black text-brand-charcoal uppercase tracking-widest">₵{item.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEditClick(item)}
                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-brand-deep-dark/10 text-brand-deep-dark hover:bg-brand-deep-dark hover:text-white transition-all active:scale-90"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-brand-red/10 text-brand-red hover:bg-brand-red hover:text-white transition-all active:scale-90"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
