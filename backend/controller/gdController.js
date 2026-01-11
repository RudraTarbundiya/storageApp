import fetchToken, { listDriveFiles } from "../services/googleOauth.js"

export const codeToToken = async (req, res, next) => {
    console.log("In gdController")
    const code = req.body.code
    try {
        const sub = await fetchToken(code)
        res.cookie('sub', sub, {
            httpOnly: true,
            signed: true,
            maxAge: 60 * 60 * 1000 * 24 * 7//1 week
        })
        return res.status(200).json({ message: "Token fetched and stored successfully" })
    } catch (error) {
        next(error)
    }
}

export const listFiles = async (req,res,next)=>{
    const userId = req.signedCookies.sub;
    console.log("UserId in listFiles:", userId);
    if(!userId){
        return res.status(401).json({error:"Unauthorized"})
    }
    try {
        const files = await listDriveFiles(userId);
        res.status(200).json({ files });
    } catch (error) {
        next(error)
    }
}    