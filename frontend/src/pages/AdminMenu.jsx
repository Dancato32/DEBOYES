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
      image: null
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

  const categories = Array.from(new Set(menu.map(i => i.category)))
  
  useEffect(() => {
    if (!loading && categories.length === 0 && !isCustomCategory) {
      setIsCustomCategory(true)
    }
  }, [loading, categories.length, isCustomCategory])

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto px-4 sm:px-6">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight font-inter">Menu Items</h1>
        <p className="mt-1 text-slate-500 text-sm">Add, edit, or remove items customers can order.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        {/* Form Section */}
        <section className="rounded-lg bg-white border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">
                {editingItem ? 'Edit Item' : 'Add New Item'}
            </h2>
            {editingItem && (
               <button 
                 onClick={resetForm}
                 className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                 Cancel Edit
               </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Item Photo</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="mt-1 flex justify-center rounded-md border-2 border-dashed border-slate-300 px-6 pt-5 pb-6 hover:border-brand-red transition-colors cursor-pointer group relative overflow-hidden"
              >
                {imagePreview ? (
                   <>
                     <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-sm font-medium text-white">Change Photo</span>
                     </div>
                   </>
                ) : (
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-slate-600 justify-center">
                      <span className="relative cursor-pointer rounded-md font-medium text-brand-red focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-red focus-within:ring-offset-2 hover:text-brand-dark-red">
                        Upload a file
                      </span>
                    </div>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  className="sr-only" 
                  accept="image/*"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Item Name</label>
                <input 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="block w-full rounded-md border border-slate-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm px-4 py-2" 
                  placeholder="e.g. Extra Spicy Wings" 
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700">Category</label>
                    <button 
                        type="button"
                        onClick={() => setIsCustomCategory(!isCustomCategory)}
                        className="text-xs font-medium text-brand-red hover:text-brand-dark-red"
                    >
                        {isCustomCategory ? 'Select Existing' : '+ Add Custom'}
                    </button>
                </div>
                {isCustomCategory ? (
                   <input 
                     value={formData.category}
                     onChange={(e) => setFormData({...formData, category: e.target.value})}
                     className="block w-full rounded-md border border-slate-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm px-4 py-2"
                     placeholder="Type new category..."
                     autoFocus
                   />
                ) : (
                    <select 
                       value={formData.category}
                       onChange={(e) => setFormData({...formData, category: e.target.value})}
                       className="block w-full rounded-md border border-slate-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm px-4 py-2"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
                className="block w-full rounded-md border border-slate-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm px-4 py-2 resize-none" 
                placeholder="Describe the ingredients and preparation..."
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2 items-end">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Price (₵)</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-slate-500 sm:text-sm">₵</span>
                  </div>
                  <input 
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="block w-full rounded-md border border-slate-300 pl-8 focus:border-brand-red focus:ring-brand-red sm:text-sm px-4 py-2" 
                    placeholder="0.00" 
                    required
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={submitting}
                className="flex w-full justify-center rounded-md border border-transparent bg-slate-900 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 h-[38px]"
              >
                {submitting ? (editingItem ? 'Updating...' : 'Adding...') : (editingItem ? 'Save Changes' : 'Add to Menu')}
              </button>
            </div>
          </form>
        </section>

        {/* Current Menu Feed */}
        <section className="rounded-lg bg-white border border-slate-200 flex flex-col h-[700px]">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">Current Menu</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <ul className="divide-y divide-slate-200">
              {loading ? (
                  <li className="p-6 text-center text-sm text-slate-500">Loading menu...</li>
              ) : menu.length === 0 ? (
                  <li className="p-6 text-center text-sm text-slate-500">No items available.</li>
              ) : menu.map((item) => (
                <li key={item.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 flex-shrink-0 rounded bg-slate-100 overflow-hidden border border-slate-200">
                      {item.image ? (
                        <img 
                          src={item.image.startsWith('http') ? item.image : `${import.meta.env.VITE_API_URL || ''}${item.image}`} 
                          alt={item.name} 
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xl">🍲</div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {item.category}
                        </span>
                        <span className="text-xs text-slate-500">₵{item.price}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEditClick(item)}
                      className="text-slate-400 hover:text-slate-900 transition-colors"
                      title="Edit"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="text-slate-400 hover:text-brand-red transition-colors"
                      title="Delete"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
