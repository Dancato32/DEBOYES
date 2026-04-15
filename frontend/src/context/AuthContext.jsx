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
    getCurrentUser()
      .then((response) => {
        setUser(response.data.user)
        setIsAuthenticated(true)
      })
      .catch(() => {
        setUser(null)
        setIsAuthenticated(false)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (payload) => {
    try {
      await authLogin(payload)
      const response = await getCurrentUser()
      const userData = response.data.user
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
      await authSignup(payload)
      toast.success('Account created!')
      // Automatically log in after successful signup
      try {
        await login({ username: payload.username, password: payload.password })
      } catch (loginError) {
        // If login fails after signup, don't show "Signup failed" but prompt manual login
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
      setUser(null)
      setIsAuthenticated(false)
      toast.success('Logged out')
      navigate('/login')
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
