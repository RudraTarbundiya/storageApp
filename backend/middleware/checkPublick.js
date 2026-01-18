import Directory from "../models/directoryModel.js";
import File from "../models/fileModel.js";

export const checkPublicDir = async (req,res,next)=>{
    const id = req.params.id;
    const dir = await Directory.findById(id).lean();
    if(!dir || !dir.isPublic){
        return res.status(404).json({error: 'Directory not found or is not public'});
    }
    next()
}

export const checkPublicFile = async (req,res,next)=>{
    const id = req.params.id;
    const file = await File.findById(id).lean();
    if(!file || !file.isPublic){
        return res.status(404).json({error: 'File not found or is not public'});
    }
    next()
}