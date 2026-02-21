import createDOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

const window = new JSDOM('').window
const DOMPurify = createDOMPurify(window)

export const sanitizeString = (value) => {
    if (typeof value !== 'string') return value
    return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

export const sanitizeValue = (value) => {
    if (Array.isArray(value)) {
        return value.map(sanitizeValue)
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, val]) => [key, sanitizeValue(val)])
        )
    }

    return sanitizeString(value)
}
