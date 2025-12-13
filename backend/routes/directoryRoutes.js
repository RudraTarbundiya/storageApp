import express from 'express'
import idCheck from '../middleware/idCheckMIddleware.js'
import { createDirectory, deleteDirectory, getDirectoryById, renameDirectorry } from '../controller/directoryController.js'
const router = express.Router()

router.param('id', idCheck)
router.param('parentId', idCheck)

router.get(['/', '/:id'], getDirectoryById)//get directory content by id or root if no id provided

router.post(['/', '/:parentId'], createDirectory)

router.patch('/:id', renameDirectorry)

router.delete('/:id',deleteDirectory)

export default router