import User from "../models/userModel.js";
import Directory from "../models/directoryModel.js";
import mongoose from "mongoose";
import crypto from "node:crypto";
import bcrypt from "bcrypt";

export const registerUser = async (req, res, next) => {
    const { name, email, password } = req.body;
    const hash_pw = await bcrypt.hash(password,12)
    const session = await mongoose.startSession()
    try {
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
            password: hash_pw,
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
    const user = await User.findOne({ email }).select('password').lean()
    if (!user) {
        return res.status(401).json({ error: 'not registered!!' })
    }
    const result  = await bcrypt.compare(password,user.password)
    if(!result){
        return res.status(401).json({ error: 'Invalid email or password !' })
    }

    const cookiePayLoad = JSON.stringify({
        _id: user._id,
        expiry: Math.round(Date.now() / 1000 + 1000 * 60 * 60 * 24) //1 day expiry
    })

    res.cookie('token', Buffer.from(cookiePayLoad).toString('base64'), {
        httpOnly: true,
        signed : true ,
        maxAge: 60 * 60 * 1000 * 24 * 7//1 week
    })
    return res.status(200).json({ message: 'Login successful' })
}

export const getUserProfile = (req, res) => {
    res.status(200).json({
        name: req.user.name,
        email: req.user.email,
    })
}

export const logoutUser = (req, res) => {
    res.clearCookie('token')
    return res.status(204).json({ message: 'Logout successful' })
}