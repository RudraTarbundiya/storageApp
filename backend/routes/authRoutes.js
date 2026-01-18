import express from 'express'
import { changeProfile, generateOTP, googlelogin } from '../controller/authController.js'
import checkAuth from '../middleware/authMiddlwWare.js'
const router = express.Router()

router.post('/send-otp', generateOTP)

router.post('/google-login', googlelogin)

router.post('/change-profile', checkAuth,changeProfile)

export default router