/**
 * EXAMPLE IMPLEMENTATIONS - Rate Limiting for Different Routes
 * Use these as templates for other routes in your application
 */

// ============================================================
// EXAMPLE 1: FILES ROUTES - With File Upload/Download Limits
// ============================================================

import express from 'express'
import { 
    uploadFile, 
    downloadFile, 
    deleteFile, 
    listFiles 
} from '../controller/fileController.js'
import checkAuth from '../middleware/authMiddlwWare.js'
import { customRateLimiter, moderateRateLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

// GET - Standard limit
router.get('/list', listFiles)

// POST - File Upload - MODERATE limit (50 per hour)
// Uploads are resource-intensive, so we limit them
router.post('/upload', 
    customRateLimiter({ 
        max: 50,              // 50 uploads
        windowMs: 60 * 60 * 1000, // per hour
        message: 'Upload limit exceeded. Max 50 uploads per hour.'
    }),
    uploadFile
)

// GET - File Download - MODERATE limit (100 per hour)
// Downloads are less resource-intensive than uploads
router.get('/download/:fileId', 
    customRateLimiter({ 
        max: 100,
        windowMs: 60 * 60 * 1000,
        message: 'Download limit exceeded. Max 100 downloads per hour.'
    }),
    downloadFile
)

// DELETE - Delete File - STRICT limit (20 per hour)
// Destructive operation, needs strict limiting
router.delete('/:fileId', 
    customRateLimiter({ 
        max: 20,
        windowMs: 60 * 60 * 1000,
        message: 'Cannot delete more than 20 files per hour.'
    }),
    deleteFile
)

export default router


// ============================================================
// EXAMPLE 2: USERS ROUTES - Different Limits by Operation
// ============================================================

import express from 'express'
import { 
    getAllUsers, 
    updateUser, 
    deleteUser, 
    createUser 
} from '../controller/usersController.js'
import checkAuth from '../middleware/authMiddlwWare.js'
import { checkAdmin } from '../middleware/authMiddlwWare.js'
import { customRateLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

// GET - List users - STANDARD limit
router.get('/all', getAllUsers)

// POST - Create new user - MODERATE limit (10 per hour)
router.post('/create', 
    checkAdmin,
    customRateLimiter({ 
        max: 10,
        windowMs: 60 * 60 * 1000,
        message: 'Cannot create more than 10 users per hour.'
    }),
    createUser
)

// PUT - Update user - MODERATE limit (30 per 15 min)
router.put('/:userId', 
    checkAdmin,
    customRateLimiter({ 
        max: 30,
        windowMs: 15 * 60 * 1000,
        message: 'Too many user updates.'
    }),
    updateUser
)

// DELETE - Delete user - STRICT limit (5 per hour)
// Destructive operation
router.delete('/:userId', 
    checkAdmin,
    customRateLimiter({ 
        max: 5,
        windowMs: 60 * 60 * 1000,
        message: 'Cannot delete more than 5 users per hour.'
    }),
    deleteUser
)

export default router


// ============================================================
// EXAMPLE 3: ADMIN ROUTES - Very Strict Limits
// ============================================================

import express from 'express'
import { 
    getStats, 
    manageLicenses, 
    backupData, 
    purgeOldFiles 
} from '../controller/adminController.js'
import checkAuth from '../middleware/authMiddlwWare.js'
import { checkAdmin } from '../middleware/authMiddlwWare.js'
import { strictRateLimiter, customRateLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

// GET - Stats - MODERATE limit
router.get('/stats', getStats)

// POST - Manage Licenses - STRICT limit (5 per hour)
router.post('/licenses', 
    strictRateLimiter(),
    manageLicenses
)

// POST - Backup - VERY STRICT limit (2 per day = 2 per 24 hours)
router.post('/backup', 
    customRateLimiter({ 
        max: 2,
        windowMs: 24 * 60 * 60 * 1000,
        message: 'Maximum 2 backups per day.'
    }),
    backupData
)

// DELETE - Purge Old Files - VERY STRICT (1 per week)
router.delete('/purge-old', 
    customRateLimiter({ 
        max: 1,
        windowMs: 7 * 24 * 60 * 60 * 1000,
        message: 'Purge operation can only be done once per week.'
    }),
    purgeOldFiles
)

export default router


// ============================================================
// EXAMPLE 4: DIRECTORY ROUTES - Balanced Limits
// ============================================================

import express from 'express'
import { 
    createDirectory, 
    getDirectories, 
    updateDirectory, 
    deleteDirectory, 
    moveDirectory 
} from '../controller/directoryController.js'
import { customRateLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

// GET - List directories - STANDARD limit
router.get('/', getDirectories)

// POST - Create directory - MODERATE limit (50 per hour)
router.post('/create', 
    customRateLimiter({ 
        max: 50,
        windowMs: 60 * 60 * 1000,
        message: 'Cannot create more than 50 directories per hour.'
    }),
    createDirectory
)

// PUT - Update directory - MODERATE limit (30 per 15 min)
router.put('/:dirId', 
    customRateLimiter({ 
        max: 30,
        windowMs: 15 * 60 * 1000
    }),
    updateDirectory
)

// DELETE - Delete directory - STRICT limit (20 per hour)
router.delete('/:dirId', 
    customRateLimiter({ 
        max: 20,
        windowMs: 60 * 60 * 1000,
        message: 'Cannot delete more than 20 directories per hour.'
    }),
    deleteDirectory
)

// POST - Move directory - MODERATE limit
router.post('/:dirId/move', 
    customRateLimiter({ 
        max: 30,
        windowMs: 60 * 60 * 1000
    }),
    moveDirectory
)

export default router


// ============================================================
// EXAMPLE 5: SHARING ROUTES - Controlled Share Limits
// ============================================================

import express from 'express'
import { 
    shareFile, 
    unshareFile, 
    getShares, 
    updateSharePermissions 
} from '../controller/sharedController.js'
import { customRateLimiter, strictRateLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

// GET - Get shares - STANDARD limit
router.get('/', getShares)

// POST - Share file - MODERATE limit (50 per 15 min)
router.post('/share', 
    customRateLimiter({ 
        max: 50,
        windowMs: 15 * 60 * 1000,
        message: 'Cannot share more than 50 items per 15 minutes.'
    }),
    shareFile
)

// DELETE - Unshare - MODERATE limit
router.delete('/:shareId', 
    customRateLimiter({ 
        max: 30,
        windowMs: 15 * 60 * 1000
    }),
    unshareFile
)

// PUT - Update permissions - MODERATE limit
router.put('/:shareId/permissions', 
    customRateLimiter({ 
        max: 20,
        windowMs: 15 * 60 * 1000,
        message: 'Too many permission changes.'
    }),
    updateSharePermissions
)

export default router


// ============================================================
// EXAMPLE 6: GOOGLE DRIVE ROUTES - With Sync Limits
// ============================================================

import express from 'express'
import { 
    getRootFolders, 
    syncGoogleDrive, 
    importFromGD, 
    syncStatus 
} from '../controller/gdController.js'
import { strictRateLimiter, customRateLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

// GET - Get folders - STANDARD limit
router.get('/folders', getRootFolders)

// GET - Sync status - STANDARD limit
router.get('/sync-status', syncStatus)

// POST - Sync Google Drive - STRICT limit (5 per hour)
// Syncing is resource-intensive
router.post('/sync', 
    customRateLimiter({ 
        max: 5,
        windowMs: 60 * 60 * 1000,
        message: 'Sync can be performed maximum 5 times per hour.'
    }),
    syncGoogleDrive
)

// POST - Import from GD - MODERATE limit (20 per hour)
router.post('/import', 
    customRateLimiter({ 
        max: 20,
        windowMs: 60 * 60 * 1000,
        message: 'Cannot import more than 20 items per hour.'
    }),
    importFromGD
)

export default router


// ============================================================
// RATE LIMITING STRATEGY MATRIX
// ============================================================

/**
 * OPERATION TYPE → RECOMMENDED LIMITS
 * 
 * ┌─────────────────────────────────────────┐
 * │ AUTHENTICATION                          │
 * ├─────────────────┬───────────────────────┤
 * │ Login           │ 5/15min (Strictest)   │
 * │ Register        │ 5/15min (Strictest)   │
 * │ Password Reset  │ 3/hour (Strictest)    │
 * │ OTP             │ 5/15min (Strictest)   │
 * └─────────────────┴───────────────────────┘
 * 
 * ┌─────────────────────────────────────────┐
 * │ DATA MODIFICATIONS (CREATE/UPDATE)      │
 * ├─────────────────┬───────────────────────┤
 * │ File Upload     │ 50/hour (Moderate)    │
 * │ Create Folder   │ 50/hour (Moderate)    │
 * │ Update Profile  │ 10/15min (Moderate)   │
 * │ Share File      │ 50/15min (Moderate)   │
 * │ Create User     │ 10/hour (Moderate)    │
 * └─────────────────┴───────────────────────┘
 * 
 * ┌─────────────────────────────────────────┐
 * │ DESTRUCTIVE OPERATIONS (DELETE)         │
 * ├─────────────────┬───────────────────────┤
 * │ Delete File     │ 20/hour (Strict)      │
 * │ Delete Folder   │ 20/hour (Strict)      │
 * │ Delete User     │ 5/hour (Strict)       │
 * │ Purge Old Data  │ 1/week (Very Strict)  │
 * │ System Reset    │ 1/month (Extreme)     │
 * └─────────────────┴───────────────────────┘
 * 
 * ┌─────────────────────────────────────────┐
 * │ READ OPERATIONS (GET)                   │
 * ├─────────────────┬───────────────────────┤
 * │ List Files      │ 200/15min (Standard)  │
 * │ List Users      │ 100/15min (Standard)  │
 * │ File Download   │ 100/hour (Standard)   │
 * │ Public Search   │ 200/15min (Lenient)   │
 * └─────────────────┴───────────────────────┘
 * 
 * ┌─────────────────────────────────────────┐
 * │ RESOURCE-INTENSIVE OPERATIONS           │
 * ├─────────────────┬───────────────────────┤
 * │ Google Sync     │ 5/hour (Very Strict)  │
 * │ Backup          │ 2/day (Very Strict)   │
 * │ Direct Processing │ 10/hour (Strict)   │
 * └─────────────────┴───────────────────────┘
 */


// ============================================================
// GUIDELINES FOR SETTING LIMITS
// ============================================================

/**
 * 1. START CONSERVATIVE
 *    - Begin with low limits
 *    - Increase based on actual usage patterns
 *    - Monitor 429 responses
 * 
 * 2. CONSIDER USER IMPACT
 *    - Normal users should never hit limits
 *    - Power users might occasionally hit limits
 *    - Attackers should hit limits rapidly
 * 
 * 3. WEIGHT BY OPERATION COST
 *    - GET: Low cost → Higher limits (100-200/15min)
 *    - POST: Medium cost → Moderate limits (30-50/15min)
 *    - DELETE: High cost → Low limits (5-20/hour)
 * 
 * 4. CONSIDER BUSINESS LOGIC
 *    - Critical operations (auth) → Very strict
 *    - User convenience → More lenient
 *    - Security concerns → Stricter
 * 
 * 5. MONITOR AND ADJUST
 *    - Track 429 errors in your logs
 *    - Adjust if legitimate users are affected
 *    - Keep attack patterns under observation
 */

export default {}
