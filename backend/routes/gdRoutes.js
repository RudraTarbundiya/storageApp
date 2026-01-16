import express from 'express'
import { codeToToken, listData, importFromGoogleDrive } from '../controller/gdController.js'
import checkAuth from '../middleware/authMiddlwWare.js'
const router = express.Router()

router.post('/auth-code',checkAuth,codeToToken)

router.get('/list-files',checkAuth, listData)

router.post('/import', checkAuth, importFromGoogleDrive)

export default router