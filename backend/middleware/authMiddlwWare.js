import User from "../models/userModel.js";


export default async function checkAuth(req, res, next) {
    const { userId } = req.cookies;
    
    if(!userId){
        return res.status(401).json({ error: "Not logged!" });
    }   
    const user = await User.findOne({ _id: userId }).lean();
    if (!user) {
        return res.status(401).json({ error: "Not logged!" });
    }
    req.user = user
    next()
}
