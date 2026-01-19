import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AuthProvider, AlertProvider } from '@/context'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import GoogleDrivePage from '@/pages/GoogleDrivePage'
import UsersPage from '@/pages/UsersPage'
import ProfilePage from '@/pages/ProfilePage'
import AuthCallbackPage from '@/pages/AuthCallbackPage'
import LandingPage from '@/pages/LandingPage'
import PublicSharePage from '@/pages/PublicSharePage'
import SharedWithMePage from '@/pages/SharedWithMePage'
import SharedByMePage from '@/pages/SharedByMePage'
import AppLayout from '@/components/Layout/AppLayout'

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <AuthProvider>
        <AlertProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />

              {/* Public share routes - accessible without login */}
              <Route path="/share/:type/:id" element={<PublicSharePage />} />

              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/files" element={<DashboardPage />} />
                <Route path="/shared-with-me" element={<SharedWithMePage />} />
                <Route path="/shared-by-me" element={<SharedByMePage />} />
                <Route path="/google-drive" element={<GoogleDrivePage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AlertProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App