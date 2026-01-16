import { useState, useEffect } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { motion } from 'framer-motion'
import { Cloud, Download, FolderOpen, File, Home, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { googleDriveAPI } from '@/lib/api'
import { googleLoginConfig } from '@/lib/googleAuth'
import { useAlert } from '@/context'

export default function GoogleDrivePage() {
  const { showAlert } = useAlert()

  const [connected, setConnected] = useState(false)
  const [files, setFiles] = useState([])
  const [currentFolder, setCurrentFolder] = useState(null)
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextPageToken, setNextPageToken] = useState(null)
  const [importFile, setImportFile] = useState(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importing, setImporting] = useState(false)

  // Try to fetch files on mount and when folder changes
  useEffect(() => {
    fetchFiles()
  }, [currentFolder])

  // Initialize Google OAuth login
  const googleLogin = useGoogleLogin({
    ...googleLoginConfig,
    onSuccess: async (codeResponse) => {
      try {
        // Send authorization code to backend
        await googleDriveAPI.authorize(codeResponse.code)
        setConnected(true)
        showAlert('Successfully connected to Google Drive')
        fetchFiles() // Fetch files after connecting
      } catch (error) {
        console.error('Google Drive authorization failed:', error)
        showAlert('Failed to connect to Google Drive', 'destructive')
      }
    },
    onError: (error) => {
      console.error('Google login error:', error)
      showAlert('Google login failed', 'destructive')
    },
  })

  const handleConnect = () => {
    googleLogin()
  }

  const fetchFiles = async () => {
    setLoading(true)
    setNextPageToken(null) // Reset token when fetching fresh
    try {
      const response = await googleDriveAPI.listFiles(currentFolder, null)
      const filesData = response.data.files || []
      const foldersData = response.data.folders || []
      // Normalize folders to include mimeType for consistent rendering
      const normalizedFolders = foldersData.map((folder) => ({
        ...folder,
        mimeType: 'application/vnd.google-apps.folder',
      }))
      setFiles([...normalizedFolders, ...filesData])
      setNextPageToken(response.data.nextPageToken || null)
      setConnected(true) // Successfully fetched means connected
    } catch (error) {
      console.error('Failed to fetch files:', error)
      // If 401/403, user is not connected to Google Drive
      if (error.response?.status === 401 || error.response?.status === 403) {
        setConnected(false)
      } else {
        showAlert('Failed to fetch files', 'destructive')
      }
    } finally {
      setLoading(false)
      setInitialLoading(false) // Done checking connection
    }
  }

  const loadMoreFiles = async () => {
    if (!nextPageToken || loadingMore) return

    setLoadingMore(true)
    try {
      const response = await googleDriveAPI.listFiles(currentFolder, nextPageToken)
      const newFiles = response.data.files || []
      const newFolders = response.data.folders || []
      const normalizedFolders = newFolders.map((folder) => ({
        ...folder,
        mimeType: 'application/vnd.google-apps.folder',
      }))
      setFiles(prev => [...prev, ...normalizedFolders, ...newFiles])
      setNextPageToken(response.data.nextPageToken || null)
    } catch (error) {
      showAlert('Failed to load more files', 'destructive')
    } finally {
      setLoadingMore(false)
    }
  }

  const handleOpenFolder = (folder) => {
    setBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }])
    setCurrentFolder(folder.id)
  }

  const handleNavigateBreadcrumb = (folderId) => {
    if (!folderId) {
      setBreadcrumbs([])
      setCurrentFolder(null)
    } else {
      const index = breadcrumbs.findIndex(b => b.id === folderId)
      setBreadcrumbs(breadcrumbs.slice(0, index + 1))
      setCurrentFolder(folderId)
    }
  }

  const handleImportClick = (file) => {
    setImportFile(file)
    setShowImportDialog(true)
  }

  const confirmImport = async () => {
    if (!importFile) return

    setImporting(true)
    try {
      await googleDriveAPI.import(importFile.id, importFile.name, null)
      showAlert(`"${importFile.name}" imported successfully!`)
      setShowImportDialog(false)
      setImportFile(null)
    } catch (error) {
      showAlert('Import failed', 'destructive')
    } finally {
      setImporting(false)
    }
  }

  const cancelImport = () => {
    setShowImportDialog(false)
    setImportFile(null)
  }

  // Show loading while checking connection status
  if (initialLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Checking Google Drive connection...</div>
        </div>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="flex items-center justify-center w-24 h-24 mb-6">
              <img src="/googleDrive.png" alt="Google Drive" className="w-20 h-20" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Connect Google Drive</h1>
            <p className="text-muted-foreground mb-8 max-w-md">
              Import files from your Google Drive to your cloud storage. Quick, easy, and secure.
            </p>
            <Button size="lg" onClick={handleConnect} className="h-12 px-8">
              <Cloud className="mr-2 h-5 w-5" />
              Connect Google Drive
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Google Drive</h1>
            <p className="text-muted-foreground mt-1">Browse and import files</p>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-600">
            <div className="w-2 h-2 bg-green-600 rounded-full mr-2" />
            Connected
          </Badge>
        </div>

        <div className="flex items-center gap-1 text-sm overflow-x-auto pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigateBreadcrumb(null)}
            className="h-8 px-2 hover:bg-accent"
          >
            <Home className="h-4 w-4" />
          </Button>

          {breadcrumbs.map((item) => (
            <div key={item.id} className="flex items-center gap-1">
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigateBreadcrumb(item.id)}
                className="h-8 px-2 hover:bg-accent whitespace-nowrap"
              >
                {item.name}
              </Button>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {files.map(file => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
              >
                <Card className="hover:shadow-lg transition-all">
                  <CardContent className="p-4">
                    {file.mimeType === 'application/vnd.google-apps.folder' ? (
                      <div onClick={() => handleOpenFolder(file)} className="cursor-pointer">
                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm mb-3">
                          <FolderOpen className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-medium text-sm truncate">{file.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">Folder</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-sm mb-3">
                          <File className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-medium text-sm truncate mb-2">{file.name}</h3>
                        <Button
                          onClick={() => handleImportClick(file)}
                          size="sm"
                          className="w-full"
                          variant="secondary"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Import
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {files.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center h-64 text-muted-foreground">
                <p>No files found</p>
              </div>
            )}
          </div>
        )}

        {/* Load More Button */}
        {nextPageToken && !loading && (
          <div className="flex justify-center mt-6">
            <Button
              onClick={loadMoreFiles}
              disabled={loadingMore}
              variant="outline"
              className="px-8"
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>

      {/* Import Confirmation Dialog */}
      <Dialog open={showImportDialog} onOpenChange={(open) => { if (!importing) setShowImportDialog(open) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import File</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to import this file to your cloud storage?
            </p>
            {importFile && (
              <div className="mt-4 p-3 bg-secondary rounded-lg flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                  <File className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{importFile.name}</p>
                  <p className="text-xs text-muted-foreground">From Google Drive</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelImport} disabled={importing}>Cancel</Button>
            <Button onClick={confirmImport} disabled={importing}>
              {importing ? 'Importing...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}