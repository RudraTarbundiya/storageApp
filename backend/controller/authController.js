import { verifyIdTokenAndGetUser } from "../services/googleOauth.js";
import sendOtpService, { mailToAdmin } from "../services/sendOtp.service.js";
import User from "../models/userModel.js";
import Directory from "../models/directoryModel.js";
import mongoose from "mongoose";
import OTP from "../models/otpModel.js";
import redisClient from "../config/redis.js";
import { deleteAllSession } from "../utils/deleteSessions.js";
import { parseUserAgent } from "../utils/parseUserAgent.js";
import { invalidateUserCache } from "../middleware/authMiddlwWare.js";
import { changeProfileSchema, loginSchema, registerSchema } from "../validator/authSchema.js";

const sessionMaxAge = 60 * 60 * 1000 * 24 * 7 // 1 week

const getSessionCookieOptions = () => {
    const isProd = process.env.NODE_ENV === 'production'
    return {
        httpOnly: true,
        signed: true,
        sameSite: isProd ? 'none' : 'lax',
        secure: isProd,
        maxAge: sessionMaxAge,
    }
}

export const registerUser = async (req, res, next) => {
    const { name, otp, email, password } = req.body;
    // Force role to 'user' for all self-registrations
    const role = 'user'
    const { success, error } = registerSchema.safeParse({ name, otp, email, password })
    if (!success) {
        return res.status(400).json({ error: error.flatten().fieldErrors })
    }
    const session = await mongoose.startSession()
    try {
        // Self-registration only allowed for regular users; role forced above

        const findOtp = await OTP.findOne({ email, otp })
        if (!findOtp) {
            return res.status(400).json({ error: 'Invalid OTP..' })
        }
        await findOtp.deleteOne()
        const rootDirId = new mongoose.Types.ObjectId()
        const userId = new mongoose.Types.ObjectId()

        session.startTransaction()
        await Directory.insertOne({
            _id: rootDirId,
            name: `root -${email}`,
            parentDirId: null,
            userId,
            size: 0
        }, { session })
        await User.insertOne({
            _id: userId,
            name,
            maxStorageInBytes: 1 * (1024 ** 3),//1GB default storage
            email,
            password,
            picture: null,
            rootDirId: rootDirId,
            role: 'user',
        }, { session })
        await session.commitTransaction()
        await session.endSession()
        // Send email to admin about new registration
        await mailToAdmin('New User Registration', `A new user has registered with the email: ${email}.`)
        return res.status(201).json({ message: `User registered successfully` })
    } catch (err) {
        await session.abortTransaction()

        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ error: messages.join(', ') });
        } else if (err.code == 11000) {
            if (err.keyPattern?.email) {
                return res.status(400).json({ error: 'Email is already registered. Please login instead.' })
            }
            return res.status(400).json({ error: 'Duplicate entry detected' })
        }

        console.error('Registration error:', err)
        return res.status(500).json({ error: 'Registration failed. Please try again.' })
        // return res.status(200).json({ err })//temporary response to debug registration errors without crashing the server
    }
}

export const loginUser = async (req, res, next) => {
    const { email, password } = req.body
    const { success, error } = loginSchema.safeParse({ email, password })
    if (!success) {
        return res.status(400).json({ error: error.flatten().fieldErrors })
    }

    try {
        const user = await User.findOne({ email }).select('password isDelete')
        if (!user) {
            return res.status(401).json({ error: 'not registered!!' })
        }
        // Check if user is soft-deleted
        if (user.isDelete) {
            return res.status(403).json({ error: 'Your account has been deleted.' })
        }
        const result = await user.comparePassword(password)
        if (!result) {
            return res.status(401).json({ error: 'Invalid email or password !' })
        }
        const allSessions = await redisClient.ft.search('sessionIdx', `@userId:{${user._id.toString()}}`, {
            RETURN: ['createdAt'],
        })
        if (allSessions.total >= 3) {//max 3 sessions allowed
            // Sort by createdAt ascending and delete the oldest
            const sorted = [...allSessions.documents].sort((a, b) => {
                const aTime = parseInt(a.value?.createdAt || '0')
                const bTime = parseInt(b.value?.createdAt || '0')
                return aTime - bTime
            })
            await redisClient.del(sorted[0].id)
        }
        const ssnId = crypto.randomUUID()
        const userAgent = req.headers['user-agent'] || 'Unknown'
        await redisClient.hSet(`session:${ssnId}`, {
            userId: user._id.toString(),
            userAgent,
            createdAt: Date.now().toString()
        })
        await redisClient.expire(`session:${ssnId}`, 60 * 60 * 24 * 7) // 1 week expiration
        res.cookie('sid', ssnId, getSessionCookieOptions())
        return res.status(200).json({ message: 'Login successful', userId: user._id.toString() })
    } catch (error) {
        next(error)
    }
}

