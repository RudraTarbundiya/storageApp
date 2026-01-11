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
  const [showGoogleDriveSection, setShowGoogleDriveSection] = useState(false)
  const [googleDriveFiles, setGoogleDriveFiles] = useState([])
  const [googleDriveBreadcrumbs, setGoogleDriveBreadcrumbs] = useState([{ id: 'root', name: 'My Drive' }])
  const [currentGoogleDriveFolder, setCurrentGoogleDriveFolder] = useState('root')
  const [loadingGoogleDrive, setLoadingGoogleDrive] = useState(false)
  const { user, logout, logoutAll, googleLogin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchDirectoryContents("root")
  }, [])

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
      const filesRes = await fetch('http://localhost:4000/gd/list-files', {
        method: 'GET',
        credentials: 'include',
      })
      console.log(await filesRes.json())
    }
  });


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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
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
        </div>

        <button onClick={() => gdLogin()} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 mb-6">
          Connect Google Drive
        </button>

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
      </main>
    </div>
  )
}
