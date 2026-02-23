import express from 'express'
import { changeProfile, generateOTP, getUserProfile, googlelogin, loginUser, logoutAllDevice, logoutUser, registerUser } from '../controller/authController.js'
import checkAuth from '../middleware/authMiddlwWare.js'
import { strictRateLimiter, customRateLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

//this auth routes are handle single user not multiple users like usersRoutes.js

// STRICT rate limiting for registration (5 attempts per 15 minutes)
router.post('/register', strictRateLimiter(), registerUser)

// STRICT rate limiting for login (5 attempts per 15 minutes)
router.post('/login', strictRateLimiter(), loginUser)

router.post('/logout', checkAuth, logoutUser)//logout current user

router.post('/logoutall', checkAuth, logoutAllDevice)//logout from all devices

router.get('/profile', checkAuth, getUserProfile)//get user profile

// STRICT rate limiting for OTP generation (5 attempts per 15 minutes)
router.post('/send-otp', strictRateLimiter(), generateOTP)

// STRICT rate limiting for Google OAuth (10 attempts per 15 minutes)
router.post('/google-login', customRateLimiter({ max: 10, windowMs: 15 * 60 * 1000 }), googlelogin)

router.post('/change-profile', checkAuth, customRateLimiter({ max: 10, windowMs: 15 * 60 * 1000 }), changeProfile)

export default router