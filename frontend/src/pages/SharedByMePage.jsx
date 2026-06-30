import { useState, useEffect, useMemo } from 'react'
import { Search, Share2, Folder, File as FileIcon, Eye, Pencil, Music, Video, FileText, Image as ImageIcon, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { sharingAPI } from '@/lib/api'
import { useAlert } from '@/context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import ConfirmDialog from '@/components/ConfirmDialog'

// Helper function to determine file type
const getFileType = (extension) => {
    const ext = (extension || '').toLowerCase().replace('.', '')
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico']
    const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv']
    const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a']
    const pdfExts = ['pdf']

    if (imageExts.includes(ext)) return 'image'
    if (videoExts.includes(ext)) return 'video'
    if (audioExts.includes(ext)) return 'audio'
    if (pdfExts.includes(ext)) return 'pdf'
    return 'other'
}

// Get file icon based on type
const getFileIcon = (extension) => {
    const type = getFileType(extension)
    switch (type) {
        case 'image': return ImageIcon
        case 'video': return Video
        case 'audio': return Music
        case 'pdf': return FileText
        default: return FileIcon
    }
}

// Format file size helper
const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return 'Unknown'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// My Shared File Card Component
function MySharedFileCard({ file, viewMode, onRemoveShare }) {
    const IconComponent = getFileIcon(file.extension)
    const sharedWith = file.sharedWith || []

    if (viewMode === 'list') {
        return (
            <div className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                    <IconComponent className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>Shared with {sharedWith.length} user(s)</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                    {sharedWith.slice(0, 3).map((share, idx) => {
                        const user = share.user || {}
                        return (
                            <div key={user._id || idx} className="flex flex-col gap-1 px-3 py-2 bg-muted rounded-lg min-w-42.5">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        {user.picture && <AvatarImage src={user.picture} alt={user.name} referrerPolicy="no-referrer" />}
                                        <AvatarFallback className="text-[10px] bg-linear-to-br from-green-500 to-teal-600 text-white">
                                            {user.name?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-medium truncate">{user.name || user.email}</span>
                                        <span className="text-[11px] text-muted-foreground truncate">Can view</span>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-center text-destructive border-destructive/40 hover:bg-destructive/10"
                                    onClick={() => onRemoveShare(file._id, user._id, 'file', user.name || user.email, file.name)}
                                >
                                    Remove access
                                </Button>
                            </div>
                        )
                    })}
                    {sharedWith.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{sharedWith.length - 3} more</span>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-xl border bg-card p-4 hover:shadow-lg transition-all duration-200 hover:border-primary/20">
            <div className="flex items-start justify-between mb-3">
                <div className="h-12 w-12 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <IconComponent className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-muted-foreground">
                    {sharedWith.length} user(s)
                </span>
            </div>
            <h3 className="font-medium truncate mb-1" title={file.name}>{file.name}</h3>
            <p className="text-xs text-muted-foreground mb-3">{formatFileSize(file.size)}</p>

            <div className="pt-3 border-t space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Shared with:</p>
                <div className="flex flex-wrap gap-1">
                    {sharedWith.map((share, idx) => {
                        const user = share.user || {}
                        return (
                            <div
                                key={user._id || idx}
                                className="flex flex-col gap-1 px-3 py-2 bg-muted rounded-lg min-w-42.5 group"
                            >
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-5 w-5">
                                        {user.picture && <AvatarImage src={user.picture} alt={user.name} referrerPolicy="no-referrer" />}
                                        <AvatarFallback className="text-[9px] bg-linear-to-br from-green-500 to-teal-600 text-white">
                                            {user.name?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-medium truncate">{user.name || 'User'}</span>
                                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                            <Eye className="h-3 w-3 text-slate-500" />
                                            <span className="truncate">Can view</span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-center text-destructive border-destructive/40 hover:bg-destructive/10"
                                    onClick={() => onRemoveShare(file._id, user._id, 'file', user.name || user.email, file.name)}
                                >
                                    Remove access
                                </Button>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// My Shared Folder Card Component
function MySharedFolderCard({ folder, viewMode, onRemoveShare }) {
    const sharedWith = folder.sharedWith || []

    if (viewMode === 'list') {
        return (
            <div className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-linear-to-br from-yellow-400 to-orange-500 flex items-center justify-center shrink-0">
                    <Folder className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{folder.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Folder</span>
                        <span>•</span>
                        <span>Shared with {sharedWith.length} user(s)</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                    {sharedWith.slice(0, 3).map((share, idx) => {
                        const user = share.user || {}
                        return (
                            <div key={user._id || idx} className="flex flex-col gap-1 px-3 py-2 bg-muted rounded-lg min-w-42.5">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        {user.picture && <AvatarImage src={user.picture} alt={user.name} referrerPolicy="no-referrer" />}
                                        <AvatarFallback className="text-[10px] bg-linear-to-br from-green-500 to-teal-600 text-white">
                                            {user.name?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-medium truncate">{user.name || user.email}</span>
                                        <span className="text-[11px] text-muted-foreground truncate">Can view</span>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-center text-destructive border-destructive/40 hover:bg-destructive/10"
                                    onClick={() => onRemoveShare(folder._id, user._id, 'folder', user.name || user.email, folder.name)}
                                >
                                    Remove access
                                </Button>
                            </div>
                        )
                    })}
                    {sharedWith.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{sharedWith.length - 3} more</span>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-xl border bg-card p-4 hover:shadow-lg transition-all duration-200 hover:border-primary/20">
            <div className="flex items-start justify-between mb-3">
                <div className="h-12 w-12 rounded-xl bg-linear-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <Folder className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-muted-foreground">
                    {sharedWith.length} user(s)
                </span>
            </div>
            <h3 className="font-medium truncate mb-1" title={folder.name}>{folder.name}</h3>
            <p className="text-xs text-muted-foreground mb-3">Folder</p>

            <div className="pt-3 border-t space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Shared with:</p>
                <div className="flex flex-wrap gap-1">
                    {sharedWith.map((share, idx) => {
                        const user = share.user || {}
                        return (
                            <div
                                key={user._id || idx}
                                className="flex flex-col gap-1 px-3 py-2 bg-muted rounded-lg min-w-42.5 group"
                            >
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-5 w-5">
                                        {user.picture && <AvatarImage src={user.picture} alt={user.name} referrerPolicy="no-referrer" />}
                                        <AvatarFallback className="text-[9px] bg-linear-to-br from-green-500 to-teal-600 text-white">
                                            {user.name?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-medium truncate">{user.name || 'User'}</span>
                                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                            <Eye className="h-3 w-3 text-slate-500" />
                                            <span className="truncate">Can view</span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-center text-destructive border-destructive/40 hover:bg-destructive/10"
                                    onClick={() => onRemoveShare(folder._id, user._id, 'folder', user.name || user.email, folder.name)}
                                >
                                    Remove access
                                </Button>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default function SharedByMePage() {
    const { showAlert } = useAlert()
    const [loading, setLoading] = useState(true)
    const [files, setFiles] = useState([])
    const [directories, setDirectories] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const viewMode = 'grid'

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        itemId: null,
        userId: null,
        userName: null,
        itemName: null,
        type: null,
        isLoading: false
    })

    useEffect(() => {
        fetchSharedItems()
    }, [])

    const fetchSharedItems = async () => {
        try {
            setLoading(true)
            const response = await sharingAPI.getSharedByMe()
            setFiles(response.data.files || [])
            setDirectories(response.data.directories || [])
        } catch (error) {
            showAlert('Failed to load shared items', 'destructive')
        } finally {
            setLoading(false)
        }
    }

    const handleRemoveShare = (itemId, userId, type, userName, itemName) => {
        setConfirmDialog({
            open: true,
            itemId,
            userId,
            userName,
            itemName,
            type,
            isLoading: false
        })
    }

    const handleConfirmRemoveShare = async () => {
        const { itemId, userId, type } = confirmDialog
        setConfirmDialog(prev => ({ ...prev, isLoading: true }))

        try {
            if (type === 'folder') {
                await sharingAPI.removeDirectoryShare(itemId, userId)
                setDirectories(prev => prev.map(dir => {
                    if (dir._id === itemId) {
                        return {
                            ...dir,
                            sharedWith: dir.sharedWith.filter(s => (s.user?._id || s.user) !== userId)
                        }
                    }
                    return dir
                }).filter(dir => dir.sharedWith.length > 0))
            } else {
                await sharingAPI.removeFileShare(itemId, userId)
                setFiles(prev => prev.map(file => {
                    if (file._id === itemId) {
                        return {
                            ...file,
                            sharedWith: file.sharedWith.filter(s => (s.user?._id || s.user) !== userId)
                        }
                    }
                    return file
                }).filter(file => file.sharedWith.length > 0))
            }
            showAlert('Access removed successfully')
            setConfirmDialog({ open: false, itemId: null, userId: null, userName: null, itemName: null, type: null, isLoading: false })
        } catch (error) {
            showAlert('Failed to remove share', 'destructive')
            setConfirmDialog(prev => ({ ...prev, isLoading: false }))
        }
    }

    const filteredDirectories = useMemo(() => (
        directories.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ), [directories, searchQuery])

    const filteredFiles = useMemo(() => (
        files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ), [files, searchQuery])

    const totalSharedItems = useMemo(() => files.length + directories.length, [files, directories])

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Share2 className="h-8 w-8 text-green-500" />
                        Shared by Me
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Files and folders you've shared with others
                        {totalSharedItems > 0 && <span className="ml-2">({totalSharedItems} items)</span>}
                    </p>
                </div>

                {/* Search */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search shared items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-16">
                        <div className="relative flex items-center justify-center">
                            <div className="h-10 w-10 rounded-full border-4 border-muted/30 border-t-blue-500 animate-spin" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">Loading items...</p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'flex flex-col gap-2'}>
                        {filteredDirectories.map(folder => (
                            <MySharedFolderCard
                                key={folder._id}
                                folder={folder}
                                viewMode={viewMode}
                                onRemoveShare={handleRemoveShare}
                            />
                        ))}
                        {filteredFiles.map(file => (
                            <MySharedFileCard
                                key={file._id}
                                file={file}
                                viewMode={viewMode}
                                onRemoveShare={handleRemoveShare}
                            />
                        ))}
                        {filteredDirectories.length === 0 && filteredFiles.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center h-64 text-muted-foreground">
                                <Share2 className="h-16 w-16 mb-4 opacity-30" />
                                <p className="text-lg font-medium">No shared items</p>
                                <p className="text-sm">Items you share will appear here</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Confirmation Dialog */}
            <ConfirmDialog
                open={confirmDialog.open}
                onOpenChange={(open) => !open && setConfirmDialog({ open: false, itemId: null, userId: null, userName: null, itemName: null, type: null, isLoading: false })}
                title="Remove Access"
                description={`Are you sure you want to remove access to "${confirmDialog.itemName}" from ${confirmDialog.userName}?`}
                confirmText="Remove Access"
                variant="destructive"
                isLoading={confirmDialog.isLoading}
                onConfirm={handleConfirmRemoveShare}
                icon={Trash2}
            />
        </div>
    )
}
