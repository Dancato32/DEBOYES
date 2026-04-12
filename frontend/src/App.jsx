import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import Login from './pages/Login'
import Signup from './pages/Signup'
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

function ProtectedRoute({ children, role }) {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
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
  const isMobileLayoutPath = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/customer' || location.pathname === '/checkout' || location.pathname === '/history' || location.pathname === '/profile' || location.pathname.startsWith('/rider') || location.pathname.startsWith('/track')
  const hideNavbar = isMobileLayoutPath

  // Block rendering until the session check resolves — prevents
  // ProtectedRoute from seeing isAuthenticated=false on cold refresh
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-[#ff5722] border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm font-medium tracking-wide">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex overflow-hidden ${isAdminPath ? 'bg-brand-cream text-brand-deep-dark font-dmsans' : ''}`}>
      {isAdminPath && <AdminSidebar />}
      
      <div className={`flex-1 flex flex-col h-screen overflow-hidden ${isAdminPath ? 'bg-brand-cream' : ''}`}>
        {!hideNavbar && <Navbar />}
        <main className={`flex-1 overflow-y-auto ${isAdminPath ? 'no-scrollbar p-10' : (!isMobileLayoutPath ? 'px-4 py-6 sm:px-6 lg:px-8' : '')}`}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
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
          </Routes>
        </main>
      </div>
      <ToastContainer position="top-right" theme="colored" />
    </div>
  )
}
