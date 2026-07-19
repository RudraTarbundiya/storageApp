import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { motion } from 'framer-motion'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth, useAlert } from '@/context'
import { sanitizeInput } from '@/lib/utils'

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
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
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#eef4ed', fontFamily: 'Rubik, system-ui, sans-serif' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[440px]"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center gap-2 mb-3"
          >
            <img
              src="/logo.png"
              alt="Storix"
              className="w-9 h-9 rounded-lg shadow-sm"
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <span className="text-2xl font-semibold" style={{ color: '#134074' }}>Storix</span>
          </motion.div>
          <h1 className="text-xl font-semibold mb-1" style={{ color: '#134074' }}>Welcome back</h1>
          <p className="text-sm" style={{ color: '#456685' }}>Sign in to your account</p>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-lg p-8"
          style={{ boxShadow: '0 4px 12px rgba(19,64,116,0.08)', border: '1px solid rgba(186,204,220,0.4)' }}
        >
          <form onSubmit={handleEmailLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
                style={{ color: '#134074' }}
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full h-11 px-3 text-sm rounded transition-all outline-none"
                style={{
                  border: '1.5px solid #8da9c4',
                  color: '#0b2545',
                  background: '#fff',
                  fontFamily: 'inherit',
                }}
                onFocus={e => { e.target.style.border = '1.5px solid #134074'; e.target.style.boxShadow = '0 0 0 2px rgba(19,64,116,0.10)' }}
                onBlur={e => { e.target.style.border = '1.5px solid #8da9c4'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
                style={{ color: '#134074' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full h-11 px-3 pr-10 text-sm rounded transition-all outline-none"
                  style={{
                    border: '1.5px solid #8da9c4',
                    color: '#0b2545',
                    background: '#fff',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => { e.target.style.border = '1.5px solid #134074'; e.target.style.boxShadow = '0 0 0 2px rgba(19,64,116,0.10)' }}
                  onBlur={e => { e.target.style.border = '1.5px solid #8da9c4'; e.target.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-3 flex items-center transition-colors"
                  style={{ color: '#8da9c4' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#134074'}
                  onMouseLeave={e => e.currentTarget.style.color = '#8da9c4'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded text-sm font-medium text-white flex items-center justify-center gap-2 transition-all"
              style={{
                background: loading ? '#456685' : '#134074',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#0d2f56' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#134074' }}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" style={{ borderColor: '#baccdc' }} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white font-mono uppercase tracking-widest" style={{ color: '#8da9c4' }}>
                or continue with
              </span>
            </div>
          </div>

          {/* Google */}
          <div className="flex justify-center">
            <GoogleLogin
              useOneTap
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              disabled={loading}
            />
          </div>

          {/* Footer link */}
          <p className="text-center text-sm mt-5" style={{ color: '#456685' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-medium hover:underline" style={{ color: '#134074' }}>
              Register
            </Link>
          </p>
        </div>

        {/* Legal */}
        <p className="text-center text-xs mt-5 font-mono" style={{ color: '#8da9c4' }}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  )
}