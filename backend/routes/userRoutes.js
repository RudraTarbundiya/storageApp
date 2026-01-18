import { Router } from "express";
import checkAuth, { checkAdmin, checkManager, checkOwner } from "../middleware/authMiddlwWare.js";
import { changeUserRole, deleteByUserId, deleteByUserIdOwner, getDeletedUsers, getUserProfile, getUsers, loginUser, logoutAllUser, logOutByUserId, logoutUser, recoverUserByIdOwner, registerUser } from "../controller/userController.js";
const router = Router();


router.post('/user/register', registerUser)
router.post('/user/login', loginUser)

router.get('/user/profile', checkAuth, getUserProfile)
router.post('/user/logout', checkAuth, logoutUser)
router.post('/user/logoutall', checkAuth, logoutAllUser)
//manager and above can view users
router.get('/users', checkAuth, checkManager, getUsers)
//manager can logout users only, admin can logout users/managers
router.post('/users/:userId/logout', checkAuth, checkManager, logOutByUserId)
//admin only - soft delete
router.delete('/users/:userId/delete', checkAuth, checkAdmin, deleteByUserId)
//manager and above can change roles (with hierarchy restrictions in controller)
router.post('/users/:userId/role', checkAuth, checkManager, changeUserRole)
//owner only
router.get('/users/deleted', checkAuth, checkOwner, getDeletedUsers)
router.delete('/users/:userId/delete/hard', checkAuth, checkOwner, deleteByUserIdOwner)
router.post('/users/:userId/recover', checkAuth, checkOwner, recoverUserByIdOwner)

export default router;