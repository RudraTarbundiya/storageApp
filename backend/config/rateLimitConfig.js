/**
 * Rate Limiting Configuration - Industry Level DoS Protection
 * Uses sliding window algorithm with Redis for distributed systems
 */

export const rateLimitConfig = {
    // Global defaults (requests per windowMs)
    defaults: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // max requests per window
        message: 'Too many requests, please try again later.',
        statusCode: 429,
    },

    // Request type specific limits (by endpoint patterns)
    requestTypes: {
        // Authentication endpoints - STRICTEST
        auth: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // 5 attempts per 15 minutes
            message: 'Too many authentication attempts, please try again in 15 minutes.',
            endpoints: ['/auth/login', '/auth/register', '/auth/verify-otp', '/auth/send-otp']
        },

        // Password reset - VERY STRICT
        passwordReset: {
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 3, // 3 attempts per hour
            message: 'Too many password reset attempts, please try again in 1 hour.',
            endpoints: ['/auth/forgot-password', '/auth/reset-password']
        },

        // File upload - MODERATE
        fileUpload: {
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 50, // 50 uploads per hour
            message: 'Too many file uploads, please try again in 1 hour.',
            endpoints: ['/file/upload', '/file/create']
        },

        // File download - MODERATE
        fileDownload: {
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 100, // 100 downloads per hour
            message: 'Too many downloads, please try again in 1 hour.',
            endpoints: ['/file/download', '/file/export']
        },

        // API calls - STANDARD
        api: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // 100 requests per 15 minutes
            message: 'Too many requests, please try again later.',
            endpoints: ['^(?!/auth|/public).*'] // All non-auth, non-public routes
        },

        // Public endpoints - LENIENT
        public: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 200, // 200 requests per 15 minutes
            message: 'Too many requests, please try again later.',
            endpoints: ['/public']
        },

        // Admin endpoints - STRICT
        admin: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 50, // 50 requests per 15 minutes
            message: 'Too many admin operations, please try again later.',
            endpoints: ['/admin']
        },

        // Share/Permission endpoints - MODERATE
        sharing: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 30,
            message: 'Too many sharing operations, please try again later.',
            endpoints: ['/shared']
        }
    },

    // User-type based limits (authenticated vs unauthenticated)
    userTypes: {
        authenticated: {
            multiplier: 2.5 // Authenticated users get 2.5x the limit
        },
        unauthenticated: {
            multiplier: 1 // Normal limit
        }
    },

    // HTTP method specific limits (stricter on state-changing operations)
    httpMethods: {
        GET: { multiplier: 1 }, // Normal limits
        POST: { multiplier: 0.8 }, // Stricter - POST is for data creation
        PUT: { multiplier: 0.8 }, // Stricter
        DELETE: { multiplier: 0.5 }, // Very strict - DELETE is destructive
        PATCH: { multiplier: 0.8 }
    },

    // Redis keys configuration
    redis: {
        prefix: 'ratelimit:', // Redis key prefix
        ttl: 24 * 60 * 60, // 24 hours - cleanup old keys
    },

    // Skip options - which requests to skip rate limiting
    skip: {
        // Skip localhost in development
        localhost: true,
        // Skip healthcheck endpoints
        healthcheck: ['/health', '/ping'],
        // Custom skip function
        customFn: (req) => {
            // Add custom logic here
            return false;
        }
    },

    // Logging configuration
    logging: {
        enabled: true,
        logExceeded: true, // Log when rate limit is exceeded
        logBlocked: true, // Log blocked requests
        logInfo: false, // Log all rate limit info (verbose)
    },

    // Response headers
    headers: {
        remaining: 'X-RateLimit-Remaining',
        resetTime: 'X-RateLimit-Reset',
        limit: 'X-RateLimit-Limit',
        retryAfter: 'Retry-After'
    }
};

/**
 * Get rate limit config for specific endpoint
 * @param {string} path - Request path
 * @param {string} method - HTTP method
 * @param {boolean} isAuthenticated - Is user authenticated
 * @returns {Object} Rate limit configuration
 */
export function getRouteLimitConfig(path, method = 'GET', isAuthenticated = false) {
    let config = { ...rateLimitConfig.defaults };

    // Find matching request type
    for (const [type, typeConfig] of Object.entries(rateLimitConfig.requestTypes)) {
        if (typeConfig.endpoints) {
            const match = typeConfig.endpoints.some(pattern => {
                if (pattern.startsWith('^')) {
                    return new RegExp(pattern).test(path);
                }
                return path.startsWith(pattern);
            });

            if (match) {
                config = { ...config, ...typeConfig };
                break;
            }
        }
    }

    // Apply user type multiplier
    const userMultiplier = isAuthenticated
        ? rateLimitConfig.userTypes.authenticated.multiplier
        : rateLimitConfig.userTypes.unauthenticated.multiplier;

    config.max = Math.ceil(config.max * userMultiplier);

    // Apply HTTP method multiplier
    const methodMultiplier = rateLimitConfig.httpMethods[method]?.multiplier || 1;
    config.max = Math.ceil(config.max * methodMultiplier);

    return config;
}

export default rateLimitConfig;
