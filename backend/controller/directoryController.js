import { rm } from 'fs/promises'
import path from 'path'
import Directory from '../models/directoryModel.js'
import File from '../models/fileModel.js'
import { updateParentDirectorySize } from '../utils/changeDirectorySize.js';

export const getDirectoryById = async (req, res, next) => {

    const _id = req.params.id || req.user.rootDirId.toString()
    try {
        const directoryData = await Directory.findOne({ _id, userId: req.user._id })
            .populate('sharedWith.user', 'name email picture')
            .lean()
        if (!directoryData) return res.status(404).json({ error: "Directory not found or you do not have access to it!" });
        const files = await File.find({ parentDirId: _id }, { '__v': 0 })
            .populate('sharedWith.user', 'name email picture')
            .lean()
        const directories = await Directory.find({ parentDirId: _id }, { '__v': 0 })
            .populate('sharedWith.user', 'name email picture')
            .lean()
         
        // Compute child counts for each Subdirectory (files + subdirectories)
        const dirIds = directories.map(d => d._id)
        let fileCounts = []
        let dirCounts = []

        if (dirIds.length) {
            fileCounts = await File.aggregate([
                { $match: { parentDirId: { $in: dirIds } } },
                { $group: { _id: '$parentDirId', count: { $sum: 1 } } }
            ])

            dirCounts = await Directory.aggregate([
                { $match: { parentDirId: { $in: dirIds } } },
                { $group: { _id: '$parentDirId', count: { $sum: 1 } } }
            ])
        }

        const dirCountMap = new Map()
        fileCounts.forEach(fc => dirCountMap.set(fc._id.toString(), (dirCountMap.get(fc._id.toString()) || 0) + fc.count))
        dirCounts.forEach(dc => dirCountMap.set(dc._id.toString(), (dirCountMap.get(dc._id.toString()) || 0) + dc.count))

        // Add item count and id to directories (size is already stored in MongoDB)
        const directoriesWithCounts = directories.map(d => ({
            id: d._id,
            ...d,
            itemCount: dirCountMap.get(d._id.toString()) || 0
        }));

        return res.status(200).json({
            ...directoryData,
            files,
            directories: directoriesWithCounts
        })
    } catch (err) {
        next(err)
    }

}

export const createDirectory = async (req, res, next) => {

    const parentId = req.params.parentId || req.user.rootDirId.toString()
    const name = req.body.dirname || "new folder"
    if (!name) return res.status(400).json({ error: 'Missing directory name (send in header "dirname")' })
    try {
        await Directory.insertOne({
            name: name,
            userId: req.user._id,
            parentDirId: parentId,
            size: 0
        })
        res.status(201).json({ message: 'Directory created' })
    } catch (err) {
        // console.log(err)
        next(err)
    }
}

export const renameDirectorry = async (req, res, next) => {
    const id = req.params.id
    const newName = req.body.newDirName
    const user = req.user
    try {
        await Directory.findOneAndUpdate({ _id: id, userId: user._id }, { name: newName }).lean()
        return res.status(200).json({ message: 'Directory renamed' })
    } catch (err) {
        next(err)
    }
}

export const deleteDirectory = async (req, res, next) => {
    const id = req.params.id

    async function collectContentDir(id) {
        let files = await File.find({ parentDirId: id }).select('extension').lean()
        let directories = await Directory.find({ parentDirId: id }).select('_id').lean()

        for (const dir of directories) {
            const { files: childFiles, directories: chilDirs } = await collectContentDir(dir._id)
            files.push(...childFiles)
            directories.push(...chilDirs)
        }
        return { files, directories }
    }

    try {
        const dirObj = await Directory.findOne(
            { _id: id, userId: req.user._id }
        )
        if (!dirObj) return res.status(404).json({ error: 'dir is not found or you are not authorise' })
        const { files, directories } = await collectContentDir(id)
        directories.push({ _id: id }) //include the directory itself for deletion

        //delete form actual storage folder
        for (const file of files) {
            await rm(path.join(import.meta.dirname, '../storage', file._id.toString() + file.extension))
        }
        //delete form filecollection 
        await File.deleteMany({ _id: { $in: files.map(f => f._id) } })

        //delete form directory collection
        await Directory.deleteMany({ _id: { $in: directories.map(d => d._id) } })
        //decrement parent dir size
        await updateParentDirectorySize(dirObj.parentDirId, -dirObj.size).catch(err => {
            next(err)
        })
        return res.status(200).json({ message: 'Directory and all its contents deleted' })
    } catch (err) {
        next(err)
    }
}