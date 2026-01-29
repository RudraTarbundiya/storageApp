import path from "path";
import Directory from "../models/directoryModel.js";
import File from "../models/fileModel.js";
import { calculateDirSize, getFileSize } from "../utils/getSize.js";

// Get all public items owned by the current user
// Returns directories first (top-level public dirs), then standalone public files
export const getMyPublicItems = async (req, res, next) => {
    const userId = req.user._id;
    try {
        // Get all public directories owned by the user that are "top-level public"
        // A top-level public dir is one where its parent is NOT public (or has no parent)
        const allPublicDirs = await Directory.find({ userId, isPublic: true })
            .populate('userId', 'name picture')
            .lean();

        // Filter to only top-level public directories
        // (directories whose parent is either null or not public)
        const parentIds = allPublicDirs.map(d => d.parentDirId).filter(id => id);
        const parentDirs = await Directory.find({ _id: { $in: parentIds } }).lean();
        const parentPublicMap = new Map(parentDirs.map(d => [d._id.toString(), d.isPublic]));

        const topLevelPublicDirs = allPublicDirs.filter(d => {
            if (!d.parentDirId) return true; // No parent = top level
            return parentPublicMap.get(d.parentDirId.toString()) !== true; // Parent not public
        });

        // Add size and item count to directories
        const directoriesWithStats = await Promise.all(topLevelPublicDirs.map(async (d) => {
            const totalSize = await calculateDirSize(d._id);
            const fileCount = await File.countDocuments({ parentDirId: d._id });
            const subDirCount = await Directory.countDocuments({ parentDirId: d._id });
            return {
                ...d,
                itemCount: fileCount + subDirCount,
                totalSize
            };
        }));

        // Get all public files owned by the user that are "standalone public"
        // A standalone public file is one in a non-public directory
        const allPublicFiles = await File.find({ userId, isPublic: true })
            .populate('userId', 'name picture')
            .lean();

        // Filter to only standalone public files (parent dir is not public)
        const fileParentIds = allPublicFiles.map(f => f.parentDirId).filter(id => id);
        const fileParentDirs = await Directory.find({ _id: { $in: fileParentIds } }).lean();
        const fileParentPublicMap = new Map(fileParentDirs.map(d => [d._id.toString(), d.isPublic]));

        const standalonePublicFiles = allPublicFiles.filter(f => {
            if (!f.parentDirId) return true; // No parent = standalone
            return fileParentPublicMap.get(f.parentDirId.toString()) !== true; // Parent not public
        });

        // Add file sizes if missing
        const filesWithSizes = await Promise.all(standalonePublicFiles.map(async (f) => {
            let size = f.size || 0;
            if (!size) {
                size = await getFileSize(f._id.toString(), f.extension);
            }
            return { ...f, size };
        }));

        return res.status(200).json({
            directories: directoriesWithStats,
            files: filesWithSizes
        });
    } catch (err) {
        next(err);
    }
};

//use in public share,share with user,admin view all files but use different middleware for that
export const getPublicDirData = async (req, res, next) => {
    const _id = req.params.id
    try {
        const directoryData = await Directory.findOne({ _id }).populate('userId', 'name picture').lean()
        if (!directoryData) return res.status(404).json({ error: "Directory not found!" });
        const files = await File.find({ parentDirId: _id }, { '__v': 0 }).populate('userId', 'name picture').lean()
        const directories = await Directory.find({ parentDirId: _id }, { '__v': 0 }).populate('userId', 'name picture').lean()

        // Get file sizes - either from DB or from filesystem
        const filesWithSizes = await Promise.all(files.map(async (f) => {
            let size = f.size || 0;
            // If size is 0 or not stored, get it from filesystem
            if (!size) {
                size = await getFileSize(f._id.toString(), f.extension);
            }
            return { id: f._id, ...f, size };
        }));

        // Compute child counts for each directory (files + subdirectories)
        const dirIds = directories.map(d => d._id)
        let fileCounts = []
        let dirCounts = []

        if (dirIds.length) {
            fileCounts = await File.aggregate([
                { $match: { parentDirId: { $in: dirIds } } },
                { $group: { _id: '$parentDirId', count: { $sum: 1 } } }
            ])

            dirCounts = await Directory.aggregate([
                { $match: { parentDirId: { $in: dirIds } } },
                { $group: { _id: '$parentDirId', count: { $sum: 1 } } }
            ])
        }

        const dirCountMap = new Map()
        fileCounts.forEach(fc => dirCountMap.set(fc._id.toString(), (dirCountMap.get(fc._id.toString()) || 0) + fc.count))
        dirCounts.forEach(dc => dirCountMap.set(dc._id.toString(), (dirCountMap.get(dc._id.toString()) || 0) + dc.count))

        // Calculate total size for each directory
        const directoriesWithCounts = await Promise.all(directories.map(async (d) => {
            const totalSize = await calculateDirSize(d._id);
            return {
                id: d._id,
                ...d,
                itemCount: dirCountMap.get(d._id.toString()) || 0,
                totalSize
            };
        }));

        return res.status(200).json({
            ...directoryData,
            files: filesWithSizes,
            directories: directoriesWithCounts
        })
    } catch (err) {
        next(err)
    }
}

