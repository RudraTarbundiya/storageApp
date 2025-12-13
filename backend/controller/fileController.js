import { WriteStream } from 'fs'
import { rm} from 'fs/promises'
import path from 'path'
import { Db, ObjectId } from 'mongodb'
import File from '../models/fileModel.js'
import Directory from '../models/directoryModel.js'


export const sendFile = async (req, res, next) => {
    const id = req.params.id
    const fileobj = await File.findOne({_id : id , userId : req.user._id}).lean()
    if (!fileobj) return res.status(404).send({ error : 'File not found and or you do not have access to it!' })

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
    const db = req.db
    const id = req.params.id

    const fileobj = await File.findOne({_id : new ObjectId(id), userId : req.user._id})
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
        const fileObj = await File.findOne({_id : id, userId :req.user._id})
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
    const filename = req.headers.filename || "untitled" //if no filename in header then untitled
    const extension = path.extname(filename)
    try {
        // Check if parent directory exists
        const parentDirData = await Directory.findOne({ _id: parentDirId, userId: req.user._id }).lean()
        if (!parentDirData) {
            return res.status(404).json({ error: "Parent directory not found!" });
        }


        const result = await File.create({
            name: filename,
            extension: extension,
            parentDirId,
            userId: req.user._id
        })
        
        //actual file write in storage folder
        const ws = WriteStream(path.join(import.meta.dirname, '../storage', result._id + extension))
        req.pipe(ws)
        req.on('end', () => {
            return res.status(201).json({ message: 'File uploaded successfully' })
        })
        req.on('error',async (err)=>{
            await rm(path.join(import.meta.dirname, '../storage', result._id + extension))
            await File.deleteOne({_id : result._id})
            next(err)
        })
    } catch (err) {
        console.log(err);
        next(err)
    }
}