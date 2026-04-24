import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authSignupPassword, authPasswordLogin, googleLogin, authLogout, getCurrentUser } from '../services/api'
import { toast } from '../utils/soundToast'

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

  const login = async (usernameOrEmail, password) => {
    try {
      const response = await authPasswordLogin({ username: usernameOrEmail, password })
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



  const signup = async (payload) => {
    try {
      const response = await authSignupPassword(payload)
      const { token, user: userData } = response.data
      
      localStorage.setItem('authToken', token)
      setUser(userData)
      setIsAuthenticated(true)
      toast.success('Account created successfully!')
      
      handleRedirect(userData)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Signup failed')
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
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, loginWithGoogle, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
