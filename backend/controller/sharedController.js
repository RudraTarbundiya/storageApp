import File from "../models/fileModel.js"
import User from "../models/userModel.js"
import Directory from "../models/directoryModel.js"

export const searchUserByEmail = async (req, res, next) => {
    try {
        const { email } = req.body

        if (!email || email.length < 3) {
            return res.status(400).json({ message: 'Enter at least 3 characters' })
        }

        // Find user matching email (exclude current user)
        const user = await User.find({
            email: { $regex: email, $options: 'i' },
            _id: { $ne: req.user._id },
            isDelete: false
        })
            .select('name email picture')

        res.json(user)
    } catch (error) {
        next(error)
    }
}

export const shareFile = async (req, res, next) => {
    try {
        const { fileId } = req.params
        const { shareUserId , permission } = req.body // User to share with

        const file = await File.findById(fileId)

        if (!file) {
            return res.status(404).json({ message: 'File not found' })
        }

        // Check if user exists
        const targetUser = await User.findById(shareUserId)
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' })
        }

        // Add to sharedWith array (avoid duplicates)
        if (!file.sharedWith.some(share => share.user.toString() === shareUserId)) {
            file.sharedWith.push({ user: shareUserId, permission })
            await file.save()
        }

        res.json({ message: 'File shared successfully', file })
    } catch (error) {
        next(error)
    }
}

export const shareDirectory = async (req, res, next) => {
    const { dirId } = req.params
    const { shareUserId, permission } = req.body // User to share with
    try {

        const dir = await Directory.findById(dirId)

        if (!dir) {
            return res.status(404).json({ message: 'Directory not found' })
        }

        // Check if user exists
        const targetUser = await User.findById(shareUserId)
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' })
        }

        // Add to sharedWith array (avoid duplicates)
        if (!dir.sharedWith.some(share => share.user?.toString() === shareUserId)) {
            dir.sharedWith.push({ user: shareUserId, permission: permission || 'view' })
            dir.markModified('sharedWith')
            await dir.save()
        }

        // Share all subdirectories recursively
        const shareSubdirectories = async (parentDirId) => {
            const subdirs = await Directory.find({ parentDirId: parentDirId })
            for (const subdir of subdirs) {
                if (!subdir.sharedWith.some(share => share.user?.toString() === shareUserId)) {
                    subdir.sharedWith.push({ user: shareUserId, permission: permission || 'view' })
                    subdir.markModified('sharedWith')
                    await subdir.save()
                }
                await shareSubdirectories(subdir._id)
            }
        }

        // Share all files in directory and subdirectories
        const shareFilesRecursive = async (parentDirId) => {
            const files = await File.find({ parentDirId: parentDirId })
            for (const file of files) {
                if (!file.sharedWith.some(share => share.user?.toString() === shareUserId)) {
                    file.sharedWith.push({ user: shareUserId, permission: permission || 'view' })
                    file.markModified('sharedWith')
                    await file.save()
                }
            }

            const subdirs = await Directory.find({ parentDirId: parentDirId })
            for (const subdir of subdirs) {
                await shareFilesRecursive(subdir._id)
            }
        }

        await shareSubdirectories(dirId)
        await shareFilesRecursive(dirId)

        res.json({ message: 'Directory and all contents shared successfully', directory: dir })
    } catch (error) {
        next(error)
    }
}

