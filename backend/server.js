import 'dotenv/config'
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

await connectDB()

const app = express()

app.use(cookieParser('RudraSecret'))//for parsing cookies

app.use(express.json())//for json parsing newname in rename handler

app.use(cors({
    origin: 'http://localhost:5175',
    credentials: true
}))//enable CORS

app.use('/users', usersRouteres)
app.use('/auth',authRoutes)
app.use('/directory', checkAuth, directoryRoutes)
app.use('/file', checkAuth, filesRoutes)
app.use('/gd',checkAuth, gdRoutes)
app.use('/shared',sharedRoutes)
app.use('/public',publicRoutes)
app.use('/admin',adminRoutes)

//this is global middleware for eroor handling
app.use((err, req, res, next) => {
    console.log(err)
    // return res.status(200).json(err)//for testing
    return res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' })
})

app.listen(4000, () => {
    console.log('Server is running on http://localhost:4000')
})