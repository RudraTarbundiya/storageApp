/**
 * ADVANCED RATE LIMITING STRATEGIES
 * Whitelisting, Blacklisting, and Dynamic Configuration
 */

// ============================================================
// 1. WHITELIST/BLACKLIST MANAGEMENT
// ============================================================

import redisClient from '../config/redis.js'

class RateLimitManager {
    constructor() {
        this.whitelistKey = 'ratelimit:whitelist'
        this.blacklistKey = 'ratelimit:blacklist'
        this.dynamicLimitsKey = 'ratelimit:dynamic_limits'
    }

    /**
     * ADD TO WHITELIST - Completely bypass rate limiting
     * Use for: Internal services, trusted partners, monitoring tools
     */
    async addToWhitelist(identifier, reason = '') {
        try {
            const data = {
                identifier,
                reason,
                addedAt: new Date().toISOString(),
                addedBy: 'admin'
            }
            await redisClient.zadd(this.whitelistKey, Date.now(), `${identifier}:${reason}`)
            console.log(`✅ Added to whitelist: ${identifier}`)
            return true
        } catch (error) {
            console.error('Whitelist add error:', error)
            return false
        }
    }

    /**
     * REMOVE FROM WHITELIST
     */
    async removeFromWhitelist(identifier) {
        try {
            const pattern = `${identifier}:*`
            const members = await redisClient.zscan(this.whitelistKey, 0, 'MATCH', pattern)
            if (members[1].length > 0) {
                await redisClient.zrem(this.whitelistKey, ...members[1])
            }
            console.log(`✅ Removed from whitelist: ${identifier}`)
            return true
        } catch (error) {
            console.error('Whitelist remove error:', error)
            return false
        }
    }

    /**
     * CHECK IF WHITELISTED
     */
    async isWhitelisted(identifier) {
        try {
            const pattern = `${identifier}:*`
            const members = await redisClient.zscan(this.whitelistKey, 0, 'MATCH', pattern)
            return members[1].length > 0
        } catch (error) {
            return false
        }
    }

    /**
     * ADD TO BLACKLIST - Permanently block
     * Use for: Known attackers, malicious IPs, spam accounts
     */
    async addToBlacklist(identifier, reason = '', duration = 24 * 60 * 60) {
        try {
            const data = {
                identifier,
                reason,
                addedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + duration * 1000).toISOString()
            }
            
            await redisClient.zadd(
                this.blacklistKey,
                Date.now() + duration * 1000,
                `${identifier}:${reason}`
            )
            
            console.log(`🚫 Added to blacklist: ${identifier} (${duration}s)`)
            return true
        } catch (error) {
            console.error('Blacklist add error:', error)
            return false
        }
    }

    /**
     * REMOVE FROM BLACKLIST
     */
    async removeFromBlacklist(identifier) {
        try {
            const pattern = `${identifier}:*`
            const members = await redisClient.zscan(this.blacklistKey, 0, 'MATCH', pattern)
            if (members[1].length > 0) {
                await redisClient.zrem(this.blacklistKey, ...members[1])
            }
            console.log(`✅ Removed from blacklist: ${identifier}`)
            return true
        } catch (error) {
            console.error('Blacklist remove error:', error)
            return false
        }
    }

    /**
     * CHECK IF BLACKLISTED
     */
    async isBlacklisted(identifier) {
        try {
            const pattern = `${identifier}:*`
            const members = await redisClient.zscan(this.blacklistKey, 0, 'MATCH', pattern, 'LIMIT', 0, 1)
            
            if (members[1].length > 0) {
                // Check if not expired
                const score = await redisClient.zscore(this.blacklistKey, members[1][0])
                if (score > Date.now()) {
                    return true
                } else {
                    // Expired, remove it
                    await redisClient.zrem(this.blacklistKey, members[1][0])
                }
            }
            return false
        } catch (error) {
            return false
        }
    }

    /**
     * GET WHITELIST
     */
    async getWhitelist() {
        try {
            const members = await redisClient.zrange(this.whitelistKey, 0, -1)
            return members.map(m => m.split(':')[0])
        } catch (error) {
            return []
        }
    }

    /**
     * GET BLACKLIST (active entries only)
     */
    async getBlacklist() {
        try {
            const now = Date.now()
            const members = await redisClient.zrangebyscore(this.blacklistKey, now, '+inf')
            return members.map(m => ({
                identifier: m.split(':')[0],
                reason: m.split(':')[1] || 'N/A'
            }))
        } catch (error) {
            return []
        }
    }
}

