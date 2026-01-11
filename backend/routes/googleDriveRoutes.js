import express from 'express'
import { 
    getAuthUrl, 
    authorizeGoogleDrive, 
    checkAuth, 
    listGoogleDriveFiles,
    importFromGoogleDrive
} from '../controller/googleDriveController.js'
import  authMiddleware  from '../middleware/authMiddlwWare.js'

const router = express.Router()

// Get Google OAuth URL
router.get('/auth-url', authMiddleware, getAuthUrl)

// Exchange authorization code for tokens
router.post('/authorize', authMiddleware, authorizeGoogleDrive)

// Check if user has authorized Google Drive
router.get('/check-auth', authMiddleware, checkAuth)

// List Google Drive files
router.get('/files', authMiddleware, listGoogleDriveFiles)

// Import file from Google Drive to storage
router.post('/import', authMiddleware, importFromGoogleDrive)

export default router
