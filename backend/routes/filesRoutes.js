import express from 'express'
import { WriteStream } from 'fs'
import { rm} from 'fs/promises'
import path from 'path'
import idCheck from '../middleware/idCheckMIddleware.js'

import { Db, ObjectId } from 'mongodb'

const router = express.Router()

router.param('id', idCheck)
router.param('parentid', idCheck)

//server the file - get request
router.get('/:id', async (req, res, next) => {
    const id = req.params.id
    const db  = req.db
    const fileobj = await db.collection('files').findOne({_id : new ObjectId(id) , userId : new ObjectId(req.user._id)})
    if (!fileobj) return res.status(404).send('File not found and or you do not have access to it!')

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
})

// rename - patch request
router.patch('/:id', async (req, res, next) => {
    const db = req.db
    const id = req.params.id

    const fileobj = await db.collection('files').findOne({_id : new ObjectId(id), userId : req.user._id})
    if (!fileobj) return res.status(404).json({ message: 'File not found or you do not have access to it!' })

    try {
        await db.collection('files').updateOne({_id : new ObjectId(id)}, { $set: { name: req.body.newFileName } })
        return res.status(200).json({ message: 'File renamed', newName: req.body.newFileName })
    } catch (err) {
        next(err)
    }
})

//delete file - delete request
router.delete('/:id', async (req, res, next) => {
    const id = req.params.id
    const db = req.db
    
    try {
        const fileObj = await db.collection('files').findOne({_id : new ObjectId(id), userId : new ObjectId(req.user._id)});
    
        // Check if file exists or user has access
        if (!fileObj) {
            return res.status(404).json({ error: "File not found! or you do not have access to it!" });
        }
        
        //delete from filedata
        await db.collection('files').deleteOne({_id : new ObjectId(id)})
        //delete from storage
        const name = id + fileObj.extension
        await rm(path.join(import.meta.dirname, '../storage', name), { recursive: true })
        return res.status(200).json({ message: 'File deleted successfully' })
    } catch (err) {
        next(err)
    }
})

//upload - post request
router.post(['/', '/:parentid'], async (req, res, next) => {
    const db = req.db
    const dirCollection = db.collection('directories')
    const parentid = req.params.parentid ? new ObjectId(req.params.parentid) : req.user.rootDirId //if no parent id then upload to root
    const filename = req.headers.filename || "untitled" //if no filename in header then untitled
    const extension = path.extname(filename)

    try {
        // Check if parent directory exists
        const parentDirData = await dirCollection.findOne({ _id: parentid, userId: new ObjectId(req.user._id) });
        if (!parentDirData) {
            return res.status(404).json({ error: "Parent directory not found!" });
        }

        const result = await db.collection('files').insertOne({
            name: filename,
            extension: extension,
            parentId: parentid,
            userId: new ObjectId(req.user._id)
        })
        //actual file write in storage folder
        const ws = WriteStream(path.join(import.meta.dirname, '../storage', result.insertedId + extension))
        req.pipe(ws)
        req.on('end', () => {
            return res.status(201).json({ message: 'File uploaded successfully' })
        })
        req.on('error',async (err)=>{
            await db.collection('files').deleteOne({_id : result.insertedId})
            next(err)
        })
    } catch (err) {
        next(err)
    }
})

export default router