import { useState, useEffect, useMemo } from 'react'
import { Search, Grid3x3, List, Globe, Folder, Link2, Eye, Copy, Check, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { publicAPI } from '@/lib/api'
import { useAlert } from '@/context'
import ConfirmDialog from '@/components/ConfirmDialog'
import { getFileType, getFileIcon, getGradient, formatFileSize } from '@/lib/fileUtils'

// Public File Card Component
function PublicFileCard({ file, viewMode, onMakePrivate, onCopyLink }) {
    const IconComponent = getFileIcon(file.extension)
    const publicUrl = `${window.location.origin}/share/file/${file._id}`

    if (viewMode === 'list') {
        return (
            <div className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className={`h-10 w-10 rounded-lg bg-linear-to-br ${getGradient(file.extension)} flex items-center justify-center shrink-0`}>
                    <IconComponent className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-green-600 border-green-300">
                            <Globe className="h-3 w-3 mr-1" />
                            Public
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => onCopyLink(publicUrl)}>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Link
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => onMakePrivate(file._id, 'file', file.name)}>
                        <Lock className="h-3 w-3 mr-1" />
                        Make Private
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <Card className="group hover:shadow-lg transition-all duration-200 hover:border-primary/20">
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className={`h-12 w-12 rounded-xl bg-linear-to-br ${getGradient(file.extension)} flex items-center justify-center`}>
                        <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-300">
                        <Globe className="h-3 w-3 mr-1" />
                        Public
                    </Badge>
                </div>
                <h3 className="font-medium truncate mb-1" title={file.name}>{file.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{formatFileSize(file.size)}</p>

                <div className="pt-3 border-t space-y-2">
                    <Button variant="outline" size="sm" className="w-full" onClick={() => onCopyLink(publicUrl)}>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Link
                    </Button>
                    <Button variant="outline" size="sm" className="w-full text-destructive border-destructive/40 hover:bg-destructive/10" onClick={() => onMakePrivate(file._id, 'file', file.name)}>
                        <Lock className="h-3 w-3 mr-1" />
                        Make Private
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

// Public Folder Card Component
function PublicFolderCard({ folder, viewMode, onMakePrivate, onCopyLink }) {
    const publicUrl = `${window.location.origin}/share/folder/${folder._id}`

    if (viewMode === 'list') {
        return (
            <div className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-linear-to-br from-yellow-400 to-orange-500 flex items-center justify-center shrink-0">
                    <Folder className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{folder.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{folder.itemCount || 0} items</span>
                        <span>•</span>
                        <span>{formatFileSize(folder.size)}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-green-600 border-green-300">
                            <Globe className="h-3 w-3 mr-1" />
                            Public
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => onCopyLink(publicUrl)}>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Link
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => onMakePrivate(folder._id, 'folder', folder.name)}>
                        <Lock className="h-3 w-3 mr-1" />
                        Make Private
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <Card className="group hover:shadow-lg transition-all duration-200 hover:border-primary/20">
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="h-12 w-12 rounded-xl bg-linear-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                        <Folder className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-300">
                        <Globe className="h-3 w-3 mr-1" />
                        Public
                    </Badge>
                </div>
                <h3 className="font-medium truncate mb-1" title={folder.name}>{folder.name}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <span>{folder.itemCount || 0} items</span>
                    <span>•</span>
                    <span>{formatFileSize(folder.size)}</span>
                </div>

                <div className="pt-3 border-t space-y-2">
                    <Button variant="outline" size="sm" className="w-full" onClick={() => onCopyLink(publicUrl)}>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Link
                    </Button>
                    <Button variant="outline" size="sm" className="w-full text-destructive border-destructive/40 hover:bg-destructive/10" onClick={() => onMakePrivate(folder._id, 'folder', folder.name)}>
                        <Lock className="h-3 w-3 mr-1" />
                        Make Private
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default function MyPublicSharesPage() {
    const { showAlert } = useAlert()
    const [loading, setLoading] = useState(true)
    const [files, setFiles] = useState([])
    const [directories, setDirectories] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState('grid')
    const [copiedLink, setCopiedLink] = useState(null)

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        itemId: null,
        itemName: null,
        type: null,
        isLoading: false
    })

    useEffect(() => {
        fetchPublicItems()
    }, [])

    const fetchPublicItems = async () => {
        try {
            setLoading(true)
            const response = await publicAPI.getMyPublicItems()
            setFiles(response.data.files || [])
            setDirectories(response.data.directories || [])
        } catch (error) {
            showAlert('Failed to load public items', 'destructive')
        } finally {
            setLoading(false)
        }
    }

    const handleCopyLink = async (url) => {
        try {
            await navigator.clipboard.writeText(url)
            setCopiedLink(url)
            showAlert('Link copied to clipboard')
            setTimeout(() => setCopiedLink(null), 2000)
        } catch (error) {
            showAlert('Failed to copy link', 'destructive')
        }
    }

    const handleMakePrivate = (itemId, type, itemName) => {
        setConfirmDialog({
            open: true,
            itemId,
            itemName,
            type,
            isLoading: false
        })
    }

    const handleConfirmMakePrivate = async () => {
        const { itemId, type } = confirmDialog
        setConfirmDialog(prev => ({ ...prev, isLoading: true }))

        try {
            if (type === 'folder') {
                await publicAPI.toggleDirectoryPublic(itemId, false)
                setDirectories(prev => prev.filter(d => d._id !== itemId))
            } else {
                await publicAPI.toggleFilePublic(itemId, false)
                setFiles(prev => prev.filter(f => f._id !== itemId))
            }
            showAlert('Item made private successfully')
            setConfirmDialog({ open: false, itemId: null, itemName: null, type: null, isLoading: false })
        } catch (error) {
            showAlert('Failed to make item private', 'destructive')
            setConfirmDialog(prev => ({ ...prev, isLoading: false }))
        }
    }

    const filteredDirectories = useMemo(() => (
        directories.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ), [directories, searchQuery])

    const filteredFiles = useMemo(() => (
        files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ), [files, searchQuery])

    const totalPublicItems = useMemo(() => files.length + directories.length, [files, directories])

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Globe className="h-8 w-8 text-green-500" />
                        My Public Shares
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Files and folders you've made public
                        {totalPublicItems > 0 && <span className="ml-2">({totalPublicItems} items)</span>}
                    </p>
                </div>

                {/* Search and View Toggle */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search public items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-1 border rounded-lg p-1">
                        <Button
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid3x3 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-muted-foreground">Loading...</div>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'flex flex-col gap-2'}>
                        {filteredDirectories.map(folder => (
                            <PublicFolderCard
                                key={folder._id}
                                folder={folder}
                                viewMode={viewMode}
                                onMakePrivate={handleMakePrivate}
                                onCopyLink={handleCopyLink}
                            />
                        ))}
                        {filteredFiles.map(file => (
                            <PublicFileCard
                                key={file._id}
                                file={file}
                                viewMode={viewMode}
                                onMakePrivate={handleMakePrivate}
                                onCopyLink={handleCopyLink}
                            />
                        ))}
                        {filteredDirectories.length === 0 && filteredFiles.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center h-64 text-muted-foreground">
                                <Globe className="h-16 w-16 mb-4 opacity-30" />
                                <p className="text-lg font-medium">No public items</p>
                                <p className="text-sm">Items you make public will appear here</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Confirmation Dialog */}
            <ConfirmDialog
                open={confirmDialog.open}
                onOpenChange={(open) => !open && setConfirmDialog({ open: false, itemId: null, itemName: null, type: null, isLoading: false })}
                title="Make Private"
                description={`Are you sure you want to make "${confirmDialog.itemName}" private? The public link will stop working.`}
                confirmText="Make Private"
                variant="destructive"
                isLoading={confirmDialog.isLoading}
                onConfirm={handleConfirmMakePrivate}
                icon={Lock}
            />
        </div>
    )
}
