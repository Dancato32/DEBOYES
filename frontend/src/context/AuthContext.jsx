import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authLogin, authLogout, authSignup, getCurrentUser } from '../services/api'
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

  const login = async (payload) => {
    try {
      const response = await authLogin(payload)
      const { token } = response.data
      // Store the JWT so every future request carries it
      localStorage.setItem('authToken', token)

      const meResponse = await getCurrentUser()
      const userData = meResponse.data.user
      setUser(userData)
      setIsAuthenticated(true)
      toast.success(`Welcome back, ${userData.username}!`)

      // Role-based redirection
      if (userData.user_type === 'admin') {
        navigate('/admin')
      } else if (userData.user_type === 'rider') {
        navigate('/rider')
      } else {
        navigate('/customer')
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid login credentials')
      throw error
    }
  }

  const signup = async (payload) => {
    try {
      const response = await authSignup(payload)
      const { token } = response.data
      if (token) {
        localStorage.setItem('authToken', token)
      }
      toast.success('Account created!')
      try {
        await login({ username: payload.username, password: payload.password })
      } catch (loginError) {
        console.error('Auto-login failed after signup:', loginError)
        toast.info('Please sign in manually with your new account.')
        navigate('/login')
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Signup failed')
      throw error
    }
  }

  const logout = async () => {
    try {
      await authLogout()
    } catch (_) { /* best effort */ }
    localStorage.removeItem('authToken')
    setUser(null)
    setIsAuthenticated(false)
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
