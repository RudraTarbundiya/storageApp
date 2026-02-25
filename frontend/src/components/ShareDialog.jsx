import { useState, useEffect, useCallback } from 'react'
import { Link2, Copy, Check, Globe, Lock, ExternalLink, Search, X, UserPlus, Users, Eye, Pencil, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { publicAPI, sharingAPI } from '@/lib/api'
import { useAlert } from '@/context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import ConfirmDialog from '@/components/ConfirmDialog'

// Debounce hook
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])

    return debouncedValue
}

export default function ShareDialog({
    open,
    onOpenChange,
    item,
    type = 'file', // 'file' or 'folder'
    onShareSuccess // Callback when sharing succeeds to refresh parent data
}) {
    const { showAlert } = useAlert()
    const [isPublic, setIsPublic] = useState(false)
    const [copied, setCopied] = useState(false)
    const [loading, setLoading] = useState(false)

    // User sharing state
    const [activeTab, setActiveTab] = useState('users') // 'users' or 'public'
    const [searchEmail, setSearchEmail] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [searching, setSearching] = useState(false)
    const [searchError, setSearchError] = useState('')
    const [sharingUser, setSharingUser] = useState(null)
    const [sharedUsers, setSharedUsers] = useState([])
    const [removingUser, setRemovingUser] = useState(null)
    const [loadingSharedUsers, setLoadingSharedUsers] = useState(false)

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        description: '',
        userId: null,
        userName: ''
    })

    const debouncedSearch = useDebounce(searchEmail, 300)

    // Fetch latest item data when dialog opens to ensure shared users are up-to-date
    useEffect(() => {
        if (!item || !open) return

        // Set data from item prop (which should have sharedWith populated)
        setIsPublic(item.isPublic || false)
        setSharedUsers(item.sharedWith || [])
        setCopied(false)
        setSearchEmail('')
        setSearchResults([])
        setSearchError('')
        setLoadingSharedUsers(false)
    }, [item, open])

    // Search users when email input changes
    useEffect(() => {
        const searchUsers = async () => {
            // Basic email validation - must contain @ and have text before and after
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            const isValidEmail = emailRegex.test(debouncedSearch)

            if (!isValidEmail) {
                setSearchResults([])
                setSearchError('')
                return
            }

            setSearching(true)
            setSearchError('')
            try {
                const response = await sharingAPI.searchUsers(debouncedSearch)
                // Filter out users who already have access
                const alreadySharedIds = sharedUsers.map(s => s.user?._id || s.user)
                const filtered = response.data.filter(u => !alreadySharedIds.includes(u._id))
                setSearchResults(filtered)
            } catch (error) {
                console.error('Search failed:', error)
                setSearchResults([])
                // Graceful error message
                const errorMessage = error.response?.data?.message || 'Failed to search users. Please try again.'
                setSearchError(errorMessage)
            } finally {
                setSearching(false)
            }
        }

        searchUsers()
    }, [debouncedSearch, sharedUsers])

    const shareLink = item
        ? `${window.location.origin}/share/${type}/${item._id}`
        : ''

    const handleTogglePublic = async () => {
        if (!item) return

        setLoading(true)
        try {
            const newStatus = !isPublic

            if (type === 'folder') {
                await publicAPI.toggleDirectoryPublic(item._id, newStatus)
            } else {
                await publicAPI.toggleFilePublic(item._id, newStatus)
            }

            setIsPublic(newStatus)
            showAlert(
                newStatus
                    ? `${type === 'folder' ? 'Folder' : 'File'} is now public and shareable!`
                    : `${type === 'folder' ? 'Folder' : 'File'} is now private.`
            )
        } catch (error) {
            showAlert('Failed to update sharing settings', 'destructive')
        } finally {
            setLoading(false)
        }
    }

    const handleCopyLink = async () => {
        if (!shareLink) return

        try {
            await navigator.clipboard.writeText(shareLink)
            setCopied(true)
            showAlert('Link copied to clipboard!')
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            showAlert('Failed to copy link', 'destructive')
        }
    }

    const handleOpenInNewTab = () => {
        window.open(shareLink, '_blank')
    }

    const handleShareWithUser = async (user) => {
        if (!item || !user) return

        setSharingUser(user._id)
        try {
            if (type === 'folder') {
                await sharingAPI.shareDirectory(item._id, user._id, 'view')
            } else {
                await sharingAPI.shareFile(item._id, user._id, 'view')
            }

            // Add to shared users list
            setSharedUsers(prev => [...prev, { user, permission: 'view' }])
            setSearchResults(prev => prev.filter(u => u._id !== user._id))
            setSearchEmail('')
            showAlert(`Shared with ${user.name || user.email}!`)
            
            // Call success callback to refresh parent data
            if (onShareSuccess) onShareSuccess()
        } catch (error) {
            showAlert('Failed to share', 'destructive')
        } finally {
            setSharingUser(null)
        }
    }

    const handleRemoveShare = (userId, userName) => {
        if (!item) return

        // Open confirmation dialog
        setConfirmDialog({
            open: true,
            title: 'Remove Access',
            description: `Are you sure you want to remove access for ${userName || 'this user'}? They will no longer be able to access this ${type}.`,
            userId,
            userName
        })
    }

    const confirmRemoveShare = async () => {
        const { userId } = confirmDialog
        
        setConfirmDialog(prev => ({ ...prev, open: false }))
        setRemovingUser(userId)
        
        try {
            if (type === 'folder') {
                await sharingAPI.removeDirectoryShare(item._id, userId)
            } else {
                await sharingAPI.removeFileShare(item._id, userId)
            }

            // Remove from shared users list
            setSharedUsers(prev => prev.filter(s => (s.user?._id || s.user) !== userId))
            showAlert('Access removed successfully')
            
            // Call success callback to refresh parent data
            if (onShareSuccess) onShareSuccess()
        } catch (error) {
            showAlert('Failed to remove access', 'destructive')
        } finally {
            setRemovingUser(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5 text-blue-500" />
                        Share {type === 'folder' ? 'Folder' : 'File'}
                    </DialogTitle>
                    <DialogDescription>
                        {item?.name && (
                            <span className="font-medium text-foreground">"{item.name}"</span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {/* Tab Navigation */}
                <div className="flex gap-1 p-1 bg-muted rounded-lg">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'users'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Users className="h-4 w-4" />
                        Share with Users
                    </button>
                    <button
                        onClick={() => setActiveTab('public')}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'public'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Globe className="h-4 w-4" />
                        Public Link
                    </button>
                </div>

                <div className="space-y-4 py-2">
                    {/* User Sharing Tab */}
                    {activeTab === 'users' && (
                        <div className="space-y-4 animate-in slide-in-from-left-2 duration-200">
                            {/* Search Input */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Add people</Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by email..."
                                            value={searchEmail}
                                            onChange={(e) => setSearchEmail(e.target.value)}
                                            className="pl-10"
                                        />
                                        {searching && (
                                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">Users will have view-only access</p>
                            </div>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                                    {searchResults.map(user => (
                                        <div
                                            key={user._id}
                                            className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    {user.picture && (
                                                        <AvatarImage src={user.picture} alt={user.name} referrerPolicy="no-referrer" />
                                                    )}
                                                    <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-white text-xs">
                                                        {user.name?.charAt(0).toUpperCase() || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleShareWithUser(user)}
                                                disabled={sharingUser === user._id}
                                            >
                                                {sharingUser === user._id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <UserPlus className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Search Error */}
                            {searchError && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                    <p className="text-sm text-red-700 dark:text-red-300">{searchError}</p>
                                </div>
                            )}

                            {/* No results message - only show for valid email with no error */}
                            {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(searchEmail) && searchResults.length === 0 && !searching && !searchError && (
                                <p className="text-sm text-muted-foreground text-center py-3">
                                    No users found matching "{searchEmail}"
                                </p>
                            )}

                            {/* Shared Users List */}
                            {sharedUsers.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">People with access</Label>
                                    <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                                        {sharedUsers.map((share, index) => {
                                            const user = share.user || {}
                                            const userId = user._id || share.user
                                            return (
                                                <div
                                                    key={userId || index}
                                                    className="flex items-center justify-between p-3"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            {user.picture && (
                                                                <AvatarImage src={user.picture} alt={user.name} referrerPolicy="no-referrer" />
                                                            )}
                                                            <AvatarFallback className="bg-linear-to-br from-green-500 to-teal-600 text-white text-xs">
                                                                {user.name?.charAt(0).toUpperCase() || 'U'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-medium">{user.name || 'User'}</p>
                                                            <p className="text-xs text-muted-foreground">{user.email || 'Loading...'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                            <Eye className="h-3 w-3" /> View
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            onClick={() => handleRemoveShare(userId, user.name || user.email)}
                                                            disabled={removingUser === userId}
                                                        >
                                                            {removingUser === userId ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <X className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {loadingSharedUsers && (
                                <div className="text-center py-6 text-muted-foreground">
                                    <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                                    <p className="text-sm">Loading shared users...</p>
                                </div>
                            )}

                            {!loadingSharedUsers && sharedUsers.length === 0 && searchEmail.length < 3 && (
                                <div className="text-center py-6 text-muted-foreground">
                                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Not shared with anyone yet</p>
                                    <p className="text-xs">Search for users by email to share</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Public Link Tab */}
                    {activeTab === 'public' && (
                        <div className="space-y-4 animate-in slide-in-from-right-2 duration-200">
                            {/* Public toggle */}
                            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                                <div className="flex items-center gap-3">
                                    {isPublic ? (
                                        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                            <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        </div>
                                    ) : (
                                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            <Lock className="h-5 w-5 text-slate-500" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium">
                                            {isPublic ? 'Public Access' : 'Private'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {isPublic
                                                ? 'Anyone with the link can view and download'
                                                : 'Only you and shared users can access'
                                            }
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant={isPublic ? "outline" : "default"}
                                    size="sm"
                                    onClick={handleTogglePublic}
                                    disabled={loading}
                                >
                                    {loading ? 'Updating...' : isPublic ? 'Make Private' : 'Make Public'}
                                </Button>
                            </div>

                            {/* Share link */}
                            {isPublic && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                    <Label htmlFor="share-link" className="text-sm font-medium">
                                        Share Link
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="share-link"
                                            value={shareLink}
                                            readOnly
                                            className="font-mono text-sm"
                                        />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={handleCopyLink}
                                            className="shrink-0"
                                        >
                                            {copied ? (
                                                <Check className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={handleOpenInNewTab}
                                            className="shrink-0"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {type === 'folder'
                                            ? 'Anyone with this link can view and download all files'
                                            : 'Anyone with this link can view and download this file'
                                        }
                                    </p>
                                </div>
                            )}

                            {/* Info for folders */}
                            {type === 'folder' && isPublic && (
                                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                        <strong>Note:</strong> Making a folder public will also make all its contents (files and subfolders) public.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>

            {/* Confirm Dialog for removing access */}
            <ConfirmDialog
                open={confirmDialog.open}
                onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
                title={confirmDialog.title}
                description={confirmDialog.description}
                onConfirm={confirmRemoveShare}
                confirmText="Remove Access"
                variant="destructive"
            />
        </Dialog>
    )
}