export const logoutUser = async (req, res, next) => {
    res.clearCookie('sid')
    try {
        await redisClient.del(`session:${req.signedCookies.sid}`)
        return res.status(204).json({ message: 'Logout successful' })
    } catch (error) {
        next(error)
    }
}

export const logoutAllDevice = async (req, res, next) => {
    try {
        await deleteAllSession(req.user._id.toString())
        return res.status(204).json({ message: 'Logout from all devices successful' })
    } catch (error) {
        next(error)
    }
}

export const getUserProfile = (req, res) => {
    res.status(200).json({
        name: req.user.name,
        maxStorage: req.user.maxStorageInBytes,
        email: req.user.email,
        picture: req.user.picture,
        role: req.user.role
    })
}

export const generateOTP = async (req, res, next) => {
    const email = req.body.email
    if (!email) {
        return res.status(400).json({ error: 'Email is required to generate OTP.' })
    }
    const resData = await sendOtpService(email);
    try {
        res.status(201).json(resData);
    } catch (error) {
        console.log('Error sending OTP:', error);
        next(error)
    }
};

export const googlelogin = async (req, res, next) => {
    const id_token = req.body.credential;
    const session = await mongoose.startSession()// this is mongoose session
    const rootDirId = new mongoose.Types.ObjectId()
    const userId = new mongoose.Types.ObjectId()
    try {
        const { name, email, picture } = await verifyIdTokenAndGetUser(id_token);
        const findUser = await User.findOne({ email }).lean()
        if (findUser) {
            // Check if user is soft-deleted
            if (findUser.isDelete) {
                return res.status(403).json({ error: 'Your account has been deleted.' })
            }
            if (findUser.picture !== picture) {
                await User.updateOne({ _id: findUser._id }, { picture })
            }
            //create session and set cookie
            const ssnId = crypto.randomUUID()
            const userAgent = req.headers['user-agent'] || 'Unknown'
            // Enforce max 3 sessions
            const existingSessions = await redisClient.ft.search('sessionIdx', `@userId:{${findUser._id.toString()}}`, {
                RETURN: ['createdAt'],
            })
            if (existingSessions.total >= 3) {
                const sorted = [...existingSessions.documents].sort((a, b) => {
                    const aTime = parseInt(a.value?.createdAt || '0')
                    const bTime = parseInt(b.value?.createdAt || '0')
                    return aTime - bTime
                })
                await redisClient.del(sorted[0].id)
            }
            await redisClient.hSet(`session:${ssnId}`, {
                userId: findUser._id.toString(),
                userAgent,
                createdAt: Date.now().toString()
            })
            await redisClient.expire(`session:${ssnId}`, 60 * 60 * 24 * 7) // 1 week expiration
            res.cookie('sid', ssnId, getSessionCookieOptions())
            return res.status(200).json({ message: "User already exists" })
        }
        session.startTransaction()
        await Directory.insertOne({
            _id: rootDirId,
            name: `root -${email}`,
            parentDirId: null,
            userId,
            size: 0
        }, { session })
        await User.insertOne({
            _id: userId,
            name,
            maxStorageInBytes: 1 * (1024 ** 3),//1GB default storage
            email,
            picture,
            rootDirId: rootDirId,
        }, { session })
        //create session and set cookie
        const ssnId = crypto.randomUUID()
        const userAgent = req.headers['user-agent'] || 'Unknown'
        await redisClient.hSet(`session:${ssnId}`, {
            userId: userId.toString(),
            userAgent,
            createdAt: Date.now().toString()
        })
        await redisClient.expire(`session:${ssnId}`, 60 * 60 * 24 * 7) // 1 week expiration
        res.cookie('sid', ssnId, getSessionCookieOptions())
        res.status(201).json({ message: "Google login successful" });
        // Send email to admin about new registration
        await mailToAdmin('New User Registration', `A new user has registered with the email: ${email} using Google OAuth.`)
        await session.commitTransaction()
        await session.endSession()
    } catch (error) {
        await session.abortTransaction()
        next(error);
    }
}