export const sendPublicFile = async (req, res, next) => {
    const id = req.params.id
    const fileobj = await File.findById(id).populate('userId', 'name picture').lean()
    if (!fileobj) return res.status(404).send({ error: 'File not found!' })

    const filePath = path.join(import.meta.dirname, '..', 'storage', id + (fileobj.extension || ''))

    // Set CORS headers for streaming with credentials
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:5175')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Accept-Ranges', 'bytes')

    // Set content type based on extension for proper streaming
    const mimeTypes = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.mov': 'video/quicktime',
        '.avi': 'video/x-msvideo',
        '.mkv': 'video/x-matroska',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.aac': 'audio/aac',
        '.flac': 'audio/flac',
        '.m4a': 'audio/mp4',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf'
    }
    const ext = (fileobj.extension || '').toLowerCase()
    if (mimeTypes[ext]) {
        res.setHeader('Content-Type', mimeTypes[ext])
    }

    // Set Content-Disposition header with filename for the frontend to extract
    const encodedFilename = encodeURIComponent(fileobj.name)
    res.setHeader('Content-Disposition', `inline; filename="${encodedFilename}"`)
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type')

    if (req.query.action === 'download') {
        res.download(filePath, fileobj.name)
        return
    }
    res.sendFile(filePath, (err) => {
        // Ignore aborted connections (client closed before file finished sending)
        if (err && err.code !== 'ECONNABORTED' && !res.headersSent) {
            next(err)
        }
    })
}

// Helper function to update public status recursively for both public and unpublic operations
const updateDirectoryPublicStatus = async (dirId, isPublic) => {
    // Update the parent directory
    const dir = await Directory.findByIdAndUpdate(dirId, { isPublic }, { new: true }).lean();
    if (!dir) {
        throw new Error('Directory not found');
    }

    // Helper function to recursively update subdirectories
    const updateSubdirs = async (parentId) => {
        const subdirs = await Directory.find({ parentDirId: parentId });
        for (const subdir of subdirs) {
            await Directory.findByIdAndUpdate(subdir._id, { isPublic });
            await updateSubdirs(subdir._id); // Recursively process nested directories
        }
    };

    // Update all files in this directory
    await File.updateMany({ parentDirId: dirId }, { isPublic });

    // Update all subdirectories
    await updateSubdirs(dirId);

    // Collect and update all files in subdirectories recursively
    const allSubdirIds = [];
    const collectSubdirIds = async (parentId) => {
        const subdirs = await Directory.find({ parentDirId: parentId }, '_id');
        subdirs.forEach(d => allSubdirIds.push(d._id));
        for (const subdir of subdirs) {
            await collectSubdirIds(subdir._id);
        }
    };
    await collectSubdirIds(dirId);
    if (allSubdirIds.length > 0) {
        await File.updateMany({ parentDirId: { $in: allSubdirIds } }, { isPublic });
    }

    return dir;
};

export const toggleDirectoryPublicStatus = async (req, res, next) => {
    const id = req.params.id;
    const { isPublic } = req.body;
    // Validate that isPublic is a boolean
    if (typeof isPublic !== 'boolean') {
        return res.status(400).json({ error: 'isPublic must be a boolean value' });
    }

    try {
        const dir = await updateDirectoryPublicStatus(id, isPublic);
        const message = isPublic
            ? 'Directory and all contents made public'
            : 'Directory and all contents made private';
        return res.status(200).json({ message, dir });
    } catch (error) {
        next(error);
    }
};

export const toggleFilePublicStatus = async (req, res, next) => {
    const id = req.params.id;
    const { isPublic } = req.body;

    // Validate that isPublic is a boolean
    if (typeof isPublic !== 'boolean') {
        return res.status(400).json({ error: 'isPublic must be a boolean value' });
    }

    try {
        const file = await File.findByIdAndUpdate(id, { isPublic }, { new: true }).lean();
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }
        const message = isPublic
            ? 'File made public'
            : 'File made private';
        return res.status(200).json({ message, file });
    } catch (error) {
        next(error);
    }
};