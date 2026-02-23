# 🚀 Rate Limiting - Quick Start Guide

## What You Got

An **enterprise-grade rate limiting system** protecting your app against DoS attacks.

✅ **Automatic Protection** - All routes protected by default  
✅ **Customizable** - Adjust limits per endpoint  
✅ **Smart** - Different limits for different request types  
✅ **Production Ready** - Uses Redis, handles errors gracefully  

---

## Files Overview

| File | Purpose |
|------|---------|
| `backend/middleware/rateLimiter.js` | Core rate limiter |
| `backend/config/rateLimitConfig.js` | Configuration & limits |
| `backend/server.js` | ✏️ UPDATED - integrated limiter |
| `backend/routes/authRoutes.js` | ✏️ UPDATED - auth limits |

---

## What's Protected

| Endpoint | Limit | Protection |
|----------|-------|-----------|
| `/auth/login` | 5/15min | Brute force |
| `/auth/register` | 5/15min | Account spam |
| `/auth/send-otp` | 5/15min | OTP spam |
| `/file/upload` | 50/hour | Server load |
| `/file/download` | 100/hour | Bandwidth abuse |
| `/admin/*` | 50/15min | Admin control |
| `/public/*` | 200/15min | Public access |

---

## How It Works (Simple Version)

```
Request arrives
    ↓
Check rate limit in Redis
    ↓
Under limit? → Allow + Add to count
    ↓
Over limit? → Return 429 "Too Many Requests"
```

---

## Test It

### Test Login Limiting (5 attempts/15 min)
```bash
for i in {1..7}; do
  curl -X POST http://localhost:4000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n" -s
  sleep 1
done
```

Expected: First 5 = 401, 6th = 429 ✅

### Check Rate Limit Headers
```bash
curl -X GET http://localhost:4000/file/list \
  -H "Cookie: sid=your_session" \
  -i | grep -E "X-RateLimit|Retry-After"
```

Response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1629876543
```

---

## When User Hits Limit

### Response (HTTP 429)
```json
{
  "error": "Too many requests, please try again later.",
  "retryAfter": 300
}
```

### Headers
```
Retry-After: 300    (seconds to wait)
```

---

## Customize Limits

### Edit File: `backend/config/rateLimitConfig.js`

**Change global default:**
```javascript
defaults: {
    max: 150,              // Increase from 100 to 150
    windowMs: 10 * 60 * 1000, // Change window
}
```

**Change request type:**
```javascript
requestTypes: {
    auth: {
        max: 10,           // More attempts (default: 5)
        windowMs: 30 * 60 * 1000, // 30 minutes
    }
}
```

**Change multipliers (for authenticated users):**
```javascript
userTypes: {
    authenticated: {
        multiplier: 3  // 3x limit for logged-in users (was 2.5x)
    }
}
```

---

## Add Limits to New Routes

### Simple (Use Default)
```javascript
// Just apply the global middleware (already applied in server.js)
router.get('/endpoint', handler)
```

### Strict (For Sensitive Operations)
```javascript
import { strictRateLimiter } from '../middleware/rateLimiter.js'

router.post('/sensitive', strictRateLimiter(), handler)
// = 5 requests per 15 minutes
```

### Custom
```javascript
import { customRateLimiter } from '../middleware/rateLimiter.js'

router.post('/upload', 
    customRateLimiter({ 
        max: 20,                    // 20 requests
        windowMs: 60 * 60 * 1000   // per 1 hour
    }), 
    handler
)
```

### Per-Route in server.js
```javascript
app.use('/myroute', 
    createRateLimiter({ max: 150 }), 
    myRouter
)
```

---

## Monitor Rate Limiting

### Check Logs
```bash
# Watch for rate limit events
grep "RATE_LIMIT" app.log

