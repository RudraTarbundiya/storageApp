import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Loader2, Mail, Lock } from 'lucide-react'
import { userAPI, authAPI } from '@/lib/api'
import { useAuth, useAlert } from '@/context'
import { sanitizeInput } from '@/lib/utils'

// Shared input style helpers
function useInputStyle() {
  const base = {
    border: '1.5px solid #8da9c4',
    color: '#0b2545',
    background: '#fff',
    fontFamily: 'Rubik, system-ui, sans-serif',
  }
  const onFocus = (e) => {
    e.target.style.border = '1.5px solid #134074'
    e.target.style.boxShadow = '0 0 0 2px rgba(19,64,116,0.10)'
  }
  const onBlur = (e) => {
    e.target.style.border = '1.5px solid #8da9c4'
    e.target.style.boxShadow = 'none'
  }
  return { base, onFocus, onBlur }
}

function StepDots({ step }) {
  return (
    <div className="flex justify-center gap-2 mt-6">
      {[1, 2].map(s => (
        <div
          key={s}
          className="w-2 h-2 rounded-full transition-all duration-300"
          style={{ background: step === s ? '#134074' : '#baccdc' }}
        />
      ))}
    </div>
  )
}

export default function RegisterPage() {
  const [step, setStep] = useState(1) // Step 1: Email & Name, Step 2: OTP & Password
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    otp: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [otpSending, setOtpSending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0) // Cooldown in seconds

  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { showAlert } = useAlert()
  const { base: inputBase, onFocus, onBlur } = useInputStyle()

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true })
      showAlert('Welcome back', 'success')
    }
  }, [authLoading, isAuthenticated, navigate])

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault()
    setOtpSending(true)

    const safeName = sanitizeInput(formData.name).trim()
    const safeEmail = sanitizeInput(formData.email).trim()

    if (!safeName) {
      showAlert('Please enter your name', 'destructive')
      setOtpSending(false)
      return
    }
    if (!safeEmail) {
      showAlert('Please enter your email', 'destructive')
      setOtpSending(false)
      return
    }

    try {
      await authAPI.sendOTP(safeEmail)
      showAlert('OTP sent to your email', 'success')
      setStep(2)
      setResendCooldown(300) // Start 5-minute cooldown (300 seconds)
    } catch (err) {
      showAlert(err.response?.data?.error || 'Failed to send OTP. Please try again.', 'destructive')
    } finally {
      setOtpSending(false)
    }
  }

  // Step 2: Register with OTP
  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)

    const safePassword = sanitizeInput(formData.password)
    const safeConfirmPassword = sanitizeInput(formData.confirmPassword)

    if (safePassword !== safeConfirmPassword) {
      showAlert('Passwords do not match', 'destructive')
      setLoading(false)
      return
    }
    if (safePassword.length < 6) {
      showAlert('Password must be at least 6 characters', 'destructive')
      setLoading(false)
      return
    }

    try {
      const safeName = sanitizeInput(formData.name).trim()
      const safeEmail = sanitizeInput(formData.email).trim()
      const safeOtp = sanitizeInput(formData.otp).trim()
      await userAPI.register({ name: safeName, email: safeEmail, otp: safeOtp, password: safePassword })
      showAlert('Registration successful. Redirecting to login...', 'success')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      showAlert(err.response?.data?.error || 'Registration failed', 'destructive')
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    setOtpSending(true)
    try {
      const safeEmail = sanitizeInput(formData.email).trim()
      await authAPI.sendOTP(safeEmail)
      showAlert('OTP resent successfully', 'success')
      setResendCooldown(300) // Reset 5-minute cooldown
    } catch (err) {
      showAlert(err.response?.data?.error || 'Failed to resend OTP', 'destructive')
    } finally {
      setOtpSending(false)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const goBack = () => {
    setStep(1)
    setFormData(prev => ({ ...prev, otp: '', password: '', confirmPassword: '' }))
  }

  const resendLabel = otpSending
    ? 'Sending...'
    : resendCooldown > 0
      ? `Resend in ${Math.floor(resendCooldown / 60)}:${(resendCooldown % 60).toString().padStart(2, '0')}`
      : 'Resend OTP'

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
          <h1 className="text-xl font-semibold mb-1" style={{ color: '#134074' }}>
            {step === 1 ? 'Create Account' : 'Verify Email'}
          </h1>
          <p className="text-sm" style={{ color: '#456685' }}>
            {step === 1 ? 'Fill in your details to get started' : `Enter the OTP sent to ${formData.email}`}
          </p>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-lg p-8"
          style={{ boxShadow: '0 4px 12px rgba(19,64,116,0.08)', border: '1px solid rgba(186,204,220,0.4)' }}
        >
          {/* Back button for step 2 */}
          {step === 2 && (
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-1.5 text-sm mb-5 transition-colors"
              style={{ color: '#456685' }}
              onMouseEnter={e => e.currentTarget.style.color = '#134074'}
              onMouseLeave={e => e.currentTarget.style.color = '#456685'}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSendOtp}
                className="space-y-5"
              >
                {/* Full Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1.5" style={{ color: '#134074' }}>
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full h-11 px-3 text-sm rounded transition-all outline-none"
                    style={inputBase}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: '#134074' }}>
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full h-11 px-3 text-sm rounded transition-all outline-none"
                    style={inputBase}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>

                {/* Send OTP button */}
                <button
                  type="submit"
                  disabled={otpSending}
                  className="w-full h-11 rounded text-sm font-medium text-white flex items-center justify-center gap-2 transition-all"
                  style={{ background: otpSending ? '#456685' : '#134074', cursor: otpSending ? 'not-allowed' : 'pointer' }}
                  onMouseEnter={e => { if (!otpSending) e.currentTarget.style.background = '#0d2f56' }}
                  onMouseLeave={e => { if (!otpSending) e.currentTarget.style.background = '#134074' }}
                >
                  {otpSending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending OTP...</>
                  ) : (
                    <><Mail className="w-4 h-4" /> Send OTP</>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleRegister}
                className="space-y-5"
              >
                {/* OTP */}
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium mb-1.5" style={{ color: '#134074' }}>
                    OTP Code
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    placeholder="- - - -"
                    value={formData.otp}
                    onChange={handleChange}
                    required
                    maxLength={4}
                    className="w-full h-11 px-3 text-center text-lg tracking-[0.5em] rounded transition-all outline-none"
                    style={{ ...inputBase, fontFamily: 'JetBrains Mono, Roboto Mono, monospace' }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                  <div className="flex justify-end mt-1">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={otpSending || resendCooldown > 0}
                      className="text-xs font-mono transition-colors"
                      style={{
                        color: otpSending || resendCooldown > 0 ? '#8da9c4' : '#134074',
                        cursor: otpSending || resendCooldown > 0 ? 'not-allowed' : 'pointer',
                        textDecoration: resendCooldown === 0 && !otpSending ? 'underline' : 'none',
                      }}
                    >
                      {resendLabel}
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: '#134074' }}>
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a password (min. 6 chars)"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="w-full h-11 px-3 text-sm rounded transition-all outline-none"
                    style={inputBase}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5" style={{ color: '#134074' }}>
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="w-full h-11 px-3 text-sm rounded transition-all outline-none"
                    style={inputBase}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>

                {/* Create Account button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded text-sm font-medium text-white flex items-center justify-center gap-2 transition-all"
                  style={{ background: loading ? '#456685' : '#134074', cursor: loading ? 'not-allowed' : 'pointer' }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#0d2f56' }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#134074' }}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</>
                  ) : (
                    <><Lock className="w-4 h-4" /> Create Account</>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Sign in link */}
          <p className="text-center text-sm mt-5" style={{ color: '#456685' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-medium hover:underline" style={{ color: '#134074' }}>
              Sign In
            </Link>
          </p>
        </div>

        {/* Step dots */}
        <StepDots step={step} />

        {/* Legal */}
        <p className="text-center text-xs mt-5 font-mono" style={{ color: '#8da9c4' }}>
          By registering, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  )
}