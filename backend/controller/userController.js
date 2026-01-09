import User from "../models/userModel.js";
import Directory from "../models/directoryModel.js";
import mongoose from "mongoose";
import Session from "../models/sesssionModel.js"
import OTP from "../models/otpModel.js";
import sendOtpService from "../services/sendOtp.service.js";

export const generateOTP = async (req, res, next) => {
    const { email } = req.body;
    try {
        const resData = await sendOtpService(email);
        res.status(201).json(resData);
    } catch (error) {
        next(error)
    }
};

export const registerUser = async (req, res, next) => {
    const { name, otp, email, password } = req.body;
    const session = await mongoose.startSession()
    try {
        const find = await OTP.findOne({ email, otp })
        if (!find) {
            return res.status(400).json({ error: 'Invalid OTP..' })
        }
        await find.deleteOne()
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
            rootDirId: rootDirId,
        }, { session })
        await session.commitTransaction()
        await session.endSession()

        return res.status(201).json({ message: 'User registered successfully' })
    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ error: messages.join(', ') });
        } else if (err.code == 11000) {
            if (err.keyPattern.email) {
                return res.status(400).json({ error: 'User with this email already exists' })
            }
        }
        await session.abortTransaction()
        next(err)
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
    console.log('test server')
    res.status(200).json({
        name: req.user.name,
        email: req.user.email,
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