export const changeProfile = async (req, res, next) => {
    const { otp, newPassword, picture } = req.body;
    const { success, error } = changeProfileSchema.safeParse({ name: req.body.name, password: newPassword })
    if (!success) {
        return res.status(400).json({ error: error.flatten().fieldErrors })
    }
    const { email } = req.user;
    try {
        const otpRecord = await OTP.findOne({ email }).sort({ createdAt: -1 });
        //we can not use !== because otp is string and otpRecord.otp is number
        if (!otp || !otpRecord || otpRecord.otp != otp) {
            return res.status(400).json({ error: 'Invalid OTP.' });
        }
        await otpRecord.deleteOne();

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Update only provided fields
        if (newPassword) {
            user.password = newPassword; // Will be hashed by pre-save hook
        }
        if (picture !== undefined) {
            user.picture = picture;
        }

        await user.save();
        await invalidateUserCache(user._id.toString());
        res.status(200).json({ message: 'Profile updated successfully.' });
    } catch (error) {
        next(error);
    }
}

export const getSessions = async (req, res, next) => {
    try {
        const userId = req.user._id.toString()
        const currentSid = req.signedCookies.sid
        const allSessions = await redisClient.ft.search('sessionIdx', `@userId:{${userId}}`, {
            RETURN: [],
        })

        // Fetch full hash data for each session (FT.SEARCH RETURN doesn't reliably return non-indexed fields)
        const sessions = await Promise.all(
            allSessions.documents.map(async (doc) => {
                const sessionId = doc.id.replace('session:', '')
                const sessionData = await redisClient.hGetAll(doc.id)
                const ua = sessionData?.userAgent || 'Unknown'
                const parsed = parseUserAgent(ua)
                return {
                    sessionId,
                    browser: parsed.browser,
                    os: parsed.os,
                    deviceType: parsed.deviceType,
                    createdAt: sessionData?.createdAt ? parseInt(sessionData.createdAt) : null,
                    isCurrent: sessionId === currentSid
                }
            })
        )

        // Sort: current session first, then by createdAt descending
        sessions.sort((a, b) => {
            if (a.isCurrent) return -1
            if (b.isCurrent) return 1
            return (b.createdAt || 0) - (a.createdAt || 0)
        })

        return res.status(200).json({ sessions })
    } catch (error) {
        next(error)
    }
}

export const logoutSession = async (req, res, next) => {
    try {
        const { sessionId } = req.params
        const userId = req.user._id.toString()

        // Verify the session belongs to this user
        const ssn = await redisClient.hGetAll(`session:${sessionId}`)
        if (!ssn || ssn.userId !== userId) {
            return res.status(404).json({ error: 'Session not found' })
        }

        await redisClient.del(`session:${sessionId}`)

        // If user is logging out their own current session, clear the cookie
        if (sessionId === req.signedCookies.sid) {
            res.clearCookie('sid')
        }

        return res.status(200).json({ message: 'Session terminated' })
    } catch (error) {
        next(error)
    }
}