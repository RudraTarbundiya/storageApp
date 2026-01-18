import path from "path";
import Directory from "../models/directoryModel.js";
import File from "../models/fileModel.js";
import { calculateDirSize, getFileSize } from "./directoryController.js";

export const getPublicDirData = async (req, res, next) => {
    const _id = req.params.id
    try {
        const directoryData = await Directory.findOne({ _id }).lean()
        if (!directoryData) return res.status(404).json({ error: "Directory not found!" });
        const files = await File.find({ parentDirId: _id }, { '__v': 0 }).lean()
        const directories = await Directory.find({ parentDirId: _id }, { '__v': 0 }).lean()

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
    const fileobj = await File.findById(id).lean()
    if (!fileobj) return res.status(404).send({ error: 'File not found!' })

    const filePath = path.join(import.meta.dirname, '..', 'storage', id + (fileobj.extension || ''))
    if (req.query.action === 'download') {
        res.download(filePath, fileobj.name)
        return
    }
    res.sendFile(filePath, (err) => {
        if (err) {
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