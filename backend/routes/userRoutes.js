import { Router } from "express";
import checkAuth from "../middleware/authMiddlwWare.js";
import { getUserProfile, loginUser, logoutUser, registerUser } from "../controller/userController.js";
const router = Router();


router.post('/register',registerUser)

router.post('/login', loginUser )

router.get('/', checkAuth, getUserProfile)

router.post('/logout', logoutUser)

export default router;