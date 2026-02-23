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

// File API
export const fileAPI = {
  upload: (file, parentDirId = null) => {
    return api.post(parentDirId ? `/file/${parentDirId}` : '/file', file, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'filename': file.name
      },
    })
  },

  // Stream-based upload using Fetch API with ReadableStream (more memory efficient)
  streamUploadWithProgress: async (file, parentDirId = null, onProgress, abortSignal) => {
    const url = `http://localhost:4000/file${parentDirId ? `/${parentDirId}` : ''}`
    const totalSize = file.size
    let uploadedSize = 0

    // Create a ReadableStream that tracks progress
    const progressStream = new ReadableStream({
      async start(controller) {
        const reader = file.stream().getReader()

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            controller.close()
            break
          }

          uploadedSize += value.length
          if (onProgress) {
            const percent = Math.round((uploadedSize / totalSize) * 100)
            onProgress(percent)
          }

          controller.enqueue(value)
        }
      }
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'filename': file.name
      },
      body: progressStream,
      credentials: 'include',
      signal: abortSignal,
      // Enable streaming upload (requires server support)
      duplex: 'half'
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Upload failed')
    }

    return await response.json()
  },

  // Upload with progress using XHR (fallback with better browser support)
  uploadWithProgress: (file, parentDirId = null, onProgress, abortSignal) => {
    // NOTE: Streaming uploads with Fetch API require HTTP/2 which Express doesn't support by default
    // Keeping XHR for now as it works reliably on HTTP/1.1
    // The streamUploadWithProgress function is available if you switch to HTTP/2 server

    // Validate file size (1GB limit)
    const MAX_FILE_SIZE = 1000 * 1024 * 1024 // 1GB
    if (file.size > MAX_FILE_SIZE) {
      return Promise.reject(new Error('File size exceeds 1GB limit'))
    }

    // Use XHR (works on HTTP/1.1, reliable progress tracking)
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const url = `http://localhost:4000/file${parentDirId ? `/${parentDirId}` : ''}`

      // Handle abort signal
      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          xhr.abort()
        })
      }

      xhr.open('POST', url, true)
      xhr.withCredentials = true
      xhr.setRequestHeader('filename', file.name)
      xhr.setRequestHeader('filesize', file.size)

      // Progress event
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100)
          onProgress(percent)
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText))
        } else if (xhr.status === 413) {
          reject(new Error('File size exceeds 1GB limit'))
        } else {
          const errorResponse = xhr.responseText ? JSON.parse(xhr.responseText) : {}
          reject(new Error(errorResponse.error || 'Upload failed'))
        }
      }

      xhr.onerror = () => reject(new Error('Network error'))
      xhr.onabort = () => reject(new Error('Upload cancelled'))

      xhr.send(file)
    })
  },

  // Upload multiple files with parallel processing (optimized)
  uploadMultipleParallel: async (files, parentDirId = null, onFileProgress, onFileComplete, onStart, concurrency = 3) => {
    const results = []
    const queue = [...files]
    let completedCount = 0

    // Create abort controllers for each file
    const abortControllers = new Map()
    files.forEach(file => {
      abortControllers.set(file.name, new AbortController())
    })

    // Provide cancel functions immediately via callback
    const cancelFns = {
      cancelUpload: (fileName) => {
        const controller = abortControllers.get(fileName)
        if (controller) controller.abort()
      },
      cancelAll: () => {
        abortControllers.forEach(controller => controller.abort())
        queue.length = 0 // Clear the queue
      }
    }

    // Call onStart immediately with cancel functions
    if (onStart) onStart(cancelFns)

    const uploadNext = async () => {
      if (queue.length === 0) return null

      const file = queue.shift()
      const abortController = abortControllers.get(file.name)

      try {
        const result = await fileAPI.uploadWithProgress(
          file,
          parentDirId,
          (percent) => {
            if (onFileProgress) onFileProgress(file.name, percent, 'uploading')
          },
          abortController.signal
        )
        results.push({ file: file.name, success: true, result })
        if (onFileProgress) onFileProgress(file.name, 100, 'completed')
      } catch (error) {
        const status = error.message === 'Upload cancelled' ? 'cancelled' : 'failed'
        results.push({ file: file.name, success: false, error: error.message, status })
        if (onFileProgress) onFileProgress(file.name, 0, status)
      }

      completedCount++
      if (onFileComplete) {
        onFileComplete(completedCount, files.length)
      }

      // Process next file in queue
      return uploadNext()
    }

    // Start concurrent uploads
    const workers = []
    for (let i = 0; i < Math.min(concurrency, files.length); i++) {
      workers.push(uploadNext())
    }

    await Promise.all(workers)

    return { results, ...cancelFns }
  },

  // Legacy sequential upload (kept for compatibility)
  uploadMultiple: async (files, parentDirId = null, onFileProgress, onOverallProgress) => {
    const results = []
    let completedCount = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const result = await fileAPI.uploadWithProgress(file, parentDirId, (percent) => {
          if (onFileProgress) onFileProgress(i, file.name, percent)
        })
        results.push({ file: file.name, success: true, result })
      } catch (error) {
        results.push({ file: file.name, success: false, error: error.message })
      }
      completedCount++
      if (onOverallProgress) {
        onOverallProgress(Math.round((completedCount / files.length) * 100), completedCount, files.length)
      }
    }
    return results
  },
  get: (id, config = {}) => api.get(`/file/${id}`, { responseType: 'blob', ...config }),
  rename: (id, newFileName) => api.patch(`/file/${id}`, { newFileName }),
  delete: (id) => api.delete(`/file/${id}`),
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