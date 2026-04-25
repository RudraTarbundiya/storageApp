import { Router } from "express";
import checkAuth, { checkAdmin, checkManager, checkOwner } from "../middleware/authMiddlwWare.js";
import { changeUserRole, deleteByUserId, deleteByUserIdOwner, getDeletedUsers, getUsers,  logOutByUserId, recoverUserByIdOwner } from "../controller/usersController.js";
import idCheck from '../middleware/idCheckMiddleware.js'
const router = Router();

router.param('userId', idCheck) 

//manager and above can view users
router.get('/', checkManager, getUsers)
//manager can logout users only, admin can logout users/managers
router.post('/:userId/logout', checkManager, logOutByUserId)
//admin only - soft delete
router.delete('/:userId/delete', checkAdmin, deleteByUserId)
//manager and above can change roles (with hierarchy restrictions in controller)
router.post('/:userId/role', checkManager, changeUserRole)
//owner only
router.get('/deleted', checkOwner, getDeletedUsers)
router.delete('/:userId/delete/hard', checkOwner, deleteByUserIdOwner)
router.post('/:userId/recover', checkOwner, recoverUserByIdOwner)

export default router;