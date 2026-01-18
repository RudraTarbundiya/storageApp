import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, LogOut, Trash2, Loader2, UserCircle, Shield, UserCog, RefreshCw, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { adminAPI } from '@/lib/api'
import { useAuth, useAlert } from '@/context'

export default function UsersPage() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState({})
    const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, user: null })
    const { user: currentUser } = useAuth()
    const { showAlert } = useAlert()

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const response = await adminAPI.getUsers()
            setUsers(response.data)
        } catch (err) {
            showAlert(err.response?.data?.error || 'Failed to fetch users', 'destructive')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const openConfirmDialog = (type, user) => {
        setConfirmDialog({ open: true, type, user })
    }

    const closeConfirmDialog = () => {
        setConfirmDialog({ open: false, type: null, user: null })
    }

    const handleConfirm = async () => {
        const { type, user } = confirmDialog
        if (!user) return

        closeConfirmDialog()

        if (type === 'logout') {
            await performLogout(user._id, user.name)
        } else if (type === 'delete') {
            await performDelete(user._id, user.name)
        }
    }

    const performLogout = async (userId, userName) => {
        setActionLoading(prev => ({ ...prev, [`logout-${userId}`]: true }))
        try {
            await adminAPI.logoutUser(userId)
            showAlert(`${userName} has been logged out successfully`, 'default')
            await fetchUsers()
        } catch (err) {
            showAlert(err.response?.data?.error || `Failed to logout ${userName}`, 'destructive')
        } finally {
            setActionLoading(prev => ({ ...prev, [`logout-${userId}`]: false }))
        }
    }

    const performDelete = async (userId, userName) => {
        setActionLoading(prev => ({ ...prev, [`delete-${userId}`]: true }))
        try {
            await adminAPI.deleteUser(userId)
            setUsers(prev => prev.filter(u => u._id !== userId))
            showAlert(`${userName} has been deleted successfully`, 'default')
        } catch (err) {
            showAlert(err.response?.data?.error || `Failed to delete ${userName}`, 'destructive')
        } finally {
            setActionLoading(prev => ({ ...prev, [`delete-${userId}`]: false }))
        }
    }

    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin':
                return <Badge className="bg-red-500/10 text-red-600 border-red-200"><Shield className="w-3 h-3 mr-1" />Admin</Badge>
            case 'manager':
                return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200"><UserCog className="w-3 h-3 mr-1" />Manager</Badge>
            default:
                return <Badge className="bg-gray-500/10 text-gray-600 border-gray-200"><UserCircle className="w-3 h-3 mr-1" />User</Badge>
        }
    }

    const isCurrentUser = (userId) => {
        const user = users.find(u => u._id === userId)
        return user?.email === currentUser?.email
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <>
            <div className="p-6 max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="w-5 h-5" />
                                        User Management
                                    </CardTitle>
                                    <CardDescription>
                                        Manage all registered users ({users.length} total)
                                    </CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
                                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {users.map((user) => (
                                    <motion.div
                                        key={user._id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className={`flex items-center justify-between p-4 rounded-lg border ${isCurrentUser(user._id)
                                            ? 'bg-primary/5 border-primary/20'
                                            : 'bg-card hover:bg-accent/50'
                                            } transition-colors`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10">
                                                {user.picture && (
                                                    <AvatarImage src={user.picture} alt={user.name} referrerPolicy="no-referrer" />
                                                )}
                                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                                    {user.name?.charAt(0).toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{user.name}</p>
                                                    {isCurrentUser(user._id) && (
                                                        <Badge variant="outline" className="text-xs">You</Badge>
                                                    )}
                                                    {user.isLoggedIn && (
                                                        <span className="w-2 h-2 bg-green-500 rounded-full" title="Online" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {getRoleBadge(user.role)}

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openConfirmDialog('logout', user)}
                                                disabled={!user.isLoggedIn || actionLoading[`logout-${user._id}`]}
                                                title={user.isLoggedIn ? 'Logout this user' : 'User is not logged in'}
                                            >
                                                {actionLoading[`logout-${user._id}`] ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <LogOut className="w-4 h-4" />
                                                )}
                                            </Button>

                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => openConfirmDialog('delete', user)}
                                                disabled={isCurrentUser(user._id) || actionLoading[`delete-${user._id}`]}
                                                title={isCurrentUser(user._id) ? 'Cannot delete yourself' : 'Delete this user'}
                                            >
                                                {actionLoading[`delete-${user._id}`] ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}

                                {users.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No users found</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && closeConfirmDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className={`w-5 h-5 ${confirmDialog.type === 'delete' ? 'text-red-500' : 'text-yellow-500'}`} />
                            {confirmDialog.type === 'logout' ? 'Confirm Logout' : 'Confirm Delete'}
                        </DialogTitle>
                        <DialogDescription>
                            {confirmDialog.type === 'logout' ? (
                                <>Are you sure you want to logout <strong>{confirmDialog.user?.name}</strong>?</>
                            ) : (
                                <>
                                    Are you sure you want to delete <strong>{confirmDialog.user?.name}</strong>?
                                    <br />
                                    <span className="text-red-500">This action cannot be undone.</span>
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeConfirmDialog}>
                            Cancel
                        </Button>
                        <Button
                            variant={confirmDialog.type === 'delete' ? 'destructive' : 'default'}
                            onClick={handleConfirm}
                        >
                            {confirmDialog.type === 'logout' ? 'Logout' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
