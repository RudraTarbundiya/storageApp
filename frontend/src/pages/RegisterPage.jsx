import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, KeyRound, Lock, ArrowLeft, Loader2, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
// role selection removed - only user registration allowed
import { userAPI, authAPI } from '@/lib/api'
import { useAuth, useAlert } from '@/context'
import { sanitizeInput } from '@/lib/utils'

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
      const registrationData = {
        name: safeName,
        email: safeEmail,
        otp: safeOtp,
        password: safePassword
      }
      await userAPI.register(registrationData)
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
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }


  const goBack = () => {
    setStep(1)
    setFormData(prev => ({ ...prev, otp: '', password: '', confirmPassword: '' }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
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
          <h1 className="text-3xl font-bold bg-linear-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent">
            Join Storix
          </h1>
          <p className="text-muted-foreground mt-2">Create your account and start organizing</p>
        </div>

        <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {step === 2 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 mr-1"
                  onClick={goBack}
                  type="button"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              {step === 1 ? (
                <>
                  <User className="w-5 h-5" />
                  Create Account
                </>
              ) : (
                <>
                  <KeyRound className="w-5 h-5" />
                  Verify Email
                </>
              )}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? 'Fill in your details to get started'
                : `Enter the OTP sent to ${formData.email}`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSendOtp}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="enter your name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="h-11"
                    />
                  </div>

                  <Button type="submit" className="w-full h-11" disabled={otpSending}>
                    {otpSending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Send OTP
                      </>
                    )}
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleRegister}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="otp">OTP Code</Label>
                    <Input
                      id="otp"
                      name="otp"
                      type="text"
                      placeholder="Enter 4-digit OTP"
                      value={formData.otp}
                      onChange={handleChange}
                      required
                      className="h-11 text-center tracking-widest text-lg font-mono"
                      maxLength={4}
                    />
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="text-xs p-0 h-auto"
                        onClick={handleResendOtp}
                        disabled={otpSending || resendCooldown > 0}
                      >
                        {otpSending
                          ? 'Sending...'
                          : resendCooldown > 0
                            ? `Resend OTP in ${Math.floor(resendCooldown / 60)}:${(resendCooldown % 60).toString().padStart(2, '0')}`
                            : 'Resend OTP'}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="h-11"
                      minLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="h-11"
                      minLength={6}
                    />
                  </div>

                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Create Account
                      </>
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="flex-col gap-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mt-6">
          <div className={`w-2 h-2 rounded-full transition-colors ${step === 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`w-2 h-2 rounded-full transition-colors ${step === 2 ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          By registering, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  )
}