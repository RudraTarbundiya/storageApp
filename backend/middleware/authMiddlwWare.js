import User from "../models/userModel.js";
import redisClient from "../config/redis.js";

// Middleware to check if user is authenticated with valid session and not soft-deleted
export default async function checkAuth(req, res, next) {
    const {sid}= req.signedCookies
    if(!sid){
        return  res.status(401).json({ error: "Not logged!" });
    }
    const ssn = await redisClient.json.get(sid)
    if (!ssn) {
        return res.status(401).json({ error: "Not logged!" });
    }
    const user = await User.findOne({ _id : ssn.userId }).lean();
    if (!user) {
        return res.status(401).json({ error: "Not logged!" });
    }
    // Check if user is soft-deleted
    if (user.isDelete) {
        // Clear the session for deleted user
        await deleteAllSession(user._id.toString());
        res.clearCookie('sid');
        return res.status(403).json({ error: "Your account has been deleted." });
    }
    req.user = user
    next()
}

export const checkAdmin = (req, res, next) => {
    if (req.user.role === 'admin' || req.user.role === 'owner') {
        return next()
    }
    return res.status(403).json({ error: "Access denied!" });
}

export const checkManager = (req, res, next) => {
    if (req.user.role === 'manager' || req.user.role === 'admin' || req.user.role === 'owner') {
        return next()
    }
    return res.status(403).json({ error: "Access denied!" });
}

export const checkOwner = (req, res, next) => {
    if (req.user.role === 'owner') {
        return next()
    }
    return res.status(403).json({ error: "Access denied!" });
}