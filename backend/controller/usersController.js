import User from "../models/userModel.js";
import Directory from "../models/directoryModel.js";
import File from "../models/fileModel.js";
import { rm } from "fs/promises";
import path from "path";
import { deleteAllSession } from "../utils/deleteSessions.js";
import redisClient from "../config/redis.js";

//admin only
export const getUsers = async (req, res, next) => {
    try {
        const users = await User.aggregate([
            { $match: { isDelete: false } },
            {
                // Lookup files to calculate storage
                $lookup: {
                    from: 'files',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'userFiles'
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    picture: 1,
                    role: 1,
                    rootDirId: 1,
                    storageUsed: { $sum: '$userFiles.size' }
                }
            }
        ]);

        // Determine login state from Redis for each user (sessions are stored in Redis)
        for (const u of users) {
            try {
                const ssnSearch = await redisClient.ft.search('sessionIdx', `@userId:{${u._id.toString()}}`, {
                    RETURN: [],
                });
                u.isLoggedIn = ssnSearch.total > 0;
            } catch (e) {
                u.isLoggedIn = false;
            }
        }
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
}

//manager and above - logout by userId with role hierarchy
export const logOutByUserId = async (req, res, next) => {
    const { userId } = req.params;
    const currentUserRole = req.user.role;
    try {
        const targetUser = await User.findById(userId).select('role').lean();
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Role hierarchy for logout:
        // Owner can logout anyone
        // Admin can logout users and managers (not admin/owner)
        // Manager can only logout users
        if (currentUserRole === 'owner') {
            // Owner can logout anyone
        } else if (currentUserRole === 'admin') {
            if (targetUser.role === 'admin' || targetUser.role === 'owner') {
                return res.status(403).json({ error: 'Admins cannot logout admin or owner users.' });
            }
        } else if (currentUserRole === 'manager') {
            if (targetUser.role !== 'user') {
                return res.status(403).json({ error: 'Managers can only logout regular users.' });
            }
        } else {
            return res.status(403).json({ error: 'Access denied.' });
        }
        await deleteAllSession(userId);
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
        await deleteAllSession(userId);

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
                // Lookup files to calculate storage
                $lookup: {
                    from: 'files',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'userFiles'
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    picture: 1,
                    role: 1,
                    rootDirId: 1,
                    storageUsed: { $sum: '$userFiles.size' }
                }
            }
        ]);

        for (const u of users) {
            try {
                const ssnSearch = await redisClient.ft.search('sessionIdx', `@userId:{${u._id.toString()}}`, {
                    RETURN: [],
                });
                u.isLoggedIn = ssnSearch.total > 0;
            } catch (e) {
                u.isLoggedIn = false;
            }
        }
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
}
//change role - role hierarchy: owner > admin > manager > user
export const changeUserRole = async (req, res, next) => {
    const { userId } = req.params;
    const { newRole } = req.body;
    const currentUserRole = req.user.role;

    const validRoles = ['user', 'admin', 'manager', 'owner'];
    if (!validRoles.includes(newRole)) {
        return res.status(400).json({ error: 'Invalid role. Must be user, admin, manager, or owner.' });
    }
    if (userId === req.user._id.toString()) {
        return res.status(400).json({ error: 'Users cannot change their own role.' });
    }

    try {
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Role hierarchy checks
        // Owner can change anyone's role
        // Admin can change roles except owner
        // Manager can change roles except owner and admin

        if (currentUserRole === 'owner') {
            // Owner can change any role
        } else if (currentUserRole === 'admin') {
            // Admin cannot change owner's role or set role to owner
            if (targetUser.role === 'owner') {
                return res.status(403).json({ error: 'Admins cannot change owner role.' });
            }
            if (newRole === 'owner') {
                return res.status(403).json({ error: 'Admins cannot set role to owner.' });
            }
        } else if (currentUserRole === 'manager') {
            // Manager cannot change owner/admin roles or set role to owner/admin
            if (targetUser.role === 'owner' || targetUser.role === 'admin') {
                return res.status(403).json({ error: 'Managers cannot change owner or admin roles.' });
            }
            if (newRole === 'owner' || newRole === 'admin') {
                return res.status(403).json({ error: 'Managers cannot set role to owner or admin.' });
            }
        } else {
            return res.status(403).json({ error: 'Access denied.' });
        }

        targetUser.role = newRole;
        await targetUser.save();
        return res.status(200).json({ message: 'User role updated successfully.' });
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
        await deleteAllSession(userId);
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