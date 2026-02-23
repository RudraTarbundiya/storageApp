import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { directoryAPI, fileAPI } from '@/lib/api'
import { useAlert } from './AlertContext'
import { sanitizeInput } from '@/lib/utils'

const FileManagerContext = createContext({
    // State
    files: [],
    folders: [],
    currentFolder: null,
    breadcrumbs: [],
    loading: false,
    searchQuery: '',
    viewMode: 'grid',
    // Dialog states
    showUploadDialog: false,
    showCreateFolderDialog: false,
    showRenameDialog: false,
    showDeleteDialog: false,
    uploadFiles: [],
    uploadProgress: {},
    isUploading: false,
    newFolderName: '',
    renameItem: null,
    newName: '',
    deleteItem: null,
    // Actions
    fetchDirectory: async () => { },
    setCurrentFolder: () => { },
    setBreadcrumbs: () => { },
    setSearchQuery: () => { },
    setViewMode: () => { },
    handleOpenFolder: () => { },
    handleNavigateBreadcrumb: () => { },
    // Dialog actions
    setShowUploadDialog: () => { },
    setShowCreateFolderDialog: () => { },
    setShowRenameDialog: () => { },
    setShowDeleteDialog: () => { },
    setUploadFiles: () => { },
    setNewFolderName: () => { },
    setRenameItem: () => { },
    setNewName: () => { },
    setDeleteItem: () => { },
    // CRUD operations
    handleUpload: async () => { },
    handleCreateFolder: async () => { },
    handleRename: async () => { },
    handleDelete: async () => { },
    handleDownload: async () => { },
    handleOpenFile: async () => { },
})

