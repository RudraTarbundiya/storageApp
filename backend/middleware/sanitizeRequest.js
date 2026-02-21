import { sanitizeValue } from '../utils/sanitizeInput.js'

const sanitizeRequest = (req, res, next) => {
    req.body = sanitizeValue(req.body)
    req.query = sanitizeValue(req.query)
    req.params = sanitizeValue(req.params)
    next()
}

export default sanitizeRequest
