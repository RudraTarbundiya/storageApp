import { stat } from "fs/promises";
import path from 'path'
import File from "../models/fileModel.js";
import Directory from "../models/directoryModel.js";

// Helper function to get file size from filesystem
export const getFileSize = async (fileId, extension) => {
    try {
        const filePath = path.join(import.meta.dirname, '..', 'storage', fileId + (extension || ''));
        const stats = await stat(filePath);
        return stats.size;
    } catch (err) {
        return 0;
    }
};

// Helper function to calculate total size of a directory recursively
export const calculateDirSize = async (dirId) => {
    let totalSize = 0;

    // Get all files in this directory
    const files = await File.find({ parentDirId: dirId }, { size: 1, extension: 1 }).lean();

    // Sum file sizes
    for (const file of files) {
        let size = file.size || 0;
        if (!size) {
            size = await getFileSize(file._id.toString(), file.extension);
        }
        totalSize += size;
    }

    // Get all subdirectories
    const subdirs = await Directory.find({ parentDirId: dirId }, { _id: 1 }).lean();

    // Recursively calculate subdirectory sizes
    for (const subdir of subdirs) {
        totalSize += await calculateDirSize(subdir._id);
    }

    return totalSize;
};