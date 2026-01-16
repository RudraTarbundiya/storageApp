import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { directoryAPI, fileAPI } from '@/lib/api'
import { useAlert } from './AlertContext'

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

    const handleUpload = useCallback(async () => {
        if (uploadFiles.length === 0) return

        setIsUploading(true)
        setUploadProgress({})

        try {
            const results = await fileAPI.uploadMultiple(
                uploadFiles,
                currentFolder,
                (index, fileName, percent) => {
                    setUploadProgress(prev => ({ ...prev, [fileName]: percent }))
                }
            )

            const successCount = results.filter(r => r.success).length
            const failCount = results.filter(r => !r.success).length

            if (failCount === 0) {
                showAlert(`${successCount} file(s) uploaded successfully`)
            } else {
                showAlert(`${successCount} succeeded, ${failCount} failed`, 'destructive')
            }

            setShowUploadDialog(false)
            setUploadFiles([])
            setUploadProgress({})
            fetchDirectory()
        } catch (error) {
            showAlert('Upload failed', 'destructive')
        } finally {
            setIsUploading(false)
        }
    }, [uploadFiles, currentFolder, showAlert, fetchDirectory])

    const handleCreateFolder = useCallback(async () => {
        if (!newFolderName.trim()) return

        try {
            await directoryAPI.create(newFolderName, currentFolder)
            showAlert('Folder created successfully')
            setShowCreateFolderDialog(false)
            setNewFolderName('')
            fetchDirectory()
        } catch (error) {
            showAlert('Failed to create folder', 'destructive')
        }
    }, [newFolderName, currentFolder, showAlert, fetchDirectory])

    const handleRename = useCallback(async () => {
        if (!newName.trim()) return

        try {
            if (renameItem.type === 'folder') {
                await directoryAPI.rename(renameItem._id, newName)
            } else {
                await fileAPI.rename(renameItem._id, newName)
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
            const response = await fileAPI.get(file._id)
            const url = window.URL.createObjectURL(response.data)
            window.open(url, '_blank')
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
