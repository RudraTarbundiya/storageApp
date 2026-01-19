import express from 'express'
import { changeProfile, generateOTP, getUserProfile, googlelogin, loginUser, logoutAllUser, logoutUser, registerUser } from '../controller/authController.js'
import checkAuth from '../middleware/authMiddlwWare.js'
const router = express.Router()
//this auth routes are handle single user not multiple users like usersRoutes.js
router.post('/register', registerUser)

router.post('/login', loginUser)

router.post('/logout', checkAuth, logoutUser)//logout current user

router.post('/logoutall', checkAuth, logoutAllUser)//logout from all devices

router.get('/profile', checkAuth, getUserProfile)//get user profile

router.post('/send-otp', generateOTP)

router.post('/google-login', googlelogin)

router.post('/change-profile', checkAuth,changeProfile)

export default router