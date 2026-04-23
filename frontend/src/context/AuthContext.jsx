import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestOTP, verifyOTP, googleLogin, completeProfile, authPasswordLogin, authLogout, getCurrentUser } from '../services/api'
import { toast } from 'react-toastify'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // On mount, verify the stored token by fetching the current user
    const token = localStorage.getItem('authToken')
    if (!token) {
      setLoading(false)
      return
    }
    getCurrentUser()
      .then((response) => {
        setUser(response.data.user)
        setIsAuthenticated(true)
      })
      .catch(() => {
        // Token is invalid or expired — clear it
        localStorage.removeItem('authToken')
        setUser(null)
        setIsAuthenticated(false)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (identifier, code) => {
    // identifier can be { phone } or { email }
    try {
      const response = await verifyOTP({ ...identifier, code })
      const { status, token, user: userData, email, phone } = response.data

      if (status === 'partial') {
        return { status: 'partial', phone, email }
      }

      localStorage.setItem('authToken', token)
      setUser(userData)
      setIsAuthenticated(true)
      toast.success(`Welcome back, ${userData.username}!`)
      
      handleRedirect(userData)
      return { status: 'success' }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Verification failed')
      throw error
    }
  }

  const loginWithGoogle = async (idToken) => {
    try {
      const response = await googleLogin(idToken)
      const { status, token, user: userData, email, suggested_username } = response.data

      if (status === 'partial') {
        return { status: 'partial', email, suggested_username }
      }

      localStorage.setItem('authToken', token)
      setUser(userData)
      setIsAuthenticated(true)
      toast.success(`Welcome, ${userData.username}!`)
      
      handleRedirect(userData)
      return { status: 'success' }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Google login failed')
      throw error
    }
  }

  const loginWithPassword = async (username, password) => {
    try {
      const response = await authPasswordLogin({ username, password })
      const { token, user: userData } = response.data
      
      localStorage.setItem('authToken', token)
      setUser(userData)
      setIsAuthenticated(true)
      toast.success(`Welcome back, ${userData.username}!`)
      
      handleRedirect(userData)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid credentials')
      throw error
    }
  }

  const signup = async (payload) => {
    try {
      const response = await completeProfile(payload)
      const { token, user: userData } = response.data
      
      localStorage.setItem('authToken', token)
      setUser(userData)
      setIsAuthenticated(true)
      toast.success('Profile completed!')
      
      handleRedirect(userData)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Profile setup failed')
      throw error
    }
  }

  const handleRedirect = (userData) => {
    if (userData.user_type === 'admin') {
      navigate('/admin')
    } else if (userData.user_type === 'rider') {
      navigate('/rider')
    } else {
      navigate('/customer')
    }
  }

  const sendCode = async (identifier) => {
    // identifier can be { phone } or { email }
    try {
      await requestOTP(identifier)
      toast.info('Verification code sent!')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send code')
      throw error
    }
  }

  const logout = async () => {
    try {
      await authLogout()
    } catch (_) { /* ignore */ }
    localStorage.removeItem('authToken')
    setUser(null)
    setIsAuthenticated(false)
    toast.success('Logged out')
    navigate('/')
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, loginWithGoogle, loginWithPassword, signup, logout, sendCode }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
