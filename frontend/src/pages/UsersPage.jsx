import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, LogOut, Trash2, Loader2, UserCircle, Shield, UserCog, RefreshCw, AlertTriangle, RotateCcw, Trash, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { adminAPI, ownerAPI } from '@/lib/api'
import { useAuth, useAlert } from '@/context'

export default function UsersPage() {
    const [users, setUsers] = useState([])
    const [deletedUsers, setDeletedUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [deletedLoading, setDeletedLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState({})
    const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, user: null })
    const [deleteChoiceDialog, setDeleteChoiceDialog] = useState({ open: false, user: null })
    const { user: currentUser } = useAuth()
    const { showAlert } = useAlert()

    const isOwner = currentUser?.role === 'owner'

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

    const fetchDeletedUsers = async () => {
        if (!isOwner) return
        setDeletedLoading(true)
        try {
            const response = await ownerAPI.getDeletedUsers()
            setDeletedUsers(response.data)
        } catch (err) {
            showAlert(err.response?.data?.error || 'Failed to fetch deleted users', 'destructive')
        } finally {
            setDeletedLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
        if (isOwner) {
            fetchDeletedUsers()
        }
    }, [isOwner])

    const openConfirmDialog = (type, user) => {
        setConfirmDialog({ open: true, type, user })
    }

    const closeConfirmDialog = () => {
        setConfirmDialog({ open: false, type: null, user: null })
    }

    const openDeleteChoiceDialog = (user) => {
        setDeleteChoiceDialog({ open: true, user })
    }

    const closeDeleteChoiceDialog = () => {
        setDeleteChoiceDialog({ open: false, user: null })
    }

    const handleDeleteClick = (user) => {
        if (isOwner) {
            openDeleteChoiceDialog(user)
        } else {
            openConfirmDialog('delete', user)
        }
    }

    const handleConfirm = async () => {
        const { type, user } = confirmDialog
        if (!user) return

        closeConfirmDialog()

        if (type === 'logout') {
            await performLogout(user._id, user.name)
        } else if (type === 'delete') {
            await performSoftDelete(user._id, user.name)
        } else if (type === 'hardDelete') {
            await performHardDelete(user._id, user.name)
        } else if (type === 'recover') {
            await performRecover(user._id, user.name)
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

    const performSoftDelete = async (userId, userName) => {
        setActionLoading(prev => ({ ...prev, [`delete-${userId}`]: true }))
        try {
            await adminAPI.deleteUser(userId)
            setUsers(prev => prev.filter(u => u._id !== userId))
            showAlert(`${userName} has been deleted successfully`, 'default')
            if (isOwner) {
                await fetchDeletedUsers()
            }
        } catch (err) {
            showAlert(err.response?.data?.error || `Failed to delete ${userName}`, 'destructive')
        } finally {
            setActionLoading(prev => ({ ...prev, [`delete-${userId}`]: false }))
        }
    }

    const performHardDelete = async (userId, userName) => {
        setActionLoading(prev => ({ ...prev, [`hardDelete-${userId}`]: true }))
        try {
            await ownerAPI.hardDeleteUser(userId)
            setUsers(prev => prev.filter(u => u._id !== userId))
            setDeletedUsers(prev => prev.filter(u => u._id !== userId))
            showAlert(`${userName} has been permanently deleted`, 'default')
        } catch (err) {
            showAlert(err.response?.data?.error || `Failed to permanently delete ${userName}`, 'destructive')
        } finally {
            setActionLoading(prev => ({ ...prev, [`hardDelete-${userId}`]: false }))
        }
    }

    const performRecover = async (userId, userName) => {
        setActionLoading(prev => ({ ...prev, [`recover-${userId}`]: true }))
        try {
            await ownerAPI.recoverUser(userId)
            setDeletedUsers(prev => prev.filter(u => u._id !== userId))
            showAlert(`${userName} has been recovered successfully`, 'default')
            await fetchUsers()
        } catch (err) {
            showAlert(err.response?.data?.error || `Failed to recover ${userName}`, 'destructive')
        } finally {
            setActionLoading(prev => ({ ...prev, [`recover-${userId}`]: false }))
        }
    }

    const handleDeleteChoice = (choice) => {
        const { user } = deleteChoiceDialog
        closeDeleteChoiceDialog()
        if (choice === 'soft') {
            openConfirmDialog('delete', user)
        } else if (choice === 'permanent') {
            openConfirmDialog('hardDelete', user)
        }
    }

    const getRoleBadge = (role) => {
        switch (role) {
            case 'owner':
                return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200"><Crown className="w-3 h-3 mr-1" />Owner</Badge>
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

    // Check if current user can modify target user (admin cannot modify admin/owner)
    const canModifyUser = (targetUser) => {
        if (isOwner) return true
        if (targetUser.role === 'admin' || targetUser.role === 'owner') return false
        return true
    }

    const renderUserCard = (user, isDeleted = false) => (
        <motion.div
            key={user._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex items-center justify-between p-4 rounded-lg border ${isCurrentUser(user._id)
                ? 'bg-primary/5 border-primary/20'
                : isDeleted
                    ? 'bg-red-50/50 border-red-100'
                    : 'bg-card hover:bg-accent/50'
                } transition-colors`}
        >
            <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                    {user.picture && (
                        <AvatarImage src={user.picture} alt={user.name} referrerPolicy="no-referrer" />
                    )}
                    <AvatarFallback className={`bg-gradient-to-br ${isDeleted ? 'from-red-400 to-red-600' : 'from-blue-500 to-purple-600'} text-white`}>
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <div className="flex items-center gap-2">
                        <p className={`font-medium ${isDeleted ? 'text-red-700' : ''}`}>{user.name}</p>
                        {isCurrentUser(user._id) && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                        {!isDeleted && user.isLoggedIn && (
                            <span className="w-2 h-2 bg-green-500 rounded-full" title="Online" />
                        )}
                        {isDeleted && (
                            <Badge variant="outline" className="text-xs text-red-500 border-red-200">Deleted</Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {getRoleBadge(user.role)}

                {isDeleted ? (
                    // Actions for deleted users (owner only)
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openConfirmDialog('recover', user)}
                            disabled={actionLoading[`recover-${user._id}`]}
                            title="Recover this user"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                            {actionLoading[`recover-${user._id}`] ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <RotateCcw className="w-4 h-4" />
                            )}
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openConfirmDialog('hardDelete', user)}
                            disabled={actionLoading[`hardDelete-${user._id}`]}
                            title="Permanently delete this user"
                        >
                            {actionLoading[`hardDelete-${user._id}`] ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Trash className="w-4 h-4" />
                            )}
                        </Button>
                    </>
                ) : (
                    // Actions for active users
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openConfirmDialog('logout', user)}
                            disabled={!user.isLoggedIn || actionLoading[`logout-${user._id}`] || !canModifyUser(user)}
                            title={!canModifyUser(user) ? 'Only owner can logout admin/owner users' : user.isLoggedIn ? 'Logout this user' : 'User is not logged in'}
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
                            onClick={() => handleDeleteClick(user)}
                            disabled={isCurrentUser(user._id) || actionLoading[`delete-${user._id}`] || !canModifyUser(user)}
                            title={isCurrentUser(user._id) ? 'Cannot delete yourself' : !canModifyUser(user) ? 'Only owner can delete admin/owner users' : 'Delete this user'}
                        >
                            {actionLoading[`delete-${user._id}`] ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4" />
                            )}
                        </Button>
                    </>
                )}
            </div>
        </motion.div>
    )

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
                                        Manage all registered users
                                    </CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => { fetchUsers(); if (isOwner) fetchDeletedUsers(); }} disabled={loading || deletedLoading}>
                                    <RefreshCw className={`w-4 h-4 mr-2 ${loading || deletedLoading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isOwner ? (
                                <Tabs defaultValue="active" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-4">
                                        <TabsTrigger value="active" className="flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            Active Users ({users.length})
                                        </TabsTrigger>
                                        <TabsTrigger value="deleted" className="flex items-center gap-2">
                                            <Trash2 className="w-4 h-4" />
                                            Deleted Users ({deletedUsers.length})
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="active">
                                        <div className="space-y-3">
                                            {users.map((user) => renderUserCard(user, false))}
                                            {users.length === 0 && (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                    <p>No active users found</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="deleted">
                                        {deletedLoading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {deletedUsers.map((user) => renderUserCard(user, true))}
                                                {deletedUsers.length === 0 && (
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                        <p>No deleted users found</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            ) : (
                                <div className="space-y-3">
                                    {users.map((user) => renderUserCard(user, false))}
                                    {users.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                            <p>No users found</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Delete Choice Dialog (Owner Only) */}
            <Dialog open={deleteChoiceDialog.open} onOpenChange={(open) => !open && closeDeleteChoiceDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            Choose Delete Type
                        </DialogTitle>
                        <DialogDescription>
                            How would you like to delete <strong>{deleteChoiceDialog.user?.name}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <Button
                            variant="outline"
                            className="flex flex-col h-auto py-4 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                            onClick={() => handleDeleteChoice('soft')}
                        >
                            <Trash2 className="w-6 h-6 mb-2 text-orange-500" />
                            <span className="font-medium">Soft Delete</span>
                            <span className="text-xs text-muted-foreground mt-1">Can be recovered later</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col h-auto py-4 border-red-200 hover:bg-red-50 hover:border-red-300"
                            onClick={() => handleDeleteChoice('permanent')}
                        >
                            <Trash className="w-6 h-6 mb-2 text-red-500" />
                            <span className="font-medium">Permanent Delete</span>
                            <span className="text-xs text-muted-foreground mt-1">Cannot be undone</span>
                        </Button>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={closeDeleteChoiceDialog}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && closeConfirmDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className={`w-5 h-5 ${confirmDialog.type === 'hardDelete' ? 'text-red-500' : confirmDialog.type === 'recover' ? 'text-green-500' : confirmDialog.type === 'delete' ? 'text-orange-500' : 'text-yellow-500'}`} />
                            {confirmDialog.type === 'logout' && 'Confirm Logout'}
                            {confirmDialog.type === 'delete' && 'Confirm Soft Delete'}
                            {confirmDialog.type === 'hardDelete' && 'Confirm Permanent Delete'}
                            {confirmDialog.type === 'recover' && 'Confirm Recovery'}
                        </DialogTitle>
                        <DialogDescription>
                            {confirmDialog.type === 'logout' && (
                                <>Are you sure you want to logout <strong>{confirmDialog.user?.name}</strong>?</>
                            )}
                            {confirmDialog.type === 'delete' && (
                                <>
                                    Are you sure you want to soft delete <strong>{confirmDialog.user?.name}</strong>?
                                    <br />
                                    <span className="text-orange-500">This user can be recovered later by an owner.</span>
                                </>
                            )}
                            {confirmDialog.type === 'hardDelete' && (
                                <>
                                    Are you sure you want to permanently delete <strong>{confirmDialog.user?.name}</strong>?
                                    <br />
                                    <span className="text-red-500">This action cannot be undone. All user data will be permanently removed.</span>
                                </>
                            )}
                            {confirmDialog.type === 'recover' && (
                                <>Are you sure you want to recover <strong>{confirmDialog.user?.name}</strong>?</>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeConfirmDialog}>
                            Cancel
                        </Button>
                        <Button
                            variant={confirmDialog.type === 'hardDelete' ? 'destructive' : confirmDialog.type === 'recover' ? 'default' : confirmDialog.type === 'delete' ? 'destructive' : 'default'}
                            onClick={handleConfirm}
                            className={confirmDialog.type === 'recover' ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                            {confirmDialog.type === 'logout' && 'Logout'}
                            {confirmDialog.type === 'delete' && 'Soft Delete'}
                            {confirmDialog.type === 'hardDelete' && 'Permanently Delete'}
                            {confirmDialog.type === 'recover' && 'Recover'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