// Get items shared with me
export const getSharedWithMe = async (req, res, next) => {
    try {
        const userId = req.user._id

        // Get all files explicitly shared with me
        // Note: Only files with explicit sharedWith entry are returned
        // Files created AFTER sharing will NOT be included (must be explicitly shared)
        const allFiles = await File.find({ 'sharedWith.user': userId })
            .populate('userId', 'name  picture')
            .populate('sharedWith.user', 'name  picture')

        // Get all directories explicitly shared with me
        const allDirectories = await Directory.find({ 'sharedWith.user': userId })
            .populate('userId', 'name  picture')
            .populate('sharedWith.user', 'name  picture')

        // Get IDs of all shared directories
        const sharedDirIds = allDirectories.map(dir => dir._id.toString())

        // Filter directories to only include top-most ones (exclude subdirectories of shared dirs)
        const topDirectories = allDirectories.filter(dir => {
            // If parent is null or parent is not in shared list, it's a top directory
            return !dir.parentDirId || !sharedDirIds.includes(dir.parentDirId.toString())
        })

        // Filter files to only include explicitly shared standalone files
        // Excludes files inside shared directories (they are accessed through directory navigation)
        // Newly created files after sharing are NOT included (require explicit sharing)
        const standaloneFiles = allFiles.filter(file => {
            return !sharedDirIds.includes(file.parentDirId?.toString())
        })

        res.json({ files: standaloneFiles, directories: topDirectories })
    } catch (error) {
        next(error)
    }
}
// Remove share from file or directory
export const removeShare = async (req, res, next) => {
    try {
        const { fileId, dirId, userId } = req.params

        if (fileId) {
            // Remove share from file
            const file = await File.findById(fileId)

            if (!file) {
                return res.status(404).json({ message: 'File not found' })
            }

            // Check if current user is the owner
            if (file.userId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Unauthorized' })
            }

            // Remove user from sharedWith
            file.sharedWith = file.sharedWith.filter(share => share.user.toString() !== userId)
            file.markModified('sharedWith')
            await file.save()

            return res.json({ message: 'Share removed successfully', file })
        }

        if (dirId) {
            // Remove share from directory
            const dir = await Directory.findById(dirId)

            if (!dir) {
                return res.status(404).json({ message: 'Directory not found' })
            }

            // Check if current user is the owner
            if (dir.userId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Unauthorized' })
            }

            // Remove user from sharedWith for this directory
            dir.sharedWith = dir.sharedWith.filter(share => share.user.toString() !== userId)
            dir.markModified('sharedWith')
            await dir.save()

            // Recursively remove share from all subdirectories
            const removeShareFromSubdirs = async (parentDirId) => {
                const subdirs = await Directory.find({ parentDirId: parentDirId })
                for (const subdir of subdirs) {
                    subdir.sharedWith = subdir.sharedWith.filter(share => share.user?.toString() !== userId)
                    subdir.markModified('sharedWith')
                    await subdir.save()
                    await removeShareFromSubdirs(subdir._id)
                }
            }

            // Remove share from all files in this directory and subdirectories
            const removeShareFromFiles = async (parentDirId) => {
                const files = await File.find({ parentDirId: parentDirId })
                for (const file of files) {
                    file.sharedWith = file.sharedWith.filter(share => share.user?.toString() !== userId)
                    file.markModified('sharedWith')
                    await file.save()
                }

                const subdirs = await Directory.find({ parentDirId: parentDirId })
                for (const subdir of subdirs) {
                    await removeShareFromFiles(subdir._id)
                }
            }

            // Execute recursive removal
            await removeShareFromSubdirs(dirId)
            await removeShareFromFiles(dirId)

            return res.json({ message: 'Share removed from directory and all contents successfully', directory: dir })
        }

        res.status(400).json({ message: 'File or Directory ID required' })
    } catch (error) {
        next(error)
    }
}

// Get items I've shared with others
export const getMySharedItems = async (req, res, next) => {
    try {
        const userId = req.user._id

        // Get all files shared by current user
        const allSharedFiles = await File.find({
            userId: userId,
            'sharedWith.0': { $exists: true } // Has at least one share
        })
            .populate('sharedWith.user', 'name email picture')

        // Get all directories shared by current user
        const allSharedDirectories = await Directory.find({
            userId: userId,
            'sharedWith.0': { $exists: true } // Has at least one share
        })
            .populate('sharedWith.user', 'name email picture')

        // Get IDs of all shared directories
        const sharedDirIds = allSharedDirectories.map(dir => dir._id.toString())

        // Filter directories to only include top-most ones (exclude subdirectories of shared dirs)
        const topDirectories = allSharedDirectories.filter(dir => {
            // If parent is null or parent is not in shared list, it's a top directory
            return !dir.parentDirId || !sharedDirIds.includes(dir.parentDirId.toString())
        })

        // Filter files to only include those NOT in any shared directory
        const standaloneFiles = allSharedFiles.filter(file => {
            return !sharedDirIds.includes(file.parentDirId.toString())
        })

        res.json({ files: standaloneFiles, directories: topDirectories })
    } catch (error) {
        next(error)
    }
}