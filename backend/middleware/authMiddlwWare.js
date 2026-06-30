import User from "../models/userModel.js";
import redisClient from "../config/redis.js";
import { deleteAllSession } from "../utils/deleteSessions.js";
// Cache TTL for user data stored in Redis session (5 minutes)
const USER_CACHE_TTL_MS = 5 * 60 * 1000;

// Middleware to check if user is authenticated with valid session and not soft-deleted
// Uses Redis-cached user data to avoid hitting MongoDB on every request
export default async function checkAuth(req, res, next) {
    const { sid } = req.signedCookies
    if (!sid) {
        return res.status(401).json({ error: "Not logged!" });
    }
    const ssn = await redisClient.hGetAll(`session:${sid}`)
    if (!ssn || !ssn.userId) {
        return res.status(401).json({ error: "Not logged!" });
    }

    // Try to use cached user data from Redis session
    let user = null;
    const cachedAt = ssn.userCachedAt ? parseInt(ssn.userCachedAt) : 0;
    const isCacheValid = ssn.userData && cachedAt && (Date.now() - cachedAt < USER_CACHE_TTL_MS);

    if (isCacheValid) {
        try {
            user = JSON.parse(ssn.userData);
        } catch {
            user = null; // Cache corrupted, will re-fetch
        }
    }

    // Cache miss or expired — fetch from MongoDB and update cache
    if (!user) {
        user = await User.findOne({ _id: ssn.userId }).lean();
        if (!user) {
            return res.status(401).json({ error: "Not logged!" });
        }
        // Cache user data in the session hash (non-blocking, fire and forget)
        redisClient.hSet(`session:${sid}`, {
            userData: JSON.stringify(user),
            userCachedAt: Date.now().toString()
        }).catch(() => { }); // Silently ignore cache write errors
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

// Invalidate cached user data across all sessions for a given userId
// Call this when user data changes (role change, profile update, deletion)
export async function invalidateUserCache(userId) {
    try {
        const ssnSearch = await redisClient.ft.search('sessionIdx', `@userId:{${userId.toString()}}`, {
            RETURN: ['userId'],
        });
        if (ssnSearch.total > 0) {
            await Promise.all(
                ssnSearch.documents.map(doc =>
                    redisClient.hDel(doc.id, ['userData', 'userCachedAt']).catch(() => { })
                )
            );
        }
    } catch {
        // Silently ignore invalidation errors — worst case, stale data is used for up to 5 min
    }
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