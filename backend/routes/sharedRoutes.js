import { Router } from "express";
import { getSharedWithMe, searchUserByEmail, shareDirectory, shareFile, removeShare, getMySharedItems } from "../controller/sharedController.js";
import checkAuth from "../middleware/authMiddlwWare.js";
import checkFileShare, { checkDirectoryShare } from "../middleware/checkShare.js";
import { getPublicDirData, sendPublicFile } from "../controller/publicController.js";
const router = Router();

router.post("/search", searchUserByEmail)

// Share file/directory with user
router.post('/file/:fileId', shareFile)
router.post('/dir/:dirId', shareDirectory)

// Remove share
router.delete('/file/:fileId/:userId', removeShare)
router.delete('/dir/:dirId/:userId', removeShare)

// Get items I've shared
router.get('/by-me', getMySharedItems)

// Get items shared with me
router.get('/with-me', getSharedWithMe)

//share Files and Directory
router.get('/file/:id', checkFileShare, sendPublicFile)
router.get('/dir/:id', checkDirectoryShare, getPublicDirData)

export default router;