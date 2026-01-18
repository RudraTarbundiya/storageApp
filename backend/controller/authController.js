import { verifyIdTokenAndGetUser } from "../services/googleOauth.js";
import sendOtpService from "../services/sendOtp.service.js";
import User from "../models/userModel.js";
import Directory from "../models/directoryModel.js";
import mongoose from "mongoose";
import Session from "../models/sesssionModel.js";
import OTP from "../models/otpModel.js";

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
            const allSessions = await Session.find({ userId: findUser._id })
            if (allSessions.length >= 2) {//max 2 sessions allowed
                await allSessions[0].deleteOne()
            }
            if (findUser.picture !== picture) {
                await User.updateOne({ _id: findUser._id }, { picture })
            }
            //create session and set cookie
            const ssn = await Session.create({ userId: findUser._id })
            res.cookie('sid', ssn._id, {
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
        const ssn = await Session.create({ userId })
        res.cookie('sid', ssn._id, {
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