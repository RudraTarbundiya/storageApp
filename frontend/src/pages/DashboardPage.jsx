import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, FolderPlus, Search, Grid3x3, List, Download, X, File, Image as ImageIcon, Video, FileText, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import FileCard from '@/components/FileCard'
import FolderCard from '@/components/FolderCard'
import BreadcrumbNav from '@/components/BreadcrumbNav'
import ShareDialog from '@/components/ShareDialog'
import { FileManagerProvider, useFileManager } from '@/context'
import { fileAPI } from '@/lib/api'

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
    default: return File
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

// Preview Modal Component with loading state
function PreviewModal({ open, onClose, file, fileUrl, isLoading, onDownload }) {
  const fileType = getFileType(file?.extension)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-[95vw] max-w-4xl max-h-[90vh] bg-background rounded-xl overflow-hidden shadow-2xl border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
              {(() => {
                const IconComponent = getFileIcon(file?.extension)
                return <IconComponent className="h-5 w-5 text-white" />
              })()}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium truncate text-sm md:text-base">{file?.name || 'Preview'}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{file?.extension || 'File'}</span>
                <span>•</span>
                <span>{formatFileSize(file?.size)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => onDownload?.(file)} className="hidden sm:flex">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="icon" onClick={() => onDownload?.(file)} className="sm:hidden">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Preview content */}
        <div className="flex items-center justify-center bg-slate-950 min-h-[300px] md:min-h-[400px] max-h-[70vh] overflow-auto">
          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
              <p className="text-white text-sm">Loading preview...</p>
            </div>
          )}

          {!isLoading && fileType === 'image' && fileUrl && (
            <img
              src={fileUrl}
              alt={file?.name}
              className="max-w-full max-h-[70vh] object-contain"
            />
          )}

          {!isLoading && fileType === 'video' && fileUrl && (
            <video
              src={fileUrl}
              controls
              autoPlay
              preload="metadata"
              className="max-w-full max-h-[70vh]"
            >
              Your browser does not support the video tag.
            </video>
          )}

          {!isLoading && fileType === 'audio' && fileUrl && (
            <div className="p-8 md:p-12 text-center w-full">
              <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <Music className="h-10 w-10 md:h-12 md:w-12 text-white" />
              </div>
              <h4 className="text-white font-medium mb-4 truncate px-4">{file?.name}</h4>
              <audio src={fileUrl} controls autoPlay preload="metadata" className="w-full max-w-md mx-auto" />
            </div>
          )}

          {!isLoading && fileType === 'pdf' && fileUrl && (
            <iframe
              src={fileUrl}
              className="w-full h-[70vh]"
              title={file?.name}
            />
          )}

          {!isLoading && (fileType === 'other') && (
            <div className="p-8 md:p-12 text-center text-white">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center mx-auto mb-6">
                <FileText className="h-8 w-8 md:h-10 md:w-10" />
              </div>
              <h4 className="font-medium mb-2 truncate px-4">{file?.name}</h4>
              <p className="text-slate-400 text-sm mb-6">Preview not available for this file type</p>
              <Button onClick={() => onDownload?.(file)}>
                <Download className="h-4 w-4 mr-2" />
                Download to View
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DashboardContent() {
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
    // Actions
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
    cancelAllUploads,
  } = useFileManager()

  // Share dialog state
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [shareItem, setShareItem] = useState(null)
  const [shareType, setShareType] = useState('file')

  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const handleShare = (item, type) => {
    setShareItem(item)
    setShareType(type)
    setShowShareDialog(true)
  }

  const handlePreviewFile = async (file) => {
    const fileType = getFileType(file.extension)

    // Show modal immediately with loading state
    setPreviewFile(file)
    setPreviewOpen(true)
    setPreviewLoading(true)

    try {
      // Revoke previous URL if exists
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }

      // For video and audio, use direct streaming URL for better performance
      if (fileType === 'video' || fileType === 'audio') {
        // Use direct URL that streams instead of downloading entire file
        const streamUrl = `http://localhost:4000/file/${file._id}`
        setPreviewUrl(streamUrl)
        setPreviewLoading(false)
      } else {
        // For other file types, download as blob
        const response = await fileAPI.get(file._id)
        const blobUrl = URL.createObjectURL(response.data)
        setPreviewUrl(blobUrl)
        setPreviewLoading(false)
      }
    } catch (err) {
      console.error('Preview failed:', err)
      setPreviewLoading(false)
    }
  }

  const handleClosePreview = () => {
    setPreviewOpen(false)
    setPreviewLoading(false)
    // Cleanup after a small delay to allow animation
    setTimeout(() => {
      if (previewUrl && !previewUrl.startsWith('http://localhost')) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(null)
      setPreviewFile(null)
    }, 200)
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
            <Button onClick={() => setShowUploadDialog(true)}>
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
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">Select Files</Label>
              <Input
                id="file"
                type="file"
                multiple
                onChange={(e) => setUploadFiles(Array.from(e.target.files))}
                className="mt-2"
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Files are uploaded in parallel (3 at a time) for faster performance
              </p>
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
      />

      {/* Preview Modal */}
      <PreviewModal
        open={previewOpen}
        onClose={handleClosePreview}
        file={previewFile}
        fileUrl={previewUrl}
        isLoading={previewLoading}
        onDownload={handleDownload}
      />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <FileManagerProvider>
      <DashboardContent />
    </FileManagerProvider>
  )
}