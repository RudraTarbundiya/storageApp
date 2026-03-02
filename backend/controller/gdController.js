import fetchToken, { listDriveFiles, getDriveClient } from "../services/googleOauth.js"
import File from "../models/fileModel.js"
import Directory from "../models/directoryModel.js"
import { WriteStream } from 'fs'
import path from 'path'
import { rm } from 'fs/promises'
import mime from 'mime-types'

// Google Drive special MIME types mapping to export MIME types and extensions
// These are native Google formats that need to be exported (not downloaded directly)
const GOOGLE_MIME_TYPE_MAP = {
    'application/vnd.google-apps.document': { exportMimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', extension: '.docx' },
    'application/vnd.google-apps.spreadsheet': { exportMimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: '.xlsx' },
    'application/vnd.google-apps.presentation': { exportMimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', extension: '.pptx' },
    'application/vnd.google-apps.drawing': { exportMimeType: 'image/png', extension: '.png' },
    'application/vnd.google-apps.form': { exportMimeType: 'application/pdf', extension: '.pdf' },
    'application/vnd.google-apps.script': { exportMimeType: 'application/vnd.google-apps.script+json', extension: '.json' },
    'application/vnd.google-apps.site': { exportMimeType: 'text/plain', extension: '.txt' },
    'application/vnd.google-apps.jam': { exportMimeType: 'application/pdf', extension: '.pdf' },
    'application/vnd.google-apps.map': { exportMimeType: 'application/pdf', extension: '.pdf' },
};

export const codeToToken = async (req, res, next) => {
    const code = req.body.code
    const userId = req.user._id;
    try {
        await fetchToken(code, userId)
        return res.status(200).json({ message: "Token fetched and stored successfully" })
    } catch (error) {
        res.status(200).json(error)
        // next(error)
    }
}

export const listData = async (req, res, next) => {
    const userId = req.user._id;
    const folderId = req.query.folderId || 'root';
    const pageToken = req.query.pageToken || null;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" })
    }
    try {
        const options = {
            pageToken: pageToken
        };
        if (folderId && folderId !== 'root') {
            options.q = `'${folderId}' in parents and trashed=false`;
        }
        const { files, folders, nextPageToken } = await listDriveFiles(userId, options);
        res.status(200).json({
            files: files || [],
            folders: folders || [],
            nextPageToken: nextPageToken || null
        });
    } catch (error) {
        next(error)
    }
}

export const importFromGoogleDrive = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { fileId } = req.body;

        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        // Get authenticated user from session
        const userRootDirId = req.user.rootDirId;
        if (!userRootDirId) {
            return res.status(404).json({ error: "root directory not found!" });
        }

        //make new Google Drive Folder and add all gd files there
        let newGoogleDriveFolder;
        const existingGdFolder = await Directory.findOne({ name: 'GoogleDrive', userId: userId, parentDirId: userRootDirId });
        if (!existingGdFolder) {
            newGoogleDriveFolder = await Directory.create({
                name: `GoogleDrive`,
                userId: userId,
                parentDirId: userRootDirId
            })
        }


        // Get Google Drive client
        const drive = await getDriveClient(userId);

        // Get file metadata from Google Drive
        const fileMetadata = await drive.files.get({
            fileId: fileId,
            fields: 'id, name, mimeType, size'
        });
        const fileSize = +fileMetadata.data.size || 0;

        // Check if user has enough storage space
        const rootDirectory = await Directory.findById(userRootDirId);
        if (rootDirectory.size + fileSize > req.user.maxStorageInBytes) {
            return res.status(400).json({ error: "Importing this file would exceed your storage limit" });
        }
        // Skip folders
        if (fileMetadata.data.mimeType === 'application/vnd.google-apps.folder') {
            return res.status(400).json({ error: "Cannot import folders" });
        }

        const originalFileName = fileMetadata.data.name;
        const fileMimeType = fileMetadata.data.mimeType;

        // Check if this is a Google native format that needs export
        const googleFormatInfo = GOOGLE_MIME_TYPE_MAP[fileMimeType];

        // Determine the correct extension
        let extension = '';
        if (googleFormatInfo) {
            // Use the mapped extension for Google native formats
            extension = googleFormatInfo.extension;
        } else if (fileMimeType) {
            // Try to get extension from mime-types library
            const mimeExt = mime.extension(fileMimeType);
            if (mimeExt) {
                extension = '.' + mimeExt;
            }
        }
        // Fallback to file extension from name if mime type didn't work
        if (!extension) {
            const fileExt = path.extname(originalFileName);
            if (fileExt) {
                extension = fileExt;
            }
        }

        // Create file record in database
        const fileRecord = await File.create({
            name: originalFileName,
            extension: extension,
            parentDirId: existingGdFolder ? existingGdFolder._id : newGoogleDriveFolder._id,
            userId: userId,
            size: fileSize
        });
        //increse the size og GoogleDriveFolder
        if (existingGdFolder) {
            existingGdFolder.size += fileSize;
            await existingGdFolder.save();
        } else {
            newGoogleDriveFolder.size = fileSize;
            await newGoogleDriveFolder.save();
        }

        // Also increase the size of user's root directory
        if (rootDirectory) {
            rootDirectory.size += fileSize
            await rootDirectory.save();
        }

        try {
            let response;

            if (googleFormatInfo) {
                // Export Google native formats (Docs, Sheets, Slides, etc.)
                response = await drive.files.export(
                    { fileId: fileId, mimeType: googleFormatInfo.exportMimeType },
                    { responseType: 'stream' }
                );
            } else {
                // Download regular files directly
                response = await drive.files.get(
                    { fileId: fileId, alt: 'media' },
                    { responseType: 'stream' }
                );
            }

            // Save to storage
            const storagePath = path.join(import.meta.dirname, '../storage', fileRecord._id + extension);
            const writeStream = WriteStream(storagePath);

            response.data.pipe(writeStream);

            // Handle write completion
            writeStream.on('finish', () => {
                return res.status(201).json({
                    message: 'File imported successfully from Google Drive',
                    file: {
                        _id: fileRecord._id,
                        name: originalFileName,
                        extension: extension
                    }
                });
            });

            // Handle errors
            writeStream.on('error', async (err) => {
                console.error('Write stream error:', err);
                await rm(storagePath).catch(() => { });
                await File.deleteOne({ _id: fileRecord._id });
                next(err);
            });

            response.data.on('error', async (err) => {
                console.error('Download error:', err);
                await rm(storagePath).catch(() => { });
                await File.deleteOne({ _id: fileRecord._id });
                next(err);
            });

        } catch (err) {
            // Clean up on error
            await File.deleteOne({ _id: fileRecord._id });
            const storagePath = path.join(import.meta.dirname, '../storage', fileRecord._id + extension);
            await rm(storagePath).catch(() => { });
            next(err);
        }

    } catch (error) {
        console.error('Import error:', error);
        next(error);
    }
}