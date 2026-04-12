import { useMemo, useState } from 'react'
import { useCart } from '../context/CartContext'
import { fetchAvailableRiders, placeOrder } from '../services/api'
import { toast } from 'react-toastify'

export default function Cart({ area }) {
  const { cartItems, total, updateQty, removeItem, clearCart } = useCart()
  const [address, setAddress] = useState('')
  const [selectedRider, setSelectedRider] = useState('')
  const [riders, setRiders] = useState([])
  const [loadingRiders, setLoadingRiders] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const cartPayload = useMemo(
    () => cartItems.map((item) => ({ food_id: item.food_id, qty: item.qty })),
    [cartItems]
  )

  const loadRiders = async () => {
    setLoadingRiders(true)
    try {
      const response = await fetchAvailableRiders(area)
      setRiders(response.data.riders)
    } catch (error) {
      toast.error('Unable to fetch riders')
    } finally {
      setLoadingRiders(false)
    }
  }

  const handleSubmit = async () => {
    if (!address || !area || cartItems.length === 0) {
      toast.error('Add items, address and area before placing an order')
      return
    }

    setSubmitting(true)
    try {
      await placeOrder({
        address,
        area,
        total_price: total,
        items: cartPayload,
        rider_id: selectedRider || undefined
      })
      toast.success('Order placed successfully')
      clearCart()
      setAddress('')
      setSelectedRider('')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Order placement failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <aside className="space-y-5 rounded-3xl bg-white p-6 shadow-soft">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Your cart</h2>
        <p className="text-sm text-slate-500">Review your order and place delivery.</p>
      </div>
      <div className="space-y-4">
        {cartItems.length === 0 ? (
          <p className="text-sm text-slate-500">Your cart is empty.</p>
        ) : (
          cartItems.map((item) => (
            <div key={item.food_id} className="rounded-3xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{item.name}</h3>
                  <p className="text-sm text-slate-500">${item.price} × {item.qty}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(item.food_id, item.qty - 1)}
                    className="rounded-full bg-slate-100 px-3 py-1 text-sm"
                  >
                    -
                  </button>
                  <span className="min-w-[1.5rem] text-center text-sm font-semibold">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.food_id, item.qty + 1)}
                    className="rounded-full bg-slate-100 px-3 py-1 text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                onClick={() => removeItem(item.food_id)}
                className="mt-3 text-sm text-rose-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Delivery address</label>
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="123 Main Street"
            className="mt-2 w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Area</label>
          <input
            value={area}
            readOnly
            className="mt-2 w-full bg-slate-100"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-900">Rider options</h3>
            <button
              onClick={loadRiders}
              className="text-sm font-semibold text-slate-900 hover:text-slate-700"
            >
              Refresh
            </button>
          </div>
          {loadingRiders ? (
            <p className="text-sm text-slate-500">Loading riders…</p>
          ) : riders.length === 0 ? (
            <p className="text-sm text-slate-500">No available riders in this area.</p>
          ) : (
            <select
              value={selectedRider}
              onChange={(event) => setSelectedRider(event.target.value)}
              className="w-full"
            >
              <option value="">Auto-assign nearest rider</option>
              {riders.map((rider) => (
                <option key={rider.id} value={rider.id}>{rider.username}</option>
              ))}
            </select>
          )}
        </div>
        <div className="rounded-3xl border border-slate-200 p-4 bg-slate-50">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || cartItems.length === 0}
            className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Placing order…' : 'Place order'}
          </button>
        </div>
      </div>
    </aside>
  )
}
