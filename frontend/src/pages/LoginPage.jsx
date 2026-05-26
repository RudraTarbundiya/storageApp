import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { motion } from 'framer-motion'
import { Cloud, Mail, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth, useAlert } from '@/context'
import { sanitizeInput } from '@/lib/utils'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login, loginWithGoogle, isAuthenticated, loading: authLoading } = useAuth()
  const { showAlert } = useAlert()

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true })
      showAlert('Welcome back', 'success')
    }
  }, [authLoading, isAuthenticated, navigate])

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const [showPassword, setShowPassword] = useState(false)

  const toggleShowPassword = () => setShowPassword(v => !v)

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const safeEmail = sanitizeInput(formData.email).trim()
      const safePassword = sanitizeInput(formData.password)
      await login(safeEmail, safePassword)
      showAlert('Signed in successfully', 'success')
      navigate('/dashboard')
    } catch (err) {
      showAlert(err.response?.data?.error || 'Login failed', 'destructive')
    } finally {
      setLoading(false)
    }
  }

  // Google OAuth login for user authentication
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true)
      await loginWithGoogle(credentialResponse.credential)
      showAlert('Signed in with Google', 'success')
      navigate('/dashboard')
    } catch (error) {
      console.error('Google login error:', error)
      showAlert(error.response?.data?.error || 'Google sign-in failed', 'destructive')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    console.error('Google login failed')
    showAlert('Google sign-in failed', 'destructive')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 mb-4"
          >
            <img src="/logo.png" alt="Storix" className="w-16 h-16 rounded-2xl shadow-lg" />
          </motion.div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-yellow-300 to-gray-600 bg-clip-text text-transparent">
            Storix
          </h1>
          <p className="text-muted-foreground mt-2">Secure file management made simple</p>
        </div>

        <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Sign In
            </CardTitle>
            <CardDescription>
              Sign in with your email and password
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={toggleShowPassword}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-2 flex items-center px-2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex-col gap-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or continue with</span>
              </div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                useOneTap
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                disabled={loading}
              />
            </div>

            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Register
              </Link>
            </p>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  )
}