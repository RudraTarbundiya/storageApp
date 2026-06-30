import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    User, Mail, Lock, Camera, Loader2, Check, Eye, EyeOff, HardDrive,
    LogOut, Monitor, Smartphone, Tablet, Sun, Moon, ComputerIcon,
    ChevronRight, Shield, Palette, Globe
} from 'lucide-react'
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
import { useAuth, useAlert, useFileManager } from '@/context'
import { useTheme } from '@/components/ThemeProvider'
import { sanitizeInput } from '@/lib/utils'


// Format bytes to human readable
const formatStorage = (bytes) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'sessions', label: 'Sessions', icon: Monitor },
    { id: 'appearance', label: 'Appearance', icon: Palette },
]

const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
        case 'mobile': return Smartphone
        case 'tablet': return Tablet
        default: return Monitor
    }
}

export default function SettingsPage() {
    const { user, refreshUser, logout } = useAuth()
    const { showAlert } = useAlert()
    const { totalStorageUsed } = useFileManager()
    const { theme, setTheme } = useTheme()

    const [activeTab, setActiveTab] = useState('profile')
    const [loading, setLoading] = useState(false)
    const [otpDialogOpen, setOtpDialogOpen] = useState(false)
    const [otpLoading, setOtpLoading] = useState(false)
    const [verifying, setVerifying] = useState(false)
    const [logoutLoading, setLogoutLoading] = useState(false)
    const [logoutAllLoading, setLogoutAllLoading] = useState(false)
    const [sessionsLoading, setSessionsLoading] = useState(false)
    const [deletingSessionId, setDeletingSessionId] = useState(null)

    const [otp, setOtp] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [pictureUrl, setPictureUrl] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [resendCooldown, setResendCooldown] = useState(0)
    const [sessions, setSessions] = useState([])
    const cooldownTimerRef = useRef(null)

    // Storage percentage
    const STORAGE_LIMIT = user?.maxStorage || 3 * 1024 * 1024 * 1024
    const storagePercentage = Math.min((totalStorageUsed / STORAGE_LIMIT) * 100, 100)

    const getStorageColor = () => {
        if (storagePercentage >= 90) return 'from-red-500 to-red-600'
        if (storagePercentage >= 70) return 'from-yellow-500 to-orange-500'
        return 'from-green-500 to-emerald-500'
    }

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (cooldownTimerRef.current) {
                clearInterval(cooldownTimerRef.current)
            }
        }
    }, [])

    // Fetch sessions when sessions tab is active
    useEffect(() => {
        if (activeTab === 'sessions') {
            fetchSessions()
        }
    }, [activeTab])

    const fetchSessions = async () => {
        setSessionsLoading(true)
        try {
            const res = await userAPI.getSessions()
            setSessions(res.data.sessions || [])
        } catch (err) {
            showAlert(err.response?.data?.error || 'Failed to load sessions', 'destructive')
        } finally {
            setSessionsLoading(false)
        }
    }

    const startCooldownTimer = () => {
        setResendCooldown(300)
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
        const safeNewPassword = sanitizeInput(newPassword)
        const safeConfirmPassword = sanitizeInput(confirmPassword)
        const safePictureUrl = sanitizeInput(pictureUrl).trim()

        if (!safeNewPassword && !safePictureUrl) {
            showAlert('Please enter a new password or picture URL', 'destructive')
            return
        }

        if (safeNewPassword && safeNewPassword !== safeConfirmPassword) {
            showAlert('Passwords do not match', 'destructive')
            return
        }

        if (safeNewPassword && safeNewPassword.length < 6) {
            showAlert('Password must be at least 6 characters', 'destructive')
            return
        }

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
        const safeOtp = sanitizeInput(otp).trim()
        if (!safeOtp) {
            showAlert('Please enter the OTP', 'destructive')
            return
        }

        setVerifying(true)
        try {
            const safeNewPassword = sanitizeInput(newPassword)
            const safePictureUrl = sanitizeInput(pictureUrl).trim()
            const data = { otp: safeOtp }
            if (safeNewPassword) data.newPassword = safeNewPassword
            if (safePictureUrl) data.picture = safePictureUrl

            await userAPI.updateProfile(data)
            showAlert('Profile updated successfully', 'default')
            await refreshUser()

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

    const handleLogout = async () => {
        setLogoutLoading(true)
        try {
            await logout()
            showAlert('Logged out successfully', 'default')
        } catch (err) {
            showAlert(err.response?.data?.error || 'Failed to logout', 'destructive')
        } finally {
            setLogoutLoading(false)
        }
    }

    const handleLogoutAll = async () => {
        setLogoutAllLoading(true)
        try {
            await userAPI.logoutAll()
            showAlert('Logged out from all devices', 'default')
            window.location.href = '/login'
        } catch (err) {
            showAlert(err.response?.data?.error || 'Failed to logout from all devices', 'destructive')
        } finally {
            setLogoutAllLoading(false)
        }
    }

    const handleDeleteSession = async (sessionId) => {
        setDeletingSessionId(sessionId)
        try {
            await userAPI.deleteSession(sessionId)
            showAlert('Session terminated', 'default')
            setSessions(prev => prev.filter(s => s.sessionId !== sessionId))
        } catch (err) {
            showAlert(err.response?.data?.error || 'Failed to terminate session', 'destructive')
        } finally {
            setDeletingSessionId(null)
        }
    }

    const safeNewPassword = sanitizeInput(newPassword)
    const safeConfirmPassword = sanitizeInput(confirmPassword)
    const safePictureUrl = sanitizeInput(pictureUrl).trim()
    const hasChanges = safeNewPassword || safePictureUrl
    const passwordsMatch = !safeNewPassword || safeNewPassword === safeConfirmPassword

    const formatSessionDate = (timestamp) => {
        if (!timestamp) return 'Unknown'
        const date = new Date(timestamp)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
    }

    // ─── Tab content renderers ───

    const renderProfile = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">Profile</h2>
                <p className="text-sm text-muted-foreground">Your personal information</p>
            </div>

            <Card>
                <CardContent className="pt-6 space-y-6">
                    {/* User Info */}
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
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                {user?.name}
                                <Badge variant="outline" className="capitalize">{user?.role}</Badge>
                            </h3>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                    </div>

                    {/* Account Info */}
                    <div className="space-y-3">
                        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Account Information</h3>
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

                    {/* Storage Info */}
                    <div className="p-4 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-2 mb-3">
                            <HardDrive className="w-5 h-5 text-muted-foreground" />
                            <h3 className="font-medium">Storage Usage</h3>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Used</span>
                                <span className="font-medium">{formatStorage(totalStorageUsed)} / {formatStorage(STORAGE_LIMIT)}</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                                <div
                                    className={`h-3 rounded-full transition-all duration-500 bg-linear-to-r ${getStorageColor()}`}
                                    style={{ width: `${storagePercentage}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {storagePercentage.toFixed(1)}% of your storage is used
                            </p>
                        </div>
                    </div>

                    {/* Profile Picture URL */}
                    <div className="border-t pt-6 space-y-4">
                        <h3 className="font-medium">Update Profile Picture</h3>
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
                        {safePictureUrl && (
                            <Button
                                onClick={handleUpdateClick}
                                disabled={loading}
                                className="w-full"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Sending OTP...
                                    </>
                                ) : (
                                    'Update Picture'
                                )}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )

    const renderSecurity = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">Security</h2>
                <p className="text-sm text-muted-foreground">Manage your password</p>
            </div>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    <h3 className="font-medium">Change Password</h3>
                    <p className="text-sm text-muted-foreground">
                        Update your password. You'll need to verify via OTP sent to your email.
                    </p>

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

                    <Button
                        onClick={handleUpdateClick}
                        disabled={loading || !safeNewPassword || !passwordsMatch}
                        className="w-full"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sending OTP...
                            </>
                        ) : (
                            <>
                                <Lock className="w-4 h-4 mr-2" />
                                Change Password
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )

    const renderSessions = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">Sessions</h2>
                <p className="text-sm text-muted-foreground">Manage your active sessions across devices</p>
            </div>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    {sessionsLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-muted-foreground">Loading sessions...</span>
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No active sessions found
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sessions.map((session) => {
                                const DeviceIcon = getDeviceIcon(session.deviceType)
                                return (
                                    <div
                                        key={session.sessionId}
                                        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${session.isCurrent
                                            ? 'bg-green-500/5 border-green-500/20'
                                            : 'bg-muted/30 hover:bg-muted/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${session.isCurrent
                                                ? 'bg-green-500/10'
                                                : 'bg-muted'
                                                }`}>
                                                <DeviceIcon className={`w-5 h-5 ${session.isCurrent ? 'text-green-600' : 'text-muted-foreground'}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium truncate">
                                                        {session.browser} on {session.os}
                                                    </p>
                                                    {session.isCurrent && (
                                                        <Badge variant="outline" className="text-green-600 border-green-200 shrink-0">
                                                            Current
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {session.deviceType.charAt(0).toUpperCase() + session.deviceType.slice(1)} • {formatSessionDate(session.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        {!session.isCurrent && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteSession(session.sessionId)}
                                                disabled={deletingSessionId === session.sessionId}
                                                className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                                {deletingSessionId === session.sessionId ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <LogOut className="w-4 h-4" />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    <div className="border-t pt-4 grid gap-3 sm:grid-cols-2">
                        <Button
                            variant="outline"
                            onClick={handleLogout}
                            disabled={logoutLoading}
                            className="w-full"
                        >
                            {logoutLoading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <LogOut className="w-4 h-4 mr-2" />
                            )}
                            Logout Current Device
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleLogoutAll}
                            disabled={logoutAllLoading}
                            className="w-full"
                        >
                            {logoutAllLoading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Smartphone className="w-4 h-4 mr-2" />
                            )}
                            Logout All Devices
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                        Logging out from all devices will sign you out everywhere, including this browser.
                    </p>
                </CardContent>
            </Card>
        </div>
    )

    const renderAppearance = () => {
        const themes = [
            {
                id: 'light',
                label: 'Light',
                icon: Sun,
                preview: {
                    bg: '#f8faf7',
                    header: '#d1dde7',
                    headerShort: '#baccdc',
                    dots: ['#2dd4bf', '#60a5fa', '#f59e0b'],
                }
            },
            {
                id: 'dark',
                label: 'Dark',
                icon: Moon,
                preview: {
                    bg: '#0b1e38',
                    header: '#13315c',
                    headerShort: '#0f284b',
                    dots: ['#34d399', '#60a5fa', '#f59e0b'],
                }
            },
            {
                id: 'system',
                label: 'System',
                icon: ComputerIcon,
                preview: {
                    bg: '#e8eef3',
                    header: '#d1dde7',
                    headerShort: '#baccdc',
                    dots: ['#60a5fa', '#a78bfa', '#f59e0b'],
                }
            },
        ]

        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold">Appearance</h2>
                    <p className="text-sm text-muted-foreground">Customize the look and feel</p>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <h3 className="font-medium mb-4">Theme</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {themes.map((t) => {
                                const isActive = theme === t.id
                                const Icon = t.icon
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => setTheme(t.id)}
                                        className={`relative group rounded-xl border-2 p-1 transition-all duration-200 cursor-pointer ${isActive
                                            ? 'border-primary ring-2 ring-primary/20'
                                            : 'border-border hover:border-muted-foreground/40'
                                            }`}
                                    >
                                        {/* Checkmark */}
                                        {isActive && (
                                            <div className="absolute -top-2 -right-2 z-10 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-md">
                                                <Check className="h-3.5 w-3.5 text-primary-foreground" />
                                            </div>
                                        )}

                                        {/* Preview card */}
                                        <div
                                            className="rounded-lg p-3 space-y-2 h-24"
                                            style={{ backgroundColor: t.preview.bg }}
                                        >
                                            {/* Fake header lines */}
                                            <div
                                                className="h-2.5 rounded-full w-3/4"
                                                style={{ backgroundColor: t.preview.header }}
                                            />
                                            <div
                                                className="h-2 rounded-full w-1/2"
                                                style={{ backgroundColor: t.preview.headerShort }}
                                            />
                                            {/* Fake color dots */}
                                            <div className="flex gap-1.5 pt-1">
                                                {t.preview.dots.map((color, i) => (
                                                    <div
                                                        key={i}
                                                        className="h-4 w-4 rounded-sm"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Label */}
                                        <div className="flex items-center justify-center gap-1.5 py-2">
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">{t.label}</span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'profile': return renderProfile()
            case 'security': return renderSecurity()
            case 'sessions': return renderSessions()
            case 'appearance': return renderAppearance()
            default: return renderProfile()
        }
    }

    return (
        <>
            <div className="p-4 md:p-6 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Page Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold">Settings</h1>
                        <p className="text-muted-foreground">Manage your account and preferences</p>
                    </div>

                    {/* Layout: Sidebar + Content */}
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Tab Sidebar */}
                        <nav className="md:w-52 shrink-0">
                            <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                                {TABS.map((tab) => {
                                    const Icon = tab.icon
                                    const isActive = activeTab === tab.id
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${isActive
                                                ? 'bg-muted text-foreground'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                                }`}
                                        >
                                            <Icon className="h-4 w-4" />
                                            <span>{tab.label}</span>
                                            {isActive && (
                                                <ChevronRight className="h-4 w-4 ml-auto hidden md:block" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </nav>

                        {/* Tab Content */}
                        <div className="flex-1 min-w-0">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {renderTabContent()}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
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
                            Enter it below to confirm your update.
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
