import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Camera, Loader2, Check, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { authAPI, userAPI } from '@/lib/api'
import { useAuth, useAlert } from '@/context'

export default function ProfilePage() {
    const { user, refreshUser } = useAuth()
    const { showAlert } = useAlert()

    const [loading, setLoading] = useState(false)
    const [otpDialogOpen, setOtpDialogOpen] = useState(false)
    const [otpLoading, setOtpLoading] = useState(false)
    const [verifying, setVerifying] = useState(false)

    const [otp, setOtp] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [pictureUrl, setPictureUrl] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [resendCooldown, setResendCooldown] = useState(0)
    const cooldownTimerRef = useRef(null)

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (cooldownTimerRef.current) {
                clearInterval(cooldownTimerRef.current)
            }
        }
    }, [])

    const startCooldownTimer = () => {
        setResendCooldown(300) // 5 minutes = 300 seconds
        if (cooldownTimerRef.current) {
            clearInterval(cooldownTimerRef.current)
        }
        cooldownTimerRef.current = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(cooldownTimerRef.current)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }

    const formatCooldown = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleUpdateClick = async () => {
        // Validate inputs
        if (!newPassword && !pictureUrl) {
            showAlert('Please enter a new password or picture URL', 'destructive')
            return
        }

        if (newPassword && newPassword !== confirmPassword) {
            showAlert('Passwords do not match', 'destructive')
            return
        }

        if (newPassword && newPassword.length < 6) {
            showAlert('Password must be at least 6 characters', 'destructive')
            return
        }

        // Send OTP
        setLoading(true)
        try {
            await authAPI.sendOTP(user.email)
            setOtpDialogOpen(true)
            startCooldownTimer()
            showAlert('OTP sent to your email', 'default')
        } catch (err) {
            showAlert(err.response?.data?.error || 'Failed to send OTP', 'destructive')
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyAndUpdate = async () => {
        if (!otp) {
            showAlert('Please enter the OTP', 'destructive')
            return
        }

        setVerifying(true)
        try {
            const data = { otp }
            if (newPassword) data.newPassword = newPassword
            if (pictureUrl) data.picture = pictureUrl

            await userAPI.updateProfile(data)
            showAlert('Profile updated successfully', 'default')
            await refreshUser()

            // Reset form and close dialog
            setOtpDialogOpen(false)
            setOtp('')
            setNewPassword('')
            setConfirmPassword('')
            setPictureUrl('')
        } catch (err) {
            showAlert(err.response?.data?.error || 'Failed to update profile', 'destructive')
        } finally {
            setVerifying(false)
        }
    }

    const handleResendOtp = async () => {
        setOtpLoading(true)
        try {
            await authAPI.sendOTP(user.email)
            startCooldownTimer()
            showAlert('OTP resent to your email', 'default')
        } catch (err) {
            showAlert(err.response?.data?.error || 'Failed to resend OTP', 'destructive')
        } finally {
            setOtpLoading(false)
        }
    }

    const handleDialogClose = () => {
        setOtpDialogOpen(false)
        setOtp('')
    }

    const hasChanges = newPassword || pictureUrl
    const passwordsMatch = !newPassword || newPassword === confirmPassword

    return (
        <>
            <div className="p-6 max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    {user?.picture && (
                                        <AvatarImage src={user.picture} alt={user?.name} referrerPolicy="no-referrer" />
                                    )}
                                    <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-white text-xl">
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        {user?.name}
                                        <Badge variant="outline" className="capitalize">{user?.role}</Badge>
                                    </CardTitle>
                                    <CardDescription>{user?.email}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Current Info (Read-only) */}
                            <div className="space-y-3">
                                <h3 className="font-medium">Account Information</h3>
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                    <User className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Name</p>
                                        <p className="font-medium">{user?.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                    <Mail className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Email</p>
                                        <p className="font-medium">{user?.email}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    * Name and email cannot be changed
                                </p>
                            </div>

                            {/* Editable Fields */}
                            <div className="border-t pt-6 space-y-4">
                                <h3 className="font-medium">Update Profile</h3>

                                <div className="space-y-2">
                                    <Label htmlFor="picture">Profile Picture URL</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="picture"
                                            type="url"
                                            placeholder="https://example.com/avatar.jpg"
                                            value={pictureUrl}
                                            onChange={(e) => setPictureUrl(e.target.value)}
                                        />
                                        {pictureUrl && (
                                            <Avatar className="h-10 w-10 shrink-0">
                                                <AvatarImage src={pictureUrl} alt="Preview" />
                                                <AvatarFallback><Camera className="w-4 h-4" /></AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="newPassword"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter new password (min 6 characters)"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            minLength={6}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {newPassword && (
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="confirmPassword"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                placeholder="Confirm new password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        {!passwordsMatch && confirmPassword && (
                                            <p className="text-sm text-red-500">Passwords do not match</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={handleUpdateClick}
                                disabled={loading || !hasChanges || !passwordsMatch}
                                className="w-full"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Sending OTP...
                                    </>
                                ) : (
                                    'Update Profile'
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* OTP Verification Dialog */}
            <Dialog open={otpDialogOpen} onOpenChange={(open) => !open && handleDialogClose()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-primary" />
                            Verify Your Identity
                        </DialogTitle>
                        <DialogDescription>
                            We've sent a verification code to <strong>{user?.email}</strong>.
                            Enter it below to confirm your profile update.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="otp">Verification Code</Label>
                            <Input
                                id="otp"
                                type="text"
                                placeholder="Enter 4-digit OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={4}
                                className="text-center text-lg tracking-widest"
                            />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Didn't receive the code?</span>
                            {resendCooldown > 0 ? (
                                <span className="text-muted-foreground">
                                    Resend in {formatCooldown(resendCooldown)}
                                </span>
                            ) : (
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={handleResendOtp}
                                    disabled={otpLoading}
                                    className="p-0 h-auto"
                                >
                                    {otpLoading ? 'Sending...' : 'Resend OTP'}
                                </Button>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleDialogClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleVerifyAndUpdate} disabled={verifying || !otp}>
                            {verifying ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Verify & Update
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
