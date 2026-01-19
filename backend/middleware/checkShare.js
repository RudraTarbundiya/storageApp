import File from "../models/fileModel.js"
import Directory from "../models/directoryModel.js"

// Check if user has access to a shared file
export const checkFileShare = async (req, res, next) => {
    try {
        const { fileId } = req.params
        const userId = req.user._id

        const file = await File.findById(fileId)

        if (!file) {
            return res.status(404).json({ message: 'File not found' })
        }

        // Check if user is owner
        if (file.userId.toString() === userId.toString()) {
            req.sharePermission = 'owner'
            return next()
        }

        // Check if file is shared with user
        const sharedAccess = file.sharedWith.find(share => share.user.toString() === userId.toString())

        if (!sharedAccess) {
            return res.status(403).json({ message: 'Access denied - File not shared with you' })
        }

        // Attach permission to request
        req.sharePermission = sharedAccess.permission

        next()
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Check if user has access to a shared directory
export const checkDirectoryShare = async (req, res, next) => {
    try {
        const { dirId } = req.params
        const userId = req.user._id

        const directory = await Directory.findById(dirId)

        if (!directory) {
            return res.status(404).json({ message: 'Directory not found' })
        }

        // Check if user is owner
        if (directory.userId.toString() === userId.toString()) {
            req.sharePermission = 'owner'
            return next()
        }

        // Check if directory is shared with user
        const sharedAccess = directory.sharedWith.find(share => share.user.toString() === userId.toString())

        if (!sharedAccess) {
            return res.status(403).json({ message: 'Access denied - Directory not shared with you' })
        }

        // Attach permission to request
        req.sharePermission = sharedAccess.permission

        next()
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Check if user has edit permission on shared file
export const checkFileEditPermission = async (req, res, next) => {
    try {
        const { fileId } = req.params
        const userId = req.user._id

        const file = await File.findById(fileId)

        if (!file) {
            return res.status(404).json({ message: 'File not found' })
        }

        // Check if user is owner
        if (file.userId.toString() === userId.toString()) {
            return next()
        }

        // Check if file is shared with edit permission
        const sharedAccess = file.sharedWith.find(share => share.user.toString() === userId.toString())

        if (!sharedAccess) {
            return res.status(403).json({ message: 'Access denied - File not shared with you' })
        }

        if (sharedAccess.permission !== 'edit') {
            return res.status(403).json({ message: 'Access denied - You only have view permission' })
        }

        next()
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Check if user has edit permission on shared directory
export const checkDirectoryEditPermission = async (req, res, next) => {
    try {
        const { dirId } = req.params
        const userId = req.user._id

        const directory = await Directory.findById(dirId)

        if (!directory) {
            return res.status(404).json({ message: 'Directory not found' })
        }

        // Check if user is owner
        if (directory.userId.toString() === userId.toString()) {
            return next()
        }

        // Check if directory is shared with edit permission
        const sharedAccess = directory.sharedWith.find(share => share.user.toString() === userId.toString())

        if (!sharedAccess) {
            return res.status(403).json({ message: 'Access denied - Directory not shared with you' })
        }

        if (sharedAccess.permission !== 'edit') {
            return res.status(403).json({ message: 'Access denied - You only have view permission' })
        }

        next()
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export default checkFileShare