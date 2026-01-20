import express from 'express'
import { getPublicDirData, sendPublicFile, toggleDirectoryPublicStatus, toggleFilePublicStatus, getMyPublicItems } from '../controller/publicController.js';
import { checkPublicDir, checkPublicFile } from '../middleware/checkPublick.js';
import checkAuth from '../middleware/authMiddlwWare.js';
import idCheck from '../middleware/idCheckMIddleware.js';
const router = express.Router()

router.param('id', idCheck)

// Get current user's public items (auth required)
router.get('/my-items', checkAuth, getMyPublicItems)

// Public access routes (no auth required)
router.get('/dir/:id', checkPublicDir, getPublicDirData)
router.get('/file/:id', checkPublicFile, sendPublicFile)

// Protected routes for toggling public status (auth required)
router.patch('/dir/:id/toggle', checkAuth, toggleDirectoryPublicStatus)
router.patch('/file/:id/toggle', checkAuth, toggleFilePublicStatus)

export default router