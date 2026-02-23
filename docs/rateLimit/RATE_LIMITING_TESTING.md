/**
 * RATE LIMITING - Testing, Monitoring & Admin Utilities
 * Use these examples to test and manage rate limiting
 */

// ============================================================
// 1. ADMIN CONTROLLER - Management Endpoints
// ============================================================

import { resetRateLimit, resetAllRateLimits, getRateLimitStatus } from '../middleware/rateLimiter.js'

/**
 * GET /admin/rate-limit/status/:identifier
 * Get current rate limit status for a user/IP
 */
export const getRateLimitStatusHandler = async (req, res) => {
    try {
        const { identifier } = req.params // user:123 or ip:192.168.1.1
        
        if (!identifier) {
            return res.status(400).json({ 
                error: 'Identifier required (user:userId or ip:ipAddress)' 
            })
        }

        const status = await getRateLimitStatus(identifier)
        
        res.json({
            identifier,
            activeEndpoints: Object.keys(status),
            requestCounts: status,
            totalRequests: Object.values(status).reduce((a, b) => a + b, 0)
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * POST /admin/rate-limit/reset
 * Reset rate limit for specific endpoint
 * Body: { identifier: "user:123", endpoint: "/auth/login", method: "POST" }
 */
export const resetRateLimitHandler = async (req, res) => {
    try {
        const { identifier, endpoint, method } = req.body
        
        if (!identifier || !endpoint || !method) {
            return res.status(400).json({ 
                error: 'Missing required fields: identifier, endpoint, method' 
            })
        }

        const success = await resetRateLimit(identifier, endpoint, method)
        
        if (success) {
            return res.json({ 
                message: 'Rate limit reset successfully',
                identifier,
                endpoint,
                method
            })
        }
        
        res.status(500).json({ error: 'Failed to reset rate limit' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * POST /admin/rate-limit/reset-all
 * Reset ALL rate limits for a user/IP
 * Body: { identifier: "user:123" }
 */
export const resetAllRateLimitsHandler = async (req, res) => {
    try {
        const { identifier } = req.body
        
        if (!identifier) {
            return res.status(400).json({ error: 'Identifier required' })
        }

        const success = await resetAllRateLimits(identifier)
        
        if (success) {
            return res.json({ 
                message: 'All rate limits reset successfully',
                identifier
            })
        }
        
        res.status(500).json({ error: 'Failed to reset rate limits' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}


// ============================================================
// 2. TESTING RATE LIMITER - curl/HTTP Examples
// ============================================================

/**
 * TEST 1: Test Login Rate Limiting (5 attempts per 15 minutes)
 * 
 * for i in {1..6}; do
 *   curl -X POST http://localhost:4000/auth/login \
 *     -H "Content-Type: application/json" \
 *     -d '{"email":"test@example.com","password":"wrong"}' \
 *     -w "\nStatus: %{http_code}\n" \
 *     -s | head -n 20
 *   sleep 1
 * done
 * 
 * Expected: First 5 requests = 401 (auth failed)
 *           6th request = 429 (rate limit exceeded)
 */

/**
 * TEST 2: Check Rate Limit Headers
 * 
 * curl -X GET http://localhost:4000/users/all \
 *   -H "Cookie: sid=your_session_id" \
 *   -v
 * 
 * Look for response headers:
 * X-RateLimit-Limit: 100
 * X-RateLimit-Remaining: 99
 * X-RateLimit-Reset: 1629876543
 */

/**
 * TEST 3: Test Different User vs IP Limits
 * 
 * # As authenticated user
 * curl -X GET http://localhost:4000/file/list \
 *   -H "Cookie: sid=authenticated_session"
 * 
 * # As unauthenticated (IP-based)
 * curl -X GET http://localhost:4000/public/search
 * 
 * Authenticated should have ~2.5x higher limits
 */

/**
 * TEST 4: Verify Rate Limit Reset Time
 * 
 * curl -X GET http://localhost:4000/admin/stats \
 *   -H "Cookie: sid=admin_session" \
 *   -i | grep -E "X-RateLimit|Retry-After"
 * 
 * Retry-After header shows seconds to wait before retrying
 */


// ============================================================
// 3. NODEJS TESTING SCRIPT
// ============================================================

/**
 * Test Rate Limiting Programmatically
 * 
 * npm install axios
 * node testRateLimit.js
 */

import axios from 'axios'

const BASE_URL = 'http://localhost:4000'
const COOKIE = 'sid=your_session_cookie_here'

class RateLimitTester {
    constructor(baseUrl, sessionCookie) {
        this.baseUrl = baseUrl
        this.axiosInstance = axios.create({
            baseURL: baseUrl,
            headers: { Cookie: sessionCookie },
            validateStatus: () => true // Don't throw on any status code
        })
    }

    async testLoginRateLimit() {
        console.log('\n📊 Testing Login Rate Limit (5/15min)')
        console.log('═'.repeat(50))

        for (let i = 1; i <= 7; i++) {
            const response = await this.axiosInstance.post('/auth/login', {
                email: 'test@example.com',
                password: 'wrongpassword'
            })

            console.log(`Attempt ${i}:`)
            console.log(`  Status: ${response.status}`)
            console.log(`  Remaining: ${response.headers['x-ratelimit-remaining']}`)
            console.log(`  Limit: ${response.headers['x-ratelimit-limit']}`)
            
            if (response.status === 429) {
                console.log(`  ✅ Rate limit triggered on attempt ${i}`)
                console.log(`  Retry-After: ${response.headers['retry-after']}s`)
                break
            }

            await new Promise(resolve => setTimeout(resolve, 100))
        }
    }

    async testFileUploadLimit() {
        console.log('\n📊 Testing File Upload Rate Limit (50/hour)')
        console.log('═'.repeat(50))

        let rateLimitHit = false

        for (let i = 1; i <= 52; i++) {
            const response = await this.axiosInstance.post('/file/upload', {
                filename: `test${i}.txt`,
                content: 'test content'
            })

            if (response.status === 429) {
                console.log(`✅ Rate limit triggered on upload ${i}`)
                rateLimitHit = true
                break
            }

            if (i % 10 === 0) {
                console.log(`  Upload ${i}: Status ${response.status}`)
            }
        }

        if (!rateLimitHit) {
            console.log('⚠️  Did not hit rate limit after 52 uploads')
        }
    }

    async testDifferentEndpoints() {
        console.log('\n📊 Testing Different Endpoints')
        console.log('═'.repeat(50))

        const endpoints = [
            { path: '/file/list', method: 'GET', limit: 100 },
            { path: '/admin/stats', method: 'GET', limit: 50 },
            { path: '/shared/', method: 'GET', limit: 50 }
        ]

        for (const endpoint of endpoints) {
            const response = await this.axiosInstance.get(endpoint.path)
            console.log(`${endpoint.path}:`)
            console.log(`  Expected Limit: ${endpoint.limit}`)
            console.log(`  Actual Limit: ${response.headers['x-ratelimit-limit']}`)
            console.log(`  Remaining: ${response.headers['x-ratelimit-remaining']}`)
            console.log()
        }
    }

    async testAdjustedLimitsForAuthUsers() {
        console.log('\n📊 Testing Multiplier for Authenticated Users')
        console.log('═'.repeat(50))

        // Authenticated user should get base_limit * 2.5
        const response = await this.axiosInstance.get('/file/list')
        const limit = parseInt(response.headers['x-ratelimit-limit'])
        
        console.log(`Default limit for this endpoint: 100`)
        console.log(`Authenticated user limit: ${limit}`)
        console.log(`Multiplier: ${(limit / 100).toFixed(2)}x`)
        console.log(`Expected multiplier: 2.5x`)
    }

    async runAllTests() {
        try {
            await this.testLoginRateLimit()
            // await this.testFileUploadLimit() // Commented out - resource intensive
            await this.testDifferentEndpoints()
            await this.testAdjustedLimitsForAuthUsers()
            
            console.log('\n✅ All tests completed!')
        } catch (error) {
            console.error('Test error:', error.message)
        }
    }
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new RateLimitTester(BASE_URL, COOKIE)
    await tester.runAllTests()
}

export default RateLimitTester


// ============================================================
// 4. MONITORING DASHBOARD - Express Endpoint
// ============================================================

/**
 * Monitoring endpoint to observe rate limiting in action
 * GET /admin/rate-limit-dashboard
 */
export const rateLimitDashboard = async (req, res) => {
    try {
        // This would be more comprehensive in real implementation
        // using Redis scan to get all active rate limits
        
        const dashboardHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Rate Limit Dashboard</title>
                <style>
                    body { font-family: Arial; margin: 20px; background: #f5f5f5; }
                    .container { max-width: 1200px; margin: 0 auto; }
                    .card { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    .metric { display: inline-block; margin: 10px 20px; }
                    .value { font-size: 24px; font-weight: bold; color: #0066cc; }
                    .label { font-size: 12px; color: #666; }
                    .status-ok { color: #28a745; }
                    .status-warning { color: #ffc107; }
                    .status-danger { color: #dc3545; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background: #f8f9fa; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>⏱️ Rate Limiting Dashboard</h1>
                    
                    <div class="card">
                        <h2>System Status</h2>
                        <div class="metric">
                            <div class="value status-ok">✓</div>
                            <div class="label">Rate Limiter Active</div>
                        </div>
                        <div class="metric">
                            <div class="value" id="redis-status">-</div>
                            <div class="label">Redis Connection</div>
                        </div>
                    </div>

                    <div class="card">
                        <h2>Current Limits</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Endpoint</th>
                                    <th>Window</th>
                                    <th>Default Limit</th>
                                    <th>Auth User Limit</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>/auth/login</td>
                                    <td>15 min</td>
                                    <td>5</td>
                                    <td>N/A</td>
                                </tr>
                                <tr>
                                    <td>/file/upload</td>
                                    <td>1 hour</td>
                                    <td>50</td>
                                    <td>125</td>
                                </tr>
                                <tr>
                                    <td>/admin</td>
                                    <td>15 min</td>
                                    <td>50</td>
                                    <td>125</td>
                                </tr>
                                <tr>
                                    <td>/public</td>
                                    <td>15 min</td>
                                    <td>200</td>
                                    <td>N/A</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="card">
                        <h2>How to Check Your Status</h2>
                        <pre>
GET /admin/rate-limit/status/:identifier
Examples:
  /admin/rate-limit/status/user:123456
  /admin/rate-limit/status/ip:192.168.1.100
                        </pre>
                    </div>

                    <div class="card">
                        <h2>How to Reset Limits</h2>
                        <pre>
POST /admin/rate-limit/reset-all
Body: { "identifier": "user:123456" }

POST /admin/rate-limit/reset
Body: { 
  "identifier": "user:123456",
  "endpoint": "/auth/login",
  "method": "POST"
}
                        </pre>
                    </div>
                </div>

                <script>
                    // Auto-refresh status every 10 seconds
                    setInterval(() => {
                        // Could add AJAX calls here to update in real-time
                    }, 10000);
                </script>
            </body>
            </html>
        `
        res.send(dashboardHTML)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}


// ============================================================
// 5. LOGGER UTILITY - Track Rate Limit Events
// ============================================================

/**
 * Enhanced logging for rate limit events
 * Create a separate log file for rate limiting
 */

import fs from 'fs/promises'
import path from 'path'

export class RateLimitLogger {
    constructor(logDir = './logs') {
        this.logDir = logDir
        this.logFile = path.join(logDir, 'rate-limit.log')
        this.alertFile = path.join(logDir, 'rate-limit-alerts.log')
    }

    async initialize() {
        try {
            await fs.mkdir(this.logDir, { recursive: true })
        } catch (error) {
            console.error('Failed to create log directory:', error)
        }
    }

    async logEvent(event, data) {
        const timestamp = new Date().toISOString()
        const logEntry = JSON.stringify({ timestamp, event, ...data })
        
        try {
            await fs.appendFile(this.logFile, logEntry + '\n')
        } catch (error) {
            console.error('Failed to write log:', error)
        }
    }

    async logAlert(severity, message, data) {
        const timestamp = new Date().toISOString()
        const alertEntry = JSON.stringify({ timestamp, severity, message, ...data })
        
        try {
            await fs.appendFile(this.alertFile, alertEntry + '\n')
            
            // Send alert if critical
            if (severity === 'CRITICAL') {
                console.error('🚨 CRITICAL RATE LIMIT ALERT:', message, data)
            }
        } catch (error) {
            console.error('Failed to write alert:', error)
        }
    }

    async getRecentAlerts(count = 20) {
        try {
            const data = await fs.readFile(this.alertFile, 'utf-8')
            return data
                .split('\n')
                .filter(line => line.trim())
                .map(line => JSON.parse(line))
                .slice(-count)
        } catch (error) {
            return []
        }
    }
}


// ============================================================
// 6. PROMETHEUS METRICS - For Production Monitoring
// ============================================================

/**
 * Export rate limiting metrics to Prometheus
 * npm install prom-client
 */

import { Counter, Histogram, Gauge } from 'prom-client'

export const rateLimitMetrics = {
    // Counter: total requests checked
    requestsChecked: new Counter({
        name: 'rate_limit_requests_checked_total',
        help: 'Total requests checked by rate limiter',
        labelNames: ['endpoint', 'method']
    }),

    // Counter: requests that exceeded limit
    requestsExceeded: new Counter({
        name: 'rate_limit_exceeded_total',
        help: 'Total requests that exceeded rate limit',
        labelNames: ['endpoint', 'method', 'identifier_type']
    }),

    // Gauge: active clients being rate limited
    activeClients: new Gauge({
        name: 'rate_limit_active_clients',
        help: 'Number of active clients with active rate limit keys'
    }),

    // Histogram: requests remaining when checked
    remainingRequests: new Histogram({
        name: 'rate_limit_remaining_requests',
        help: 'Distribution of remaining requests at time of check',
        labelNames: ['endpoint']
    })
}

/**
 * Usage in rate limiter middleware:
 * 
 * rateLimitMetrics.requestsChecked.inc({ endpoint: path, method })
 * 
 * if (limitInfo.exceeded) {
 *     rateLimitMetrics.requestsExceeded.inc({ 
 *         endpoint: path,
 *         method,
 *         identifier_type: clientId.startsWith('user:') ? 'user' : 'ip'
 *     })
 * }
 */

export default {}