export const rateLimitManager = new RateLimitManager()


// ============================================================
// 2. ENHANCED MIDDLEWARE WITH WHITELIST/BLACKLIST
// ============================================================

import { createRateLimiter as baseRateLimiter } from './rateLimiter.js'

export function createAdvancedRateLimiter(options = {}) {
    return async (req, res, next) => {
        // Get client identifier
        const clientId = req.user?.id || req.user?._id
            ? `user:${req.user.id || req.user._id}`
            : req.ip

        // CHECK BLACKLIST FIRST (reject immediately)
        const isBlacklisted = await rateLimitManager.isBlacklisted(clientId)
        if (isBlacklisted) {
            console.warn(`🚫 Blacklisted request: ${clientId}`)
            return res.status(403).json({
                error: 'Access denied. Your IP/account has been blocked.'
            })
        }

        // CHECK WHITELIST (allow immediately)
        const isWhitelisted = await rateLimitManager.isWhitelisted(clientId)
        if (isWhitelisted) {
            console.log(`✅ Whitelisted request: ${clientId}`)
            return next()
        }

        // Apply normal rate limiting
        return baseRateLimiter(options)(req, res, next)
    }
}


// ============================================================
// 3. DYNAMIC RATE LIMIT ADJUSTMENT
// ============================================================

class DynamicRateLimitConfig {
    constructor() {
        this.storageKey = 'ratelimit:dynamic_config'
    }

    /**
     * SET DYNAMIC LIMIT FOR SPECIFIC ENDPOINT
     * Use when you need to adjust limits without code changes
     */
    async setDynamicLimit(endpoint, method, newLimit, windowMs) {
        try {
            const key = `${endpoint}:${method}`
            const value = JSON.stringify({ limit: newLimit, windowMs, updatedAt: new Date() })
            
            await redisClient.hset(this.storageKey, key, value)
            console.log(`⚙️ Dynamic limit set: ${endpoint} ${method} → ${newLimit}/${windowMs}ms`)
            return true
        } catch (error) {
            console.error('Dynamic limit set error:', error)
            return false
        }
    }

    /**
     * GET DYNAMIC LIMIT
     */
    async getDynamicLimit(endpoint, method) {
        try {
            const key = `${endpoint}:${method}`
            const data = await redisClient.hget(this.storageKey, key)
            return data ? JSON.parse(data) : null
        } catch (error) {
            return null
        }
    }

    /**
     * REMOVE DYNAMIC LIMIT (revert to default)
     */
    async removeDynamicLimit(endpoint, method) {
        try {
            const key = `${endpoint}:${method}`
            await redisClient.hdel(this.storageKey, key)
            console.log(`⚙️ Dynamic limit removed: ${endpoint} ${method}`)
            return true
        } catch (error) {
            return false
        }
    }

    /**
     * INCREASE RATE LIMIT (temporary boost)
     * Use during high traffic or special events
     */
    async increaseLimit(endpoint, method, increaseBy = 1.5, durationMs = 60 * 60 * 1000) {
        try {
            const key = `${endpoint}:${method}`
            const current = await this.getDynamicLimit(endpoint, method)
            
            const newLimit = Math.ceil((current?.limit || 100) * increaseBy)
            
            // Set temporary increased limit
            await this.setDynamicLimit(endpoint, method, newLimit, current?.windowMs || 15 * 60 * 1000)
            
            // Schedule reset after duration
            setTimeout(() => {
                this.removeDynamicLimit(endpoint, method)
                console.log(`⏱️ Rate limit reset to normal: ${endpoint} ${method}`)
            }, durationMs)
            
            console.log(`📈 Rate limit increased: ${endpoint} ${method} (for ${durationMs}ms)`)
            return true
        } catch (error) {
            console.error('Increase limit error:', error)
            return false
        }
    }
}

export const dynamicLimitConfig = new DynamicRateLimitConfig()


