import rateLimit from 'express-rate-limit'
// import createThrottler from '../middleware/throttle.js'

const isDev = process.env.NODE_ENV === 'development'

// Rate limiters
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isDev,
})

export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isDev,
})

export const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isDev,
})

export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: 'Too many file uploads, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isDev,
})

// // Global Throttlers for route groups
// // [useUserId, delayAfter, windowMs, limitPerSecond]
// export const authThrottle = createThrottler('throttle:auth', false, 3, 60000, 2) // 2 req/sec
// export const generalThrottle = createThrottler('throttle:general', true, 5, 60000, 3) // 3 req/sec
// export const publicThrottle = createThrottler('throttle:public', false, 3, 60000, 1) // 1 req/sec
// export const uploadThrottle = createThrottler('throttle:upload', true, 3, 3600000, 2) // 2 req/sec, 1 hour