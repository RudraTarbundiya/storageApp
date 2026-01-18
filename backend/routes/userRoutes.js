import { Router } from "express";
import checkAuth, { checkAdmin } from "../middleware/authMiddlwWare.js";
import { deleteByUserId, getUserProfile, getUsers, loginUser, logoutAllUser, logOutByUserId, logoutUser, registerUser } from "../controller/userController.js";
const router = Router();


router.post('/user/register',registerUser)
router.post('/user/login', loginUser )

router.get('/user/profile', checkAuth, getUserProfile)
router.post('/user/logout', checkAuth,logoutUser)
router.post('/user/logoutall', checkAuth, logoutAllUser)
//admin only
router.get('/users', checkAuth,checkAdmin, getUsers)
router.post('/users/:userId/logout', checkAuth, checkAdmin, logOutByUserId)
router.delete('/users/:userId/delete', checkAuth, checkAdmin, deleteByUserId)

export default router;