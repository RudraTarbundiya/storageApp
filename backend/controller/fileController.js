import { createWriteStream } from 'fs'
import { rm } from 'fs/promises'
import path from 'path'
import { Db, ObjectId } from 'mongodb'
import File from '../models/fileModel.js'
import Directory from '../models/directoryModel.js'
import { sanitizeString } from '../utils/sanitizeInput.js'


export const sendFile = async (req, res, next) => {
    const id = req.params.id
    const fileobj = await File.findOne({ _id: id, userId: req.user._id }).lean()
    if (!fileobj) return res.status(404).send({ error: 'File not found and or you do not have access to it!' })

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

export const renameFile = async (req, res, next) => {
    const id = req.params.id

    const fileobj = await File.findOne({ _id: new ObjectId(id), userId: req.user._id })
    if (!fileobj) return res.status(404).json({ error: 'File not found or you do not have access to it!' })

    try {
        fileobj.name = req.body.newFileName
        await fileobj.save()
        return res.status(200).json({ message: 'File renamed', newName: req.body.newFileName })
    } catch (err) {
        next(err)
    }
}

export const deleteFile = async (req, res, next) => {
    const id = req.params.id

    try {
        const fileObj = await File.findOne({ _id: id, userId: req.user._id })
        const filename = id + fileObj.extension

        // Check if file exists or user has access
        if (!fileObj) {
            return res.status(404).json({ error: "File not found! or you do not have access to it!" });
        }

        //delete from filedata
        await fileObj.deleteOne()
        //delete from storage
        await rm(path.join(import.meta.dirname, '../storage', filename))
        return res.status(200).json({ message: 'File deleted successfully' })
    } catch (err) {
        console.log(err);
        next(err)
    }
}

export const uploadFile = async (req, res, next) => {

    const parentDirId = req.params.parentDirId || req.user.rootDirId.toString() //if no parent id then upload to root
    
    // Remove quotes and get clean filename
    let rawFilename = req.headers.filename || "untitled.txt"
    const filename = sanitizeString(rawFilename)
    
    // Extract extension using regex - matches .ext at end of string (ignoring trailing quotes/spaces)
    const extensionMatch = filename.match(/\.(\w+)(?:["'\s]*)$/)
    const extension = extensionMatch ? `.${extensionMatch[1]}` : ''
    const filesize = parseInt(req.headers['filesize']) || 0

    try {
        // Check if parent directory exists
        const parentDirData = await Directory.findOne({ _id: parentDirId, userId: req.user._id }).lean()
        if (!parentDirData) {
            return res.status(404).json({ error: "Parent directory not found!" });
        }
        if(contentLength > 1000 * 1024 * 1024) { //1gb limit
            res.set('Connection', 'close') // Close connection
            return res.status(413).json({ error: "File size exceeds 1GB limit" });
        }
        const file = await File.create({
            name: filename,
            extension: extension,
            size: filesize,
            parentDirId,
            userId: req.user._id
        })

        //actual file write in storage folder
        const filePath = path.join(import.meta.dirname, '../storage', file._id + extension)
        const ws = createWriteStream(filePath)
        let bytesWritten = 0
        let aborted = false

        const abortUpload = async (status, message) => {
            console.log(`Aborting upload: ${message}`)
            if (aborted) return
            aborted = true
            req.destroy()
            ws.destroy()
            try {
                await rm(filePath, { force: true })
            } catch (cleanupErr) {
                console.log('Cleanup error:', cleanupErr.message)
            }
            try {
                await file.deleteOne()
            } catch (cleanupErr) {
                console.log('Cleanup error:', cleanupErr.message)
            }
            res.set('Connection', 'close')
            return res.status(status).json({ error: message })
        }

        req.on('data', async (chunk) => {
            if (aborted) return // If already aborted, ignore further data
            bytesWritten += chunk.length
            if (filesize > 0 && bytesWritten > filesize) {
                await abortUpload(413, 'File size exceeds declared filesize')
            } else {
                ws.write(chunk)
            }
        })

        // Handle stream completion
        req.on('end', () => {
            if (aborted) return
            ws.end()
            res.status(201).json({ message: 'File uploaded successfully' })
        })

        req.on('error', (err) => {
            console.log("Request error:", err.message)
            ws.destroy()
            next(err)
        })

        ws.on('error', (err) => {
            console.log("WriteStream error:", err.message)
            next(err)
        })
    } catch (err) {
        console.log(err);
        next(err)
    }
}