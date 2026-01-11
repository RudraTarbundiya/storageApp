import { Routes, Route, Navigate } from "react-router-dom"
import { GoogleOAuthProvider } from '@react-oauth/google'
import LoginPage from "./components/pages/LoginPage"
import RegisterPage from "./components/pages/RegisterPage"
import DashboardPage from "./components/pages/DashboardPage"
import ProtectedRoute from "./components/ProtectedRoute"

export default function App() {
  return (
    <GoogleOAuthProvider clientId='63206782506-clugu9nar16huil5fcvg51e70fpd9m9v.apps.googleusercontent.com'>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </GoogleOAuthProvider>
  )
}
