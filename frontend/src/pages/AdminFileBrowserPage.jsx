import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ArrowLeft, Folder, FolderOpen, Download, Eye, Loader2,
    ChevronRight, Home
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { adminAPI } from '@/lib/api'
import { useAlert, usePreview } from '@/context'
import FilePreviewModal from '@/components/FilePreviewModal'
import { getFileType, getFileIcon, getGradient, formatFileSize } from '@/lib/fileUtils'


export default function AdminFileBrowserPage() {
    const { userId } = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { showAlert } = useAlert()
    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/+$/, '')

    const userName = searchParams.get('name') || 'User'

    const [loading, setLoading] = useState(true)
    const [userInfo, setUserInfo] = useState(null)
    const [currentDir, setCurrentDir] = useState(null)
    const [directories, setDirectories] = useState([])
    const [files, setFiles] = useState([])
    const [breadcrumbs, setBreadcrumbs] = useState([])

    // Preview Management
    const { handlePreview } = usePreview()

    // Fetch user's root directory
    const fetchUserRoot = useCallback(async () => {
        try {
            const response = await adminAPI.getUserRootDir(userId)
            setUserInfo(response.data.user)
            return response.data.rootDirId
        } catch (err) {
            showAlert(err.response?.data?.error || 'Failed to fetch user info', 'destructive')
            navigate('/users')
            return null
        }
    }, [userId, showAlert, navigate])

    // Fetch directory contents
    const fetchDirectory = useCallback(async (dirId) => {
        setLoading(true)
        try {
            const response = await adminAPI.getDirectory(dirId)
            const data = response.data
            setCurrentDir({ _id: data._id, name: data.name, parentDirId: data.parentDirId })
            setDirectories(data.directories || [])
            setFiles(data.files || [])
        } catch (err) {
            showAlert(err.response?.data?.error || 'Failed to fetch directory', 'destructive')
        } finally {
            setLoading(false)
        }
    }, [showAlert])

    // Initialize - get root dir and fetch contents
    useEffect(() => {
        const init = async () => {
            const rootDirId = await fetchUserRoot()
            if (rootDirId) {
                setBreadcrumbs([{ id: rootDirId, name: 'Root' }])
                await fetchDirectory(rootDirId)
            }
        }
        init()
    }, [fetchUserRoot, fetchDirectory])

    // Navigate to a folder
    const handleOpenFolder = (folder) => {
        setBreadcrumbs(prev => [...prev, { id: folder._id || folder.id, name: folder.name }])
        fetchDirectory(folder._id || folder.id)
    }

    // Navigate via breadcrumb
    const handleBreadcrumbClick = (index) => {
        const targetBreadcrumb = breadcrumbs[index]
        setBreadcrumbs(breadcrumbs.slice(0, index + 1))
        fetchDirectory(targetBreadcrumb.id)
    }

    // Download file
    const handleDownload = (file) => {
        try {
            window.open(`${apiBaseUrl}/admin/file/${file._id || file.id}?action=download`, '_blank')
        } catch (error) {
            console.error('Download failed:', error)
        }
    }

    // Preview file using centralized logic
    const handlePreviewFile = (file) => {
        handlePreview(file, {
            fetcher: (id, signal) => adminAPI.getFile(id, { signal }),
            streamUrl: `${apiBaseUrl}/admin/file/${file._id || file.id}`
        })
    }

    if (loading && !currentDir) {
        return (
            <div className="flex items-center justify-center min-h-400px">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <>
            <div className="p-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/users')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            {userInfo?.picture && (
                                <AvatarImage src={userInfo.picture} alt={userInfo?.name} referrerPolicy="no-referrer" />
                            )}
                            <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-white">
                                {userInfo?.name?.charAt(0).toUpperCase() || userName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-xl font-semibold">{userInfo?.name || userName}'s Files</h1>
                            <p className="text-sm text-muted-foreground">{userInfo?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Breadcrumbs */}
                <div className="flex items-center gap-1 mb-4 text-sm flex-wrap">
                    {breadcrumbs.map((crumb, index) => (
                        <div key={crumb.id} className="flex items-center gap-1">
                            {index > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 px-2 ${index === breadcrumbs.length - 1 ? 'font-medium' : 'text-muted-foreground'}`}
                                onClick={() => handleBreadcrumbClick(index)}
                            >
                                {index === 0 ? <Home className="w-4 h-4 mr-1" /> : null}
                                {crumb.name}
                            </Button>
                        </div>
                    ))}
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                )}

                {/* Content */}
                {!loading && (
                    <>
                        {directories.length === 0 && files.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <Folder className="w-16 h-16 mb-4 opacity-50" />
                                <p className="text-lg">This folder is empty</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {/* Folders */}
                                {directories.map((folder) => (
                                    <motion.div
                                        key={folder._id || folder.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        whileHover={{ y: -4 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Card className="group cursor-pointer hover:shadow-lg transition-all border-slate-200 dark:border-slate-800">
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
                                                <div className="pt-2 border-t">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full h-8 text-xs"
                                                        onClick={() => handleOpenFolder(folder)}
                                                    >
                                                        <FolderOpen className="h-3 w-3 mr-1" />
                                                        Open Folder
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}

                                {/* Files */}
                                {files.map((file) => {
                                    const IconComponent = getFileIcon(file.extension)
                                    const fileType = getFileType(file.extension)
                                    const isPreviewable = ['image', 'video', 'audio', 'pdf', 'code', 'document'].includes(fileType)

                                    return (
                                        <motion.div
                                            key={file._id || file.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            whileHover={{ y: -4 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Card className="group cursor-pointer hover:shadow-lg transition-all border-slate-200 dark:border-slate-800">
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
                                                    <div className="flex gap-2 pt-2 border-t">
                                                        {isPreviewable && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="flex-1 h-8 text-xs"
                                                                onClick={() => handlePreviewFile(file)}
                                                            >
                                                                <Eye className="h-3 w-3 mr-1" />
                                                                Preview
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant={isPreviewable ? "secondary" : "outline"}
                                                            size="sm"
                                                            className={`${isPreviewable ? 'flex-1' : 'w-full'} h-8 text-xs`}
                                                            onClick={() => handleDownload(file)}
                                                        >
                                                            <Download className="h-3 w-3 mr-1" />
                                                            Download
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

            <FilePreviewModal onDownload={handleDownload} />
        </>
    )
}
