import User from "../models/userModel.js";
import Directory from "../models/directoryModel.js";
import mongoose from "mongoose";


export const registerUser =  async (req, res, next) => {
    const { name, email, password } = req.body;

    const session = await mongoose.startSession()
    try {
        //if same email exits
        const userExits = await User.findOne({ email },{_id: 1}).lean()
        if (userExits) {
            return res.status(400).json({ error: 'User with this email already exists' })
        }

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
        await session.abortTransaction()
        next(err)
    }
}

export const loginUser = async (req, res, next) => {
    const { email, password } = req.body
    const user = await User.findOne({ email, password }).lean()
    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' })
    }

    res.cookie('userId', user._id.toString(), {
        httpOnly: true,
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
    res.clearCookie('userId')
    return res.status(204).json({ message: 'Logout successful' })
}