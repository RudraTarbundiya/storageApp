import { Router } from "express";

import checkAuth from "../middleware/authMiddlwWare.js";

const router = Router();



router.post('/register', async (req, res, next) => {
    const db = req.db
    const { name, email, password } = req.body;

    try {
        //if same email exits
        const userExits = await db.collection('users').findOne({email})
        if (userExits) {
            return res.status(400).json({ message: 'User with this email already exists' })
        }

        const rootDir = await db.collection('directories').insertOne({
            name: `root -${email}`,
            parentId: null,
        })
        const rootDirInsertedId = rootDir.insertedId

        const newuser = await db.collection('users').insertOne({
            name,
            email,
            password,
            rootDirId: rootDirInsertedId,
        })

        const updateDir = await db.collection('directories').updateOne({
            _id: rootDirInsertedId
        }, {
            $set: {
                userId: newuser.insertedId
            }
        })

        return res.status(201).json(updateDir)
    } catch (err) {
        next(err)
    }
})

router.post('/login', async (req, res, next) => {
    const { email, password } = req.body
    const db = req.db
    const user = await db.collection('users').findOne({email,password})
    if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' })
    }

    res.cookie('userId', user._id.toString(), {
        httpOnly: true,
        maxAge: 60 * 60 * 1000 * 24 * 7//1 week
    })
    return res.status(200).json({ message: 'Login successful' })
})


router.get('/', checkAuth, (req, res) => {
    res.status(200).json({
        name: req.user.name,
        email: req.user.email,
    })
})

router.post('/logout', (req, res) => {
    res.clearCookie('userId')
    return res.status(204).json({ message: 'Logout successful' })
})

export default router;