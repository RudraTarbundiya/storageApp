import { Outlet, useNavigate } from 'react-router-dom'
import { SidebarProvider } from '@/components/ui/sidebar'
import AppSidebar from './AppSidebar'
import Header from './Header'
import { useState, useEffect } from 'react'
import { userAPI } from '@/lib/api'

export default function AppLayout() {
  const navigate = useNavigate()
  const [user, setUser] = useState({ name: 'User', email: 'Loading...', picture: null })
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await userAPI.getCurrentUser()
        setUser({
          name: response.data.name || 'User',
          email: response.data.email || 'user@example.com',
          picture: response.data.picture || null,
        })
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
        // Redirect to login if not authenticated
        if (error.response?.status === 401 || error.response?.status === 403) {
          navigate('/login', { replace: true })
          return
        }
        // For other errors, also redirect to login
        navigate('/login', { replace: true })
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [navigate])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header user={user} loading={loading} />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}