import express from 'express'
import { codeToToken, listData, importFromGoogleDrive } from '../controller/gdController.js'
const router = express.Router()

router.post('/auth-code', codeToToken)

router.get('/list-files', listData)

router.post('/import', importFromGoogleDrive)

export default router