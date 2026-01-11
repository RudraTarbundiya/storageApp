"use client"

import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { GoogleLogin, googleLogout } from '@react-oauth/google'
import { useAuth } from "../../context/AuthContext"
import ThemeToggle from "../ThemeToggle"

export default function RegisterPage() {
  const [step, setStep] = useState("email") // 'email', 'details'
  const [email, setEmail] = useState("rudra@gmail.com")
  const [name, setName] = useState("Rudra Tarbundiya")
  const [password, setPassword] = useState("sjnipj9isjb")
  const [confirmPassword, setConfirmPassword] = useState("sjnipj9isjb")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [canResend, setCanResend] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const navigate = useNavigate()
  const { sendOtp, register , googleLogin } = useAuth()

  useEffect(() => {
    // Check if there's a stored OTP timestamp
    const storedTimestamp = localStorage.getItem('otpSentTimestamp')
    if (storedTimestamp) {
      const elapsed = Date.now() - parseInt(storedTimestamp)
      const remaining = Math.max(0, 300000 - elapsed) // 5 minutes in ms
      
      if (remaining > 0) {
        setTimeLeft(Math.ceil(remaining / 1000))
        setCanResend(false)
      } else {
        setCanResend(true)
        setTimeLeft(0)
      }
    } else {
      setCanResend(true)
    }
  }, [])

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [timeLeft])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await sendOtp(email)
      const timestamp = Date.now()
      localStorage.setItem('otpSentTimestamp', timestamp.toString())
      setTimeLeft(300) // 5 minutes
      setCanResend(false)
      setStep("details")
    } catch (err) {
      setError(err.message || "Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setError("")
    setResendLoading(true)
    setResendSuccess(false)

    try {
      await sendOtp(email)
      const timestamp = Date.now()
      localStorage.setItem('otpSentTimestamp', timestamp.toString())
      setTimeLeft(300) // 5 minutes
      setCanResend(false)
      setResendSuccess(true)
      setTimeout(() => setResendSuccess(false), 3000)
    } catch (err) {
      setError(err.message || "Failed to resend OTP")
    } finally {
      setResendLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      await register(name, email, password, otp)
      navigate("/login")
    } catch (err) {
      setError(err.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-surface border border-border rounded-lg p-8">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-text-primary mb-2">Drive</h1>
              <p className="text-text-secondary">Create your account</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-error/10 border border-error rounded-lg">
                <p className="text-error text-sm">{error}</p>
              </div>
            )}

            {step === "email" && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-2 px-4 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </form>
            )}

            {step === "email" && (
              <>
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-sm text-text-secondary">OR</span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>

                <div className="mt-6 flex justify-center">
                  <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                      console.log(credentialResponse);
                      await googleLogin(credentialResponse)
                    }}
                    onError={() => {
                      console.log('Login Failed');
                    }}
                    useOneTap
                  />
                </div>
              </>
            )}

            {step === "details" && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="p-4 bg-background border border-border rounded-lg">
                  <p className="text-sm text-text-secondary">Enter the OTP sent to <span className="font-medium text-text-primary">{email}</span> and create your password.</p>
                </div>

                {resendSuccess && (
                  <div className="p-3 bg-success/10 border border-success rounded-lg">
                    <p className="text-success text-sm">OTP sent successfully!</p>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-text-primary">OTP</label>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={!canResend || resendLoading}
                      className="text-sm text-primary hover:text-primary-hover font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendLoading ? "Sending..." : canResend ? "Resend OTP" : `Resend in ${formatTime(timeLeft)}`}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary text-center text-lg tracking-widest"
                    placeholder="0000"
                    maxLength="4"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="John Doe"
                    minLength="3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-2 px-4 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-text-secondary">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:text-primary-hover font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
