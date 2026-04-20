import axios from 'axios'

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const productionURL = 'https://deboyes-89k1.onrender.com'
const localURL = 'http://localhost:8000'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || (isLocal ? localURL : productionURL)}/api/`,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.response?.data?.detail || 'An unexpected error occurred'
    console.error('API Error:', message)
    return Promise.reject(error)
  }
)


// Auth
export const authSignup = (payload) => api.post('auth/signup/', payload)
export const authLogin = (payload) => api.post('auth/login/', payload)
export const authLogout = () => api.post('auth/logout/')
export const getCurrentUser = () => api.get('auth/me/')

// Menu & Orders
export const fetchMenu = () => api.get('menu/')
export const estimateFee = (payload) => api.post('orders/estimate-fee/', payload)
export const placeOrder = (payload) => api.post('orders/place/', payload)
export const fetchAvailableRiders = (area) => api.get('orders/riders/', { params: { area } })
export const acceptOrder = (orderId) => api.post(`orders/accept/${orderId}/`)
export const updateOrderStatus = (orderId, payload) => api.post(`orders/update/${orderId}/`, payload)
export const fetchOrderDetails = (orderId) => api.get(`orders/track/${orderId}/`)
export const fetchAssignedOrders = () => api.get('orders/assigned/')
export const fetchPendingOrders = (area) => api.get('orders/pending/', { params: { area } })
export const fetchOrderMessages = (orderId) => api.get(`orders/${orderId}/messages/`)
export const sendOrderMessage = (orderId, payload) => api.post(`orders/${orderId}/messages/send/`, payload)
export const markOrderMessagesRead = (orderId) => api.post(`orders/${orderId}/messages/read/`)
export const verifyPayment = (reference) => api.get(`orders/verify-payment/${reference}/`)

// Super Orders / Batching
export const fetchAvailableBatches = () => api.get('orders/batches/available/')
export const fetchBatchDetails = (batchId) => api.get(`orders/batches/${batchId}/`)
export const acceptBatch = (batchId) => api.post(`orders/batches/${batchId}/accept/`)
export const startBatchTrip = (batchId) => api.post(`orders/batches/${batchId}/start/`)
export const confirmBatchStop = (batchId, orderId) => api.post(`orders/batches/${batchId}/stop/${orderId}/confirm/`)

// Rider Stats
export const fetchRiderStats = () => api.get('auth/rider/stats/')

// Admin
export const fetchAdminStats = () => api.get('auth/admin/stats/')
export const fetchAdminOrders = (status) => api.get('auth/admin/orders/', { params: { status } })
export const fetchAdminRiders = () => api.get('auth/admin/riders/')
export const fetchAdminRevenue = () => api.get('auth/admin/revenue/')
export const manageAdminMenu = (formData, id) => {
  const url = id ? `auth/admin/menu/${id}/` : 'auth/admin/menu/'
  return api.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
export const fetchAdminMenu = () => api.get('auth/admin/menu/')
export const deleteMenuItem = (id) => api.delete(`auth/admin/menu/${id}/`)
export const fetchAdminCustomers = () => api.get('auth/admin/customers/')
export const toggleAvailability = (payload) => api.post('auth/availability/', payload)
export const markOrderReady = (orderId) => api.post(`auth/admin/orders/${orderId}/ready/`)
export const confirmOrder = (orderId) => api.post(`auth/admin/orders/${orderId}/confirm/`)
export const confirmPickup = (orderId) => api.post(`auth/admin/orders/${orderId}/pickup/`)
export const fetchAdminSettings = () => api.get('auth/admin/settings/')
export const updateAdminSetting = (payload) => api.post('auth/admin/settings/', payload)

export default api