// ============================================================
// 4. ATTACK DETECTION & RESPONSE
// ============================================================

class AttackDetector {
    constructor() {
        this.attackLogKey = 'ratelimit:attacks'
        this.threshold = {
            failed_logins: 10,      // More than 10 failed logins = attack
            failed_logins_window: 15 * 60 * 1000, // in 15 minutes
            
            api_errors: 50,         // More than 50 errors
            api_errors_window: 5 * 60 * 1000, // in 5 minutes
            
            rapid_requests: 100,    // More than 100 requests
            rapid_requests_window: 60 * 1000 // in 1 second
        }
    }

    /**
     * LOG FAILED LOGIN ATTEMPT
     */
    async logFailedLogin(identifier) {
        const key = `attack_log:failed_login:${identifier}`
        const now = Date.now()
        const windowStart = now - this.threshold.failed_logins_window

        try {
            // Add attempt
            await redisClient.zadd(key, now, `${now}-${Math.random()}`)
            
            // Check if threshold exceeded
            const attempts = await redisClient.zcount(key, windowStart, now)
            
            if (attempts > this.threshold.failed_logins) {
                console.warn(`🚨 ATTACK DETECTED: Too many failed logins from ${identifier}`)
                return {
                    detected: true,
                    type: 'brute_force',
                    identifier,
                    attemptCount: attempts,
                    recommendation: `Block ${identifier} for 1 hour`
                }
            }

            return { detected: false }
        } catch (error) {
            console.error('Failed login log error:', error)
            return { detected: false }
        }
    }

    /**
     * DETECT RAPID REQUEST FLOODING
     */
    async detectRapidRequests(identifier) {
        const key = `attack_log:rapid:${identifier}`
        const now = Date.now()
        const windowStart = now - this.threshold.rapid_requests_window

        try {
            await redisClient.zadd(key, now, `${now}-${Math.random()}`)
            const count = await redisClient.zcount(key, windowStart, now)

            if (count > this.threshold.rapid_requests) {
                console.warn(`🚨 RAPID FLOODING DETECTED: ${identifier} made ${count} requests/sec`)
                return {
                    detected: true,
                    type: 'flooding',
                    identifier,
                    requests_per_sec: count,
                    recommendation: 'Add to blacklist immediately'
                }
            }

            return { detected: false }
        } catch (error) {
            return { detected: false }
        }
    }

    /**
     * AUTO-RESPOND TO ATTACKS
     */
    async autoRespondToAttack(attackInfo) {
        if (!attackInfo.detected) return

        console.warn(`⚠️ AUTO-RESPONSE: ${JSON.stringify(attackInfo)}`)

        // Automatic actions based on attack type
        switch (attackInfo.type) {
            case 'brute_force':
                // Increase backoff for brute force
                await dynamicLimitConfig.increaseLimit(
                    '/auth/login',
                    'POST',
                    0.3, // Reduce to 30% of normal
                    60 * 60 * 1000 // For 1 hour
                )
                break

            case 'flooding':
                // Add to blacklist immediately
                await rateLimitManager.addToBlacklist(
                    attackInfo.identifier,
                    'Automatic: Rapid flooding detected',
                    60 * 60 // 1 hour
                )
                break
        }
    }
}

export const attackDetector = new AttackDetector()


// ============================================================
// 5. ADMIN ENDPOINTS FOR MANAGEMENT
// ============================================================

/**
 * GET /admin/rate-limit/whitelist
 */
