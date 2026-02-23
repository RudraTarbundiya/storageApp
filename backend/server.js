import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
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

// Rate limiters with different configurations
// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    // skip: (req) => process.env.NODE_ENV === 'development', // Skip in development
})

// General rate limiter for authenticated routes
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    // skip: (req) => process.env.NODE_ENV === 'development',
})

// Relaxed rate limiter for public routes
const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per windowMs
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    // skip: (req) => process.env.NODE_ENV === 'development',
})

// File upload limiter (stricter)
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Limit each IP to 20 uploads per hour
    message: 'Too many file uploads, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    // skip: (req) => process.env.NODE_ENV === 'development',
})

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

app.use(sanitizeRequest)

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