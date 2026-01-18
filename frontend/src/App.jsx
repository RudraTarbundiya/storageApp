import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AuthProvider, AlertProvider } from '@/context'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import GoogleDrivePage from '@/pages/GoogleDrivePage'
import AuthCallbackPage from '@/pages/AuthCallbackPage'
import LandingPage from '@/pages/LandingPage'
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

              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/files" element={<DashboardPage />} />
                <Route path="/google-drive" element={<GoogleDrivePage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AlertProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App