# Watch for blocks (429 responses)
grep "RATE_LIMIT_EXCEEDED" app.log
```

### Enable Detailed Logging
Edit `backend/config/rateLimitConfig.js`:
```javascript
logging: {
    enabled: true,
    logExceeded: true,    // Log 429 errors
    logBlocked: true,     // Log blocked requests
    logInfo: true         // Log everything (verbose)
}
```

---

## Rate Limit Tiers

Choose the right tier for your endpoint:

```
TIER         LIMIT        USE CASE
────────────────────────────────────
Strictest    3/hour       Password reset
Strict       5/15min      Login, Register, OTP
Moderate     30-50/15min  Upload, Sharing, Admin
Standard     100/15min    General API calls
Lenient      200/15min    Public endpoints
```

---

## Common Scenarios

### Scenario 1: User keeps hitting login limit
**Problem:** User locked out after 5 failed attempts  
**Solution:** 
- Wait 15 minutes for reset, OR
- Admin can manually reset limit

```javascript
// Admin resets user's limit
POST /admin/rate-limit/reset-all
{ "identifier": "user:123456" }
```

### Scenario 2: Event traffic spike
**Problem:** Legitimate users hitting upload limit  
**Solution:** Temporarily increase limits

```javascript
// Increase upload limit for 2 hours
POST /admin/rate-limit/boost
{ 
  "endpoint": "/file/upload",
  "method": "POST",
  "increaseBy": 2,        // 2x increase
  "durationMs": 7200000   // 2 hours
}
```

### Scenario 3: Detecting attacks
**Solution:** Monitor 429 responses
```bash
# Find IPs with many 429s (potential attackers)
grep "429" access.log | awk '{print $1}' | sort | uniq -c | sort -rn
```

---

## Response Examples

### ✅ Normal Request (Under Limit)
```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1629876543

{ "data": "..." }
```

### ❌ Rate Limited (Over Limit)
```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
Retry-After: 300

{
  "error": "Too many requests, please try again later.",
  "retryAfter": 300
}
```

---

## Troubleshooting

### Issue: "Redis connection error"
**Check:**
```bash
# Is Redis running?
redis-cli ping
# Should return: PONG
```

### Issue: Legitimate users getting 429
**Solution:**
- Increase the `max` value for that endpoint
- Check if multipliers are too aggressive
- Verify window size is appropriate

### Issue: Rate limiter not working
**Check:**
1. Redis is connected (`redis-cli ping`)
2. Middleware is applied in right order
3. Logging is enabled (see logs)

---

## Rate Limit Multipliers

Your configured multipliers:

| Factor | Used For | Multiplier |
|--------|----------|-----------|
| **User Type** | Authenticated users | 2.5x |
| **HTTP Method** | POST/PUT/PATCH | 0.8x |
| **HTTP Method** | DELETE | 0.5x |

**Example:**
- Base limit: 100/15min
- POST request: 100 × 0.8 = 80/15min ✓
- DELETE request: 100 × 0.5 = 50/15min ✓
- Authenticated: 100 × 2.5 = 250/15min ✓

---

## Best Practices

✅ **DO:**
- Monitor 429 response rates
- Adjust limits based on actual usage
- Keep sensitive endpoints strict
- Use Redis for reliability
- Log rate limit events

❌ **DON'T:**
- Set limits too high (defeats protection)
- Set limits too low (frustrates users)
- Disable in production
- Ignore 429 spikes (may indicate attacks)
- Expose limit logic to frontend

---

## Quick Commands

### Test Endpoint
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}' \
  -i
```

### Check Rate Limit Status
```bash
curl http://localhost:4000/admin/rate-limit/status/user:12345
```

### Reset User's Limits
```bash
curl -X POST http://localhost:4000/admin/rate-limit/reset-all \
  -H "Content-Type: application/json" \
  -d '{"identifier":"user:12345"}'
```

---

## Documentation

📖 **Full Guides Available:**

1. **RATE_LIMITING.md** - Complete reference
2. **RATE_LIMITING_EXAMPLES.md** - Code examples for each route type
3. **RATE_LIMITING_TESTING.md** - Testing & monitoring
4. **ADVANCED_RATE_LIMITING.md** - Whitelist, blacklist, dynamic limits
5. **RATE_LIMITING_CHECKLIST.md** - Implementation verification

---

## Summary

Your app is now protected! 🎉

✅ All routes have rate limiting  
✅ Smart defaults applied  
✅ Fully customizable  
✅ Production ready  
✅ Monitoring built-in  

---

## Next Steps

1. **Test** - Verify limits work (see Test It section)
2. **Monitor** - Watch logs for rate limit events
3. **Adjust** - Fine-tune limits for your use case
4. **Document** - Let frontend team know about 429 responses
5. **Deploy** - Push to production confidently

---

Need help? Check the full documentation in `/docs/` folder! 📚
