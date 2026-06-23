import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, LogOut, Trash2, Loader2, UserCircle, Shield, UserCog, RefreshCw, AlertTriangle, RotateCcw, Trash, Crown, FolderOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { adminAPI, ownerAPI } from '@/lib/api'
import { useAuth, useAlert } from '@/context'

// Storage limit in bytes (1 GB)
const STORAGE_LIMIT = 1 * 1024 * 1024 * 1024

// Format bytes to human readable
const formatStorage = (bytes) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function UsersPage() {
    const [users, setUsers] = useState([])
    const [deletedUsers, setDeletedUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [deletedLoading, setDeletedLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState({})
    const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, user: null })
    const [deleteChoiceDialog, setDeleteChoiceDialog] = useState({ open: false, user: null })
    const [roleChangeDialog, setRoleChangeDialog] = useState({ open: false, user: null, newRole: null })
    const { user: currentUser } = useAuth()
    const { showAlert } = useAlert()
    const navigate = useNavigate()

    const isOwner = currentUser?.role === 'owner'
    const isAdmin = currentUser?.role === 'admin'
    const isManager = currentUser?.role === 'manager'

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
        // Run both fetches in parallel instead of sequentially
        Promise.all([
            fetchUsers(),
            isOwner ? fetchDeletedUsers() : Promise.resolve()
        ])
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

    const openRoleChangeDialog = (user, newRole) => {
        if (user.role === newRole) return
        setRoleChangeDialog({ open: true, user, newRole })
    }

    const closeRoleChangeDialog = () => {
        setRoleChangeDialog({ open: false, user: null, newRole: null })
    }

    const handleRoleChangeConfirm = async () => {
        const { user, newRole } = roleChangeDialog
        if (!user || !newRole) return

        closeRoleChangeDialog()

        setActionLoading(prev => ({ ...prev, [`role-${user._id}`]: true }))
        try {
            await adminAPI.changeUserRole(user._id, newRole)
            setUsers(prev => prev.map(u => u._id === user._id ? { ...u, role: newRole } : u))
            showAlert(`${user.name}'s role changed to ${newRole}`, 'default')
        } catch (err) {
            showAlert(err.response?.data?.error || 'Failed to change role', 'destructive')
        } finally {
            setActionLoading(prev => ({ ...prev, [`role-${user._id}`]: false }))
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

    const canModifyUser = (targetUser) => {
        if (isOwner) return true
        if (isAdmin) return targetUser.role !== 'owner'
        if (isManager) return targetUser.role === 'user' || targetUser.role === 'manager'
        return false
    }

    const canChangeRole = (targetUser) => {
        if (isCurrentUser(targetUser._id)) return false
        return canModifyUser(targetUser)
    }

    const getAvailableRoles = (targetUser) => {
        if (isOwner) return ['user', 'manager', 'admin', 'owner']
        if (isAdmin) return ['user', 'manager', 'admin']
        if (isManager) return ['user', 'manager']
        return []
    }

    const canDelete = () => isOwner || isAdmin

    const canLogoutUser = (targetUser) => {
        if (isOwner) return true
        if (isAdmin) return targetUser.role !== 'admin' && targetUser.role !== 'owner'
        if (isManager) return targetUser.role === 'user'
        return false
    }

    // Storage progress color
    const getStorageColor = (used) => {
        const percent = (used / STORAGE_LIMIT) * 100
        if (percent >= 90) return 'bg-red-500'
        if (percent >= 70) return 'bg-yellow-500'
        return 'bg-green-500'
    }

    const renderUserRow = (user, isDeleted = false) => (
        <TableRow key={user._id} className={isCurrentUser(user._id) ? 'bg-primary/5' : isDeleted ? 'bg-primary/5' : ''}>
            {/* User Column */}
            <TableCell>
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        {user.picture && (
                            <AvatarImage src={user.picture} alt={user.name} referrerPolicy="no-referrer" />
                        )}
                        <AvatarFallback className={`bg-linear-to-br ${isDeleted ? 'from-red-400 to-red-600' : 'from-blue-500 to-purple-600'} text-white text-sm`}>
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className={`font-medium text-sm ${isDeleted ? 'text-red-700' : ''}`}>{user.name}</span>
                            {isCurrentUser(user._id) && <Badge variant="outline" className="text-xs">You</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                </div>
            </TableCell>

            {/* Status Column */}
            <TableCell>
                {isDeleted ? (
                    <Badge variant="outline" className="text-red-500 border-red-200">Deleted</Badge>
                ) : user.isLoggedIn ? (
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-sm text-green-600">Online</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                        <span className="text-sm text-muted-foreground">Offline</span>
                    </div>
                )}
            </TableCell>

            {/* Storage Column */}
            <TableCell>
                <div className="w-32">
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{formatStorage(user.storageUsed || 0)}</span>
                        <span className="text-muted-foreground">/ {formatStorage(STORAGE_LIMIT)} ({(((user.storageUsed || 0) / STORAGE_LIMIT) * 100).toFixed(3)}%)</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                        <div
                            className={`h-1.5 rounded-full transition-all ${getStorageColor(user.storageUsed || 0)}`}
                            style={{ width: `${Math.min(((user.storageUsed || 0) / STORAGE_LIMIT) * 100, 100)}%` }}
                        />
                    </div>
                </div>
            </TableCell>

            {/* Role Column */}
            <TableCell>
                {!isDeleted && canChangeRole(user) ? (
                    <Select
                        value={user.role}
                        onValueChange={(value) => openRoleChangeDialog(user, value)}
                        disabled={actionLoading[`role-${user._id}`]}
                    >
                        <SelectTrigger className="w-28 h-8 text-xs">
                            {actionLoading[`role-${user._id}`] ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <SelectValue />
                            )}
                        </SelectTrigger>
                        <SelectContent>
                            {getAvailableRoles(user).map((role) => (
                                <SelectItem key={role} value={role}>
                                    <div className="flex items-center gap-1 text-xs">
                                        {role === 'owner' && <Crown className="w-3 h-3 text-yellow-600" />}
                                        {role === 'admin' && <Shield className="w-3 h-3 text-red-600" />}
                                        {role === 'manager' && <UserCog className="w-3 h-3 text-blue-600" />}
                                        {role === 'user' && <UserCircle className="w-3 h-3 text-gray-600" />}
                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    getRoleBadge(user.role)
                )}
            </TableCell>

            {/* Actions Column */}
            <TableCell>
                <div className="flex items-center gap-2">
                    {isDeleted ? (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openConfirmDialog('recover', user)}
                                disabled={actionLoading[`recover-${user._id}`]}
                                className="text-green-600 border-green-200 hover:bg-green-50 h-8 text-xs"
                            >
                                {actionLoading[`recover-${user._id}`] ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <><RotateCcw className="w-3 h-3 mr-1" /> Recover</>
                                )}
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openConfirmDialog('hardDelete', user)}
                                disabled={actionLoading[`hardDelete-${user._id}`]}
                                className="h-8 text-xs"
                            >
                                {actionLoading[`hardDelete-${user._id}`] ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <><Trash className="w-3 h-3 mr-1" /> Delete</>
                                )}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openConfirmDialog('logout', user)}
                                disabled={!user.isLoggedIn || actionLoading[`logout-${user._id}`] || !canLogoutUser(user)}
                                className="h-8 text-xs"
                            >
                                {actionLoading[`logout-${user._id}`] ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <><LogOut className="w-3 h-3 mr-1" /> Logout</>
                                )}
                            </Button>

                            {(isOwner || isAdmin) && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/admin/files/${user._id}?name=${encodeURIComponent(user.name)}`)}
                                    className="h-8 text-xs"
                                >
                                    <FolderOpen className="w-3 h-3 mr-1" /> Files
                                </Button>
                            )}

                            {canDelete() && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteClick(user)}
                                    disabled={isCurrentUser(user._id) || actionLoading[`delete-${user._id}`] || !canModifyUser(user)}
                                    className="h-8 text-xs"
                                >
                                    {actionLoading[`delete-${user._id}`] ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <><Trash2 className="w-3 h-3 mr-1" /> Delete</>
                                    )}
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </TableCell>
        </TableRow>
    )

    const renderUserCard = (user, isDeleted = false) => (
        <Card key={user._id} className={`rounded-2xl border ${isCurrentUser(user._id) || isDeleted ? 'bg-primary/5' : 'bg-card/90'}`}>
            <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10">
                            {user.picture && (
                                <AvatarImage src={user.picture} alt={user.name} referrerPolicy="no-referrer" />
                            )}
                            <AvatarFallback className={`bg-linear-to-br ${isDeleted ? 'from-red-400 to-red-600' : 'from-[#13315c] to-[#397bd6]'} text-white text-sm`}>
                                {user.name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold truncate">{user.name}</span>
                                {isCurrentUser(user._id) && <Badge variant="outline" className="text-[10px]">You</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                    </div>
                    <div>{!isDeleted && canChangeRole(user) ? null : getRoleBadge(user.role)}</div>
                </div>

                {!isDeleted && canChangeRole(user) && (
                    <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground">Role</p>
                        <Select
                            value={user.role}
                            onValueChange={(value) => openRoleChangeDialog(user, value)}
                            disabled={actionLoading[`role-${user._id}`]}
                        >
                            <SelectTrigger className="h-9 text-xs">
                                {actionLoading[`role-${user._id}`] ? <Loader2 className="w-3 h-3 animate-spin" /> : <SelectValue />}
                            </SelectTrigger>
                            <SelectContent>
                                {getAvailableRoles(user).map((role) => (
                                    <SelectItem key={role} value={role}>
                                        <div className="flex items-center gap-1 text-xs">
                                            {role === 'owner' && <Crown className="w-3 h-3 text-yellow-600" />}
                                            {role === 'admin' && <Shield className="w-3 h-3 text-red-600" />}
                                            {role === 'manager' && <UserCog className="w-3 h-3 text-blue-600" />}
                                            {role === 'user' && <UserCircle className="w-3 h-3 text-gray-600" />}
                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Storage</span>
                        <span className="text-muted-foreground">{formatStorage(user.storageUsed || 0)} / {formatStorage(STORAGE_LIMIT)}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                        <div
                            className={`h-1.5 rounded-full transition-all ${getStorageColor(user.storageUsed || 0)}`}
                            style={{ width: `${Math.min(((user.storageUsed || 0) / STORAGE_LIMIT) * 100, 100)}%` }}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                    {isDeleted ? (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openConfirmDialog('recover', user)}
                                disabled={actionLoading[`recover-${user._id}`]}
                                className="h-8 text-xs text-green-600 border-green-200 hover:bg-green-50"
                            >
                                {actionLoading[`recover-${user._id}`] ? <Loader2 className="w-3 h-3 animate-spin" /> : <><RotateCcw className="w-3 h-3 mr-1" /> Recover</>}
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openConfirmDialog('hardDelete', user)}
                                disabled={actionLoading[`hardDelete-${user._id}`]}
                                className="h-8 text-xs"
                            >
                                {actionLoading[`hardDelete-${user._id}`] ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Trash className="w-3 h-3 mr-1" /> Delete</>}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openConfirmDialog('logout', user)}
                                disabled={!user.isLoggedIn || actionLoading[`logout-${user._id}`] || !canLogoutUser(user)}
                                className="h-8 text-xs"
                            >
                                {actionLoading[`logout-${user._id}`] ? <Loader2 className="w-3 h-3 animate-spin" /> : <><LogOut className="w-3 h-3 mr-1" /> Logout</>}
                            </Button>

                            {(isOwner || isAdmin) && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/admin/files/${user._id}?name=${encodeURIComponent(user.name)}`)}
                                    className="h-8 text-xs"
                                >
                                    <FolderOpen className="w-3 h-3 mr-1" /> Files
                                </Button>
                            )}

                            {canDelete() && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteClick(user)}
                                    disabled={isCurrentUser(user._id) || actionLoading[`delete-${user._id}`] || !canModifyUser(user)}
                                    className="h-8 text-xs"
                                >
                                    {actionLoading[`delete-${user._id}`] ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Trash2 className="w-3 h-3 mr-1" /> Delete</>}
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    )

    const renderUserList = (list, isDeleted = false, emptyMessage = 'No users found') => (
        <>
            <div className="space-y-3 md:hidden">
                {list.map((user) => renderUserCard(user, isDeleted))}
                {list.length === 0 && (
                    <Card>
                        <CardContent className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</CardContent>
                    </Card>
                )}
            </div>

            <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-62.5">User</TableHead>
                            <TableHead className="w-25">Status</TableHead>
                            <TableHead className="w-37.5">Storage</TableHead>
                            <TableHead className="w-32.5">Role</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {list.map((user) => renderUserRow(user, isDeleted))}
                        {list.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </>
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-100">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <>
            <div className="mx-auto max-w-7xl p-3 sm:p-6">
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
                                    <TabsList className="mb-4 grid w-full grid-cols-2">
                                        <TabsTrigger value="active" className="flex items-center gap-1.5 text-xs sm:text-sm">
                                            <Users className="w-4 h-4" />
                                            Active Users ({users.length})
                                        </TabsTrigger>
                                        <TabsTrigger value="deleted" className="flex items-center gap-1.5 text-xs sm:text-sm">
                                            <Trash2 className="w-4 h-4" />
                                            Deleted Users ({deletedUsers.length})
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="active">
                                        {renderUserList(users, false, 'No active users found')}
                                    </TabsContent>
                                    <TabsContent value="deleted">
                                        {deletedLoading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                            </div>
                                        ) : (
                                            renderUserList(deletedUsers, true, 'No deleted users found')
                                        )}
                                    </TabsContent>
                                </Tabs>
                            ) : (
                                renderUserList(users, false, 'No users found')
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

            {/* Role Change Confirmation Dialog */}
            <Dialog open={roleChangeDialog.open} onOpenChange={(open) => !open && closeRoleChangeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserCog className="w-5 h-5 text-blue-500" />
                            Confirm Role Change
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to change <strong>{roleChangeDialog.user?.name}</strong>'s role from{' '}
                            <strong className="capitalize">{roleChangeDialog.user?.role}</strong> to{' '}
                            <strong className="capitalize">{roleChangeDialog.newRole}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center gap-4 py-4">
                        <div className="flex flex-col items-center p-3 rounded-lg border bg-muted/50">
                            {roleChangeDialog.user?.role === 'owner' && <Crown className="w-8 h-8 text-yellow-600" />}
                            {roleChangeDialog.user?.role === 'admin' && <Shield className="w-8 h-8 text-red-600" />}
                            {roleChangeDialog.user?.role === 'manager' && <UserCog className="w-8 h-8 text-blue-600" />}
                            {roleChangeDialog.user?.role === 'user' && <UserCircle className="w-8 h-8 text-gray-600" />}
                            <span className="text-sm font-medium capitalize mt-1">{roleChangeDialog.user?.role}</span>
                        </div>
                        <span className="text-2xl text-muted-foreground">→</span>
                        <div className="flex flex-col items-center p-3 rounded-lg border bg-primary/5 border-primary/20">
                            {roleChangeDialog.newRole === 'owner' && <Crown className="w-8 h-8 text-yellow-600" />}
                            {roleChangeDialog.newRole === 'admin' && <Shield className="w-8 h-8 text-red-600" />}
                            {roleChangeDialog.newRole === 'manager' && <UserCog className="w-8 h-8 text-blue-600" />}
                            {roleChangeDialog.newRole === 'user' && <UserCircle className="w-8 h-8 text-gray-600" />}
                            <span className="text-sm font-medium capitalize mt-1">{roleChangeDialog.newRole}</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeRoleChangeDialog}>
                            Cancel
                        </Button>
                        <Button onClick={handleRoleChangeConfirm}>
                            Change Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
