import { Router } from "express";
import { getSharedWithMe, searchUserByEmail, shareDirectory, shareFile, removeShare, getMySharedItems } from "../controller/sharedController.js";
import checkAuth from "../middleware/authMiddlwWare.js";
import checkFileShare, { checkDirectoryShare } from "../middleware/checkShare.js";
import { getPublicDirData, sendPublicFile } from "../controller/publicController.js";
const router = Router();

router.post("/search", checkAuth, searchUserByEmail)

// Share file/directory with user
router.post('/file/:fileId', checkAuth, shareFile)
router.post('/dir/:dirId', checkAuth, shareDirectory)

// Remove share
router.delete('/file/:fileId/:userId', checkAuth, removeShare)
router.delete('/dir/:dirId/:userId', checkAuth, removeShare)

// Get items I've shared
router.get('/by-me', checkAuth, getMySharedItems)

// Get items shared with me
router.get('/with-me', checkAuth, getSharedWithMe)

//share Files and Directory
router.get('/file/:id', checkAuth, checkFileShare, sendPublicFile)
router.get('/dir/:id', checkAuth, checkDirectoryShare, getPublicDirData)

export default router;