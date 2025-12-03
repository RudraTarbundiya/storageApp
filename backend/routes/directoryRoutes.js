import express from 'express'
import { rm, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

import dirdata from '../directoriesDb.json' with { type: 'json' };
import filedata from '../filesDb.json' with { type: 'json' };

const router = express.Router()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

//send list of files 
router.get(['/', '/:id'], async (req, res, next) => {
    const id = req.params.id

    const dirObj = id ? dirdata.find((dir) => dir.id === id) : dirdata[0]
    if (!dirObj) return res.status(404).json({ message: 'Directory not found' })

    const files = (dirObj.files || []).map((fileId) => {
        return filedata.find((file) => file.id === fileId)
    })

    const directories = dirObj.directories.map((dirId) => {
        return dirdata.find((dir) => dir.id === dirId)
    }).map(({ id, name }) => ({ id, name }))

    return res.status(200).json({ ...dirObj, files, directories })

})


//make directory
router.post(['/', '/:parentId'], async (req, res, next) => {
    const parentId = req.params.parentId || (dirdata[0] && dirdata[0].id)
    const name = req.headers.dirname || "new folder"
    if (!name) return res.status(400).json({ message: 'Missing directory name (send in header "dirname" or JSON body)' })

    const newDir = {
        id: crypto.randomUUID(),
        name: name,
        parentId: parentId || null,
        files: [],
        directories: []
    }
    dirdata.push(newDir)//add new dierectory to dirdata

    const parentDir = dirdata.find((dir) => dir.id === parentId)//add this directory to parent directory's directories array
    parentDir.directories.push(newDir.id)

    try {
        await writeFile(path.join(__dirname, '..', 'directoriesDb.json'), JSON.stringify(dirdata, null, 2))
        res.status(201).json({ message: 'Directory created', directory: newDir })
    } catch (err) {
        next(err)
    }
})

// rename directory
router.patch('/:id', async (req, res, next) => {
    const id = req.params.id
    const dirObj = dirdata.find((d) => d.id === id)
    if (!dirObj) return res.status(404).json({ message: 'Directory not found' })
    const newName = req.body.newname
    if (!newName) return res.status(400).json({ message: 'Missing newname in body or dirname header' })
    dirObj.name = newName
    try {
        await writeFile(path.join(__dirname, '..', 'directoriesDb.json'), JSON.stringify(dirdata, null, 2))
        return res.status(200).json({ message: 'Directory renamed', directory: dirObj })
    } catch (err) {
        next(err)
    }
})

// delete directory (recursive): removes directory and all child directories and files
router.delete('/:id', async (req, res, next) => {
    const id = req.params.id
    const dirIndex = dirdata.findIndex(d => d.id === id)
    if (dirIndex === -1) return res.status(404).json({ message: 'Directory not found' })

    // collect directories and files to delete
    const dirsToDelete = new Set()
    const filesToDelete = new Set()

    function collect(dirId) {
        if (dirsToDelete.has(dirId)) return
        dirsToDelete.add(dirId)
        const dir = dirdata.find(d => d.id === dirId)
        if (!dir) return
            ; (dir.files || []).forEach(fId => filesToDelete.add(fId))
            ; (dir.directories || []).forEach(childId => collect(childId))
    }

    collect(id)

    try {
        // delete files from storage
        const deleteFilePromises = []
        for (const fileId of filesToDelete) {
            const f = filedata.find(x => x.id === fileId)
            if (!f) continue
            const filePath = path.join(__dirname, '..', 'storage', fileId + (f.extension || ''))
            deleteFilePromises.push(rm(filePath, { force: true }))
        }
        await Promise.all(deleteFilePromises)

        // remove file entries from filedata
        const remainingFiles = filedata.filter(f => !filesToDelete.has(f.id))
        filedata.length = 0
        remainingFiles.forEach(f => filedata.push(f))

        // remove directory references from remaining directories and remove the dirs
        const remainingDirs = dirdata.filter(d => !dirsToDelete.has(d.id))
        // ensure parent directories don't reference deleted dirs or files
        remainingDirs.forEach(d => {
            d.directories = (d.directories || []).filter(childId => !dirsToDelete.has(childId))
            d.files = (d.files || []).filter(fileId => !filesToDelete.has(fileId))
        })

        dirdata.length = 0
        remainingDirs.forEach(d => dirdata.push(d))

        // persist changes
        await writeFile(path.join(__dirname, '..', 'filesDb.json'), JSON.stringify(filedata, null, 2))
        await writeFile(path.join(__dirname, '..', 'directoriesDb.json'), JSON.stringify(dirdata, null, 2))

        return res.status(200).json({ message: 'Directory and its contents deleted' })
    } catch (err) {
       next(err)
    }
})

export default router