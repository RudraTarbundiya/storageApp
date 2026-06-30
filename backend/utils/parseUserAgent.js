import { UAParser } from 'ua-parser-js'

/**
 * Parse a User-Agent string to extract browser, OS, and device type.
 * Uses ua-parser-js for reliable parsing.
 */
export function parseUserAgent(ua) {
    if (!ua || ua === 'Unknown') {
        return { browser: 'Unknown', os: 'Unknown', deviceType: 'desktop' }
    }

    const parser = new UAParser(ua)
    const result = parser.getResult()

    const browser = result.browser.name || 'Unknown'
    const os = result.os.name || 'Unknown'

    // Device type: ua-parser-js returns 'mobile', 'tablet', 'console', 'smarttv', 'wearable', 'embedded', or undefined (desktop)
    let deviceType = 'desktop'
    if (result.device.type === 'mobile') {
        deviceType = 'mobile'
    } else if (result.device.type === 'tablet') {
        deviceType = 'tablet'
    }

    return { browser, os, deviceType }
}
