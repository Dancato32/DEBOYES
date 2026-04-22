import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'
import CustomerDashboard from './pages/CustomerDashboard'
import RiderDashboard from './pages/RiderDashboard'
import TrackOrder from './pages/TrackOrder'
import Checkout from './pages/Checkout'
import Navbar from './components/Navbar'
import { useAuth } from './context/AuthContext'
import 'react-toastify/dist/ReactToastify.css'
import History from './pages/History'
import Profile from './pages/Profile'
import RiderAlerts from './pages/RiderAlerts'
import RiderBatchDetails from './pages/RiderBatchDetails'
import RiderActiveTrip from './pages/RiderActiveTrip'
import PaymentSuccess from './pages/PaymentSuccess'

function ProtectedRoute({ children, role }) {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  if (role && user?.user_type !== role) {
    return <Navigate to="/" replace />
  }

  return children
}

import AdminDashboard from './pages/AdminDashboard'
import AdminOrders from './pages/AdminOrders'
import AdminCustomers from './pages/AdminCustomers'
import AdminRiders from './pages/AdminRiders'
import AdminMenu from './pages/AdminMenu'
import AdminRevenue from './pages/AdminRevenue'
import AdminSidebar from './components/AdminSidebar'

export default function App() {
  const location = useLocation()
  const { user, loading } = useAuth()
  
  const isAdminPath = location.pathname.startsWith('/admin')
  const isMobileLayoutPath = location.pathname === '/' || location.pathname === '/customer' || location.pathname === '/checkout' || location.pathname === '/history' || location.pathname === '/profile' || location.pathname.startsWith('/rider') || location.pathname.startsWith('/track') || location.pathname.startsWith('/payment')
  const hideNavbar = isMobileLayoutPath

  // Block rendering until the session check resolves — prevents
  // ProtectedRoute from seeing isAuthenticated=false on cold refresh
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-red">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <img
              src="/logo.png"
              alt="De Boye's"
              className="h-28 w-28 object-contain animate-pulse drop-shadow-2xl"
            />
            <div className="absolute inset-0 rounded-full bg-white/10 blur-2xl animate-pulse" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-pacifico text-white lowercase text-3xl tracking-tight">De Boye's</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 font-inter">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex overflow-hidden ${isAdminPath ? 'bg-brand-cream text-brand-deep-dark font-inter' : ''}`}>
      {isAdminPath && <AdminSidebar />}
      
      <div className={`flex-1 flex flex-col h-screen overflow-hidden ${isAdminPath ? 'bg-brand-cream' : ''}`}>
        {!hideNavbar && <Navbar />}
        <main className={`flex-1 overflow-y-auto ${isAdminPath ? 'no-scrollbar p-10' : (!isMobileLayoutPath ? 'px-4 py-6 sm:px-6 lg:px-8' : '')}`}>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route
              path="/customer"
              element={
                <ProtectedRoute role="customer">
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute role="customer">
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rider"
              element={
                <ProtectedRoute role="rider">
                  <RiderDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rider/alerts"
              element={
                <ProtectedRoute role="rider">
                  <RiderAlerts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rider/batch/:id"
              element={
                <ProtectedRoute role="rider">
                  <RiderBatchDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rider/active"
              element={
                <ProtectedRoute role="rider">
                  <RiderActiveTrip />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute role="admin">
                  <AdminOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/customers"
              element={
                <ProtectedRoute role="admin">
                  <AdminCustomers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/riders"
              element={
                <ProtectedRoute role="admin">
                  <AdminRiders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/menu"
              element={
                <ProtectedRoute role="admin">
                  <AdminMenu />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/revenue"
              element={
                <ProtectedRoute role="admin">
                  <AdminRevenue />
                </ProtectedRoute>
              }
            />
            <Route
              path="/track/:orderId"
              element={
                <ProtectedRoute>
                  <TrackOrder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment/success"
              element={
                <ProtectedRoute>
                  <PaymentSuccess />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
      <ToastContainer position="top-right" theme="colored" />
    </div>
  )
}
