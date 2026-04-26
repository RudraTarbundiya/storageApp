import { Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import AppSidebar from './AppSidebar'
import Header from './Header'
import { useAuth, FileManagerProvider } from '@/context'

export default function AppLayout() {
  const navigate = useNavigate()
  const { user, isAuthenticated, loading } = useAuth()

  useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [loading, isAuthenticated, navigate])

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
    <FileManagerProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-linear-to-br from-background via-background to-muted/60">
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Header user={user} loading={loading} />
            <main className="flex-1 overflow-auto px-1 pb-2 sm:px-2 sm:pb-3">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </FileManagerProvider>
  )
}