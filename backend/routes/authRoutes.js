import express from 'express'
import { generateOTP, googlelogin } from '../controller/authController.js'
const router = express.Router()

router.post('/send-otp', generateOTP)

router.post('/google-login', googlelogin)

export default router