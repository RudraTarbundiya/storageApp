import { rm } from 'fs/promises'
import path from 'path'
import Directory from '../models/directoryModel.js'
import File from '../models/fileModel.js'

export const getDirectoryById = async (req, res, next) => {

    const _id = req.params.id || req.user.rootDirId.toString()
    try {
        const directoryData = await Directory.findOne({ _id, userId: req.user._id }).lean()
        if (!directoryData) return res.status(404).json({ error: "Directory not found or you do not have access to it!" });
        const files = await File.find({ parentDirId: _id },{'__v' : 0}).lean()
        const directories = await Directory.find({ parentDirId: _id },{'__v': 0}).lean()
        return res.status(200).json({ ...directoryData, files: files.map(f => ({ id: f._id, ...f })), directories: directories.map(d => ({ id: d._id, ...d })) })
    } catch (err) {
        next(err)
    }

}

export const createDirectory = async (req, res, next) => {

    const parentId = req.params.parentId || req.user.rootDirId.toString()
    const name = req.headers.dirname || "new folder"
    if (!name) return res.status(400).json({ error: 'Missing directory name (send in header "dirname")' })
    console.log({
        name: name,
        userId: req.user._id,
        parentDirId: parentId
    })
    try {
        await Directory.insertOne({
            name: name,
            userId: req.user._id,
            parentDirId: parentId
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
    const db = req.db


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
        const dirObj = await Directory.findOne({ _id: id, userId: req.user._id }, { projection: { _id: 1 } }).lean()
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

        return res.status(200).json({ message: 'Directory and all its contents deleted' })
    } catch (err) {
        next(err)
    }
}