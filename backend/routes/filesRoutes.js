import express from 'express'

import idCheck from '../middleware/idCheckMIddleware.js'

import { deleteFile, initateUpload, renameFile, sendFile, completeUpload } from '../controller/fileController.js'

const router = express.Router()

router.param('id', idCheck)
router.param('parentDirId', idCheck)

router.get('/:id', sendFile)

router.patch('/:id', renameFile)

router.delete('/:id', deleteFile)

router.post(['/upload/init', '/upload/init/:parentDirId'], initateUpload)
router.post('/upload/complete/:fileId', completeUpload)

export default router