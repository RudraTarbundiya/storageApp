import User from "../models/userModel.js";
import Directory from "../models/directoryModel.js";
import mongoose from "mongoose";
import Session from "../models/sesssionModel.js"
import OTP from "../models/otpModel.js";


export const registerUser = async (req, res, next) => {
    const { name, otp, email, password } = req.body;
    const session = await mongoose.startSession()
    try {
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
            picture:null,
            rootDirId: rootDirId,
        }, { session })
        await session.commitTransaction()
        await session.endSession()

        return res.status(201).json({ message: 'User registered successfully' })
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
        const user = await User.findOne({ email }).select('password')
        if (!user) {
            return res.status(401).json({ error: 'not registered!!' })
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
        picture: req.user.picture
    })
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

export const logoutAllUser = async (req, res, next) => {
    res.clearCookie('sid')
    try {
        await Session.deleteMany({ userId: req.user._id })
        return res.status(204).json({ message: 'Logout from all devices successful' })
    } catch (error) {
        next(error)
    }
}