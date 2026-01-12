import fetchToken, { listDriveFiles, getDriveClient } from "../services/googleOauth.js"
import File from "../models/fileModel.js"
import Directory from "../models/directoryModel.js"
import { WriteStream } from 'fs'
import path from 'path'
import { rm } from 'fs/promises'
import mime from 'mime-types'

export const codeToToken = async (req, res, next) => {
    const code = req.body.code
    try {
        const sub = await fetchToken(code)
        res.cookie('sub', sub, {
            httpOnly: true,
            signed: true,
            maxAge: 60 * 60 * 1000 * 24 * 7//1 week
        })
        return res.status(200).json({ message: "Token fetched and stored successfully" })
    } catch (error) {
        next(error)
    }
}

export const listData = async (req, res, next) => {
    const userId = req.signedCookies.sub;
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
        console.error('Error in listFiles:', error);
        next(error)
    }
}

export const importFromGoogleDrive = async (req, res, next) => {
    try {
        const googleUserId = req.signedCookies.sub;
        const { fileId } = req.body;

        if (!googleUserId) {
            return res.status(401).json({ error: "Google Drive not authorized" });
        }

        // Get authenticated user from session
        const userId = req.user._id;
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
        const drive = await getDriveClient(googleUserId);

        // Get file metadata from Google Drive
        const fileMetadata = await drive.files.get({
            fileId: fileId,
            fields: 'id, name, mimeType, size'
        });

        // Skip folders
        if (fileMetadata.data.mimeType === 'application/vnd.google-apps.folder') {
            return res.status(400).json({ error: "Cannot import folders" });
        }

        const originalFileName = fileMetadata.data.name;
        const extension = mime.extension(fileMetadata.data.mimeType) ? '.' + mime.extension(fileMetadata.data.mimeType) : path.extname(originalFileName);

        // Create file record in database
        const fileRecord = await File.create({
            name: originalFileName,
            extension: extension || '',
            parentDirId: existingGdFolder ? existingGdFolder._id : newGoogleDriveFolder._id,
            userId: userId
        });

        try {
            // Download file from Google Drive
            const response = await drive.files.get(
                { fileId: fileId, alt: 'media' },
                { responseType: 'stream' }
            );

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