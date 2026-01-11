import { getOauthUrl } from "../services/googleOauth.js"
import fetchIdToken from "../services/googleOauth.js"
import { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis'
import Token from "../models/tokenModel.js"
import File from "../models/fileModel.js"
import Directory from "../models/directoryModel.js"
import { Readable } from 'stream'

const client_id = '63206782506-clugu9nar16huil5fcvg51e70fpd9m9v.apps.googleusercontent.com'
const client_secret = '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'
const redirect_uri = 'http://localhost:5173/google-drive-callback'

const oauth2Client = new OAuth2Client({
    clientId: client_id,
    clientSecret: client_secret,
    redirectUri: redirect_uri
})

export const getAuthUrl = async (req, res, next) => {
    try {
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/drive.readonly'],
            prompt: 'consent'
        })
        res.json({ url })
    } catch (error) {
        next(error)
    }
}

export const authorizeGoogleDrive = async (req, res, next) => {
    try {
        const { code } = req.body
        const userId = req.userId
        
        // Exchange authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code)
        
        // Save tokens to database
        await Token.findOneAndUpdate(
            { userId },
            { 
                userId,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiryDate: tokens.expiry_date
            },
            { upsert: true, new: true }
        )
        
        res.json({ success: true, message: 'Google Drive authorized successfully' })
    } catch (error) {
        console.error('Error authorizing Google Drive:', error)
        next(error)
    }
}

export const checkAuth = async (req, res, next) => {
    try {
        const userId = req.userId
        const tokenDoc = await Token.findOne({ userId })
        
        res.json({ authorized: !!tokenDoc && !!tokenDoc.accessToken })
    } catch (error) {
        next(error)
    }
}

export const listGoogleDriveFiles = async (req, res, next) => {
    try {
        const userId = req.userId
        const { folderId } = req.query
        
        // Get user's Google Drive tokens
        const tokenDoc = await Token.findOne({ userId })
        if (!tokenDoc || !tokenDoc.accessToken) {
            return res.status(401).json({ error: 'Google Drive not authorized' })
        }
        
        // Set credentials
        oauth2Client.setCredentials({
            access_token: tokenDoc.accessToken,
            refresh_token: tokenDoc.refreshToken,
            expiry_date: tokenDoc.expiryDate
        })
        
        const drive = google.drive({ version: 'v3', auth: oauth2Client })
        
        // Build query
        let query = 'trashed=false'
        if (folderId && folderId !== 'root') {
            query += ` and '${folderId}' in parents`
        } else {
            query += " and 'root' in parents"
        }
        
        const response = await drive.files.list({
            q: query,
            fields: 'files(id, name, mimeType, modifiedTime, size, iconLink)',
            pageSize: 100,
            orderBy: 'folder,name'
        })
        
        res.json({ files: response.data.files })
    } catch (error) {
        console.error('Error listing Google Drive files:', error)
        next(error)
    }
}

export const importFromGoogleDrive = async (req, res, next) => {
    try {
        const userId = req.userId
        const { fileId, fileName, mimeType, targetFolderId } = req.body
        
        // Don't import folders
        if (mimeType === 'application/vnd.google-apps.folder') {
            return res.status(400).json({ error: 'Cannot import folders' })
        }
        
        // Get user's Google Drive tokens
        const tokenDoc = await Token.findOne({ userId })
        if (!tokenDoc || !tokenDoc.accessToken) {
            return res.status(401).json({ error: 'Google Drive not authorized' })
        }
        
        // Set credentials
        oauth2Client.setCredentials({
            access_token: tokenDoc.accessToken,
            refresh_token: tokenDoc.refreshToken,
            expiry_date: tokenDoc.expiryDate
        })
        
        const drive = google.drive({ version: 'v3', auth: oauth2Client })
        
        // Download file from Google Drive
        const response = await drive.files.get(
            { fileId: fileId, alt: 'media' },
            { responseType: 'stream' }
        )
        
        // Convert stream to buffer
        const chunks = []
        for await (const chunk of response.data) {
            chunks.push(chunk)
        }
        const buffer = Buffer.concat(chunks)
        
        // Get file metadata
        const metadata = await drive.files.get({
            fileId: fileId,
            fields: 'size, mimeType'
        })
        
        // Save to database
        const newFile = new File({
            name: fileName,
            userId: userId,
            parentDirId: targetFolderId || null,
            size: parseInt(metadata.data.size) || buffer.length,
            mimeType: metadata.data.mimeType || 'application/octet-stream',
            data: buffer
        })
        
        await newFile.save()
        
        res.json({ 
            success: true, 
            message: `File "${fileName}" imported successfully`,
            file: {
                _id: newFile._id,
                name: newFile.name,
                size: newFile.size,
                mimeType: newFile.mimeType
            }
        })
    } catch (error) {
        console.error('Error importing from Google Drive:', error)
        next(error)
    }
}
