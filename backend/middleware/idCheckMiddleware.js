export default function idCheck(req,res,next,id){
    if(!id.match(/^[0-9a-fA-F-]{36}$/)){
        return res.status(400).json({error:"Invalid file ID format"})
    }
    next()
}