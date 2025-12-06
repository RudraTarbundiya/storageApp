import express from 'express'
import { WriteStream } from 'fs'
import { rm, writeFile } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import idCheck from '../middleware/idCheckMIddleware.js'

import filedata from '../filesDb.json' with { type: 'json' };
import dirdata from '../directoriesDb.json' with { type: 'json' };

const router = express.Router()

router.param('id',idCheck)
router.param('parentid',idCheck)

//server the file - get request
router.get('/:id', (req, res, next) => {
    const id = req.params.id
    const fileobj = filedata.find((file) => file.id === id)
    if (!fileobj) return res.status(404).send('File not found')

    // Check if file exists
    if (!fileobj) {
        return res.status(404).json({ error: "File not found!" });
    }

    // Check parent directory ownership
    const parentDir = dirdata.find((dir) => dir.id === fileobj.parentId);
    if (!parentDir) {
        return res.status(404).json({ error: "Parent directory not found!" });
    }
    if (parentDir.userId !== req.user.id) {
        return res.status(403).json({ error: "You don't have access to this file." });
    }

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

//rename - patch request
router.patch('/:id', async (req, res, next) => {

    const id = req.params.id
    const fileobj = filedata.find((file) => file.id === id)

    // Check if file exists
    if (!fileobj) {
        return res.status(404).json({ error: "File not found!" });
    }

    // Check parent directory ownership
    const parentDir = dirdata.find((dir) => dir.id === fileobj.parentId);
    if (!parentDir) {
        return res.status(404).json({ error: "Parent directory not found!" });
    }
    if (parentDir.userId !== req.user.id) {
        return res.status(403).json({ error: "You don't have access to this file." });
    }

    fileobj.name = req.body.newFileName
    try {
        await writeFile(path.join(import.meta.dirname, '../filesDb.json'), JSON.stringify(filedata))
        return res.status(200).json({ message: 'File renamed', newName: fileobj.name })
    } catch (err) {
        next(err)
    }
})

//delete file - delete request
router.delete('/:id', async (req, res, next) => {
    const id = req.params.id
    const index = filedata.findIndex((file) => file.id === id)
    if (index === -1) return res.status(404).json({ message: 'File not found' })

    // Check if file exists
    if (index === -1) {
        return res.status(404).json({ error: "File not found!" });
    }

    const fileobj = filedata[index];
    // Check parent directory ownership
    const parentDir = dirdata.find((dir) => dir.id === fileobj.parentId);
    if (!parentDir) {
        return res.status(404).json({ error: "Parent directory not found!" });
    }
    if (parentDir.userId !== req.user.id) {
        return res.status(403).json({ error: "You don't have access to this file." });
    }

    try {
        //delete from filedata
        filedata.splice(index, 1)
        await writeFile(path.join(import.meta.dirname, '../filesDb.json'), JSON.stringify(filedata))
        //delete from storage
        const name = id + fileobj.extension
        await rm(path.join(import.meta.dirname, '../storage', name), { recursive: true })
        //delete from dictoryDb too
        const dir = dirdata.find((dir) => dir.files.includes(id))
        dir.files = dir.files.filter((fileId) => fileId !== id)
        await writeFile(path.join(import.meta.dirname, '../directoriesDb.json'), JSON.stringify(dirdata))

        return res.status(200).json({ message: 'File deleted successfully' })
    } catch (err) {
        next(err)
    }
})

//upload - post request
router.post(['/', '/:parentid'], async (req, res, next) => {

    const parentid = req.params.parentid || req.user.rootDirId //if no parent id then upload to root
    const filename = req.headers.filename || "untitled" //if no filename in header then untitled
    const id = crypto.randomUUID()
    const extension = path.extname(filename)

    // Check if parent directory exists
    const parentDirData = dirdata.find((dir) => dir.id === parentid);
    if (!parentDirData) {
        return res.status(404).json({ error: "Parent directory not found!" });
    }

    // Check if the directory belongs to the user
    if (parentDirData.userId !== req.user.id) {
        return res
            .status(403)
            .json({ error: "You do not have permission to upload to this directory." });
    }

    filedata.push({ id, extension, name: filename, parentId: parentid })//add file in filedata
    const dirObj = dirdata.find((dir) => dir.id === parentid)
    dirObj.files.push(id) //add fileid in directodydata files array
    try {
        await writeFile(path.join(import.meta.dirname, '../filesDb.json'), JSON.stringify(filedata))
        await writeFile(path.join(import.meta.dirname, '../directoriesDb.json'), JSON.stringify(dirdata))
        //actual file write in storage folder
        const ws = WriteStream(path.join(import.meta.dirname, '../storage', id + extension))
        req.pipe(ws)
        req.on('end', () => {
            return res.status(201).json({ message: 'File uploaded successfully' })
        })
    } catch (err) {
        next(err)
    }
})

export default router