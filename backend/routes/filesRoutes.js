import express from 'express'

import idCheck from '../middleware/idCheckMIddleware.js'

import { deleteFile, renameFile, sendFile, uploadFile } from '../controller/fileController.js'

const router = express.Router()

router.param('id', idCheck)
router.param('parentDirId', idCheck)

router.get('/:id', sendFile)

router.patch('/:id', renameFile)

router.delete('/:id', deleteFile)

router.post(['/', '/:parentDirId'], uploadFile)

export default router