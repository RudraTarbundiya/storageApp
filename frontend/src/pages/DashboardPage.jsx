import { motion } from 'framer-motion'
import { Upload, FolderPlus, Search, Grid3x3, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import FileCard from '@/components/FileCard'
import FolderCard from '@/components/FolderCard'
import BreadcrumbNav from '@/components/BreadcrumbNav'
import { FileManagerProvider, useFileManager } from '@/context'

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
  } = useFileManager()

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
              />
            ))}
            {filteredFiles.map(file => (
              <FileCard
                key={file._id}
                file={file}
                onDownload={handleDownload}
                onOpen={handleOpenFile}
                onRename={(f) => { setRenameItem({ ...f, type: 'file' }); setNewName(f.name); setShowRenameDialog(true) }}
                onDelete={(f) => { setDeleteItem({ ...f, type: 'file' }); setShowDeleteDialog(true) }}
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
        <DialogContent>
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
            </div>

            {/* Selected files list with progress */}
            {uploadFiles.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <p className="text-sm text-muted-foreground">{uploadFiles.length} file(s) selected</p>
                {uploadFiles.map((file, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="truncate max-w-[200px]">{file.name}</span>
                      <span className="text-muted-foreground">
                        {uploadProgress[file.name] !== undefined ? `${uploadProgress[file.name]}%` : 'Pending'}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress[file.name] || 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={isUploading}>Cancel</Button>
            <Button onClick={handleUpload} disabled={uploadFiles.length === 0 || isUploading}>
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