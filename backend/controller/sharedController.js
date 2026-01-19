import File from "../models/fileModel.js"
import User from "../models/userModel.js"
import Directory from "../models/directoryModel.js"

export const searchUserByEmail = async (req, res) => {
    try {
        const { email } = req.query
        
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
        res.status(500).json({ message: error.message })
    }
}

export const shareFile = async (req, res) => {
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
        res.status(500).json({ message: error.message })
    }
}

export const shareDirectory = async (req, res) => {
    try {
        const { dirId } = req.params
        const { shareUserId , permission } = req.body // User to share with

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
        if (!dir.sharedWith.some(share => share.user.toString() === shareUserId)) {
            dir.sharedWith.push({ user: shareUserId, permission })
            await dir.save()
        }

        // Share all subdirectories recursively
        const shareSubdirectories = async (parentDirId) => {
            const subdirs = await Directory.find({ parentDirId: parentDirId })
            for (const subdir of subdirs) {
                if (!subdir.sharedWith.some(share => share.user.toString() === shareUserId)) {
                    subdir.sharedWith.push({ user: shareUserId, permission })
                    await subdir.save()
                }
                await shareSubdirectories(subdir._id)
            }
        }

        // Share all files in directory and subdirectories
        const shareFilesRecursive = async (parentDirId) => {
            const files = await File.find({ parentDirId: parentDirId })
            for (const file of files) {
                if (!file.sharedWith.some(share => share.user.toString() === shareUserId)) {
                    file.sharedWith.push({ user: shareUserId, permission })
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
        res.status(500).json({ message: error.message })
    }
}

// Get items shared with me
export const getSharedWithMe = async (req, res) => {
    try {
        const userId = req.user._id

        const files = await File.find({ 'sharedWith.user': userId })
            .populate('owner', 'name email picture')
            .populate('sharedWith.user', 'name email picture')

        const directories = await Directory.find({ 'sharedWith.user': userId })
            .populate('owner', 'name email picture')
            .populate('sharedWith.user', 'name email picture')

        res.json({ files, directories })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Remove share from file or directory
export const removeShare = async (req, res) => {
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

            // Remove user from sharedWith
            dir.sharedWith = dir.sharedWith.filter(share => share.user.toString() !== userId)
            await dir.save()

            return res.json({ message: 'Share removed successfully', directory: dir })
        }

        res.status(400).json({ message: 'File or Directory ID required' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Get items I've shared with others
export const getMySharedItems = async (req, res) => {
    try {
        const userId = req.user._id

        // Get all files shared by current user
        const sharedFiles = await File.find({ 
            userId: userId,
            'sharedWith.0': { $exists: true } // Has at least one share
        })
            .populate('sharedWith.user', 'name email picture')

        // Get all directories shared by current user
        const sharedDirectories = await Directory.find({ 
            userId: userId,
            'sharedWith.0': { $exists: true } // Has at least one share
        })
            .populate('sharedWith.user', 'name email picture')

        res.json({ files: sharedFiles, directories: sharedDirectories })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}