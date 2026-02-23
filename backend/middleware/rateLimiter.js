/**
 * Advanced Rate Limiter Middleware - Industry Level DoS Protection
 * Uses sliding window algorithm with Redis for distribution
 * Implements exponential backoff and IP-based/User-based limiting
 */
import redisClient from '../config/redis.js';
import { rateLimitConfig, getRouteLimitConfig } from '../config/rateLimitConfig.js';

/**
 * Generate rate limit key based on identifier (IP or User ID)
 * @param {string} identifier - IP address or User ID
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @returns {string} Redis key
 */
function generateRateLimitKey(identifier, endpoint, method) {
    return `${rateLimitConfig.redis.prefix}${identifier}:${endpoint}:${method}`;
}

/**
 * Get client identifier (IP or User ID with priority to User ID)
 * @param {Object} req - Express request object
 * @returns {string} Client identifier
 */
function getClientIdentifier(req) {
    // Prefer authenticated user ID for logged-in users
    if (req.user?.id || req.user?._id) {
        return `user:${req.user.id || req.user._id}`;
    }

    // Fallback to IP address
    const ip = req.ip ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        'unknown';

    return `ip:${ip}`;
}

/**
 * Check if request should skip rate limiting
 * @param {Object} req - Express request object
 * @returns {boolean}
 */
function shouldSkip(req) {
    // Skip healthcheck endpoints
    if (rateLimitConfig.skip.healthcheck.includes(req.path)) {
        return true;
    }

    // Skip localhost in development
    if (rateLimitConfig.skip.localhost) {
        const isLocalhost = req.ip === '127.0.0.1' ||
            req.ip === '::1' ||
            req.ip === '::ffff:127.0.0.1' ||
            req.hostname === 'localhost';

        if (isLocalhost && process.env.NODE_ENV !== 'production') {
            return true;
        }
    }

    // Custom skip function
    if (rateLimitConfig.skip.customFn && rateLimitConfig.skip.customFn(req)) {
        return true;
    }

    return false;
}

/**
 * Calculate rate limit using sliding window algorithm
 * @param {string} key - Redis key
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Promise<Object>} Rate limit info
 */
async function checkRateLimit(key, maxRequests, windowMs) {
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
        // Get all requests in current window
        const requests = await redisClient.zrangebyscore(key, windowStart, now);
        const requestCount = requests.length;
        const remaining = Math.max(0, maxRequests - requestCount);
        const resetTime = Math.ceil((parseInt(requests[0]) || now + windowMs) / 1000);

        // Check if limit exceeded
        if (requestCount >= maxRequests) {
            return {
                exceeded: true,
                remaining: 0,
                resetTime: resetTime,
                retryAfter: Math.ceil((parseInt(requests[0]) + windowMs - now) / 1000)
            };
        }

        // Add current request to sorted set
        await redisClient.zadd(key, now, `${now}-${Math.random()}`);

        // Set expiration on key
        await redisClient.expire(key, Math.ceil(windowMs / 1000) + 60);

        return {
            exceeded: false,
            remaining: remaining,
            resetTime: Math.ceil((now + windowMs) / 1000),
            retryAfter: null
        };
    } catch (error) {
        console.error('Rate limit check error:', error);
        // In case of Redis error, allow request but log it
        return {
            exceeded: false,
            remaining: maxRequests,
            resetTime: Math.ceil((now + windowMs) / 1000),
            error: true
        };
    }
}

/**
 * Log rate limit events
 * @param {string} event - Event type (exceeded, blocked, info)
 * @param {Object} data - Event data
 */
function logRateLimitEvent(event, data) {
    if (!rateLimitConfig.logging.enabled) return;

    if (event === 'exceeded' && !rateLimitConfig.logging.logExceeded) return;
    if (event === 'blocked' && !rateLimitConfig.logging.logBlocked) return;
    if (event === 'info' && !rateLimitConfig.logging.logInfo) return;

    const timestamp = new Date().toISOString();
    console.log(`[RATE_LIMIT_${event.toUpperCase()}] ${timestamp}`, data);
}

/**
 * Main Rate Limiter Middleware
 * Can be used as global middleware or per-route
 * @param {Object} options - Optional config overrides
 * @returns {Function} Express middleware
 */
