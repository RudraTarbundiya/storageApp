import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Auth API
export const authAPI = {
  sendOTP: (email) => api.post('/auth/send-otp', { email }),
  googleLogin: (credential) => api.post('/auth/google-login', { credential }),
}

// User API
export const userAPI = {
  register: (data) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/profile'),
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  logoutAll: () => api.post('/auth/logoutall'),
  updateProfile: (data) => api.post('/auth/change-profile', data),
}

// Admin API (admin-only endpoints)
export const adminAPI = {
  getUsers: () => api.get('/users'),
  logoutUser: (userId) => api.post(`/users/${userId}/logout`),
  deleteUser: (userId) => api.delete(`/users/${userId}/delete`),
  changeUserRole: (userId, newRole) => api.post(`/users/${userId}/role`, { newRole }),
  // Admin file browser
  getUserRootDir: (userId) => api.get(`/admin/user/${userId}/root`),
  getDirectory: (dirId) => api.get(`/admin/directory/${dirId}`),
  getFile: (fileId, config = {}) => api.get(`/admin/file/${fileId}`, { responseType: 'blob', ...config }),
  downloadFile: (fileId) => api.get(`/admin/file/${fileId}?action=download`, { responseType: 'blob' }),
}

// Owner API (owner-only endpoints)
export const ownerAPI = {
  getDeletedUsers: () => api.get('/users/deleted'),
  hardDeleteUser: (userId) => api.delete(`/users/${userId}/delete/hard`),
  recoverUser: (userId) => api.post(`/users/${userId}/recover`),
}

// Directory API
export const directoryAPI = {
  getRoot: () => api.get('/directory'),
  getById: (id) => api.get(`/directory/${id}`),
  create: (dirname, parentId = null) =>
    api.post(parentId ? `/directory/${parentId}` : '/directory', { dirname }),
  rename: (id, newDirName) => api.patch(`/directory/${id}`, { newDirName }),
  delete: (id) => api.delete(`/directory/${id}`),
}

let isFileUploadInProgress = false

// File API
export const fileAPI = {
  initUpload: (filename, filesize, parentDirId = null) => {
    const endpoint = parentDirId ? `/file/upload/init/${parentDirId}` : '/file/upload/init'
    return api.post(
      endpoint,
      { filename, filesize , filetype: file.type }
    )
  },

  completeUpload: (fileId) => api.post(`/file/upload/complete/${fileId}`),

  // Upload with progress using XHR
  uploadWithProgress: (file, parentDirId = null, onProgress, abortSignal) => {
    if (isFileUploadInProgress) {
      return Promise.reject(new Error('Another file upload is already in progress'))
    }

    isFileUploadInProgress = true

    // Use XHR for direct upload to pre-signed S3 URL
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      let abortHandler = null
      let hasBeenAborted = false

      const cleanup = () => {
        isFileUploadInProgress = false
        if (abortSignal && abortHandler) {
          abortSignal.removeEventListener('abort', abortHandler)
        }
      }

      const startUpload = async () => {
        try {
          const initResponse = await fileAPI.initUpload(file.name, file.size, parentDirId)
          const { uploadUrl, fileId } = initResponse.data || {}
          if (!uploadUrl || !fileId) {
            cleanup()
            reject(new Error('Failed to initiate upload'))
            return
          }

          if (abortSignal) {
            abortHandler = () => {
              hasBeenAborted = true
              xhr.abort()
            }
            abortSignal.addEventListener('abort', abortHandler)
          }

          xhr.open('PUT', uploadUrl, true)
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')

          // Progress event
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
              const percent = Math.round((event.loaded / event.total) * 100)
              onProgress(percent)
            }
          }

          xhr.onload = async () => {
            if (hasBeenAborted) {
              cleanup()
              reject(new Error('Upload cancelled'))
              return
            }

            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                await fileAPI.completeUpload(fileId)
                cleanup()
                resolve({ fileId, message: 'File uploaded successfully' })
              } catch (error) {
                cleanup()
                const completeError = error?.response?.data?.error || 'Failed to complete upload'
                reject(new Error(completeError))
              }
            } else {
              cleanup()
              reject(new Error('Upload to storage failed'))
            }
          }

          xhr.onerror = () => {
            cleanup()
            reject(new Error('Network error'))
          }

          xhr.onabort = () => {
            cleanup()
            reject(new Error('Upload cancelled'))
          }

          xhr.send(file)
        } catch (error) {
          cleanup()
          const initError = error?.response?.data?.error || error?.message || 'Failed to initiate upload'
          reject(new Error(initError))
        }
      }

      startUpload()
    })
  },
  get: (id, config = {}) => api.get(`/file/${id}`, { responseType: 'blob', ...config }),
  rename: (id, newFileName) => api.patch(`/file/${id}`, { newFileName }),
  delete: (id) => api.delete(`/file/${id}`)
}

// Google Drive API
export const googleDriveAPI = {
  authorize: (code) => api.post('/gd/auth-code', { code }),
  listFiles: (folderId = null, pageToken = null) => {
    const params = {}
    if (folderId) params.folderId = folderId
    if (pageToken) params.pageToken = pageToken
    return api.get('/gd/list-files', { params })
  },
  import: (fileId, fileName, parentDirId = null) =>
    api.post('/gd/import', { fileId, fileName, parentDirId }),
}

// Public Sharing API
export const publicAPI = {
  // Get current user's public items (requires auth)
  getMyPublicItems: () => api.get('/public/my-items'),

  // Toggle public status (requires auth)
  toggleDirectoryPublic: (id, isPublic) => api.patch(`/public/dir/${id}/toggle`, { isPublic }),
  toggleFilePublic: (id, isPublic) => api.patch(`/public/file/${id}/toggle`, { isPublic }),

  // Access public content (no auth required)
  getPublicDirectory: (id) => api.get(`/public/dir/${id}`),
  getPublicFileInfo: (id) => api.get(`/public/file/${id}?info=1`),
  getPublicFile: (id, config = {}) => api.get(`/public/file/${id}`, { responseType: 'blob', ...config }),
  downloadPublicFile: (id) => api.get(`/public/file/${id}?action=download`, { responseType: 'blob' }),
}

// User-specific Sharing API
export const sharingAPI = {
  // Search users by email for sharing (send email in body)
  searchUsers: (email) => api.post('/shared/search', { email }),

  // Share file/directory with a specific user
  shareFile: (fileId, shareUserId, permission) =>
    api.post(`/shared/file/${fileId}`, { shareUserId, permission }),
  shareDirectory: (dirId, shareUserId, permission) =>
    api.post(`/shared/dir/${dirId}`, { shareUserId, permission }),

  // Remove share from file/directory
  removeFileShare: (fileId, userId) => api.delete(`/shared/file/${fileId}/${userId}`),
  removeDirectoryShare: (dirId, userId) => api.delete(`/shared/dir/${dirId}/${userId}`),

  // Get shared items
  getSharedWithMe: () => api.get('/shared/with-me'),
  getSharedByMe: () => api.get('/shared/by-me'),

  // Access shared file/directory content
  getSharedFile: (id, config = {}) => api.get(`/shared/file/${id}`, { responseType: 'blob', ...config }),
  getSharedDirectory: (id) => api.get(`/shared/dir/${id}`),
}

export default api