export function FileManagerProvider({ children }) {
    const { showAlert } = useAlert()

    // Main state
    const [files, setFiles] = useState([])
    const [folders, setFolders] = useState([])
    const [currentFolder, setCurrentFolder] = useState(null)
    const [breadcrumbs, setBreadcrumbs] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState('grid')
    const [totalStorageUsed, setTotalStorageUsed] = useState(0)

    // Dialog states
    const [showUploadDialog, setShowUploadDialog] = useState(false)
    const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false)
    const [showRenameDialog, setShowRenameDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    // Form states
    const [uploadFiles, setUploadFiles] = useState([])
    const [uploadProgress, setUploadProgress] = useState({})
    const [isUploading, setIsUploading] = useState(false)
    const [newFolderName, setNewFolderName] = useState('')
    const [renameItem, setRenameItem] = useState(null)
    const [newName, setNewName] = useState('')
    const [deleteItem, setDeleteItem] = useState(null)

    const fetchDirectory = useCallback(async () => {
        setLoading(true)
        try {
            const response = currentFolder
                ? await directoryAPI.getById(currentFolder)
                : await directoryAPI.getRoot()

            setFolders(response.data.directories || [])
            setFiles(response.data.files || [])

            // Calculate total storage when at root
            if (!currentFolder) {
                const dirs = response.data.directories || []
                const filesData = response.data.files || []
                const dirSizes = dirs.reduce((acc, d) => acc + (d.totalSize || 0), 0)
                const fileSizes = filesData.reduce((acc, f) => acc + (f.size || 0), 0)
                setTotalStorageUsed(dirSizes + fileSizes)
            }
        } catch (error) {
            showAlert('Failed to load directory', 'destructive')
        } finally {
            setLoading(false)
        }
    }, [currentFolder, showAlert])

    // Fetch directory when currentFolder changes
    useEffect(() => {
        fetchDirectory()
    }, [fetchDirectory])

    const handleOpenFolder = useCallback((folder) => {
        setBreadcrumbs(prev => [...prev, { id: folder._id, name: folder.name }])
        setCurrentFolder(folder._id)
    }, [])

    const handleNavigateBreadcrumb = useCallback((folderId) => {
        if (!folderId) {
            setBreadcrumbs([])
            setCurrentFolder(null)
        } else {
            setBreadcrumbs(prev => {
                const index = prev.findIndex(b => b.id === folderId)
                return prev.slice(0, index + 1)
            })
            setCurrentFolder(folderId)
        }
    }, [])

    // Store cancel functions for uploads
    const [uploadCancelFns, setUploadCancelFns] = useState({ cancelUpload: null, cancelAll: null })

    const handleUpload = useCallback(async () => {
        if (uploadFiles.length === 0) return

        // Validate file sizes before upload (1GB limit)
        const MAX_FILE_SIZE = 1000 * 1024 * 1024 // 1GB
        const oversizedFiles = uploadFiles.filter(file => file.size > MAX_FILE_SIZE)
        
        if (oversizedFiles.length > 0) {
            const fileNames = oversizedFiles.map(f => f.name).join(', ')
            showAlert(`File(s) exceed 1GB limit: ${fileNames}`, 'destructive')
            setShowUploadDialog(false)
            setUploadFiles([])
            setUploadProgress({})
            return
        }

        setIsUploading(true)
        // Initialize progress with status for each file
        const initialProgress = {}
        uploadFiles.forEach(file => {
            initialProgress[file.name] = { percent: 0, status: 'pending' }
        })
        setUploadProgress(initialProgress)

        try {
            // Use parallel uploads for better performance (max 3 concurrent)
            const uploadResult = await fileAPI.uploadMultipleParallel(
                uploadFiles,
                currentFolder,
                (fileName, percent, status) => {
                    setUploadProgress(prev => ({
                        ...prev,
                        [fileName]: { percent, status }
                    }))
                },
                (completed, total) => {
                    // Optional: track overall progress
                },
                // onStart callback - receive cancel functions immediately
                (cancelFns) => {
                    setUploadCancelFns({
                        cancelUpload: cancelFns.cancelUpload,
                        cancelAll: cancelFns.cancelAll
                    })
                }
            )

            const { results } = uploadResult
            const successCount = results.filter(r => r.success).length
            const failCount = results.filter(r => !r.success && r.status !== 'cancelled').length
            const cancelledCount = results.filter(r => r.status === 'cancelled').length

            if (failCount === 0 && cancelledCount === 0) {
                showAlert(`${successCount} file(s) uploaded successfully`)
            } else if (cancelledCount > 0) {
                showAlert(`${successCount} uploaded, ${cancelledCount} cancelled`, 'warning')
            } else {
                showAlert(`${successCount} succeeded, ${failCount} failed`, 'destructive')
            }

            setShowUploadDialog(false)
            setUploadFiles([])
            setUploadProgress({})
            setUploadCancelFns({ cancelUpload: null, cancelAll: null })
            fetchDirectory()
        } catch (error) {
            showAlert('Upload failed', 'destructive')
        } finally {
            setIsUploading(false)
        }
    }, [uploadFiles, currentFolder, showAlert, fetchDirectory])

    // Cancel a single file upload
    const cancelFileUpload = useCallback((fileName) => {
        if (uploadCancelFns.cancelUpload) {
            uploadCancelFns.cancelUpload(fileName)
            setUploadProgress(prev => ({
                ...prev,
                [fileName]: { percent: 0, status: 'cancelled' }
            }))
        }
    }, [uploadCancelFns])

    // Cancel all uploads
    const cancelAllUploads = useCallback(() => {
        if (uploadCancelFns.cancelAll) {
            uploadCancelFns.cancelAll()
        }
    }, [uploadCancelFns])

    const handleCreateFolder = useCallback(async () => {
        const safeFolderName = sanitizeInput(newFolderName).trim()
        if (!safeFolderName) return

        try {
            await directoryAPI.create(safeFolderName, currentFolder)
            showAlert('Folder created successfully')
            setShowCreateFolderDialog(false)
            setNewFolderName('')
            fetchDirectory()
        } catch (error) {
            showAlert('Failed to create folder', 'destructive')
        }
    }, [newFolderName, currentFolder, showAlert, fetchDirectory])

    const handleRename = useCallback(async () => {
        const safeNewName = sanitizeInput(newName).trim()
        if (!safeNewName) return

        try {
            if (renameItem.type === 'folder') {
                await directoryAPI.rename(renameItem._id, safeNewName)
            } else {
                await fileAPI.rename(renameItem._id, safeNewName)
            }
            showAlert('Renamed successfully')
            setShowRenameDialog(false)
            setRenameItem(null)
            setNewName('')
            fetchDirectory()
        } catch (error) {
            showAlert('Rename failed', 'destructive')
        }
    }, [renameItem, newName, showAlert, fetchDirectory])

    const handleDelete = useCallback(async () => {
        try {
            if (deleteItem.type === 'folder') {
                await directoryAPI.delete(deleteItem._id)
            } else {
                await fileAPI.delete(deleteItem._id)
            }
            showAlert('Deleted successfully')
            setShowDeleteDialog(false)
            setDeleteItem(null)
            fetchDirectory()
        } catch (error) {
            showAlert('Delete failed', 'destructive')
        }
    }, [deleteItem, showAlert, fetchDirectory])

    const handleDownload = useCallback(async (file) => {
        try {
            const response = await fileAPI.get(file._id)
            const url = window.URL.createObjectURL(response.data)
            const link = document.createElement('a')
            link.href = url
            link.download = file.name
            link.click()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            showAlert('Download failed', 'destructive')
        }
    }, [showAlert])

    const handleOpenFile = useCallback(async (file) => {
        try {
            // Check file type for streaming vs blob download
            const ext = (file.extension || '').toLowerCase().replace('.', '')
            const streamableExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'mp3', 'wav', 'aac', 'flac', 'm4a']

            if (streamableExts.includes(ext)) {
                // For video/audio, open the streaming URL directly (more efficient)
                window.open(`http://localhost:4000/file/${file._id}`, '_blank')
            } else {
                // For other files, download blob and open
                const response = await fileAPI.get(file._id)
                const url = window.URL.createObjectURL(response.data)
                window.open(url, '_blank')
            }
        } catch (error) {
            showAlert('Failed to open file', 'destructive')
        }
    }, [showAlert])

    const value = {
        // State
        files,
        folders,
        currentFolder,
        breadcrumbs,
        loading,
        searchQuery,
        viewMode,
        totalStorageUsed,
        // Dialog states
        showUploadDialog,
        showCreateFolderDialog,
        showRenameDialog,
        showDeleteDialog,
        uploadFiles,
        uploadProgress,
        isUploading,
        newFolderName,
        renameItem,
        newName,
        deleteItem,
        // Actions
        fetchDirectory,
        setCurrentFolder,
        setBreadcrumbs,
        setSearchQuery,
        setViewMode,
        handleOpenFolder,
        handleNavigateBreadcrumb,
        // Dialog actions
        setShowUploadDialog,
        setShowCreateFolderDialog,
        setShowRenameDialog,
        setShowDeleteDialog,
        setUploadFiles,
        setNewFolderName,
        setRenameItem,
        setNewName,
        setDeleteItem,
        // CRUD operations
        handleUpload,
        handleCreateFolder,
        handleRename,
        handleDelete,
        handleDownload,
        handleOpenFile,
        // Upload cancel functions
        cancelFileUpload,
        cancelAllUploads,
    }

    return (
        <FileManagerContext.Provider value={value}>
            {children}
        </FileManagerContext.Provider>
    )
}

export const useFileManager = () => {
    const context = useContext(FileManagerContext)
    if (context === undefined) {
        throw new Error('useFileManager must be used within a FileManagerProvider')
    }
    return context
}

export default FileManagerContext
