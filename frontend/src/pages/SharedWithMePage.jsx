import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Search, Grid3x3, List, Users, Folder, Download, Eye, Pencil, ChevronRight, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { sharingAPI } from '@/lib/api'
import { useAlert, usePreview } from '@/context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import FilePreviewModal from '@/components/FilePreviewModal'
import { getFileType, getFileIcon, formatFileSize } from '@/lib/fileUtils'


// Shared File Card Component
function SharedFileCard({ file, viewMode, onPreview, onDownload }) {
    const IconComponent = getFileIcon(file.extension)
    // Get owner info from populated userId field
    const ownerData = file.userId || {}
    const ownerName = ownerData.name || ownerData.email || 'Unknown'
    const ownerPicture = ownerData.picture || null
    const ownerInitial = ownerName?.charAt(0) || 'U'

    const myPermission = file.sharedWith?.find(s => s.user)?.permission === 'edit' ? 'edit' : 'view'
    const permissionLabel = myPermission === 'edit' ? 'Can edit' : 'Can view'
    const badgeClasses = myPermission === 'edit'
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    const isPreviewable = ['image', 'video', 'audio', 'pdf', 'code', 'document'].includes(getFileType(file.extension))

    if (viewMode === 'list') {
        return (
            <div className="group rounded-xl border bg-card p-4 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                        <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="font-medium truncate">{file.name}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{formatFileSize(file.size)}</span>
                                    <span>•</span>
                                    <span>From: {ownerName}</span>
                                </div>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badgeClasses}`}>
                                {myPermission === 'edit' ? <Pencil className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                {permissionLabel}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                            <Avatar className="h-7 w-7">
                                {ownerPicture && <AvatarImage src={ownerPicture} alt={ownerName} referrerPolicy="no-referrer" />}
                                <AvatarFallback className="text-[11px] bg-linear-to-br from-green-500 to-teal-600 text-white">
                                    {ownerInitial}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground truncate">{ownerName}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                            {isPreviewable && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 text-xs w-full"
                                    onClick={() => onPreview(file)}
                                >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Preview
                                </Button>
                            )}
                            <Button
                                variant={isPreviewable ? 'secondary' : 'outline'}
                                size="sm"
                                className={`${isPreviewable ? '' : 'sm:col-span-2'} h-9 text-xs w-full`}
                                onClick={() => onDownload(file)}
                            >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <Card className="group rounded-xl border bg-card hover:shadow-lg transition-all">
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="h-12 w-12 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badgeClasses}`}>
                        {myPermission === 'edit' ? <Pencil className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {permissionLabel}
                    </span>
                </div>

                <h3 className="font-medium truncate mb-1" title={file.name}>{file.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{formatFileSize(file.size)}</p>

                <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                        {ownerPicture && <AvatarImage src={ownerPicture} alt={ownerName} referrerPolicy="no-referrer" />}
                        <AvatarFallback className="text-[11px] bg-linear-to-br from-green-500 to-teal-600 text-white">
                            {ownerInitial}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground truncate">{ownerName}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-4 border-t mt-4">
                    {isPreviewable && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 text-xs w-full"
                            onClick={() => onPreview(file)}
                        >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                        </Button>
                    )}
                    <Button
                        variant={isPreviewable ? 'secondary' : 'outline'}
                        size="sm"
                        className={`${isPreviewable ? '' : 'sm:col-span-2'} h-9 text-xs w-full`}
                        onClick={() => onDownload(file)}
                    >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

// Shared Folder Card Component
function SharedFolderCard({ folder, viewMode, onOpen }) {
    // Get owner info from populated userId field
    const ownerData = folder.userId || {}
    const ownerName = ownerData.name || ownerData.email || 'Unknown'
    const ownerPicture = ownerData.picture || null
    const ownerInitial = ownerName?.charAt(0) || 'U'

    const myPermission = folder.sharedWith?.find(s => s.user)?.permission === 'edit' ? 'edit' : 'view'
    const permissionLabel = myPermission === 'edit' ? 'Can edit' : 'Can view'
    const badgeClasses = myPermission === 'edit'
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'

    if (viewMode === 'list') {
        return (
            <div className="group rounded-xl border bg-card p-4 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-linear-to-br from-yellow-400 to-orange-500 flex items-center justify-center shrink-0 cursor-pointer" onClick={() => onOpen(folder)}>
                        <Folder className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="font-medium truncate">{folder.name}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>Folder</span>
                                    <span>•</span>
                                    <span>From: {ownerName}</span>
                                </div>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badgeClasses}`}>
                                {myPermission === 'edit' ? <Pencil className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                {permissionLabel}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                            <Avatar className="h-7 w-7">
                                {ownerPicture && <AvatarImage src={ownerPicture} alt={ownerName} referrerPolicy="no-referrer" />}
                                <AvatarFallback className="text-[11px] bg-linear-to-br from-green-500 to-teal-600 text-white">
                                    {ownerInitial}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground truncate">{ownerName}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-1 gap-2 mt-4">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="h-9 text-xs w-full"
                                onClick={() => onOpen(folder)}
                            >
                                Open folder
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <Card className="group rounded-xl border bg-card hover:shadow-lg transition-all cursor-pointer" onClick={() => onOpen(folder)}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="h-12 w-12 rounded-xl bg-linear-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                        <Folder className="h-6 w-6 text-white" />
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badgeClasses}`}>
                        {myPermission === 'edit' ? <Pencil className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {permissionLabel}
                    </span>
                </div>

                <h3 className="font-medium truncate mb-1" title={folder.name}>{folder.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">Folder</p>

                <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                        {ownerPicture && <AvatarImage src={ownerPicture} alt={ownerName} referrerPolicy="no-referrer" />}
                        <AvatarFallback className="text-[11px] bg-linear-to-br from-green-500 to-teal-600 text-white">
                            {ownerInitial}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground truncate">{ownerName}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-1 gap-2 pt-4 border-t mt-4">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="h-9 text-xs w-full"
                        onClick={(e) => { e.stopPropagation(); onOpen(folder) }}
                    >
                        Open folder
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default function SharedWithMePage() {
    const { showAlert } = useAlert()
    const [loading, setLoading] = useState(true)
    const [files, setFiles] = useState([])
    const [directories, setDirectories] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState('grid')

    // Navigation state for folders
    const [currentFolderId, setCurrentFolderId] = useState(null)
    const [folderPath, setFolderPath] = useState([{ id: null, name: 'Shared with Me' }])
    const [folderLoading, setFolderLoading] = useState(false)

    // Preview state
    const { handlePreview } = usePreview()

    // Track if initial root data has been fetched
    const hasLoadedRoot = useRef(false)
    // Cache for folder contents to avoid refetching
    const folderCache = useRef(new Map())
    // Cache for root data
    const rootCache = useRef({ files: [], directories: [] })

    const fetchSharedItems = useCallback(async (forceRefresh = false) => {
        // If already loaded and not forcing refresh, use cached root data
        if (hasLoadedRoot.current && !forceRefresh) {
            setFiles(rootCache.current.files)
            setDirectories(rootCache.current.directories)
            setLoading(false)
            return
        }
        try {
            setLoading(true)
            const response = await sharingAPI.getSharedWithMe()
            const files = response.data.files || []
            const directories = response.data.directories || []
            // Cache the root data
            rootCache.current = { files, directories }
            setFiles(files)
            setDirectories(directories)
            hasLoadedRoot.current = true
        } catch (error) {
            showAlert('Failed to load shared items', 'destructive')
        } finally {
            setLoading(false)
        }
    }, [showAlert])

    const fetchFolderContents = useCallback(async (folderId, forceRefresh = false) => {
        // Check cache first (skip if forcing refresh)
        if (!forceRefresh && folderCache.current.has(folderId)) {
            const cached = folderCache.current.get(folderId)
            setFiles(cached.files)
            setDirectories(cached.directories)
            setFolderLoading(false)
            return
        }
        try {
            setFolderLoading(true)
            const response = await sharingAPI.getSharedDirectory(folderId)
            const files = response.data.files || []
            const directories = response.data.directories || []
            // Cache the result
            folderCache.current.set(folderId, { files, directories })
            setFiles(files)
            setDirectories(directories)
        } catch (error) {
            showAlert('Failed to load folder contents', 'destructive')
        } finally {
            setFolderLoading(false)
        }
    }, [showAlert])

    useEffect(() => {
        if (currentFolderId === null) {
            fetchSharedItems()
        } else {
            fetchFolderContents(currentFolderId)
        }
    }, [currentFolderId, fetchSharedItems, fetchFolderContents])



    const handlePreviewFile = (file) => {
        handlePreview(file)
    }

    const handleDownload = (file) => {
        try {
            const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/+$/, '')
            window.open(`${apiBaseUrl}/shared/file/${file._id}?action=download`, '_blank')
        } catch (error) {
            showAlert('Failed to download file', 'destructive')
        }
    }

    const handleOpenFolder = (folder) => {
        setFolderPath([...folderPath, { id: folder._id, name: folder.name }])
        setCurrentFolderId(folder._id)
    }

    const handleNavigateTo = (index) => {
        const newPath = folderPath.slice(0, index + 1)
        setFolderPath(newPath)
        setCurrentFolderId(newPath[newPath.length - 1].id)
    }


    const filteredDirectories = useMemo(() => (
        directories.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ), [directories, searchQuery])

    const filteredFiles = useMemo(() => (
        files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ), [files, searchQuery])

    const isLoading = currentFolderId === null ? loading : folderLoading

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Users className="h-8 w-8 text-blue-500" />
                        Shared with Me
                    </h1>
                    <p className="text-muted-foreground mt-1">Files and folders others have shared with you</p>
                </div>

                {/* Breadcrumb Navigation */}
                <div className="flex items-center gap-1 text-sm p-3 bg-card rounded-lg border flex-wrap">
                    {folderPath.map((item, index) => (
                        <div key={item.id || 'root'} className="flex items-center gap-1">
                            {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            <button
                                onClick={() => handleNavigateTo(index)}
                                className={`hover:text-blue-500 transition-colors truncate max-w-37.5 flex items-center gap-1 ${index === folderPath.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                            >
                                {index === 0 ? (
                                    <>
                                        <Home className="h-4 w-4" />
                                        <span>{item.name}</span>
                                    </>
                                ) : (
                                    <>
                                        <Folder className="h-4 w-4" />
                                        <span className="truncate">{item.name}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Search and View Toggle */}
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
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <div className="text-muted-foreground text-sm">Loading items...</div>
                        </div>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'flex flex-col gap-2'}>
                        {filteredDirectories.map(folder => (
                            <SharedFolderCard
                                key={folder._id}
                                folder={folder}
                                viewMode={viewMode}
                                onOpen={handleOpenFolder}
                            />
                        ))}
                        {filteredFiles.map(file => (
                            <SharedFileCard
                                key={file._id}
                                file={file}
                                viewMode={viewMode}
                                onPreview={handlePreviewFile}
                                onDownload={handleDownload}
                            />
                        ))}
                        {filteredDirectories.length === 0 && filteredFiles.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center h-64 text-muted-foreground">
                                <Users className="h-16 w-16 mb-4 opacity-30" />
                                <p className="text-lg font-medium">No shared items</p>
                                <p className="text-sm">Items shared with you will appear here</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <FilePreviewModal onDownload={handleDownload} />
        </div>
    )
}
