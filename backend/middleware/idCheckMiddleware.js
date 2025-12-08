import { ObjectId } from "mongodb";

export default function idCheck(req,res,next,id){
    if(!ObjectId.isValid(id)){
        return res.status(400).json({error:"Invalid file ID format"})
    }
    next()
}