import express from 'express'
import { rm} from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { Db, ObjectId } from 'mongodb'

import idCheck from '../middleware/idCheckMIddleware.js'
const router = express.Router()

router.param('id', idCheck)
router.param('parentId', idCheck)

//send list of files 
router.get(['/', '/:id'], async (req, res, next) => {


    const _id = req.params.id ? new ObjectId(req.params.id) : req.user.rootDirId
    const db = req.db
    const dirCollection = db.collection('directories')
    const directoryData = await dirCollection.findOne({ _id, userId: req.user._id })
    if (!directoryData) {
        return res.status(404).json({ error: "Directory not found or you do not have access to it!" });
    }

    const files = await db.collection('files').find({ parentId: _id }).toArray()
    const directories = await dirCollection.find({ parentId: _id }).toArray()

    return res.status(200).json({ ...directoryData, files: files.map(f => ({ id: f._id, ...f })), directories: directories.map(d => ({ id: d._id, ...d })) })

})

//make directory
router.post(['/', '/:parentId'], async (req, res, next) => {

    const parentId = req.params.parentId ? new ObjectId(req.params.parentId) : req.user.rootDirId
    const name = req.headers.dirname || "new folder"
    const db = req.db
    const dirCollection = db.collection('directories')
    if (!name) return res.status(400).json({ message: 'Missing directory name (send in header "dirname" or JSON body)' })

    try {
        await dirCollection.insertOne({
            name: name,
            userId: req.user._id,
            parentId: parentId,
        })
        res.status(201).json({ message: 'Directory created' })
    } catch (err) {
        next(err)
    }
})

// rename directory
router.patch('/:id', async (req, res, next) => {
    const id = req.params.id
    const db = req.db

    const newName = req.body.newDirName

    try {
        const result = await db.collection('directories').updateOne({ _id: new ObjectId(id), userId: req.user._id }, { $set: { name: newName } })
        console.log(result)
        return res.status(200).json({ message: 'Directory renamed' })
    } catch (err) {
        next(err)
    }
})

// delete directory (recursive): removes directory and all child directories and files
router.delete('/:id', async (req, res, next) => {
    const id = req.params.id
    const db = req.db
    const _id = new ObjectId(id)

    async function collectContentDir(id) {
        let files = await db.collection('files').find({ parentId: id }, { projection: { extension: 1 } }).toArray()
        let directories = await db.collection('directories').find({ parentId: id }, { projection: { _id: 1 } }).toArray()

        for (const dir of directories) {
            const { files: childFiles, directories: chilDirs } = await collectContentDir(dir._id)
            files.push(...childFiles)
            directories.push(...chilDirs)
        }
        return { files, directories }
    }

    try {
        const dirObj = await db.collection('directories').findOne({ _id, userId: req.user._id }, { projection: { _id: 1 } })
        if (!dirObj) return res.status(404).json({ massage: 'dir is not found or you are not authorise' })

        const { files, directories } = await collectContentDir(_id)
        directories.push({ _id })
        
        //delete form actual storage folder
        for (const file of files) {
            await rm(path.join(import.meta.dirname, '../storage', file._id.toString() + file.extension))
        }
        //delete form filecollection 
        await db.collection('files').deleteMany({ _id: { $in: files.map(f => f._id) } })

        //delete form directory collection
        await db.collection('directories').deleteMany({ _id: { $in: directories.map(d => d._id) } })

        return res.status(200).json({ message: 'Directory and all its contents deleted' })
    }catch(err){
        next(err)
    }
})

export default router