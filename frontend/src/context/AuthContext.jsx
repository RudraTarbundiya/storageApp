import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { userAPI, authAPI } from '@/lib/api'

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => { },
  loginWithGoogle: async () => { },
  logout: async () => { },
  refreshUser: async () => { },
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
      const response = await userAPI.getCurrentUser()
      setUser({
        name: response.data.name || 'User',
        email: response.data.email || 'user@example.com',
        picture: response.data.picture || null,
        role: response.data.role || 'user',
      })
      setIsAuthenticated(true)
      return true
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      setUser(null)
      setIsAuthenticated(false)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Check authentication on mount
  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = useCallback(async (email, password) => {
    const response = await userAPI.login(email, password)
    await fetchUser()
    return response
  }, [fetchUser])

  const loginWithGoogle = useCallback(async (credential) => {
    const response = await authAPI.googleLogin(credential)
    await fetchUser()
    return response
  }, [fetchUser])

  const logout = useCallback(async () => {
    try {
      await userAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setIsAuthenticated(false)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    return fetchUser()
  }, [fetchUser])

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    loginWithGoogle,
    logout,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
