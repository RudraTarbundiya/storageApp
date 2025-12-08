import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import connectDB from './db.js'
//importing routes
import filesRoutes from './routes/filesRoutes.js'
import directoryRoutes from './routes/directoryRoutes.js'
import userRouteres from './routes/userRoutes.js'
import checkAuth from './middleware/authMiddlwWare.js'

try {
    const db = await connectDB()
    console.log('Connected to DB')

    const app = express()

    app.use(cookieParser())//for parsing cookies

    app.use(express.json())//for json parsing newname in rename handler

    app.use(cors({
        origin: 'http://localhost:3000',
        credentials: true
    }
    ))//enable CORS
    
    app.use((req,res,next)=>{
        req.db = db 
        next()
    })
    app.use('/directory', checkAuth, directoryRoutes)
    app.use('/file', checkAuth, filesRoutes)
    app.use('/user', userRouteres)

    //this is global middleware for eroor handling
    app.use((err, req, res, next) => {
        return res.status(err.status || 500).json({ mesasge: err.message || 'Internal Server Error' })
    })

    app.listen(4000, () => {
        console.log('Server is running on http://localhost:4000')
    })
} catch (err) {
    console.log(err)
}
