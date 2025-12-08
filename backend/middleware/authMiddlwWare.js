import { ObjectId } from "mongodb";


export default async function checkAuth(req, res, next) {
    const { userId } = req.cookies;
    const db = req.db;
    
    if(!userId){
        return res.status(401).json({ error: "Not logged!" });
    }   
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
        return res.status(401).json({ error: "Not logged!" });
    }
    req.user = user
    next()
}
