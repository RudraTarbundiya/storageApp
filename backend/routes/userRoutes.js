import { Router } from "express";
import checkAuth from "../middleware/authMiddlwWare.js";
import { getUserProfile, getUsers, loginUser, logoutAllUser, logoutUser, registerUser } from "../controller/userController.js";
const router = Router();


router.post('/register',registerUser)

router.post('/login', loginUser )

router.get('/profile', checkAuth, getUserProfile)

router.get('/users', checkAuth, getUsers)

router.post('/logout', logoutUser)

router.post('/logoutall', checkAuth, logoutAllUser)

export default router;