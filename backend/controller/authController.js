import { verifyIdTokenAndGetUser } from "../services/googleOauth.js";
import sendOtpService from "../services/sendOtp.service.js";
import User from "../models/userModel.js";
import Directory from "../models/directoryModel.js";
import mongoose from "mongoose";
import OTP from "../models/otpModel.js";
import redisClient from "../config/redis.js";
import { deleteAllSession } from "../utils/deleteSessions.js";

export const registerUser = async (req, res, next) => {
    const { name, otp, email, password, role, secretKey } = req.body;
    const session = await mongoose.startSession()
    try {
        // Validate role
        const validRoles = ['user', 'admin', 'manager'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be user, admin, or manager.' });
        }

        // Validate admin secret key
        if (role === 'admin') {
            if (!secretKey) {
                return res.status(400).json({ error: 'Secret key is required for admin registration.' });
            }
            if (secretKey !== process.env.ADMIN_SECRET_KEY) {
                return res.status(403).json({ error: 'Invalid admin secret key.' });
            }
        }

        // Validate manager secret key
        if (role === 'manager') {
            if (!secretKey) {
                return res.status(400).json({ error: 'Secret key is required for manager registration.' });
            }
            if (secretKey !== process.env.MANAGER_SECRET_KEY) {
                return res.status(403).json({ error: 'Invalid manager secret key.' });
            }
        }

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
        }, { session })
        await User.insertOne({
            _id: userId,
            name,
            email,
            password,
            picture: null,
            rootDirId: rootDirId,
            role,
        }, { session })
        await session.commitTransaction()
        await session.endSession()

        return res.status(201).json({ message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully` })
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
    }
}

export const loginUser = async (req, res, next) => {
    const { email, password } = req.body

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
            RETURN: [],
        })
        if (allSessions.total >= 2) {//max 2 sessions allowed
            await redisClient.del(allSessions.documents[0].id)//deleting oldest session
        }
        const ssnId = crypto.randomUUID()
        await redisClient.hSet(`session:${ssnId}`, { userId: user._id.toString() })
        await redisClient.expire(`session:${ssnId}`, 60 * 60 * 24 * 7) // 1 week expiration
        res.cookie('sid', ssnId, {
            httpOnly: true,
            signed: true,
            maxAge: 60 * 60 * 1000 * 24 * 7//1 week
        })
        return res.status(200).json({ message: 'Login successful', userId: user._id.toString() })
    } catch (error) {
        next(error)
    }
}

export const logoutUser = async (req, res) => {
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
        email: req.user.email,
        picture: req.user.picture,
        role: req.user.role
    })
}

export const generateOTP = async (req, res, next) => {
    const { email } = req.body;
    const resData = await sendOtpService(email);
    try {
        res.status(201).json(resData);
    } catch (error) {
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
            await redisClient.hSet(`session:${ssnId}`, { userId: findUser._id.toString() })
            await redisClient.expire(`session:${ssnId}`, 60 * 60 * 24 * 7) // 1 week expiration
            res.cookie('sid', ssnId, {
                httpOnly: true,
                signed: true,
                maxAge: 60 * 60 * 1000 * 24 * 7//1 week
            })
            return res.status(200).json({ message: "User already exists" })
        }
        session.startTransaction()
        await Directory.insertOne({
            _id: rootDirId,
            name: `root -${email}`,
            parentDirId: null,
            userId,
        }, { session })
        await User.insertOne({
            _id: userId,
            name,
            email,
            picture,
            rootDirId: rootDirId,
        }, { session })
        //create session and set cookie
        const ssnId = crypto.randomUUID()
        await redisClient.hSet(`session:${ssnId}`, { userId: userId.toString() })
        await redisClient.expire(`session:${ssnId}`, 60 * 60 * 24 * 7) // 1 week expiration
        res.cookie('sid', ssnId, {
            httpOnly: true,
            signed: true,
            maxAge: 60 * 60 * 1000 * 24 * 7//1 week
        })
        res.status(201).json({ message: "Google login successful" });
        await session.commitTransaction()
        await session.endSession()
    } catch (error) {
        await session.abortTransaction()
        next(error);
    }
}

export const changeProfile = async (req, res, next) => {
    const { otp, newPassword, picture } = req.body;
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
        res.status(200).json({ message: 'Profile updated successfully.' });
    } catch (error) {
        next(error);
    }
}