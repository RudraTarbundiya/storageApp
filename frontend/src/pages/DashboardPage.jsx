import React from 'react'
import { Upload, FolderPlus, Search, Grid3x3, List, Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import FileCard from '@/components/FileCard'
import FolderCard from '@/components/FolderCard'
import BreadcrumbNav from '@/components/BreadcrumbNav'
import ShareDialog from '@/components/ShareDialog'
import FilePreviewModal from '@/components/FilePreviewModal'
import FileDetailsModal from '@/components/FileDetailsModal'
import FolderDetailsModal from '@/components/FolderDetailsModal'
import { useFileManager, usePreview, useAuth } from '@/context'


function DashboardContent() {
  const { user } = useAuth()
  const {
    files,
    folders,
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
    totalStorageUsed,
    // Actions
    fetchDirectory,
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
    // Cancel functions
    cancelFileUpload,
  } = useFileManager()

  // Calculate available storage
  const maxStorage = user?.maxStorage || 3 * 1024 * 1024 * 1024 // Default 3GB
  const availableStorage = maxStorage - totalStorageUsed
  const hasNoStorage = availableStorage <= 0

  // Share dialog state
  const [showShareDialog, setShowShareDialog] = React.useState(false)
  const [shareItem, setShareItem] = React.useState(null)
  const [shareType, setShareType] = React.useState('file')

  // Details modal state
  const [showDetailsModal, setShowDetailsModal] = React.useState(false)
  const [detailsFile, setDetailsFile] = React.useState(null)

  // Folder details modal state
  const [showFolderDetailsModal, setShowFolderDetailsModal] = React.useState(false)
  const [detailsFolder, setDetailsFolder] = React.useState(null)

  const handleShowDetails = (file) => {
    setDetailsFile(file)
    setShowDetailsModal(true)
  }

  const handleShowFolderDetails = (folder) => {
    setDetailsFolder(folder)
    setShowFolderDetailsModal(true)
  }

  // Preview management
  const { handlePreview } = usePreview()

  const handleShare = (item, type) => {
    setShareItem(item)
    setShareType(type)
    setShowShareDialog(true)
  }

  const handlePreviewFile = (file) => {
    handlePreview(file)
  }

  const filteredFolders = folders.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Files</h1>
            <p className="text-muted-foreground mt-1">Manage your files and folders</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowCreateFolderDialog(true)} variant="outline">
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            <Button 
              onClick={() => setShowUploadDialog(true)}
              disabled={hasNoStorage}
              title={hasNoStorage ? 'No storage space available' : 'Upload file'}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files and folders..."
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

        <BreadcrumbNav items={breadcrumbs} onNavigate={handleNavigateBreadcrumb} />

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'flex flex-col gap-2'}>
            {filteredFolders.map(folder => (
              <FolderCard
                key={folder._id}
                folder={folder}
                onOpen={handleOpenFolder}
                onRename={(f) => { setRenameItem({ ...f, type: 'folder' }); setNewName(f.name); setShowRenameDialog(true) }}
                onDelete={(f) => { setDeleteItem({ ...f, type: 'folder' }); setShowDeleteDialog(true) }}
                onShare={(f) => handleShare(f, 'folder')}
                onDetails={handleShowFolderDetails}
              />
            ))}
            {filteredFiles.map(file => (
              <FileCard
                key={file._id}
                file={file}
                onDownload={handleDownload}
                onOpen={handleOpenFile}
                onPreview={handlePreviewFile}
                onRename={(f) => { setRenameItem({ ...f, type: 'file' }); setNewName(f.name); setShowRenameDialog(true) }}
                onDelete={(f) => { setDeleteItem({ ...f, type: 'file' }); setShowDeleteDialog(true) }}
                onShare={(f) => handleShare(f, 'file')}
                onDetails={handleShowDetails}
              />
            ))}
            {filteredFolders.length === 0 && filteredFiles.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center h-64 text-muted-foreground">
                <p>No files or folders found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={(open) => { if (!isUploading) setShowUploadDialog(open) }}>
        <DialogContent className="w-[94vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">Select File</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0]
                  setUploadFiles(selectedFile ? [selectedFile] : [])
                }}
                className="mt-2"
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Only one file can be uploaded at a time
              </p>
              {availableStorage > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Available storage: {(availableStorage / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>

            {/* Selected files list with enhanced progress */}
            {uploadFiles.length > 0 && (
              <div className="space-y-2 max-h-[50vh] sm:max-h-[55vh] overflow-y-auto border rounded-lg p-3 bg-muted/30">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-2">
                  <p className="text-sm font-medium">{uploadFiles.length} file(s) selected</p>
                  <p className="text-xs text-muted-foreground">
                    {uploadFiles.reduce((acc, f) => acc + f.size, 0) > 1024 * 1024
                      ? `${(uploadFiles.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(1)} MB total`
                      : `${(uploadFiles.reduce((acc, f) => acc + f.size, 0) / 1024).toFixed(1)} KB total`}
                  </p>
                </div>
                {uploadFiles.map((file, index) => {
                  const progress = uploadProgress[file.name]
                  const percent = progress?.percent || 0
                  const status = progress?.status || 'pending'
                  const canCancel = status === 'pending' || status === 'uploading'

                  // Status colors
                  const statusColors = {
                    pending: 'bg-slate-400',
                    uploading: 'bg-blue-500',
                    completed: 'bg-green-500',
                    failed: 'bg-red-500',
                    cancelled: 'bg-yellow-500'
                  }

                  return (
                    <div key={index} className="space-y-2 p-2 rounded-md bg-background">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={`h-2 w-2 rounded-full ${statusColors[status]} shrink-0`} />
                          <span className="truncate" title={file.name}>{file.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                          <span className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(0)} KB
                          </span>
                          <span className={`text-xs font-medium ${status === 'completed' ? 'text-green-600' :
                            status === 'failed' ? 'text-red-600' :
                              status === 'uploading' ? 'text-blue-600' :
                                status === 'cancelled' ? 'text-yellow-600' :
                                  'text-muted-foreground'
                            }`}>
                            {status === 'uploading' ? `${percent}%` :
                              status === 'completed' ? '✓' :
                                status === 'failed' ? '✗' :
                                  status === 'cancelled' ? 'Cancelled' :
                                    'Pending'}
                          </span>
                          {/* Cancel button for pending or uploading files */}
                          {canCancel && isUploading && (
                            <button
                              onClick={() => cancelFileUpload(file.name)}
                              className="h-5 w-5 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 flex items-center justify-center text-red-600 transition-colors"
                              title="Cancel upload"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      {status === 'uploading' && (
                        <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3">
            <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={isUploading} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleUpload} disabled={uploadFiles.length === 0 || isUploading} className="w-full sm:w-auto">
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="foldername">Folder Name</Label>
              <Input
                id="foldername"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFolderDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {renameItem?.type === 'folder' ? 'Folder' : 'File'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newname">New Name</Label>
              <Input
                id="newname"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new name"
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>Cancel</Button>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteItem?.type === 'folder' ? 'Folder' : 'File'}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete "{deleteItem?.name}"? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        item={shareItem}
        type={shareType}
        onShareSuccess={fetchDirectory}
      />

      <FilePreviewModal onDownload={handleDownload} />

      <FileDetailsModal
        file={detailsFile}
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />

      <FolderDetailsModal
        folder={detailsFolder}
        open={showFolderDetailsModal}
        onClose={() => setShowFolderDetailsModal(false)}
      />
    </div>
  )
}

export default function DashboardPage() {
  return <DashboardContent />
}