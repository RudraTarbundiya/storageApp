import { sanitizeValue } from '../utils/sanitizeInput.js'

const sanitizeRequest = (req, res, next) => {
    // Sanitize body (writable)
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeValue(req.body)
    }

    // Sanitize query params (read-only, so modify in place)
    if (req.query && typeof req.query === 'object') {
        for (const key in req.query) {
            req.query[key] = sanitizeValue(req.query[key])
        }
    }

    // Sanitize route params (read-only, so modify in place)
    if (req.params && typeof req.params === 'object') {
        for (const key in req.params) {
            req.params[key] = sanitizeValue(req.params[key])
        }
    }

    next()
}

export default sanitizeRequest
