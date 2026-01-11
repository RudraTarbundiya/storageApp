import express from 'express'
import { codeToToken  , listFiles} from '../controller/gdController.js'
const router = express.Router()

router.post('/auth-code', codeToToken)

router.get('/list-files',listFiles)

export default router