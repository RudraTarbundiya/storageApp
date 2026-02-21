import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import connectDB from './config/db.js'
//importing routes
import filesRoutes from './routes/filesRoutes.js'
import authRoutes from './routes/authRoutes.js'
import directoryRoutes from './routes/directoryRoutes.js'
import usersRouteres from './routes/usersRoutes.js'
import gdRoutes from './routes/gdRoutes.js'
import publicRoutes from './routes/publicRoutes.js'
import sharedRoutes from './routes/sharedRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import checkAuth from './middleware/authMiddlwWare.js'
import sanitizeRequest from './middleware/sanitizeRequest.js'

await connectDB()

const app = express()

app.use(cookieParser(process.env.SESSION_SECRET))//for parsing cookies

app.use(express.json())//for json parsing newname in rename handler

app.use(sanitizeRequest)

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}))//enable CORS

app.use('/auth',authRoutes)
app.use('/admin', checkAuth, adminRoutes)//admin,owner only to show files
app.use('/users',checkAuth, usersRouteres)//manager,admin,owner only
app.use('/directory', checkAuth, directoryRoutes)
app.use('/file', checkAuth, filesRoutes)
app.use('/gd',checkAuth, gdRoutes)
app.use('/shared',checkAuth,sharedRoutes)
app.use('/public',publicRoutes)

//this is global middleware for eroor handling
app.use((err, req, res, next) => {
    console.log(err)
    // return res.status(200).json(err)//for testing
    return res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})