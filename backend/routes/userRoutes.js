import { Router } from "express";
import {writeFile} from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

import dirdata from '../directoriesDb.json' with { type: 'json' };;
import usersData from '../usersDb.json' with { type: 'json' };

const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));


router.post('/register', async (req, res, next) => {
    const userId = crypto.randomUUID();
    const rootDirId = crypto.randomUUID();
    const { username, email, password } = req.body;

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
        username,
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

export default router;