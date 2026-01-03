import User from "../models/userModel.js";
import Session from "../models/sesssionModel.js";

export default async function checkAuth(req, res, next) {
    const {sid}= req.signedCookies
    if(!sid){
        return  res.status(401).json({ error: "Not logged!" });
    }
    const ssn = await Session.findById(sid).lean()
    if (!ssn) {
        return res.status(401).json({ error: "Not logged!" });
    }
    const user = await User.findOne({ _id : ssn.userId }).lean();
    if (!user) {
        return res.status(401).json({ error: "Not logged!" });
    }
    req.user = user
    next()
}
