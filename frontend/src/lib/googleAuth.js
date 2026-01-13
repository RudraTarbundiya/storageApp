/**
 * Google OAuth Configuration using @react-oauth/google
 * 
 * To set up Google OAuth:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select existing
 * 3. Enable Google Drive API
 * 4. Go to "APIs & Services" → "Credentials"
 * 5. Click "Create Credentials" → "OAuth 2.0 Client ID"
 * 6. Set Application type to "Web application"
 * 7. Add Authorized JavaScript origins:
 *    - http://localhost:5173 (for development)
 *    - https://yourdomain.com (for production)
 * 8. Add Authorized redirect URIs:
 *    - http://localhost:5173 (for development)
 *    - https://yourdomain.com (for production)
 * 9. Copy the Client ID
 * 10. Create a .env file in frontend folder and add:
 *     VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
 */

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// Google OAuth scopes needed for Drive access
export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ')

/**
 * Google Login configuration for useGoogleLogin hook
 */
export const googleLoginConfig = {
  scope: GOOGLE_DRIVE_SCOPES,
  flow: 'auth-code', // Use authorization code flow for server-side token exchange
}

// Extract authorization code from redirect URL
export function getAuthCodeFromUrl() {
  const params = new URLSearchParams(window.location.search)
  return params.get('code')
}