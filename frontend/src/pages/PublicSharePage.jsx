import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Folder,
    Download,
    ExternalLink,
    ChevronRight,
    Home,
    AlertCircle,
    Eye,
    Grid3x3,
    List,
    Lock,
    Search,
    File as FileIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { publicAPI } from '@/lib/api'
import { usePreview } from '@/context'
import FilePreviewModal from '@/components/FilePreviewModal'
import { getFileType, getFileIcon, getGradient, formatFileSize } from '@/lib/fileUtils'



// File preview component for guest users - with always visible buttons
function PublicFileCard({ file, onPreview, onDownload }) {
    const IconComponent = getFileIcon(file.extension)
    const fileType = getFileType(file.extension)
    const isPreviewable = ['image', 'video', 'audio', 'pdf', 'code', 'document'].includes(fileType)

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
        >
            <Card className="group hover:shadow-lg transition-all border-slate-200 dark:border-slate-800">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-lg bg-linear-to-br ${getGradient(file.extension)} shadow-sm`}>
                            <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">
                            {formatFileSize(file.size)}
                        </span>
                    </div>

                    <div className="mb-3">
                        <h3 className="font-medium text-sm truncate mb-1">{file.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                            {file.extension || 'File'}
                        </Badge>
                    </div>

                    {/* Always visible action buttons */}
                    <div className="flex gap-2 pt-2 border-t">
                        {isPreviewable && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 text-xs"
                                onClick={() => onPreview?.(file)}
                            >
                                <Eye className="h-3 w-3 mr-1" />
                                Preview
                            </Button>
                        )}
                        <Button
                            variant={isPreviewable ? "secondary" : "outline"}
                            size="sm"
                            className={`${isPreviewable ? 'flex-1' : 'w-full'} h-8 text-xs`}
                            onClick={() => onDownload?.(file)}
                        >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

// Folder card for navigation in public view
function PublicFolderCard({ folder, onOpen }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
        >
            <Card
                className="group cursor-pointer hover:shadow-lg transition-all border-slate-200 dark:border-slate-800"
                onClick={() => onOpen?.(folder)}
            >
                <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-linear-to-br from-amber-400 to-orange-500 shadow-sm">
                            <Folder className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">
                            {formatFileSize(folder.size)}
                        </span>
                    </div>

                    <div className="mb-3">
                        <h3 className="font-medium text-sm truncate">{folder.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            {folder.itemCount || 0} items
                        </p>
                    </div>

                    {/* Open button for consistency */}
                    <div className="pt-2 border-t">
                        <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                            <Folder className="h-3 w-3 mr-1" />
                            Open Folder
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

// Breadcrumb component for public view
function PublicBreadcrumb({ items, onNavigate }) {
    return (
        <nav className="flex items-center gap-1 text-sm overflow-x-auto pb-2 scrollbar-hide">
            <button
                onClick={() => onNavigate(null)}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors shrink-0 px-2 py-1 rounded-md hover:bg-muted"
            >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Shared</span>
            </button>
            {items.map((item, index) => (
                <div key={item.id} className="flex items-center gap-1 shrink-0">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <button
                        onClick={() => onNavigate(item.id, index)}
                        className={`hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted truncate max-w-30 sm:max-w-50 ${index === items.length - 1
                            ? 'text-foreground font-medium'
                            : 'text-muted-foreground'
                            }`}
                    >
                        {item.name}
                    </button>
                </div>
            ))}
        </nav>
    )
}

export default function PublicSharePage() {
    const { type, id } = useParams()
    const navigate = useNavigate()
    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/+$/, '')

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [data, setData] = useState(null)
    const [breadcrumbs, setBreadcrumbs] = useState([])
    const [currentFolderId, setCurrentFolderId] = useState(null)
    const [viewMode, setViewMode] = useState('grid')
    const [searchQuery, setSearchQuery] = useState('')

    // Preview management
    const { handlePreview } = usePreview()


    // Single file data
    const [singleFileData, setSingleFileData] = useState(null)

    const fetchPublicContent = useCallback(async (folderId = null) => {
        setLoading(true)
        setError(null)

        try {
            if (type === 'file') {
                // Fetch metadata separately so public file pages don't depend on XHR following an S3 redirect.
                const response = await publicAPI.getPublicFileInfo(id)
                const fileObj = response.data
                setSingleFileData(fileObj)
                setData({ type: 'file', id, fileInfo: fileObj })
            } else if (type === 'folder') {
                // For folder, fetch the directory content
                const targetId = folderId || id
                const response = await publicAPI.getPublicDirectory(targetId)
                setData({
                    type: 'folder',
                    ...response.data,
                    directories: response.data.directories || [],
                    files: response.data.files || []
                })
            }
        } catch (err) {
            console.error('Error fetching public content:', err)
            if (err.response?.status === 404) {
                setError('This content is not available. It may have been removed or made private.')
            } else {
                setError('Failed to load shared content. Please try again later.')
            }
        } finally {
            setLoading(false)
        }
    }, [type, id])

    useEffect(() => {
        fetchPublicContent(currentFolderId)
    }, [fetchPublicContent, currentFolderId])


    const handleOpenFolder = (folder) => {
        setBreadcrumbs(prev => [...prev, { id: folder._id, name: folder.name }])
        setCurrentFolderId(folder._id)
    }

    const handleNavigateBreadcrumb = (folderId, index) => {
        if (!folderId) {
            // Navigate to root
            setBreadcrumbs([])
            setCurrentFolderId(null)
        } else {
            setBreadcrumbs(prev => prev.slice(0, index + 1))
            setCurrentFolderId(folderId)
        }
    }

    const handlePreviewFile = (file) => {
        handlePreview(file, {
            fetcher: (id, signal) => publicAPI.getPublicFile(id, { signal }),
            streamUrl: `${apiBaseUrl}/public/file/${file._id}`
        })
    }


    const handleDownloadFile = async (file) => {
        try {
            window.open(`${apiBaseUrl}/public/file/${file._id}?action=download`, '_blank')
        } catch (err) {
            console.error('Download failed:', err)
        }
    }

    // Filter content based on search
    const filteredFolders = data?.directories?.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

    const filteredFiles = data?.files?.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading shared content...</p>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="p-6 md:p-8 text-center">
                        <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Content Unavailable</h2>
                        <p className="text-muted-foreground mb-6 text-sm">{error}</p>
                        <Button onClick={() => navigate('/')} variant="outline">
                            Go to Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Single file view - Same UI as folder but with one file card
    if (type === 'file' && data?.type === 'file' && singleFileData) {
        const fileType = getFileType(singleFileData.extension)
        const isPreviewable = ['image', 'video', 'audio', 'pdf', 'code', 'document'].includes(fileType)

        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b">
                    <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm shrink-0">
                                    <FileIcon className="h-4 w-4 md:h-5 md:w-5 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <h1 className="font-semibold text-base md:text-lg truncate">Shared File</h1>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Lock className="h-3 w-3" />
                                        Read-only access
                                    </p>
                                </div>
                            </div>
                            <Badge variant="secondary" className="gap-1 shrink-0 text-xs">
                                <ExternalLink className="h-3 w-3" />
                                <span className="hidden sm:inline">Public Share</span>
                            </Badge>
                        </div>
                    </div>
                </header>

                {/* Main content */}
                <main className="container mx-auto px-4 md:px-6 py-4 md:py-8 max-w-7xl">
                    {/* Breadcrumb for single file */}
                    <div className="mb-4 md:mb-6">
                        <nav className="flex items-center gap-1 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground px-2 py-1">
                                <Home className="h-4 w-4" />
                                <span>Shared File</span>
                            </div>
                        </nav>
                    </div>

                    {/* Single file card in grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                        <PublicFileCard
                            file={singleFileData}
                            onPreview={() => handlePreviewFile(singleFileData)}
                            onDownload={() => handleDownloadFile(singleFileData)}
                        />
                    </div>

                    {/* Info footer */}
                    <div className="mt-8 md:mt-12 p-4 md:p-6 rounded-xl bg-slate-100 dark:bg-slate-800/50 border text-center">
                        <p className="text-xs md:text-sm text-muted-foreground">
                            This file has been shared publicly. You can preview and download it, but cannot modify it.
                        </p>
                    </div>
                </main>

                <FilePreviewModal onDownload={handleDownloadFile} />
            </div>
        )
    }

    // Folder view
    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b">
                <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shrink-0">
                                <Folder className="h-4 w-4 md:h-5 md:w-5 text-white" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="font-semibold text-base md:text-lg truncate">{data?.name || 'Shared Folder'}</h1>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Lock className="h-3 w-3" />
                                    Read-only access
                                </p>
                            </div>
                        </div>
                        <Badge variant="secondary" className="gap-1 shrink-0 text-xs">
                            <ExternalLink className="h-3 w-3" />
                            <span className="hidden sm:inline">Public Share</span>
                        </Badge>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="container mx-auto px-4 md:px-6 py-4 md:py-8 max-w-7xl">
                {/* Breadcrumbs */}
                <div className="mb-4 md:mb-6">
                    <PublicBreadcrumb
                        items={breadcrumbs}
                        onNavigate={handleNavigateBreadcrumb}
                    />
                </div>

                {/* Search and view toggle */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 mb-4 md:mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search files and folders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-1 border rounded-lg p-1 bg-white dark:bg-slate-800 self-end sm:self-auto">
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

                {/* Content grid - responsive */}
                <AnimatePresence mode="wait">
                    <div className={viewMode === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4'
                        : 'flex flex-col gap-2'
                    }>
                        {filteredFolders.map(folder => (
                            <PublicFolderCard
                                key={folder._id}
                                folder={folder}
                                onOpen={handleOpenFolder}
                            />
                        ))}
                        {filteredFiles.map(file => (
                            <PublicFileCard
                                key={file._id}
                                file={file}
                                onPreview={handlePreviewFile}
                                onDownload={handleDownloadFile}
                            />
                        ))}
                        {filteredFolders.length === 0 && filteredFiles.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center h-48 md:h-64 text-muted-foreground">
                                <Folder className="h-10 w-10 md:h-12 md:w-12 mb-4 opacity-50" />
                                <p className="text-sm">No files or folders found</p>
                            </div>
                        )}
                    </div>
                </AnimatePresence>

                {/* Info footer */}
                <div className="mt-8 md:mt-12 p-4 md:p-6 rounded-xl bg-slate-100 dark:bg-slate-800/50 border text-center">
                    <p className="text-xs md:text-sm text-muted-foreground">
                        This content has been shared publicly. You can preview and download files, but cannot modify them.
                    </p>
                </div>
            </main>

            <FilePreviewModal onDownload={handleDownloadFile} />
        </div>
    )
}
