"use client"
import { useGoogleLogin } from '@react-oauth/google'
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import ThemeToggle from "../ThemeToggle"
import FileCard from "../FileCard"

export default function DashboardPage() {
  const [files, setFiles] = useState([])
  const [folders, setFolders] = useState([])
  const [currentFolder, setCurrentFolder] = useState(null)
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: "root", name: "My Drive" }])
  const [loading, setLoading] = useState(true)
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [renameTarget, setRenameTarget] = useState(null)
  const [renameNewName, setRenameNewName] = useState("")
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [activeTab, setActiveTab] = useState('storage')
  const [googleDriveFiles, setGoogleDriveFiles] = useState([])
  const [googleDriveBreadcrumbs, setGoogleDriveBreadcrumbs] = useState([{ id: 'root', name: 'My Drive' }])
  const [currentGoogleDriveFolder, setCurrentGoogleDriveFolder] = useState('root')
  const [loadingGoogleDrive, setLoadingGoogleDrive] = useState(false)
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false)
  const [nextPageToken, setNextPageToken] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const { user, logout, logoutAll } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchDirectoryContents("root")
    checkGoogleDriveConnection()
  }, [])

  useEffect(() => {
    if (activeTab === 'google-drive' && googleDriveConnected && googleDriveFiles.length === 0) {
      fetchGoogleDriveFiles('root')
    }
  }, [activeTab, googleDriveConnected])

  const checkGoogleDriveConnection = async () => {
    try {
      const response = await fetch('http://localhost:4000/gd/list-files', {
        credentials: 'include',
      })
      if (response.ok) {
        setGoogleDriveConnected(true)
      }
    } catch (error) {
      console.error('Error checking Google Drive connection:', error)
    }
  }

  const gdLogin = useGoogleLogin({
    flow: 'auth-code',
    scope: 'openid email https://www.googleapis.com/auth/drive.readonly',
    prompt: 'consent',
    onSuccess: async (code) => {
      console.log(code)
      const res = await fetch('http://localhost:4000/gd/auth-code', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: code })
      })
      console.log(await res.json())
      setGoogleDriveConnected(true)
      await fetchGoogleDriveFiles('root')
      setActiveTab('google-drive')
    }
  });

  const fetchGoogleDriveFiles = async (folderId, pageToken = null, append = false) => {
    append ? setLoadingMore(true) : setLoadingGoogleDrive(true)
    try {
      const params = new URLSearchParams()
      if (folderId && folderId !== 'root') {
        params.append('folderId', folderId)
      }
      if (pageToken) {
        params.append('pageToken', pageToken)
      }
      const url = `http://localhost:4000/gd/list-files?${params.toString()}`
      const filesRes = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      })
      const data = await filesRes.json()
      console.log('Google Drive files response:', data)
      // Combine folders and files into one array
      const allItems = [...(data.folders || []), ...(data.files || [])]
      if (Array.isArray(allItems)) {
        if (append) {
          setGoogleDriveFiles(prev => [...prev, ...allItems])
        } else {
          setGoogleDriveFiles(allItems)
        }
        setNextPageToken(data.nextPageToken || null)
      } else {
        console.error('Invalid files response:', data)
        if (!append) {
          setGoogleDriveFiles([])
          setNextPageToken(null)
        }
      }
    } catch (error) {
      console.error('Error fetching Google Drive files:', error)
      if (!append) {
        setGoogleDriveFiles([])
        setNextPageToken(null)
      }
    } finally {
      append ? setLoadingMore(false) : setLoadingGoogleDrive(false)
    }
  }

  const handleOpenGoogleDriveFolder = (folder) => {
    setGoogleDriveBreadcrumbs([...googleDriveBreadcrumbs, { id: folder.id, name: folder.name }])
    setCurrentGoogleDriveFolder(folder.id)
    fetchGoogleDriveFiles(folder.id)
  }

  const handleNavigateGoogleDriveBreadcrumb = (index) => {
    const newBreadcrumbs = googleDriveBreadcrumbs.slice(0, index + 1)
    setGoogleDriveBreadcrumbs(newBreadcrumbs)
    const folderId = newBreadcrumbs[index].id
    setCurrentGoogleDriveFolder(folderId)
    fetchGoogleDriveFiles(folderId)
  }

  const handleImportFromGoogleDrive = async (file) => {
    if (!file || file.mimeType === 'application/vnd.google-apps.folder') {
      alert('Cannot import folders')
      return
    }

    setLoadingGoogleDrive(true)
    try {
      const response = await fetch('http://localhost:4000/gd/import', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: file.id
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`"${file.name}" imported successfully!`)
        fetchDirectoryContents(currentFolder)
      } else {
        alert(`Error: ${data.error || 'Failed to import file'}`)
      }
    } catch (error) {
      console.error('Error importing file:', error)
      alert('Error importing file')
    } finally {
      setLoadingGoogleDrive(false)
    }
  }

  const fetchDirectoryContents = async (dirId) => {
    setLoading(true)
    try {
      const url = dirId === "root" ? "http://localhost:4000/directory" : `http://localhost:4000/directory/${dirId}`
      const response = await fetch(url, { credentials: "include" })
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setFiles(data.files || [])
      setFolders(data.directories || [])
      setCurrentFolder(dirId)
    } catch (error) {
      console.error("Error fetching directory:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      const url = currentFolder === "root"
        ? "http://localhost:4000/directory"
        : `http://localhost:4000/directory/${currentFolder}`
      const response = await fetch(url, {
        method: "POST",
        // Backend expects folder name in header "dirname"
        headers: { dirname: newFolderName },
        credentials: "include",
      })
      if (response.ok) {
        setNewFolderName("")
        setShowNewFolderModal(false)
        fetchDirectoryContents(currentFolder)
      }
    } catch (error) {
      console.error("Error creating folder:", error)
    }
  }

  const handleOpenFolder = (folder) => {
    setBreadcrumbs([...breadcrumbs, { id: folder._id, name: folder.name }])
    fetchDirectoryContents(folder._id)
  }

  const handleNavigateBreadcrumb = (index) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1)
    setBreadcrumbs(newBreadcrumbs)
    const folderId = newBreadcrumbs[index].id === "root" ? "root" : newBreadcrumbs[index].id
    fetchDirectoryContents(folderId)
  }

  const handleDeleteFile = async (file) => {
    if (!confirm(`Delete "${file.name}"?`)) return
    try {
      await fetch(`http://localhost:4000/file/${file._id}`, {
        method: "DELETE",
        credentials: "include",
      })
      fetchDirectoryContents(currentFolder)
    } catch (error) {
      console.error("Error deleting file:", error)
    }
  }

  const handleDeleteFolder = async (folder) => {
    if (!confirm(`Delete folder "${folder.name}" and its contents?`)) return
    try {
      await fetch(`http://localhost:4000/directory/${folder._id}`, {
        method: "DELETE",
        credentials: "include",
      })
      fetchDirectoryContents(currentFolder ?? "root")
    } catch (error) {
      console.error("Error deleting folder:", error)
    }
  }

  const handleRenameFile = (file) => {
    setRenameTarget(file)
    setRenameNewName(file.name)
    setShowRenameModal(true)
  }

  const submitRename = async () => {
    if (!renameTarget || !renameNewName.trim()) return
    try {
      await fetch(`http://localhost:4000/file/${renameTarget._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newFileName: renameNewName.trim() }),
      })
      setShowRenameModal(false)
      setRenameTarget(null)
      setRenameNewName("")
      fetchDirectoryContents(currentFolder)
    } catch (error) {
      console.error("Error renaming file:", error)
    }
  }

  const fileInputRef = useRef(null)
  const handleClickUpload = () => fileInputRef.current?.click()
  const handleUploadFiles = async (e) => {
    const filesList = Array.from(e.target.files || [])
    if (!filesList.length) return
    for (const f of filesList) {
      try {
        const url = currentFolder === "root"
          ? "http://localhost:4000/file"
          : `http://localhost:4000/file/${currentFolder}`
        await fetch(url, {
          method: "POST",
          headers: { filename: f.name },
          credentials: "include",
          body: f,
        })
      } catch (err) {
        console.error("Upload failed for", f.name, err)
      }
    }
    // reset input to allow re-uploading same file name
    e.target.value = ""
    fetchDirectoryContents(currentFolder)
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Header */}
      <header className="sticky top-0 border-b border-border bg-surface z-50">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-primary">Drive</h1>
            <nav className="flex items-center gap-2">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.id} className="flex items-center gap-2">
                  {index > 0 && <span className="text-text-secondary">/</span>}
                  <button
                    onClick={() => handleNavigateBreadcrumb(index)}
                    className="hover:text-primary transition-colors"
                  >
                    {crumb.name}
                  </button>
                </div>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-3 pl-4 border-l border-border relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors"
              >
                <img
                  src={user?.picture || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user?.name || "User") + "&background=random"}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium">{user?.name}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showProfileDropdown ? "rotate-180" : ""}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowProfileDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-72 bg-surface border border-border rounded-lg shadow-lg z-20 overflow-hidden">
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center gap-3">
                        <img
                          src={user?.picture || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user?.name || "User") + "&background=random&size=64"}
                          alt="Profile"
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary truncate">{user?.name}</p>
                          <p className="text-sm text-text-secondary truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false)
                          handleLogout()
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-surface-hover rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                        </svg>
                        Logout
                      </button>
                      <button
                        onClick={async () => {
                          setShowProfileDropdown(false)
                          await logoutAll()
                          navigate("/login")
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-surface-hover rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                        </svg>
                        Logout All Devices
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="sticky top-16 border-b border-border bg-surface z-40">
        <div className="max-w-7xl mx-auto flex gap-8 px-6">
          <button
            onClick={() => setActiveTab('storage')}
            className={`py-4 px-2 font-medium border-b-2 transition-colors ${activeTab === 'storage'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z"></path>
                <path fillRule="evenodd" d="M3 9a1 1 0 011-1h12a1 1 0 011 1v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9zm5 4a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
              </svg>
              Storage App
            </span>
          </button>
          <button
            onClick={() => setActiveTab('google-drive')}
            className={`py-4 px-2 font-medium border-b-2 transition-colors ${activeTab === 'google-drive'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
          >
            <span className="flex items-center gap-2">
              <img
                src="https://ssl.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png"
                alt="Google Drive"
                className="w-5 h-5"
                loading="lazy"
              />
              Google Drive
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Storage App Tab */}
        {activeTab === 'storage' && (
          <>
            {/* Toolbar */}
            <div className="mb-6 flex gap-3">
              <button
                onClick={() => setShowNewFolderModal(true)}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    d="M10.5 1.5H3a1.5 1.5 0 00-1.5 1.5v12a1.5 1.5 0 001.5 1.5h10a1.5 1.5 0 001.5-1.5V6.5m-5-5v5m0-5L10.5 1.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  />
                </svg>
                New Folder
              </button>
              <button
                onClick={handleClickUpload}
                className="px-4 py-2 border border-border hover:bg-surface-hover rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 16a2 2 0 002 2h10a2 2 0 002-2v-6a1 1 0 10-2 0v6H5v-6a1 1 0 10-2 0v6zm7-12a1 1 0 011 1v4h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H5a1 1 0 110-2h3V5a1 1 0 011-1z" />
                </svg>
                Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleUploadFiles}
              />
              {!googleDriveConnected && (
                <button onClick={() => gdLogin()} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 ml-auto">
                  <img
                    src="https://ssl.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png"
                    alt="Google Drive"
                    className="w-5 h-5"
                    loading="lazy"
                  />
                  Connect Google Drive
                </button>
              )}
            </div>

            {/* New Folder Modal */}
            {showNewFolderModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-sm">
                  <h2 className="text-xl font-bold text-text-primary mb-4">New Folder</h2>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateFolder()
                      if (e.key === "Escape") setShowNewFolderModal(false)
                    }}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleCreateFolder}
                      className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowNewFolderModal(false)
                        setNewFolderName("")
                      }}
                      className="flex-1 py-2 border border-border hover:bg-surface-hover rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showRenameModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-sm">
                  <h2 className="text-xl font-bold text-text-primary mb-4">Rename File</h2>
                  <input
                    type="text"
                    value={renameNewName}
                    onChange={(e) => setRenameNewName(e.target.value)}
                    placeholder="New file name"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitRename()
                      if (e.key === "Escape") setShowRenameModal(false)
                    }}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={submitRename}
                      className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => {
                        setShowRenameModal(false)
                        setRenameTarget(null)
                        setRenameNewName("")
                      }}
                      className="flex-1 py-2 border border-border hover:bg-surface-hover rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Files Grid */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-text-secondary">Loading...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {folders.length === 0 && files.length === 0 ? (
                  <div className="col-span-full flex items-center justify-center h-64">
                    <div className="text-center">
                      <p className="text-2xl mb-2">📁</p>
                      <p className="text-text-secondary">This folder is empty</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {folders.map((folder) => (
                      <FileCard
                        key={folder._id}
                        item={folder}
                        onSelect={handleOpenFolder}
                        onDelete={handleDeleteFolder}
                        onRename={() => { }}
                        isFile={false}
                      />
                    ))}
                    {files.map((file) => (
                      <FileCard
                        key={file._id}
                        item={file}
                        onSelect={() => { }}
                        onDelete={handleDeleteFile}
                        onRename={handleRenameFile}
                        isFile={true}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* Google Drive Tab */}
        {activeTab === 'google-drive' && (
          <>
            {!googleDriveConnected ? (
              <div className="flex flex-col items-center justify-center h-96">
                <div className="text-center">
                  <svg className="w-20 h-20 text-green-600 mx-auto mb-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.71,3.5L1.15,15L4.58,21L11.13,9.5M9.73,15L6.3,21H19.42L22.85,15M22.28,14L15.42,2H8.58L8.57,2L15.43,14H22.28Z" />
                  </svg>
                  <h2 className="text-3xl font-bold text-text-primary mb-4">Connect Google Drive</h2>
                  <p className="text-text-secondary mb-8 max-w-md mx-auto">
                    Connect your Google Drive account to browse and import files directly into your storage.
                  </p>
                  <button
                    onClick={() => gdLogin()}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors flex items-center gap-2 mx-auto"
                  >
                    <img
                      src="https://ssl.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png"
                      alt="Google Drive"
                      className="w-5 h-5"
                      loading="lazy"
                    />
                    Connect Google Drive
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Google Drive Toolbar */}
                <div className="mb-6 flex gap-3 items-center justify-between">
                  <nav className="flex items-center gap-2">
                    {googleDriveBreadcrumbs.map((crumb, index) => (
                      <div key={crumb.id} className="flex items-center gap-2">
                        {index > 0 && <span className="text-text-secondary">/</span>}
                        <button
                          onClick={() => handleNavigateGoogleDriveBreadcrumb(index)}
                          className="hover:text-primary transition-colors font-medium"
                        >
                          {crumb.name}
                        </button>
                      </div>
                    ))}
                  </nav>
                </div>

                {/* Google Drive Files Grid */}
                {loadingGoogleDrive ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-text-secondary">Loading Google Drive...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {!googleDriveFiles || googleDriveFiles.length === 0 ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                          <p className="text-2xl mb-2">📁</p>
                          <p className="text-text-secondary">This folder is empty</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Folders Section */}
                        {googleDriveFiles.filter(item => item.mimeType === 'application/vnd.google-apps.folder').length > 0 && (
                          <>
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Folders</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
                              {googleDriveFiles.filter(item => item.mimeType === 'application/vnd.google-apps.folder').map((item) => {
                        const isFolder = item.mimeType === 'application/vnd.google-apps.folder'
                        const isGoogleDoc = item.mimeType?.includes('google-apps')
                        const isPDF = item.mimeType === 'application/pdf'
                        const isImage = item.mimeType?.startsWith('image/')
                        
                        return (
                          <div
                            key={item.id}
                            className="group relative bg-surface border border-border rounded-lg overflow-hidden hover:shadow-lg hover:border-green-600 transition-all cursor-pointer"
                            onClick={() => isFolder && handleOpenGoogleDriveFolder(item)}
                          >
                            {/* Thumbnail/Icon Area */}
                            <div className="aspect-square bg-background flex items-center justify-center p-4 relative">
                              {isFolder ? (
                                <svg className="w-16 h-16 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                                </svg>
                              ) : isGoogleDoc && item.mimeType.includes('document') ? (
                                <svg className="w-16 h-16 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8v-2zm0-4h8v2H8v-2zm0-4h5v2H8V7z"/>
                                </svg>
                              ) : isGoogleDoc && item.mimeType.includes('spreadsheet') ? (
                                <svg className="w-16 h-16 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                                </svg>
                              ) : isGoogleDoc && item.mimeType.includes('presentation') ? (
                                <svg className="w-16 h-16 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                                </svg>
                              ) : isGoogleDoc && item.mimeType.includes('colaboratory') ? (
                                <svg className="w-16 h-16 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M9 4v1.38c-.83-.33-1.72-.5-2.61-.5-1.79 0-3.58.68-4.95 2.05l3.33 3.33h1.11v1.11c.86.86 1.98 1.31 3.11 1.36V15H6v3c0 1.1.9 2 2 2h10c1.66 0 3-1.34 3-3V4H9zm-1.11 6.41V8.26H5.61L4.57 7.22a5.07 5.07 0 011.82-.34c1.34 0 2.59.52 3.54 1.46l1.41 1.41-.2.2a2.7 2.7 0 01-1.92.8c-.47 0-.93-.12-1.33-.34zM19 17c0 .55-.45 1-1 1s-1-.45-1-1v-2h-6v-2.59c.57-.23 1.1-.57 1.56-1.03l.2-.2L15.59 14H17v-1.41l-6-5.97V6h8v11z"/>
                                </svg>
                              ) : isPDF ? (
                                <svg className="w-16 h-16 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 11h-2v5H9v-5H7v-2h2V9h2v2h2v2zm1-6V3.5L18.5 8H14z"/>
                                </svg>
                              ) : isImage ? (
                                <svg className="w-16 h-16 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                </svg>
                              ) : (
                                <svg className="w-16 h-16 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                                </svg>
                              )}
                              
                              {/* Three-dot menu button */}
                              {!isFolder && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleImportFromGoogleDrive(item)
                                  }}
                                  disabled={loadingGoogleDrive}
                                  className="absolute top-2 right-2 p-1.5 bg-surface hover:bg-surface-hover rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md border border-border"
                                >
                                  <svg className="w-5 h-5 text-text-primary" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                  </svg>
                                </button>
                              )}
                            </div>
                            
                            {/* File Name */}
                            <div className="px-3 py-2 border-t border-border">
                              <p className="text-sm font-medium text-text-primary truncate" title={item.name}>
                                {item.name}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                            </div>
                          </>
                        )}

                        {/* Files Section */}
                        {googleDriveFiles.filter(item => item.mimeType !== 'application/vnd.google-apps.folder').length > 0 && (
                          <>
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Files</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                              {googleDriveFiles.filter(item => item.mimeType !== 'application/vnd.google-apps.folder').map((item) => {
                                const isGoogleDoc = item.mimeType?.includes('google-apps')
                                const isPDF = item.mimeType === 'application/pdf'
                                const isImage = item.mimeType?.startsWith('image/')
                                
                                return (
                                  <div
                                    key={item.id}
                                    className="group relative bg-surface border border-border rounded-lg overflow-hidden hover:shadow-lg hover:border-green-600 transition-all"
                                  >
                                    {/* Thumbnail/Icon Area */}
                                    <div className="aspect-square bg-background flex items-center justify-center p-4 relative">
                                      {isGoogleDoc && item.mimeType.includes('document') ? (
                                        <svg className="w-16 h-16 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8v-2zm0-4h8v2H8v-2zm0-4h5v2H8V7z"/>
                                        </svg>
                                      ) : isGoogleDoc && item.mimeType.includes('spreadsheet') ? (
                                        <svg className="w-16 h-16 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                                        </svg>
                                      ) : isGoogleDoc && item.mimeType.includes('presentation') ? (
                                        <svg className="w-16 h-16 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                                        </svg>
                                      ) : isGoogleDoc && item.mimeType.includes('colaboratory') ? (
                                        <svg className="w-16 h-16 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M9 4v1.38c-.83-.33-1.72-.5-2.61-.5-1.79 0-3.58.68-4.95 2.05l3.33 3.33h1.11v1.11c.86.86 1.98 1.31 3.11 1.36V15H6v3c0 1.1.9 2 2 2h10c1.66 0 3-1.34 3-3V4H9zm-1.11 6.41V8.26H5.61L4.57 7.22a5.07 5.07 0 011.82-.34c1.34 0 2.59.52 3.54 1.46l1.41 1.41-.2.2a2.7 2.7 0 01-1.92.8c-.47 0-.93-.12-1.33-.34zM19 17c0 .55-.45 1-1 1s-1-.45-1-1v-2h-6v-2.59c.57-.23 1.1-.57 1.56-1.03l.2-.2L15.59 14H17v-1.41l-6-5.97V6h8v11z"/>
                                        </svg>
                                      ) : isPDF ? (
                                        <svg className="w-16 h-16 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 11h-2v5H9v-5H7v-2h2V9h2v2h2v2zm1-6V3.5L18.5 8H14z"/>
                                        </svg>
                                      ) : isImage ? (
                                        <svg className="w-16 h-16 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                        </svg>
                                      ) : (
                                        <svg className="w-16 h-16 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                                        </svg>
                                      )}
                                      
                                      {/* Three-dot menu button */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleImportFromGoogleDrive(item)
                                        }}
                                        disabled={loadingGoogleDrive}
                                        className="absolute top-2 right-2 p-1.5 bg-surface hover:bg-surface-hover rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md border border-border"
                                      >
                                        <svg className="w-5 h-5 text-text-primary" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                        </svg>
                                      </button>
                                    </div>
                                    
                                    {/* File Name */}
                                    <div className="px-3 py-2 border-t border-border">
                                      <p className="text-sm font-medium text-text-primary truncate" title={item.name}>
                                        {item.name}
                                      </p>
                                    </div>
                                    
                                    {/* Import Button Overlay (on hover for files) */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleImportFromGoogleDrive(item)
                                        }}
                                        disabled={loadingGoogleDrive}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {loadingGoogleDrive ? 'Importing...' : 'Import'}
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* Load More Button */}
                {nextPageToken && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => fetchGoogleDriveFiles(currentGoogleDriveFolder, nextPageToken, true)}
                      disabled={loadingMore}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 1119.414 9.414.75.75 0 011.06 1.06A8.501 8.501 0 115.5 3.102V4a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                          Load More Files
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