export const getWhitelist = async (req, res) => {
    try {
        const whitelist = await rateLimitManager.getWhitelist()
        res.json({ whitelist, count: whitelist.length })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * POST /admin/rate-limit/whitelist
 * Body: { identifier, reason }
 */
export const addToWhitelist = async (req, res) => {
    try {
        const { identifier, reason } = req.body
        const success = await rateLimitManager.addToWhitelist(identifier, reason)
        
        res.status(success ? 200 : 500).json({
            success,
            message: `${identifier} added to whitelist`
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * DELETE /admin/rate-limit/whitelist/:identifier
 */
export const removeFromWhitelist = async (req, res) => {
    try {
        const { identifier } = req.params
        const success = await rateLimitManager.removeFromWhitelist(identifier)
        
        res.json({
            success,
            message: `${identifier} removed from whitelist`
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * GET /admin/rate-limit/blacklist
 */
export const getBlacklist = async (req, res) => {
    try {
        const blacklist = await rateLimitManager.getBlacklist()
        res.json({ blacklist, count: blacklist.length })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * POST /admin/rate-limit/blacklist
 * Body: { identifier, reason, duration }
 */
export const addToBlacklist = async (req, res) => {
    try {
        const { identifier, reason, duration = 24 * 60 * 60 } = req.body
        const success = await rateLimitManager.addToBlacklist(identifier, reason, duration)
        
        res.status(success ? 200 : 500).json({
            success,
            message: `${identifier} added to blacklist for ${duration} seconds`
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * DELETE /admin/rate-limit/blacklist/:identifier
 */
export const removeFromBlacklist = async (req, res) => {
    try {
        const { identifier } = req.params
        const success = await rateLimitManager.removeFromBlacklist(identifier)
        
        res.json({
            success,
            message: `${identifier} removed from blacklist`
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * POST /admin/rate-limit/dynamic
 * Body: { endpoint, method, limit, windowMs }
 */
export const setDynamicLimit = async (req, res) => {
    try {
        const { endpoint, method, limit, windowMs } = req.body
        const success = await dynamicLimitConfig.setDynamicLimit(endpoint, method, limit, windowMs)
        
        res.json({
            success,
            message: `Dynamic limit set for ${endpoint} ${method}`,
            limit,
            windowMs
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * POST /admin/rate-limit/boost
 * Body: { endpoint, method, increaseBy, durationMs }
 * Temporarily increase limits (for events, etc.)
 */
export const boostLimit = async (req, res) => {
    try {
        const { endpoint, method, increaseBy = 1.5, durationMs = 60 * 60 * 1000 } = req.body
        const success = await dynamicLimitConfig.increaseLimit(endpoint, method, increaseBy, durationMs)
        
        res.json({
            success,
            message: `Rate limit boosted for ${endpoint} ${method}`,
            increaseBy,
            durationSeconds: Math.round(durationMs / 1000)
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}


// ============================================================
// 6. USAGE EXAMPLES
// ============================================================

/**
 * WHITELIST EXAMPLE:
 * 
 * // Whitelist internal monitoring service
 * await rateLimitManager.addToWhitelist('ip:192.168.1.100', 'Internal monitoring')
 * 
 * // Check whitelist
 * const list = await rateLimitManager.getWhitelist()
 */

/**
 * BLACKLIST EXAMPLE:
 * 
 * // Block attacker for 24 hours
 * await rateLimitManager.addToBlacklist('ip:203.0.113.45', 'DDoS attack detected', 24 * 60 * 60)
 * 
 * // Check blacklist
 * const blacklisted = await rateLimitManager.getBlacklist()
 */

/**
 * DYNAMIC LIMIT EXAMPLE:
 * 
 * // Increase upload limits during event
 * await dynamicLimitConfig.increaseLimit('/file/upload', 'POST', 2, 4 * 60 * 60 * 1000)
 * 
 * // Set custom limit
 * await dynamicLimitConfig.setDynamicLimit('/api/endpoint', 'GET', 500, 15 * 60 * 1000)
 */

/**
 * ATTACK DETECTION EXAMPLE:
 * 
 * // In your login controller
 * export async function loginUser(req, res) {
 *     const { email, password } = req.body
 *     const identifier = `user:${email}`
 *     
 *     // Attempt login
 *     const user = await User.findOne({ email })
 *     
 *     if (!user || !validPassword(password)) {
 *         // Log failed attempt
 *         const attack = await attackDetector.logFailedLogin(identifier)
 *         
 *         // Auto-respond if detected
 *         if (attack.detected) {
 *             await attackDetector.autoRespondToAttack(attack)
 *             // Notify admin
 *             sendAdminAlert(attack)
 *         }
 *         
 *         return res.status(401).json({ error: 'Invalid credentials' })
 *     }
 * }
 */

export default {
    RateLimitManager,
    rateLimitManager,
    DynamicRateLimitConfig,
    dynamicLimitConfig,
    AttackDetector,
    attackDetector,
    createAdvancedRateLimiter
}
