import express from 'express'
import { rm, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

import dirdata from '../directoriesDb.json' with { type: 'json' };
import filedata from '../filesDb.json' with { type: 'json' };
import usersData from '../usersDb.json' with { type: 'json' };
import idCheck from '../middleware/idCheckMIddleware.js'
const router = express.Router()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

router.param('id',idCheck)
router.param('parentId',idCheck)

//send list of files 
router.get(['/', '/:id'], async (req, res, next) => {

    const rootOfUser = req.user.rootDirId
    const id = req.params.id || rootOfUser

    // Find the directory and verify ownership
    const directoryData = dirdata.find((directory) => directory.id === id && directory.userId === req.user.id);
    if (!directoryData) {
        return res.status(404).json({ error: "Directory not found or you do not have access to it!" });
    }


    const files = (directoryData.files || []).map((fileId) => {
        return filedata.find((file) => file.id === fileId)
    })

    const directories = directoryData.directories.map((dirId) => {
        return dirdata.find((dir) => dir.id === dirId)
    }).map(({ id, name }) => ({ id, name }))

    return res.status(200).json({ ...directoryData, files, directories })

})


//make directory
router.post(['/', '/:parentId'], async (req, res, next) => {

    const rootOfUser = req.user.rootDirId
    const parentId = req.params.parentId || rootOfUser
    const name = req.headers.dirname || "new folder"
    if (!name) return res.status(400).json({ message: 'Missing directory name (send in header "dirname" or JSON body)' })

    const newDir = {
        id: crypto.randomUUID(),
        name: name,
        userId: req.user.id,
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
    const directoryData = dirdata.find((d) => d.id === id)

    if (!directoryData) return res.status(404).json({ message: 'Directory not found' })

    // Check if the directory belongs to the user
    if (directoryData.userId !== req.user.id) {
        return res.status(403).json({ message: "You are not authorized to rename this directory!" });
    }

    const newName = req.body.newDirName
    if (!newName) return res.status(400).json({ message: 'Missing newname in body or dirname header' })
    directoryData.name = newName

    try {
        await writeFile(path.join(__dirname, '..', 'directoriesDb.json'), JSON.stringify(dirdata, null, 2))
        return res.status(200).json({ message: 'Directory renamed', directory: directoryData })
    } catch (err) {
        next(err)
    }
})

// delete directory (recursive): removes directory and all child directories and files
router.delete('/:id', async (req, res, next) => {
    const id = req.params.id
    const dirIndex = dirdata.findIndex(d => d.id === id)
    if (dirIndex === -1) return res.status(404).json({ message: 'Directory not found' })
    // Check if the directory belongs to the user
    if (dirdata[dirIndex].userId !== req.user.id) {
        return res.status(403).json({ message: "You are not authorized to delete this directory!" });
    }
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