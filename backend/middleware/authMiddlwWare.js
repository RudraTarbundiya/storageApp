import { ChangeStream } from "mongodb";
import User from "../models/userModel.js";
import crypto from "node:crypto";

export default async function checkAuth(req, res, next) {
    const token = req.signedCookies.token || null;
    if(!token){
        return  res.status(401).json({ error: "Not logged!" });
    }
    const {_id , expiry} = JSON.parse(Buffer.from(token,'base64').toString());
    if (expiry < Math.round(Date.now() / 1000)) {
        res.clearCookie('token');
        console.log("Session expired");
        return res.status(401).json({ error: "Session expired!" });
    }
    const user = await User.findOne({ _id }).lean();
    if (!user) {
        return res.status(401).json({ error: "Not logged!" });
    }
    req.user = user
    next()
}
