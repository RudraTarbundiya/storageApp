import { rm } from 'fs/promises'
import path from 'path'
import { Db, ObjectId } from 'mongodb'
import File from '../models/fileModel.js'
import Directory from '../models/directoryModel.js'
import { sanitizeString } from '../utils/sanitizeInput.js'
import { updateParentDirectorySize } from '../utils/changeDirectorySize.js'
import { deleteS3File, getFileMetadata, makeSignedUrl } from '../services/s3.service.js'


export const sendFile = async (req, res, next) => {
    const id = req.params.id
    const fileobj = await File.findOne({ _id: id, userId: req.user._id }).lean()
    if (!fileobj) return res.status(404).send({ error: 'File not found and or you do not have access to it!' })

    try {
        let signUrl

        if (req.query.action === 'download') {
            signUrl = await makeSignedUrl({ key: id + fileobj.extension, method: 'get', name: fileobj.name , download: true })
            return res.status(302).redirect(signUrl)
        }
        signUrl = await makeSignedUrl({ key: id + fileobj.extension, method: 'get', name: fileobj.name })
        // For previews/streaming, redirect to S3
        return res.status(302).redirect(signUrl)
    } catch (err) {
        next(err)
    }
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
        //delete from actual s3 bucket
        await deleteS3File(filename)
        //delete from filedata
        await fileObj.deleteOne()
        //decrement parent dir size
        await updateParentDirectorySize(fileObj.parentDirId, -fileObj.size).catch(err => {
            next(err)
        })
        return res.status(200).json({ message: 'File deleted successfully' })
    } catch (err) {
        console.log(err);
        next(err)
    }
}

export const initateUpload = async (req, res, next) => {
    const pid = req.params.parentDirId || req.user.rootDirId.toString() //if no parent id then upload to root
    const filename = sanitizeString(req.body.filename || "untitled")
    const filesize = parseInt(req.body.filesize) || 0
    const filetype = req.body.filetype || 'application/octet-stream'
    const extension = path.extname(filename)
    console.log("Initiating upload for file:", filename, "with size:", filesize, "bytes");
    try {
        const parant = await Directory.findOne({ _id: pid, userId: req.user._id }).lean()
        if (!parant) return res.status(404).json({ error: "Parent directory not found!" })

        const rootDir = await Directory.findOne({ _id: req.user.rootDirId, userId: req.user._id }).select('size')
        const availableStorage = req.user.maxStorageInBytes - rootDir.size

        if (filesize > availableStorage) {
            return res.status(507).json({ error: "Insufficient storage space for this file" });
        }

        const file = await File.create({
            name: filename,
            extension,
            size: filesize,
            parentDirId: pid,
            userId: req.user._id,
            isUploading: true
        })
        const key = file._id.toString() + extension
        const signedUrl = await makeSignedUrl({ key, filetype, method: 'put' })
        res.status(200).json({ uploadUrl: signedUrl, fileId: file._id })
    } catch (err) {
        next(err)
    }
}

export const completeUpload = async (req, res, next) => {
    const fileId = req.params.fileId
    try {
        const file = await File.findOne({ _id: fileId, userId: req.user._id })
        if (!file) return res.status(404).json({ error: "File not found!" })
        const metadata = await getFileMetadata(fileId + file.extension)
        if(file.size !== metadata.ContentLength){
            // File size mismatch, delete the incomplete upload
            await file.deleteOne()
            return res.status(400).json({ error: "Uploaded file size does not match the expected size. Please try uploading again." })
        }
        file.isUploading = false
        await file.save()
        await updateParentDirectorySize(file.parentDirId, file.size)
        res.status(200).json({ message: "Upload completed" })
    } catch (err) {
        await File.deleteOne({ _id: fileId, userId: req.user._id })
        next(err)
    }
}