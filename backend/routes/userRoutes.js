import { Router } from "express";
import checkAuth from "../middleware/authMiddlwWare.js";
import { getUserProfile, loginUser, logoutAllUser, logoutUser, registerUser } from "../controller/userController.js";
const router = Router();


router.post('/register',registerUser)

router.post('/login', loginUser )

router.get('/', checkAuth, getUserProfile)

router.post('/logout', logoutUser)

router.post('/logoutall', checkAuth, logoutAllUser)

export default router;