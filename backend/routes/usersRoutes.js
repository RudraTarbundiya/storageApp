import { Router } from "express";
import checkAuth, { checkAdmin, checkManager, checkOwner } from "../middleware/authMiddlwWare.js";
import { changeUserRole, deleteByUserId, deleteByUserIdOwner, getDeletedUsers, getUsers,  logOutByUserId, recoverUserByIdOwner } from "../controller/usersController.js";
const router = Router();

//manager and above can view users
router.get('/', checkAuth, checkManager, getUsers)
//manager can logout users only, admin can logout users/managers
router.post('/:userId/logout', checkAuth, checkManager, logOutByUserId)
//admin only - soft delete
router.delete('/:userId/delete', checkAuth, checkAdmin, deleteByUserId)
//manager and above can change roles (with hierarchy restrictions in controller)
router.post('/:userId/role', checkAuth, checkManager, changeUserRole)
//owner only
router.get('/deleted', checkAuth, checkOwner, getDeletedUsers)
router.delete('/:userId/delete/hard', checkAuth, checkOwner, deleteByUserIdOwner)
router.post('/:userId/recover', checkAuth, checkOwner, recoverUserByIdOwner)

export default router;