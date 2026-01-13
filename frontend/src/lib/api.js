import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:4000/',
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
  register: (data) => api.post('/user', data),
  getCurrentUser: () => api.get('/user/profile'),
  login: (email, password) => api.post('/user/login', { email, password }),
  logout: () => api.post('/user/logout'),
  logoutAll: () => api.post('/user/logoutall'),
}

// Directory API
export const directoryAPI = {
  getRoot: () => api.get('/directory'),
  getById: (id) => api.get(`/directory/${id}`),
  create: (dirname, parentId = null) =>
    api.post(parentId ? `/directory/${parentId}` : '/directory', { dirname }),
  rename: (id, newName) => api.patch(`/directory/${id}`, { newName }),
  delete: (id) => api.delete(`/directory/${id}`),
}

// File API
export const fileAPI = {
  upload: (file, parentDirId = null) => {
    return api.post(parentDirId ? `/file/${parentDirId}` : '/file', file, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'filename': encodeURIComponent(file.name)
      },
    })
  },
  // Upload with progress using XHR - returns promise with progress callback
  uploadWithProgress: (file, parentDirId = null, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const url = `http://localhost:4000/file${parentDirId ? `/${parentDirId}` : ''}`

      xhr.open('POST', url, true)
      xhr.withCredentials = true
      xhr.setRequestHeader('Content-Type', 'application/octet-stream')
      xhr.setRequestHeader('filename', encodeURIComponent(file.name))

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
        } else {
          reject(new Error(xhr.responseText || 'Upload failed'))
        }
      }

      xhr.onerror = () => reject(new Error('Network error'))
      xhr.onabort = () => reject(new Error('Upload aborted'))

      xhr.send(file)
    })
  },
  // Upload multiple files with individual progress tracking
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
  get: (id) => api.get(`/file/${id}`, { responseType: 'blob' }),
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

export default api