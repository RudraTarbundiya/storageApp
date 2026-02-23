import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import connectDB from './config/db.js'
import {
    authLimiter,
    // authThrottle,
    generalLimiter,
    // generalThrottle,
    publicLimiter,
    // publicThrottle,
    uploadLimiter,
    // uploadThrottle,
} from './utils/trafficControl.js'
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

// Security headers with helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https:"],
            fontSrc: ["'self'", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: true,
    frameguard: { action: 'deny' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
}))

app.use(cookieParser(process.env.SESSION_SECRET))//for parsing cookies

app.use(express.json())//for json parsing newname in rename handler

app.use(sanitizeRequest)//for sanitizing inputs to prevent XSS and injection attacks

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}))//enable CORS

// Apply rate limiters to routes
app.use('/auth', authLimiter, authRoutes) // Strict rate limiting for auth
app.use('/admin', checkAuth, generalLimiter, adminRoutes) //admin,owner only to show files
app.use('/users', checkAuth, generalLimiter, usersRouteres) //manager,admin,owner only
app.use('/directory', checkAuth, generalLimiter, directoryRoutes)
app.use('/file', checkAuth, uploadLimiter, filesRoutes) // Stricter for file operations
app.use('/gd', checkAuth, generalLimiter, gdRoutes)
app.use('/shared', checkAuth, generalLimiter, sharedRoutes)
app.use('/public', publicLimiter, publicRoutes) // Relaxed for public routes

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