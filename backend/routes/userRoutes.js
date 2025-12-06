import { Router } from "express";
import {writeFile} from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

import dirdata from '../directoriesDb.json' with { type: 'json' };;
import usersData from '../usersDb.json' with { type: 'json' };
import checkAuth from "../middleware/authMiddlwWare.js";

const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));


router.post('/register', async (req, res, next) => {
    const userId = crypto.randomUUID();
    const rootDirId = crypto.randomUUID();
    const { name, email, password } = req.body;

    dirdata.push({
        id: rootDirId,
        name: `root -${email}`,
        userId: userId,
        parentId: null,
        files: [],
        directories: []
    })

    usersData.push({
        id: userId,
        name,
        email,
        password,
        rootDirId,
    })

    try {
        await writeFile(path.join(__dirname, '..', 'usersDb.json'), JSON.stringify(usersData, null, 2))
        await writeFile(path.join(__dirname, '..', 'directoriesDb.json'), JSON.stringify(dirdata, null, 2))
        return res.status(201).json({message : 'User registered successfully'})
    }catch(err){
        next(err)
    }
})

router.post('/login',(req,res,next)=>{
    const {email,password} = req.body
    const user = usersData.find(u=>u.email === email && u.password === password)
    if(!user){
        return res.status(401).json({message: 'Invalid email or password'})
    }

    res.cookie('userId',user.id,{
        httpOnly : true,
        maxAge:60*60*1000 *24 * 7//1 week
    })
    return res.status(200).json({message : 'Login successful'})
})

router.post('/logout',(req,res)=>{
    res.clearCookie('userId')
    return res.status(204).json({message : 'Logout successful'})
})

router.get('/',checkAuth,(req,res)=>{
    res.status(200).json({
        name : req.user.name,
        email: req.user.email,
    })
})

export default router;