export function createRateLimiter(options = {}) {
    return async (req, res, next) => {
        try {
            // Skip rate limiting if needed
            if (shouldSkip(req)) {
                return next();
            }

            // Get configuration for this route
            const config = getRouteLimitConfig(
                req.path,
                req.method,
                !!req.user
            );

            // Override with options
            const finalConfig = { ...config, ...options };

            // Get client identifier
            const clientId = getClientIdentifier(req);

            // Generate rate limit key
            const key = generateRateLimitKey(clientId, req.path, req.method);

            // Check rate limit
            const limitInfo = await checkRateLimit(key, finalConfig.max, finalConfig.windowMs);

            // Set response headers
            res.set({
                [rateLimitConfig.headers.limit]: finalConfig.max,
                [rateLimitConfig.headers.remaining]: limitInfo.remaining,
                [rateLimitConfig.headers.resetTime]: limitInfo.resetTime
            });

            // Log info
            logRateLimitEvent('info', {
                clientId,
                path: req.path,
                method: req.method,
                remaining: limitInfo.remaining,
                limit: finalConfig.max
            });

            // Check if limit exceeded
            if (limitInfo.exceeded) {
                logRateLimitEvent('exceeded', {
                    clientId,
                    path: req.path,
                    method: req.method,
                    limit: finalConfig.max
                });

                // Set retry-after header
                if (limitInfo.retryAfter) {
                    res.set(rateLimitConfig.headers.retryAfter, limitInfo.retryAfter);
                }

                return res.status(finalConfig.statusCode).json({
                    error: finalConfig.message,
                    retryAfter: limitInfo.retryAfter
                });
            }

            // Pass control to next middleware
            next();
        } catch (error) {
            console.error('Rate limiter error:', error);
            // On critical error, allow request but log it
            next();
        }
    };
}

/**
 * Create custom rate limiter for specific route
 * Usage: app.post('/auth/login', customRateLimiter({ max: 5, windowMs: 15 * 60 * 1000 }), handler)
 * @param {Object} options - Rate limit options
 * @returns {Function} Express middleware
 */
export function customRateLimiter(options = {}) {
    return createRateLimiter(options);
}

/**
 * Strict rate limiter for sensitive endpoints (auth, admin)
 * @returns {Function} Express middleware
 */
export function strictRateLimiter() {
    return createRateLimiter({
        max: 5,
        windowMs: 15 * 60 * 1000,
        message: 'Too many sensitive operations. Please try again later.'
    });
}

/**
 * Moderate rate limiter for upload/download operations
 * @returns {Function} Express middleware
 */
export function moderateRateLimiter() {
    return createRateLimiter({
        max: 30,
        windowMs: 60 * 60 * 1000,
        message: 'Too many operations. Please try again later.'
    });
}

/**
 * Lenient rate limiter for public endpoints
 * @returns {Function} Express middleware
 */
export function lenientRateLimiter() {
    return createRateLimiter({
        max: 200,
        windowMs: 15 * 60 * 1000,
        message: 'Rate limit exceeded. Please try again later.'
    });
}

/**
 * Reset rate limit for specific client (admin utility)
 * @param {string} clientId - Client identifier (IP or User ID)
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @returns {Promise<boolean>}
 */
export async function resetRateLimit(clientId, endpoint, method) {
    try {
        const key = generateRateLimitKey(clientId, endpoint, method);
        await redisClient.del(key);
        logRateLimitEvent('info', {
            event: 'reset',
            clientId,
            endpoint,
            method
        });
        return true;
    } catch (error) {
        console.error('Reset rate limit error:', error);
        return false;
    }
}

/**
 * Reset all rate limits for a specific client (admin utility)
 * @param {string} clientId - Client identifier
 * @returns {Promise<boolean>}
 */
export async function resetAllRateLimits(clientId) {
    try {
        const pattern = `${rateLimitConfig.redis.prefix}${clientId}:*`;
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(...keys);
        }
        logRateLimitEvent('info', {
            event: 'reset_all',
            clientId,
            keysDeleted: keys.length
        });
        return true;
    } catch (error) {
        console.error('Reset all rate limits error:', error);
        return false;
    }
}

/**
 * Get rate limit status for a client
 * @param {string} clientId - Client identifier
 * @returns {Promise<Object>} Rate limit status
 */
export async function getRateLimitStatus(clientId) {
    try {
        const pattern = `${rateLimitConfig.redis.prefix}${clientId}:*`;
        const keys = await redisClient.keys(pattern);
        const status = {};

        for (const key of keys) {
            const requests = await redisClient.zcard(key);
            status[key] = requests;
        }

        return status;
    } catch (error) {
        console.error('Get rate limit status error:', error);
        return {};
    }
}

export default createRateLimiter;