import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { directoryAPI, fileAPI } from '@/lib/api'
import { useAlert } from './AlertContext'
import { useAuth } from './AuthContext'
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
    isRenaming: false,
    isDeleting: false,
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
    const { user } = useAuth()
    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/+$/, '')

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
    const [isRenaming, setIsRenaming] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [newFolderName, setNewFolderName] = useState('')
    const [renameItem, setRenameItem] = useState(null)
    const [newName, setNewName] = useState('')
    const [deleteItem, setDeleteItem] = useState(null)
    // Lazy initialization - don't fetch until a page that needs file data requests it
    const [initialized, setInitialized] = useState(false)

    const fetchDirectory = useCallback(async () => {
        setLoading(true)
        try {
            const response = currentFolder
                ? await directoryAPI.getById(currentFolder)
                : await directoryAPI.getRoot()

            setFolders(response.data.directories || [])
            setFiles(response.data.files || [])

            // Use the root directory's size from the API response directly
            if (!currentFolder) {
                setTotalStorageUsed(response.data.size || 0)
            }
        } catch (error) {
            showAlert('Failed to load directory', 'destructive')
        } finally {
            setLoading(false)
        }
    }, [currentFolder, showAlert])

    // Only fetch when initialized (a page that needs file data has requested it)
    // or when currentFolder changes after initialization
    useEffect(() => {
        if (initialized) {
            fetchDirectory()
        }
    }, [initialized, fetchDirectory])

    // Pages call this to trigger the first data load
    const ensureInitialized = useCallback(() => {
        if (!initialized) {
            setInitialized(true)
        }
    }, [initialized])

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

    // Store abort controller for the current upload
    const [uploadAbortController, setUploadAbortController] = useState(null)

    const handleUpload = useCallback(async () => {
        if (uploadFiles.length === 0) return
        if (isUploading) return

        const selectedFile = uploadFiles[0]

        // Calculate available storage
        const maxStorage = user?.maxStorage || 3 * 1024 * 1024 * 1024
        const availableStorage = maxStorage - totalStorageUsed

        // Check if user has any storage space available
        if (availableStorage <= 0) {
            showAlert('No storage space available. Please delete some files.', 'destructive')
            setShowUploadDialog(false)
            setUploadFiles([])
            setUploadProgress({})
            return
        }

        // Check if selected file size exceeds available storage
        if (selectedFile.size > availableStorage) {
            showAlert(
                `Upload size (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB) exceeds available storage (${(availableStorage / 1024 / 1024).toFixed(2)} MB)`,
                'destructive'
            )
            setShowUploadDialog(false)
            setUploadFiles([])
            setUploadProgress({})
            return
        }

        setIsUploading(true)
        setUploadProgress({
            [selectedFile.name]: { percent: 0, status: 'uploading' }
        })

        const abortController = new AbortController()
        setUploadAbortController(abortController)

        try {
            await fileAPI.uploadWithProgress(
                selectedFile,
                currentFolder,
                (percent) => {
                    setUploadProgress(prev => ({
                        ...prev,
                        [selectedFile.name]: { percent, status: 'uploading' }
                    }))
                },
                abortController.signal
            )

            setUploadProgress({
                [selectedFile.name]: { percent: 100, status: 'completed' }
            })
            showAlert('File uploaded successfully')

            setShowUploadDialog(false)
            setUploadFiles([])
            setUploadProgress({})
            fetchDirectory()
        } catch (error) {
            if (error?.message === 'Upload cancelled') {
                setUploadProgress({
                    [selectedFile.name]: { percent: 0, status: 'cancelled' }
                })
                showAlert('Upload cancelled', 'warning')
            } else if (error?.message === 'Another file upload is already in progress') {
                showAlert('Another upload is already in progress', 'warning')
            } else {
                setUploadProgress({
                    [selectedFile.name]: { percent: 0, status: 'failed' }
                })
                showAlert('Upload failed', 'destructive')
            }
        } finally {
            setUploadAbortController(null)
            setIsUploading(false)
        }
    }, [uploadFiles, currentFolder, showAlert, fetchDirectory, user, totalStorageUsed, isUploading])

    // Cancel a single file upload
    const cancelFileUpload = useCallback((fileName) => {
        const selectedFile = uploadFiles[0]
        if (uploadAbortController && selectedFile && selectedFile.name === fileName) {
            uploadAbortController.abort()
            setUploadProgress(prev => ({
                ...prev,
                [fileName]: { percent: 0, status: 'cancelled' }
            }))
        }
    }, [uploadAbortController, uploadFiles])

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

        setIsRenaming(true)
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
        } finally {
            setIsRenaming(false)
        }
    }, [renameItem, newName, showAlert, fetchDirectory])

    const handleDelete = useCallback(async () => {
        setIsDeleting(true)
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
        } finally {
            setIsDeleting(false)
        }
    }, [deleteItem, showAlert, fetchDirectory])

    const handleDownload = useCallback((file) => {
        try {
            const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/+$/, '')
            const downloadUrl = `${apiBaseUrl}/file/${file._id}?action=download`
            window.open(downloadUrl, '_blank')
        } catch (error) {
            showAlert('Download failed', 'destructive')
        }
    }, [showAlert])

    const handleOpenFile = useCallback((file) => {
        try {
            // Open backend endpoint directly so redirect to pre-signed URL happens via navigation, not XHR.
            window.open(`${apiBaseUrl}/file/${file._id}`, '_blank')
        } catch (error) {
            showAlert('Failed to open file', 'destructive')
        }
    }, [apiBaseUrl, showAlert])

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
        isRenaming,
        isDeleting,
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
        // Lazy initialization
        ensureInitialized,
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
