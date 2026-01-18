import User from "../models/userModel.js";
import Directory from "../models/directoryModel.js";
import File from "../models/fileModel.js";
import mongoose from "mongoose";
import Session from "../models/sesssionModel.js"
import OTP from "../models/otpModel.js";
import { rm } from "fs/promises";
import path from "path";

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
        const user = await User.findOne({ email }).select('password deleted')
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

        const allSessions = await Session.find({ userId: user._id })
        if (allSessions.length >= 2) {//max 2 sessions allowed
            await allSessions[0].deleteOne()
        }
        const ssn = await Session.create({ userId: user._id })
        res.cookie('sid', ssn._id, {
            httpOnly: true,
            signed: true,
            maxAge: 60 * 60 * 1000 * 24 * 7//1 week
        })
        return res.status(200).json({ message: 'Login successful' })
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
//admin only
export const getUsers = async (req, res, next) => {
    try {
        const users = await User.aggregate([
            { $match: { isDelete: false } },
            {
                $lookup: {
                    from: 'sessions', // MongoDB collection name (lowercase plural)
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'sessions'
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    picture: 1,
                    role: 1,
                    isLoggedIn: { $gt: [{ $size: '$sessions' }, 0] }
                }
            }
        ]);
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
}

export const logoutUser = async (req, res) => {
    res.clearCookie('sid')
    try {
        await Session.findByIdAndDelete(req.signedCookies.sid)
        return res.status(204).json({ message: 'Logout successful' })
    } catch (error) {
        next(error)
    }
}
//admin only logout by userId
export const logOutByUserId = async (req, res, next) => {
    const { userId } = req.params;
    try {
        // Check if target user is admin or owner - only owner can logout them
        const targetUser = await User.findById(userId).select('role').lean();
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found.' });
        }
        if ((targetUser.role === 'admin' || targetUser.role === 'owner') && req.user.role !== 'owner') {
            return res.status(403).json({ error: 'Only owner can logout admin or owner users.' });
        }
        const userSessions = await Session.find({ userId: userId }).lean();
        if (userSessions.length === 0) {
            return res.status(404).json({ error: 'No active sessions found for this user.' });
        }
        await Session.deleteMany({ userId: userId });
        return res.status(204).json({ message: 'User logged out from all sessions successfully.' });
    } catch (error) {
        next(error);
    }
}
//admin only soft delete
export const deleteByUserId = async (req, res, next) => {
    const { userId } = req.params;
    if (req.user._id.toString() === userId) {
        return res.status(400).json({ error: 'Users cannot delete their own accounts via this endpoint.' });
    }
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Check if target user is admin or owner - only owner can delete them
        if ((user.role === 'admin' || user.role === 'owner') && req.user.role !== 'owner') {
            return res.status(403).json({ error: 'Only owner can delete admin or owner users.' });
        }

        // Soft delete the user
        user.isDelete = true;
        await user.save();
        await Session.deleteMany({ userId });

        return res.status(200).json({ message: 'User and all associated data deleted successfully', });
    } catch (error) {
        next(error);
    }
}
//owner only - get deleted users
export const getDeletedUsers = async (req, res, next) => {
    try {
        const users = await User.aggregate([
            { $match: { isDelete: true } },
            {
                $lookup: {
                    from: 'sessions',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'sessions'
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    picture: 1,
                    role: 1,
                    isLoggedIn: { $gt: [{ $size: '$sessions' }, 0] }
                }
            }
        ]);
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
}

//owner only hard delete any user
export const deleteByUserIdOwner = async (req, res, next) => {
    const { userId } = req.params;
    if (req.user._id.toString() === userId) {
        return res.status(400).json({ error: 'Cannot permanently delete your own account.' });
    }
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        const files = await File.find({ userId }).select('_id extension').lean();
        for (const file of files) {
            try {
                await rm(path.join(import.meta.dirname, '../storage', file._id.toString() + file.extension));
            } catch (e) {
                // File may already be deleted, continue
            }
        }
        await File.deleteMany({ userId });
        await Directory.deleteMany({ userId });
        await Session.deleteMany({ userId });
        await User.deleteOne({ _id: userId });

        return res.status(200).json({ message: 'User and all associated data have been permanently deleted.' });
    } catch (error) {
        next(error)
    }
}
//owner only recover user
export const recoverUserByIdOwner = async (req, res, next) => {
    const { userId } = req.params;
    try {
        await User.findOneAndUpdate({ _id: userId, isDelete: true }, { isDelete: false })
    } catch (error) {
        return res.status(error.code).json({ message: error.message });
    }
    return res.status(200).json({ message: 'User account recovered successfully.' });
}

export const logoutAllUser = async (req, res, next) => {
    res.clearCookie('sid')
    try {
        await Session.deleteMany({ userId: req.user._id })
        return res.status(204).json({ message: 'Logout from all devices successful' })
    } catch (error) {
        next(error)
    }
}